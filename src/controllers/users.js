import bcrypt from 'bcrypt'


/* =========================================================
   DATABASE MODEL IMPORTS
========================================================= */

import {
  createUser,
  authenticateUser,
  getAllUsers
} from '../models/users.js'


import {
  getProjectsByVolunteer
} from '../models/volunteer-model.js'


import {
  createActivityLog
} from '../models/activity-model.js'


/* =========================================================
   REQUIRE LOGIN MIDDLEWARE

   Protects routes that require authentication.
   Only logged-in users can access protected routes.
========================================================= */

const requireLogin = (req, res, next) => {

  // Verify authentication.
  if (!req.session?.user) {

    req.flash(
      'error',
      'You must be logged in to access that page.'
    )

    return res.redirect('/login')
  }


  // Allow authenticated users to continue.
  return next()

}


/* =========================================================
   REQUIRE ROLE MIDDLEWARE

   Protects routes that require a specific user role.

   Only authenticated users with the required role
   are permitted to continue.
========================================================= */

const requireRole = (requiredRole) => {

  return (req, res, next) => {

    // Verify authentication.
    if (!req.session?.user) {

      req.flash(
        'error',
        'You must be logged in to access that page.'
      )

      return res.redirect('/login')
    }


    // Normalize the authenticated user's role.
    const userRole = String(
      req.session.user.role_name || ''
    ).trim().toLowerCase()


    // Normalize the required role.
    const expectedRole = String(
      requiredRole || ''
    ).trim().toLowerCase()


    // Verify authorization.
    if (!expectedRole || userRole !== expectedRole) {

      req.flash(
        'error',
        'You do not have permission to access this page.'
      )

      return res.redirect('/dashboard')
    }


    // Allow authorized users to continue.
    return next()

  }

}


/* =========================================================
   SHOW DASHBOARD

   Displays the logged-in user's information and the service
   projects they have volunteered for.
========================================================= */

const showDashboard = async (req, res, next) => {

  try {

    // Retrieve authenticated user information.
    const user = req.session.user


    // Retrieve the user's volunteer projects.
    const volunteerProjects = await getProjectsByVolunteer(
      user.user_id
    )


    // Display dashboard.
    return res.render('dashboard', {
      title: 'Dashboard',
      user,
      volunteerProjects
    })

  } catch (error) {

    console.error(
      'Error loading dashboard:',
      error
    )

    return next(error)

  }

}


/* =========================================================
   SHOW USERS PAGE

   Displays registered users to administrators.
========================================================= */

