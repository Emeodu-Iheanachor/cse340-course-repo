import bcrypt from 'bcrypt'

import {
  createUser,
  authenticateUser,
  getAllUsers
} from '../models/users.js'


/* =========================================================
   REQUIRE LOGIN MIDDLEWARE
   Protects routes that require authentication.
========================================================= */

const requireLogin = (req, res, next) => {
  if (!req.session?.user) {
    req.flash(
      'error',
      'You must be logged in to access that page.'
    )

    return res.redirect('/login')
  }

  next()
}


/* =========================================================
   REQUIRE ROLE MIDDLEWARE
   Protects routes that require a specific user role.
========================================================= */

const requireRole = (requiredRole) => {
  return (req, res, next) => {

    /* Verify authentication */

    if (!req.session?.user) {
      req.flash(
        'error',
        'You must be logged in to access that page.'
      )

      return res.redirect('/login')
    }

    /* Verify authorization */

    const userRole =
      String(req.session.user.role_name || '').toLowerCase()

    if (userRole !== String(requiredRole).toLowerCase()) {
      req.flash(
        'error',
        'You do not have permission to access this page.'
      )

      return res.redirect('/dashboard')
    }

    next()
  }
}


/* =========================================================
   SHOW DASHBOARD
========================================================= */

const showDashboard = (req, res) => {
  return res.render('dashboard', {
    title: 'Dashboard',
    user: req.session.user
  })
}


/* =========================================================
   SHOW USERS PAGE
   Displays registered users to authorized administrators.
========================================================= */

const showUsersPage = async (req, res) => {
  try {
    const users = await getAllUsers()

    return res.render('users', {
      title: 'Manage Users',
      users
    })

  } catch (error) {
    console.error('Error loading users page:', error)

    req.flash(
      'error',
      'Unable to load users. Please try again.'
    )

    return res.redirect('/dashboard')
  }
}


/* =========================================================
   SHOW REGISTRATION FORM
========================================================= */

const showUserRegistrationForm = (req, res) => {
  return res.render('register', {
    title: 'Register'
  })
}


/* =========================================================
   PROCESS USER REGISTRATION
   Validates input, hashes the password, and creates a user.
========================================================= */

const processUserRegistrationForm = async (req, res) => {
  const {
    name,
    email,
    password,
    confirmPassword
  } = req.body

  /* Validate required fields */

  if (
    !name ||
    !email ||
    !password ||
    !confirmPassword
  ) {
    req.flash(
      'error',
      'Please complete all required fields.'
    )

    return res.redirect('/register')
  }

  /* Validate input types */

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof confirmPassword !== 'string'
  ) {
    req.flash(
      'error',
      'Please provide valid registration information.'
    )

    return res.redirect('/register')
  }

  /* Clean user input */

  const cleanName = name.trim()
  const cleanEmail = email.trim().toLowerCase()

  /* Validate name */

  if (cleanName.length < 2) {
    req.flash(
      'error',
      'Name must be at least 2 characters long.'
    )

    return res.redirect('/register')
  }

  /* Validate email */

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailPattern.test(cleanEmail)) {
    req.flash(
      'error',
      'Please enter a valid email address.'
    )

    return res.redirect('/register')
  }

  /* Validate password length */

  if (password.length < 7) {
    req.flash(
      'error',
      'Password must be at least 7 characters long.'
    )

    return res.redirect('/register')
  }

  /* Confirm password */

  if (password !== confirmPassword) {
    req.flash(
      'error',
      'Passwords do not match.'
    )

    return res.redirect('/register')
  }

  try {

    /* Hash the password before storing it */

    const passwordHash = await bcrypt.hash(password, 10)

    /*
     * Public registration must create an ordinary user.
     * The model should assign the default "user" role.
     */

    await createUser(
      cleanName,
      cleanEmail,
      passwordHash
    )

    /* Registration success */

    req.flash(
      'success',
      'Registration successful! Please log in.'
    )

    return res.redirect('/login')

  } catch (error) {
    console.error('Error registering user:', error)

    /* Handle duplicate email addresses */

    if (error.code === '23505') {
      req.flash(
        'error',
        'An account with that email already exists.'
      )

      return res.redirect('/register')
    }

    /* Handle other registration errors */

    req.flash(
      'error',
      'An error occurred during registration. Please try again.'
    )

    return res.redirect('/register')
  }
}


/* =========================================================
   SHOW LOGIN FORM
========================================================= */

const showLoginForm = (req, res) => {
  return res.render('login', {
    title: 'Login'
  })
}


/* =========================================================
   PROCESS LOGIN
   Authenticates the user and creates an authenticated session.
========================================================= */

const processLoginForm = async (req, res) => {
  const { email, password } = req.body

  /* Validate required fields */

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !email.trim() ||
    !password
  ) {
    req.flash(
      'error',
      'Please enter your email and password.'
    )

    return res.redirect('/login')
  }

  const cleanEmail = email.trim().toLowerCase()

  try {

    /* Authenticate the user */

    const user = await authenticateUser(
      cleanEmail,
      password
    )

    /* Reject invalid credentials */

    if (!user) {
      req.flash(
        'error',
        'Invalid email or password.'
      )

      return res.redirect('/login')
    }

    /*
     * Verify that the authenticated user has a valid role.
     * The model should return role_name from the database.
     */

    if (
      typeof user.role_name !== 'string' ||
      !user.role_name.trim()
    ) {
      console.error(
        'Login failed: the authenticated user has no valid role.'
      )

      req.flash(
        'error',
        'Unable to verify your account permissions. Please contact support.'
      )

      return res.redirect('/login')
    }

    /*
     * Regenerate the session after successful authentication
     * to help prevent session fixation.
     */

    req.session.regenerate((error) => {
      if (error) {
        console.error(
          'Error regenerating session:',
          error
        )

        return res.status(500).render('login', {
          title: 'Login',
          error: 'Unable to start your session. Please try again.'
        })
      }

      /* Store only necessary user information */

      req.session.user = {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role_name: user.role_name
      }

      /* Set the flash message */

      req.flash(
        'success',
        `Welcome back, ${user.name}!`
      )

      /*
       * Save the session before redirecting so that the
       * authenticated session is available on the next request.
       */

      req.session.save((saveError) => {
        if (saveError) {
          console.error(
            'Error saving login session:',
            saveError
          )

          return res.status(500).render('login', {
            title: 'Login',
            error: 'Unable to save your session. Please try again.'
          })
        }

        return res.redirect('/dashboard')
      })
    })

  } catch (error) {
    console.error('Error during login:', error)

    req.flash(
      'error',
      'An error occurred while logging in. Please try again.'
    )

    return res.redirect('/login')
  }
}


/* =========================================================
   PROCESS LOGOUT
   Clears the authenticated session and displays a message.
========================================================= */

const processLogout = (req, res) => {
  if (!req.session) {
    return res.redirect('/login')
  }

  req.session.destroy((error) => {
    if (error) {
      console.error(
        'Error destroying session during logout:',
        error
      )

      return res.status(500).redirect('/dashboard')
    }

    res.clearCookie('connect.sid')

    return res.redirect('/login')
  })
}


/* =========================================================
   EXPORT CONTROLLERS AND MIDDLEWARE
   These names must match the imports in src/routes.js.
========================================================= */

export {
  requireLogin,
  requireRole,
  showDashboard,
  showUsersPage,
  showUserRegistrationForm,
  processUserRegistrationForm,
  showLoginForm,
  processLoginForm,
  processLogout
}
