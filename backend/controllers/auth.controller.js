export const googleCallback = async (req, res) => {
  console.log("====== OAUTH CALLBACK REACHED ======");
  console.log("User Authenticated:", req.isAuthenticated());
  console.log("User Email:", req.user?.email);
  console.log("Session ID Exists:", !!req.sessionID, req.sessionID);

  console.log("Initiating session.save()...");
  req.session.save((err) => {
    if (err) {
      console.error("====== SESSION SAVE FAILED ======", err);
      return res.status(500).send("Session save failed");
    }

    console.log("====== SESSION SAVED SUCCESSFULLY ======");
    const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : 'http://localhost:5173';
    console.log(`Executing redirect to: ${frontendUrl}/dashboard`);
    res.redirect(`${frontendUrl}/dashboard`);
  });
};

export const logout = async (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Error logging out" });
    }
    req.session.destroy((err) => {
      res.clearCookie('connect.sid'); // Clear session cookie
      res.json({
        success: true,
        message: "Successfully logged out"
      });
    });
  });
};

export const getCurrentUser = async (req, res) => {
  console.log("===== AUTH DEBUG =====");
  console.log("isAuthenticated:", req.isAuthenticated());
  console.log("Session ID:", req.sessionID);
  console.log("Session:", req.session);
  console.log("Passport:", req.session?.passport);
  console.log("User:", req.user);
  if (req.isAuthenticated()) {
    res.json({
      name: req.user.displayName,
      email: req.user.email,
      picture: req.user.avatar,
      authenticated: true
    });
  } else {
    res.status(401).json({ authenticated: false, message: "Not authenticated" });
  }
};

export const revokeToken = async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  const token = req.user?.tokens?.refreshToken || req.user?.tokens?.accessToken;
  
  if (token) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
        method: 'POST',
        headers: { 'Content-type': 'application/x-www-form-urlencoded' }
      });
    } catch (err) {
      console.error("Token revocation error:", err);
    }
  }

  req.logout((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Error logging out" });
    }
    req.session.destroy((err) => {
      res.clearCookie('connect.sid');
      res.json({
        success: true,
        message: "Successfully disconnected and logged out"
      });
    });
  });
};
