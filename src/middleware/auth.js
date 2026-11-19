/**
 * Authentication and Authorization Middleware
 *
 * Protects routes based on login status and user roles.
 */

const requireLogin = (req, res, next) => {

  if (!req.session?.user) {

    req.flash(
      'error',
      'You must be logged in to access that page.'
    )

    return res.redirect('/login')
  }

  return next()
}


/**
 * Require the authenticated user to have a specific role.
 */
const requireRole = (requiredRole) => {

  return (req, res, next) => {

    if (!req.session?.user) {

      req.flash(
        'error',
        'You must be logged in to access that page.'
      )

      return res.redirect('/login')
    }

    const userRole = String(
      req.session.user.role_name || ''
    ).trim().toLowerCase()

    const expectedRole = String(
      requiredRole || ''
    ).trim().toLowerCase()

    if (!expectedRole || userRole !== expectedRole) {

      req.flash(
        'error',
        'You do not have permission to access this page.'
      )

      return res.redirect('/dashboard')
    }

    return next()
  }
}


export {
  requireLogin,
  requireRole
}
