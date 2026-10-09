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

    /* -------------------------------------------------------
       USER MUST BE LOGGED IN
    ------------------------------------------------------- */
    if (!req.session?.user) {
      req.flash(
        'error',
        'You must be logged in to access that page.'
      )

      return res.redirect('/login')
    }

    /* -------------------------------------------------------
       USER MUST HAVE THE REQUIRED ROLE
    ------------------------------------------------------- */
    if (req.session.user.role_name !== requiredRole) {
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
  const user = req.session.user

  res.render('dashboard', {
    title: 'Dashboard',
    name: user.name,
    email: user.email
  })
}


/* =========================================================
   SHOW USERS PAGE
   Admin-only page displaying registered users.
========================================================= */
const showUsersPage = async (req, res, next) => {
  try {
    const users = await getAllUsers()

    return res.render('users', {
      title: 'Manage Users',
      users
    })

  } catch (error) {
    console.error(
      'Error loading users page:',
      error
    )

    req.flash(
      'error',
      'Unable to load users.'
    )

    return res.redirect('/dashboard')
  }
}


/* =========================================================
   SHOW REGISTRATION FORM
========================================================= */
const showUserRegistrationForm = (req, res) => {
  res.render('register', {
    title: 'Register'
  })
}


/* =========================================================
   PROCESS USER REGISTRATION
========================================================= */
const processUserRegistrationForm = async (req, res) => {
  const { name, email, password } = req.body

  /* ---------------------------------------------------------
     BASIC SERVER-SIDE VALIDATION
  --------------------------------------------------------- */
  if (!name || !email || !password) {
    req.flash(
      'error',
      'Please complete all required fields.'
    )

    return res.redirect('/register')
  }

  /* ---------------------------------------------------------
     CLEAN USER INPUT
  --------------------------------------------------------- */
  const cleanName = name.trim()
  const cleanEmail = email.trim().toLowerCase()

  /* ---------------------------------------------------------
     VALIDATE NAME
  --------------------------------------------------------- */
  if (cleanName.length < 2) {
    req.flash(
      'error',
      'Name must be at least 2 characters long.'
    )

    return res.redirect('/register')
  }

  /* ---------------------------------------------------------
     VALIDATE EMAIL
  --------------------------------------------------------- */
  if (!cleanEmail.includes('@')) {
    req.flash(
      'error',
      'Please enter a valid email address.'
    )

    return res.redirect('/register')
  }

  /* ---------------------------------------------------------
     VALIDATE PASSWORD
     Password must be at least 7 characters.
  --------------------------------------------------------- */
  if (password.length < 7) {
    req.flash(
      'error',
      'Password must be at least 7 characters long.'
    )

    return res.redirect('/register')
  }

  try {
    /* -------------------------------------------------------
       HASH PASSWORD
       Never store the plain-text password.
    ------------------------------------------------------- */
    const saltRounds = 10

    const passwordHash = await bcrypt.hash(
      password,
      saltRounds
    )

    /* -------------------------------------------------------
       CREATE USER
       createUser() assigns the default "user" role.
       The registration form cannot select an admin role.
    ------------------------------------------------------- */
    await createUser(
      cleanName,
      cleanEmail,
      passwordHash
    )

    /* -------------------------------------------------------
       SUCCESS MESSAGE
    ------------------------------------------------------- */
    req.flash(
      'success',
      'Registration successful! Please log in.'
    )

    return res.redirect('/login')

  } catch (error) {
    console.error(
      'Error registering user:',
      error
    )

    /* -------------------------------------------------------
       HANDLE DUPLICATE EMAIL
       PostgreSQL unique constraint violation.
    ------------------------------------------------------- */
    if (error.code === '23505') {
      req.flash(
        'error',
        'An account with that email already exists.'
      )

      return res.redirect('/register')
    }

    /* -------------------------------------------------------
       HANDLE OTHER DATABASE/REGISTRATION ERRORS
    ------------------------------------------------------- */
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
  res.render('login', {
    title: 'Login'
  })
}


/* =========================================================
   PROCESS LOGIN
========================================================= */
const processLoginForm = async (req, res) => {
  const { email, password } = req.body

  /* ---------------------------------------------------------
     BASIC LOGIN VALIDATION
  --------------------------------------------------------- */
  if (!email || !password) {
    req.flash(
      'error',
      'Please enter your email and password.'
    )

    return res.redirect('/login')
  }

  /* ---------------------------------------------------------
     CLEAN EMAIL
  --------------------------------------------------------- */
  const cleanEmail = email.trim().toLowerCase()

  try {
    /* -------------------------------------------------------
       AUTHENTICATE USER

       authenticateUser() handles:
       - finding the user
       - bcrypt password comparison
       - returning safe user information
    ------------------------------------------------------- */
    const user = await authenticateUser(
      cleanEmail,
      password
    )

    /* -------------------------------------------------------
       AUTHENTICATION FAILED
    ------------------------------------------------------- */
    if (!user) {
      req.flash(
        'error',
        'Invalid email or password.'
      )

      return res.redirect('/login')
    }

    /* -------------------------------------------------------
       REGENERATE SESSION
       Helps prevent session fixation after login.
    ------------------------------------------------------- */
    req.session.regenerate((error) => {
      if (error) {
        console.error(
          'Error regenerating session:',
          error
        )

        return res.redirect('/login')
      }

      /* -----------------------------------------------------
         STORE ONLY SAFE USER INFORMATION IN SESSION

         NEVER store:
         - password
         - password_hash

         role_name is required by requireRole().
      ----------------------------------------------------- */
      req.session.user = {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role_name: user.role_name
      }

      /* -----------------------------------------------------
         SUCCESS FLASH MESSAGE
      ----------------------------------------------------- */
      req.flash(
        'success',
        `Welcome back, ${user.name}!`
      )

      /* -----------------------------------------------------
         REDIRECT TO PROTECTED DASHBOARD
      ----------------------------------------------------- */
      return res.redirect('/dashboard')
    })

  } catch (error) {
    console.error(
      'Error during login:',
      error
    )

    req.flash(
      'error',
      'An error occurred while logging in. Please try again.'
    )

    return res.redirect('/login')
  }
}


/* =========================================================
   PROCESS LOGOUT
========================================================= */
const processLogout = (req, res) => {
  if (!req.session) {
    return res.redirect('/login')
  }

  /* ---------------------------------------------------------
     REGENERATE SESSION
     Replaces the authenticated session with a new session
     while allowing the logout flash message to be displayed.
  --------------------------------------------------------- */
  req.session.regenerate((error) => {
    if (error) {
      console.error(
        'Error regenerating session during logout:',
        error
      )

      return res.redirect('/login')
    }

    req.flash(
      'success',
      'You have been logged out successfully.'
    )

    return res.redirect('/login')
  })
}


/* =========================================================
   EXPORT CONTROLLER FUNCTIONS AND MIDDLEWARE
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
