// SAAGARAM ADMIN AUTHENTICATION

async function protectAdmin() {
  try {
    const { data: { user }, error } = await db.auth.getUser();

    if (error || !user) {
      window.location.replace("login.html");
      return;
    }

    const { data: profile, error: profileError } = await db
      .from("admin_profiles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (profileError || !profile) {
      await db.auth.signOut();
      window.location.replace("login.html");
      return;
    }

    // Show dashboard after successful verification.
    document.body.style.visibility = "visible";

  } catch (error) {
    console.error("Admin authentication failed:", error);
    window.location.replace("login.html");
  }
}

async function adminLogout() {
  const { error } = await db.auth.signOut();

  if (error) {
    alert("Logout failed. Please try again.");
    return;
  }

  window.location.replace("login.html");
}

protectAdmin();