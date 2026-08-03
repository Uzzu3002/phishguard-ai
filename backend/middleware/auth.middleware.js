export const requireAuth = (req, res, next) => {
  if (req.isAuthenticated() && req.user && req.user.tokens && req.user.tokens.accessToken) {
    return next();
  }
  return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
};
