// backend/src/routes/approvals.js
const express = require("express");
const router  = express.Router();
const { createClient } = require("@supabase/supabase-js");

const getAdminClient = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Basic auth middleware
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

// GET all modules
router.get("/modules", requireAuth, async (req, res) => {
  const admin = getAdminClient();
  const { data: modules, error } = await admin.from("approval_modules").select("*").order("module_name");
  if (error) return res.status(500).json({ error: error.message });
  res.json({ modules });
});

// GET trigger points by module
router.get("/points/:module_key?", requireAuth, async (req, res) => {
  const admin = getAdminClient();
  const { module_key } = req.params;
  let query = admin.from("approval_points").select("*").order("point_label");
  if (module_key && module_key !== 'undefined') query = query.eq("module_key", module_key);
  
  const { data: points, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ points });
});

// GET all workflows globally mapped
router.get("/workflows", requireAuth, async (req, res) => {
  const admin = getAdminClient();
  const { data: workflows, error } = await admin
    .from("approval_workflows")
    .select(`
      id, module_key, point_key, module_name, flow_name, is_active, created_at,
      steps:approval_steps (id, step_number, approver_id, approver_name, approver_designation, permissions)
    `)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  
  // order steps correctly
  const formatted = workflows.map(w => {
    if (w.steps) w.steps.sort((a, b) => a.step_number - b.step_number);
    return w;
  });

  res.json({ workflows: formatted });
});

// GET workflow by point_key
router.get("/workflows/:point_key", requireAuth, async (req, res) => {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("approval_workflows")
    .select(`
      id, module_key, point_key, module_name, flow_name, is_active,
      steps:approval_steps (id, step_number, approver_id, approver_name, approver_designation, permissions)
    `)
    .eq("point_key", req.params.point_key)
    .single();

  if (error) return res.json({ workflow: null }); // Don't throw for 404, just return null
  
  if (data && data.steps) data.steps.sort((a, b) => a.step_number - b.step_number);
  res.json({ workflow: data });
});

// POST / PUT workflow
router.post("/workflows", requireAuth, async (req, res) => {
  const admin = getAdminClient();
  const { module_key, point_key, module_name, flow_name, is_active, steps } = req.body;

  // 1. Upsert workflow
  let { data: workflow, error: wfError } = await admin
    .from("approval_workflows")
    .select()
    .eq("point_key", point_key)
    .single();

  if (!workflow) {
    const result = await admin.from("approval_workflows").insert({
      module_key, point_key, module_name, flow_name, is_active
    }).select().single();
    if (result.error) return res.status(500).json({ error: result.error.message });
    workflow = result.data;
  } else {
    const result = await admin.from("approval_workflows").update({
      module_name, flow_name, is_active, module_key
    }).eq("id", workflow.id).select().single();
    if (result.error) return res.status(500).json({ error: result.error.message });
    workflow = result.data;
  }

  // 2. Clear old steps
  await admin.from("approval_steps").delete().eq("workflow_id", workflow.id);

  // 3. Insert new steps
  if (steps && steps.length > 0) {
    const stepRows = steps.map((s, index) => ({
      workflow_id: workflow.id,
      step_number: index + 1,
      approver_id: s.approver_id,
      approver_name: s.approver_name,
      approver_designation: s.approver_designation || 'Approver',
      permissions: s.permissions || { approve: true, issue: true, reject: true, revert: true, recall: true }
    }));
    await admin.from("approval_steps").insert(stepRows);
  }

  res.json({ success: true, workflow_id: workflow.id });
});

// GET active requests by document (e.g. order_id)
router.get("/requests/:document_id", requireAuth, async (req, res) => {
  const admin = getAdminClient();
  const { document_id } = req.params;

  // Get request details
  const { data: request, error: reqErr } = await admin
    .from("approval_requests")
    .select(`
       *,
       workflow:approval_workflows (
         id, module_key, module_name, flow_name,
         steps:approval_steps (step_number, approver_id, approver_name, approver_designation, permissions)
       ),
       logs:approval_logs (
         step_number, action_by, action, comments, created_at
       )
    `)
    .eq("document_id", document_id)
    .single();

  if (reqErr || !request) return res.json({ request: null });

  // Prepare UI friendly timelines
  const timeline = [];
  const steps = request.workflow?.steps || [];
  steps.sort((a,b) => a.step_number - b.step_number);

  for (const step of steps) {
    const stepLogs = request.logs?.filter(l => l.step_number === step.step_number) || [];
    stepLogs.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
    const lastAction = stepLogs.length > 0 ? stepLogs[stepLogs.length - 1] : null;

    let uiStatus = 'Pending';
    if (request.current_step > step.step_number) uiStatus = 'Approved';
    if (request.current_step === step.step_number) {
       uiStatus = request.status === 'Pending' || request.status === 'Approved' ? 'In Progress' : request.status;
    }

    timeline.push({
      step_number: step.step_number,
      approver_name: step.approver_name,
      approver_designation: step.approver_designation,
      approver_id: step.approver_id,
      status: uiStatus,
      permissions: step.permissions || {},
      action: lastAction ? lastAction.action : null,
      comments: lastAction ? lastAction.comments : null,
      acted_at: lastAction ? lastAction.created_at : null
    });
  }

  res.json({ request, timeline });
});

