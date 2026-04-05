const express = require("express");
const router = express.Router();
const supabase = require("../helpers/supabaseHelper");
const { createClient } = require("@supabase/supabase-js");

// Fresh admin client for DB queries after signInWithPassword
// (shared client ka session signInWithPassword se pollute ho jaata hai)
const getAdminClient = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

/* ─────────────────────────────────────────
   POST /api/auth/login
   Body: { email, password }
───────────────────────────────────────── */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email aur password required hai" });

  const admin = getAdminClient();

  // Run both in parallel: sign in + fetch profile by email
  const [authResult, profileResult] = await Promise.all([
    admin.auth.signInWithPassword({ email, password }),
    admin.from("users").select("*").eq("email", email).single(),
  ]);

  const { data, error } = authResult;
  if (error) return res.status(401).json({ error: "Email ya password galat hai" });

  const profile = profileResult.data;

  if (!profile || !profile.is_active)
    return res.status(403).json({ error: "Account inactive hai, admin se contact karo" });

  res.json({
    token: data.session.access_token,
    user: {
      id:          profile.id,
      name:        profile.name,
      email:       profile.email,
      role:        profile.role,
      designation: profile.designation,
      department:  profile.department,
      contact_no:  profile.contact_no  || "",
      avatar:      profile.avatar      || null,
    },
  });
});

/* ─────────────────────────────────────────
   POST /api/auth/forgot-password
   Body: { email }
   Supabase khud reset email bhejta hai
───────────────────────────────────────── */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required hai" });

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
  });

  // Security ke liye hamesha success return karo (email exist kare ya nahi)
  res.json({ success: true, message: "Agar email registered hai toh reset link aa jayega" });
});

/* ─────────────────────────────────────────
   POST /api/auth/reset-password
   Body: { password }
   Header: Authorization: Bearer <recovery_token>
───────────────────────────────────────── */
router.post("/reset-password", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password required hai" });
  if (!token)    return res.status(401).json({ error: "Reset token required" });

  // Verify the recovery token and get user id
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user)
    return res.status(401).json({ error: "Reset link expired or invalid. Please request a new one." });

  // Update password via admin API
  const { error } = await supabase.auth.admin.updateUserById(user.id, { password });
  if (error) return res.status(400).json({ error: error.message });

  res.json({ success: true });
});

/* ─────────────────────────────────────────
   PUT /api/auth/profile
   Any authenticated user can update their own profile
───────────────────────────────────────── */
router.put("/profile", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Login required" });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Invalid token" });

  const { name, contact_no, designation, department } = req.body;
  const updates = {};
  if (name        !== undefined) updates.name        = name;
  if (contact_no  !== undefined) updates.contact_no  = contact_no;
  if (designation !== undefined) updates.designation = designation;
  if (department  !== undefined) updates.department  = department;

  const { data, error } = await supabase
    .from("users").update(updates).eq("id", user.id).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, user: data });
});

/* ─────────────────────────────────────────
   POST /api/auth/avatar
   Upload avatar to Supabase Storage
   Body: { avatar: "data:image/jpeg;base64,..." }
───────────────────────────────────────── */
router.post("/avatar", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Login required" });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Invalid token" });

  const { avatar } = req.body;
  if (!avatar) return res.status(400).json({ error: "Avatar required" });

  // base64 string se image type aur data alag karo
  const matches = avatar.match(/^data:(.+);base64,(.+)$/);
  if (!matches) return res.status(400).json({ error: "Invalid image format" });

  const mimeType   = matches[1]; // e.g. "image/jpeg"
  const base64Data = matches[2];
  const buffer     = Buffer.from(base64Data, "base64");
  const ext        = mimeType.split("/")[1] || "jpg";

  // Unique filename per upload — CDN cache issue nahi hogi
  const newFileName = `${user.id}_${Date.now()}.${ext}`;

  // Purani avatar URL DB se nikalo (cleanup ke liye)
  const { data: existingUser } = await supabase
    .from("users").select("avatar").eq("id", user.id).single();

  // Naya file upload karo
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(newFileName, buffer, { contentType: mimeType });

  if (uploadError) return res.status(500).json({ error: `Storage upload failed: ${uploadError.message}` });

  // Fresh public URL lao (no cache bust needed — unique filename hai)
  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(newFileName);

  const avatarUrl = urlData.publicUrl;

  // Users table me naya URL save karo
  const { error: dbError } = await supabase
    .from("users")
    .update({ avatar: avatarUrl })
    .eq("id", user.id);

  if (dbError) return res.status(500).json({ error: `DB update failed: ${dbError.message}` });

  // Purani file Storage se delete karo (cleanup)
  if (existingUser?.avatar) {
    const oldPath = existingUser.avatar.split("/avatars/")[1]?.split("?")[0];
    if (oldPath) await supabase.storage.from("avatars").remove([oldPath]);
  }

  res.json({ success: true, url: avatarUrl });
});

/* ─────────────────────────────────────────
   DELETE /api/auth/avatar
   Avatar hataao Storage + DB dono se
───────────────────────────────────────── */
router.delete("/avatar", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Login required" });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Invalid token" });

  // Storage se file hatao (jpeg — hamesha yahi hota hai)
  await supabase.storage.from("avatars").remove([`${user.id}.jpeg`]);

  // DB me null set karo
  await supabase.from("users").update({ avatar: null }).eq("id", user.id);

  res.json({ success: true });
});

/* ─────────────────────────────────────────
   POST /api/auth/send-otp
   Logged-in user ke email pe OTP bhejo
   Body: { email }  ← frontend localStorage se bhejta hai
   Token verify ki zaroorat nahi — OTP hi security hai
───────────────────────────────────────── */
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const admin = getAdminClient();

  // Verify: yeh email hamare users table mein hai?
  const { data: userRow, error: dbErr } = await admin
    .from("users").select("id").eq("email", email).single();
  if (dbErr || !userRow) return res.status(404).json({ error: "Email not found in system" });

  // OTP bhejo
  const { error } = await admin.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, email });
});

/* ─────────────────────────────────────────
   POST /api/auth/verify-otp-change-password
   OTP verify karke password badlo
   Body: { email, otp, newPassword }
───────────────────────────────────────── */
router.post("/verify-otp-change-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword)
    return res.status(400).json({ error: "Email, OTP aur naya password required hai" });

  const admin = getAdminClient();

  // OTP verify karo
  const { data: verifyData, error: otpError } = await admin.auth.verifyOtp({
    email,
    token: otp,
    type: "email",
  });

  if (otpError) return res.status(400).json({ error: "Invalid or expired OTP" });

  // Auth user ID nikalo
  const userId = verifyData?.user?.id;
  if (!userId) return res.status(400).json({ error: "OTP verification failed" });

  // Password update karo via admin API
  const { error: pwError } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (pwError) return res.status(500).json({ error: pwError.message });
  res.json({ success: true });
});

/* ─────────────────────────────────────────
   GET /api/auth/me
   Header: Authorization: Bearer <token>
───────────────────────────────────────── */
router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token required hai" });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Invalid token" });

  const { data: profile } = await supabase
    .from("users")
    .select("*, permissions(*, modules(module_key, module_name))")
    .eq("id", user.id)
    .single();

  res.json({ user: profile });
});

module.exports = router;
