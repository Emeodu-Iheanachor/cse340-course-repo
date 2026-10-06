/**
 * Require the user to be logged in.
 */
export const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    req.flash(
      "notice",
      "Please log in to access that page."
    );

    return res.redirect("/login");
  }

  next();
};


/**
 * Require the logged-in user to have a specific role.
 */
export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    // User must be logged in first.
    if (!req.session.user) {
      req.flash(
        "notice",
        "Please log in to access that page."
      );

      return res.redirect("/login");
    }

    // User must have the required role.
    if (req.session.user.role_name !== requiredRole) {
      req.flash(
        "notice",
        "You do not have permission to access that page."
      );

      return res.redirect("/dashboard");
    }

    next();
  };
};
