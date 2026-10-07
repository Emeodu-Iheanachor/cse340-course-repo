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
  if (!req.session || !req.session.user) {
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
   Middleware factory used to protect routes that require
   a specific user role.
========================================================= */
const requireRole = (role) => {
  return (req, res, next) => {

    /* -------------------------------------------------------
       USER MUST BE LOGGED IN
    ------------------------------------------------------- */
    if (!req.session || !req.session.user) {
      req.flash(
        'error',
        'You must be logged in to access this page.'
      )

      return res.redirect('/login')
    }

    /* -------------------------------------------------------
       USER MUST HAVE THE REQUIRED ROLE
    ------------------------------------------------------- */
    if (req.session.user.role_name !== role) {
      req.flash(
        'error',
        'You do not have permission to access this page.'
      )

      return res.redirect('/')
    }

    /* -------------------------------------------------------
       USER HAS THE REQUIRED ROLE
    ------------------------------------------------------- */
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

    res.render('users', {
      title: 'Manage Users',
      users
    })
  } catch (error) {
    console.error(
      'Error loading users page:',
      error
    )

    next(error)
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

  try {
    /* -------------------------------------------------------
       BASIC SERVER-SIDE VALIDATION
    ------------------------------------------------------- */
    if (!name || !email || !password) {
      req.flash(
        'error',
        'Please complete all required fields.'
      )

      return res.redirect('/register')
    }

    /* -------------------------------------------------------
       CLEAN USER INPUT
    ------------------------------------------------------- */
    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()

    /* -------------------------------------------------------
       VALIDATE NAME
    ------------------------------------------------------- */
    if (cleanName.length < 2) {
      req.flash(
        'error',
        'Name must be at least 2 characters long.'
      )

      return res.redirect('/register')
    }

    /* -------------------------------------------------------
       VALIDATE EMAIL
    ------------------------------------------------------- */
    if (!cleanEmail.includes('@')) {
      req.flash(
        'error',
        'Please enter a valid email address.'
      )

      return res.redirect('/register')
    }

    /* -------------------------------------------------------
       VALIDATE PASSWORD
    ------------------------------------------------------- */
    if (password.length < 7) {
      req.flash(
        'error',
        'Password must be at least 7 characters long.'
      )

      return res.redirect('/register')
    }

    /* -------------------------------------------------------
       HASH PASSWORD
    ------------------------------------------------------- */
    const saltRounds = 10

    const passwordHash = await bcrypt.hash(
      password,
      saltRounds
    )

    /* -------------------------------------------------------
       CREATE USER
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
    ------------------------------------------------------- */
    if (error.code === '23505') {
      req.flash(
        'error',
        'An account with that email already exists.'
      )

      return res.redirect('/register')
    }

    /* -------------------------------------------------------
       HANDLE OTHER ERRORS
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

  try {
    /* -------------------------------------------------------
       BASIC LOGIN VALIDATION
    ------------------------------------------------------- */
    if (!email || !password) {
      req.flash(
        'error',
        'Please enter your email and password.'
      )

      return res.redirect('/login')
    }

    /* -------------------------------------------------------
       CLEAN EMAIL
    ------------------------------------------------------- */
    const cleanEmail = email.trim().toLowerCase()

    /* -------------------------------------------------------
       AUTHENTICATE USER
    ------------------------------------------------------- */
    const user = await authenticateUser(
      cleanEmail,
      password
    )

    if (user) {

      /* -----------------------------------------------------
         STORE AUTHENTICATED USER IN SESSION

         IMPORTANT:
         role_name must be included here because
         requireRole() uses it to authorize admin routes.

         The password hash is NOT stored in the session.
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
        'Login successful!'
      )

      /* -----------------------------------------------------
         DEVELOPMENT DEBUGGING
      ----------------------------------------------------- */
      if (res.locals.NODE_ENV === 'development') {
        console.log(
          'User logged in:',
          {
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            role_name: user.role_name
          }
        )
      }

      /* -----------------------------------------------------
         REDIRECT TO PROTECTED DASHBOARD
      ----------------------------------------------------- */
      return res.redirect('/dashboard')
    }

    /* -------------------------------------------------------
       AUTHENTICATION FAILED
    ------------------------------------------------------- */
    req.flash(
      'error',
      'Invalid email or password.'
    )

    return res.redirect('/login')

  } catch (error) {
    console.error(
      'Error during login:',
      error
    )

    req.flash(
      'error',
      'An error occurred during login. Please try again.'
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

  req.session.destroy((error) => {
    if (error) {
      console.error(
        'Error destroying session:',
        error
      )

      return res.redirect('/')
    }

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
