export const googleCallback = async (req, res) => {
  // Successful authentication, redirect to frontend dashboard.
  res.redirect('http://localhost:5173/dashboard');
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