const showUsersPage = async (req, res) => {

  try {

    // Retrieve all registered users.
    const users = await getAllUsers()


    // Display users page.
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

   Validates input, confirms the password, hashes it,
   creates a new user, and records REGISTER activity.

   Public registration always creates an ordinary user.
========================================================= */

const processUserRegistrationForm = async (req, res) => {

  const {
    name,
    email,
    password,
    confirmPassword
  } = req.body


  /* Validate input types before processing. */

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof confirmPassword !== 'string'
  ) {

    req.flash(
      'error',
      'Please complete all required fields with valid information.'
    )

    return res.redirect('/register')

  }


  /* Normalize name and email. */

  const cleanName = name.trim()
  const cleanEmail = email.trim().toLowerCase()


  /* Validate required fields. */

  if (
    !cleanName ||
    !cleanEmail ||
    !password ||
    !confirmPassword
  ) {

    req.flash(
      'error',
      'Please complete all required fields.'
    )

    return res.redirect('/register')

  }


  /* Validate name. */

  if (cleanName.length < 2) {

    req.flash(
      'error',
      'Name must be at least 2 characters long.'
    )

    return res.redirect('/register')

  }


  /* Validate email format. */

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailPattern.test(cleanEmail)) {

    req.flash(
      'error',
      'Please enter a valid email address.'
    )

    return res.redirect('/register')

  }


  /* Validate password length. */

  if (password.length < 7) {

    req.flash(
      'error',
      'Password must be at least 7 characters long.'
    )

    return res.redirect('/register')

  }


  /* Confirm password. */

  if (password !== confirmPassword) {

    req.flash(
      'error',
      'Passwords do not match.'
    )

    return res.redirect('/register')

  }


  try {

    /* Hash the password before storing it. */

    const passwordHash = await bcrypt.hash(
      password,
      10
    )


    /*
     * Public registration creates an ordinary user.
     * The model assigns the default user role.
     */

    const newUser = await createUser(
      cleanName,
      cleanEmail,
      passwordHash
    )


    /*
     * Record successful registration.
     * Logging failure must not undo registration.
     */

    try {

      await createActivityLog({
        user_id: newUser.user_id,
        action: 'REGISTER',
        description: `User ${newUser.name} registered successfully.`,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      })

    } catch (activityError) {

      console.error(
        'Registration activity logging failed:',
        activityError
      )

    }


    /* Registration success message. */

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


    /* Handle duplicate email addresses. */

    if (
      error.code === '23505' &&
      (
        !error.constraint ||
        error.constraint === 'users_email_key'
      )
    ) {

      req.flash(
        'error',
        'An account with that email already exists.'
      )

      return res.redirect('/register')

    }


    /* Handle a missing default user role. */

    if (error.code === 'USER_ROLE_NOT_FOUND') {

      req.flash(
        'error',
        'Registration is temporarily unavailable. Please contact support.'
      )

      return res.redirect('/register')

    }


    /* Handle other registration errors. */

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
   RENDER LOGIN ERROR

   Keeps login error handling consistent.
========================================================= */

const renderLoginError = (res, message, statusCode = 500) => {

  return res.status(statusCode).render('login', {
    title: 'Login',
    error: message
  })

}


/* =========================================================
   PROCESS LOGIN

   Authenticates the user, creates a secure session,
   and records LOGIN activity.
========================================================= */

const processLoginForm = async (req, res) => {

  const { email, password } = req.body


  /* Validate input types. */

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

    /* Authenticate the user. */

    const user = await authenticateUser(
      cleanEmail,
      password
    )


    // Reject invalid credentials.
    if (!user) {

      req.flash(
        'error',
        'Invalid email or password.'
      )

      return res.redirect('/login')

    }


    /* Verify the user's role. */

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

        return renderLoginError(
          res,
          'Unable to start your session. Please try again.'
        )

      }


      /* Store only necessary user information. */

      req.session.user = {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role_name: user.role_name
      }


      /*
       * Store the welcome message directly in the new session.
       * The flash middleware remains responsible for retrieving it.
       */

      req.flash(
        'success',
        `Welcome back, ${user.name}!`
      )


      /*
       * Save the authenticated session before redirecting.
       */

      req.session.save(async (saveError) => {

        if (saveError) {

          console.error(
            'Error saving login session:',
            saveError
          )

          return renderLoginError(
            res,
            'Unable to save your session. Please try again.'
          )

        }


        /*
         * Record successful login.
         * Logging failure must not prevent login.
         */

        try {

          await createActivityLog({
            user_id: user.user_id,
            action: 'LOGIN',
            description: `User ${user.name} logged into the application.`,
            ip_address: req.ip,
            user_agent: req.get('user-agent')
          })

        } catch (activityError) {

          console.error(
            'Login activity logging failed:',
            activityError
          )

        }


        return res.redirect('/dashboard')

      })

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

   Captures the authenticated user, destroys the session,
   and records LOGOUT activity.
========================================================= */

const processLogout = (req, res) => {

  if (!req.session) {
    return res.redirect('/login')
  }


  /*
   * Capture user information before destroying the session.
   */

  const user = req.session.user


  req.session.destroy(async (error) => {

    if (error) {

      console.error(
        'Error destroying session during logout:',
        error
      )

      return res.status(500).redirect('/dashboard')

    }


    /*
     * Record logout after successful session destruction.
     */

    if (user?.user_id) {

      try {

        await createActivityLog({
          user_id: user.user_id,
          action: 'LOGOUT',
          description: `User ${user.name} logged out of the application.`,
          ip_address: req.ip,
          user_agent: req.get('user-agent')
        })

      } catch (activityError) {

        console.error(
          'Logout activity logging failed:',
          activityError
        )

      }

    }


    // Clear the session cookie.
    res.clearCookie('connect.sid')


    return res.redirect('/login')

  })

}


/* =========================================================
   EXPORT CONTROLLERS AND MIDDLEWARE

   These names match src/routes.js.
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
