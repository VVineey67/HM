const express = require("express");
const router  = express.Router();
const { createClient } = require("@supabase/supabase-js");

const getAdminClient = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Basic auth middleware (copied from approvals.js)
const extractUserId = (token) => {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    return payload.sub || null;
  } catch { return null; }
};

const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Login required" });
  const userId = extractUserId(token);
  if (!userId)  return res.status(401).json({ error: "Invalid token" });
  req.userId = userId;
  next();
};

// 1. Request Amendment
router.post("/request", requireAuth, async (req, res) => {
  const admin = getAdminClient();
  const { order_id, reason, attachment_url } = req.body;

  try {
    // Check if order exists and is Issued
    const { data: order, error: oErr } = await admin.schema("procurement").from("purchase_orders").select("status").eq("id", order_id).single();
    if (oErr || !order) return res.status(404).json({ error: "Order not found" });
    if (order.status !== "Issued") return res.status(400).json({ error: "Only Issued orders can be amended." });

    // Create amendment record
    const { error: insErr } = await admin.from("order_amendments").insert({
      original_order_id: order_id,
      requestor_id: req.userId,
      reason,
      attachment_url,
      status: "Pending"
    });
    if (insErr) throw insErr;

    // Update order status
    await admin.schema("procurement").from("purchase_orders").update({ status: "Amendment Request" }).eq("id", order_id);

    // --- EMAIL NOTIFICATION LOGIC ---
    try {
      // 1. Get module ID for 'order'
      const { data: orderMod } = await admin.from("modules").select("id").eq("module_key", "order").single();
      
      if (orderMod) {
        // 2. Get users with "can_recall" permission (Primary recipients)
        const { data: recallUsers } = await admin
          .from("permissions")
          .select("user_id, users(email, name)")
          .eq("module_id", orderMod.id)
          .eq("can_recall", true);

        // 3. Get users with "can_edit" permission (CC recipients)
        const { data: ccUsers } = await admin
          .from("permissions")
          .select("user_id, users(email, name)")
          .eq("module_id", orderMod.id)
          .eq("can_edit", true);

        const toEmails = recallUsers?.map(u => u.users?.email).filter(Boolean) || ["noida.office@bms.com"];
        const ccEmails = ccUsers?.map(u => u.users?.email).filter(Boolean) || [];

        console.log(`📧 EMAIL SENT TO (Recall Power): ${toEmails.join(", ")}`);
        console.log(`📧 CC (Manage Power): ${ccEmails.join(", ")}`);
      }
    } catch (mailErr) {
      console.error("Email notification failed:", mailErr);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get All Pending Requests (for Inbox)
router.get("/requests", requireAuth, async (req, res) => {
  const admin = getAdminClient();
  const { order_id } = req.query;
  try {
    let query = admin
      .from("order_amendments")
      .select(`
        *,
        original_order:original_order_id (
          id, order_number, subject, total_amount, totals, made_by
        ),
        requestor:requestor_id (name)
      `)
      .order("created_at", { ascending: false });

    if (order_id) {
      query = query.eq("original_order_id", order_id);
    } else {
      query = query.eq("status", "Pending");
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json({ requests: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Action Amendment (Approve/Reject)
router.post("/action", requireAuth, async (req, res) => {
  const admin = getAdminClient();
  const { request_id, action } = req.body; // action: 'Approved' | 'Rejected'

  try {
    const { data: request, error: rErr } = await admin.from("order_amendments").select("*").eq("id", request_id).single();
    if (rErr || !request) return res.status(404).json({ error: "Request not found" });

    if (action === "Rejected") {
      await admin.from("order_amendments").update({ status: "Rejected" }).eq("id", request_id);
      await admin.schema("procurement").from("purchase_orders").update({ status: "Issued" }).eq("id", request.original_order_id);
      return res.json({ success: true });
    }

    // --- APPROVAL LOGIC: VERSIONING & CLONING ---
    
    // 1. Get original order & items
    const { data: order } = await admin.schema("procurement").from("purchase_orders").select("*").eq("id", request.original_order_id).single();
    const { data: items } = await admin.schema("procurement").from("purchase_order_items").select("*").eq("order_id", request.original_order_id);

    // 2. Generate New Number (3 -> 3A, 3A -> 3B)
    const baseNumber = order.order_number;
    let newNumber = "";
    
    const suffixMatch = baseNumber.match(/\/(\d+)([A-Z])?$/);
    if (suffixMatch) {
      const numPart = suffixMatch[1];
      const alphaPart = suffixMatch[2] || "";
      
      if (!alphaPart) {
        newNumber = baseNumber + "A";
      } else {
        const nextChar = String.fromCharCode(alphaPart.charCodeAt(0) + 1);
        newNumber = baseNumber.replace(/[A-Z]$/, nextChar);
      }
    } else {
      // Fallback if regex fails (though unlikely with your format)
      newNumber = baseNumber + "A";
    }

    // 3. Mark Original as Amended
    await admin.schema("procurement").from("purchase_orders").update({ status: "Amended" }).eq("id", request.original_order_id);

    // 4. Create New Draft Clone
    const { id: _oldId, created_at: _ca, updated_at: _ua, ...clonedData } = order;
    const { data: newOrder, error: cloneErr } = await admin.schema("procurement").from("purchase_orders").insert({
      ...clonedData,
      order_number: newNumber,
      status: "Draft",
      made_by: request.requestor_id // Requestor becomes the owner of the amendment
    }).select().single();

    if (cloneErr) throw cloneErr;

    // 5. Clone Items
    const newItems = items.map(({ id: _iId, order_id: _oId, created_at: _c, ...it }) => ({
      ...it,
      order_id: newOrder.id
    }));
    await admin.schema("procurement").from("purchase_order_items").insert(newItems);

    // 6. Finalize Request
    await admin.from("order_amendments").update({ 
      status: "Approved", 
      new_order_id: newOrder.id 
    }).eq("id", request_id);

    res.json({ success: true, new_order_id: newOrder.id });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