// Init/Submit Approval Request
router.post("/requests", requireAuth, async (req, res) => {
  const admin = getAdminClient();
  const { module_key, point_key, document_id, requestor_id } = req.body;

  // 1. Get workflow by point_key
  const { data: workflow } = await admin.from("approval_workflows").select().eq("point_key", point_key).single();
  if (!workflow || !workflow.is_active) {
    return res.status(400).json({ error: "No active workflow for this module. Saving locally without approval." });
  }

  // 2. Upsert Request
  let { data: request } = await admin.from("approval_requests").select().match({ module_key, document_id }).single();
  if (request) {
    const upd = await admin.from("approval_requests").update({
      current_step: 1, 
      status: 'Pending',
      requestor_id
    }).eq("id", request.id).select().single();
    request = upd.data;
  } else {
    const ins = await admin.from("approval_requests").insert({
      module_key, document_id, workflow_id: workflow.id, current_step: 1, status: 'Pending', requestor_id
    }).select().single();
    request = ins.data;
  }

  res.json({ success: true, request });
});

// Action (Approve, Reject, Revert)
router.post("/action", requireAuth, async (req, res) => {
  const admin = getAdminClient();
  const { request_id, action, comments } = req.body;
  // action in: Approved, Rejected, Reverted

  const { data: request } = await admin.from("approval_requests").select(`*, workflow:approval_workflows(steps:approval_steps(*))`).eq("id", request_id).single();
  if (!request) return res.status(404).json({ error: "Request not found" });

  const userId = req.userId;
  
  // Must verify if `req.userId` is the assigned approver OR global_admin override? (Trust frontend for now, or check here)

  // 1. Log Action
  await admin.from("approval_logs").insert({
    request_id,
    step_number: request.current_step,
    action_by: userId,
    action,
    comments
  });

  // 2. Adjust Request State
  let nextStep = request.current_step;
  let nextStatus = action; // 'Rejected', 'Reverted'
  let isFinal = false;

  const totalSteps = request.workflow.steps.length;

  if (action === 'Approved') {
    if (nextStep < totalSteps) {
      nextStep += 1;
      nextStatus = 'Pending';
    } else {
      nextStatus = 'Approved'; 
      isFinal = true;
    }
  } else if (action === 'Issued') {
     nextStatus = 'Approved';
     isFinal = true;
  } else if (action === 'Recalled') {
     nextStep = 1;
     nextStatus = 'Recalled';
     isFinal = false;
  }

  await admin.from("approval_requests").update({
    current_step: nextStep,
    status: nextStatus
  }).eq("id", request.id);

  // Sync back to procurement order status if module_key matches
  if (request.module_key === "create_order") {
     const docUpd = {};
     if (action === 'Reverted' || action === 'Recalled') docUpd.status = 'Draft';
     if (action === 'Rejected') docUpd.status = 'Rejected';
     
     if (isFinal) {
        docUpd.status = 'Issued';

        // ── FINAL NUMBERING LOGIC ──
        try {
          // 1. Get Order details
          const { data: order } = await admin
            .schema("procurement")
            .from("purchase_orders")
            .select("*, sites(*), companies(*)")
            .eq("id", request.document_id)
            .single();
          
          if (order && order.order_number.startsWith("PENDING-")) {
            // 2. Compute current financial year in 2425 format
            const now = new Date();
            const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
            const fy = `${fyStart}-${String(fyStart + 1).slice(-2)}`;

            // 3. Fetch Serialization Settings for this site + FY
            let { data: serialObj } = await admin
              .schema("procurement")
              .from("serialization_settings")
              .select("*")
              .eq("site_id", order.site_id)
              .eq("financial_year", fy)
              .single();

            // 4. If no record for this FY, create one starting at 1
            if (!serialObj) {
              const { data: created } = await admin
                .schema("procurement")
                .from("serialization_settings")
                .insert({ site_id: order.site_id, financial_year: fy, current_number: 1 })
                .select()
                .single();
              serialObj = created;
            }

            if (serialObj) {
              const serialNum = serialObj.current_number;
              const typeCode  = order.order_type === 'Supply' ? 'PO' : 'WO';
              const compCode  = order.companies?.company_code || 'CO';
              const siteCode  = order.sites?.site_code || 'SITE';
              const finalNo   = `${compCode}/${siteCode}/${typeCode}/${fy}/${String(serialNum).padStart(3, '0')}`;

              docUpd.order_number = finalNo;

              // 5. Increment serial for next order
              await admin
                .schema("procurement")
                .from("serialization_settings")
                .update({ current_number: serialNum + 1 })
                .eq("id", serialObj.id);

              console.log(`✅ Order number assigned: ${finalNo}`);
            } else {
              console.error("❌ Could not create/find serialization_settings record");
            }
          }
        } catch (numErr) {
          console.error("Number assignment failed:", numErr);
        }
     }
     
     if (Object.keys(docUpd).length > 0) {
        await admin.from("purchase_orders").update(docUpd).eq("id", request.document_id);
     }
  }

  res.json({ success: true, newStatus: nextStatus, isFinal });
});

module.exports = router;
