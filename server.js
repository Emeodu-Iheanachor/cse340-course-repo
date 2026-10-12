import express from 'express'
import session from 'express-session'
import { fileURLToPath } from 'url'
import path from 'path'

import { testConnection } from './src/models/db.js'
import flash from './src/middleware/flash.js'
import router from './src/routes.js'


/* =========================================================
   APPLICATION CONFIGURATION
========================================================= */

const NODE_ENV =
  process.env.NODE_ENV?.toLowerCase() || 'development'

const PORT =
  process.env.PORT || 3000

const SESSION_SECRET =
  process.env.SESSION_SECRET || 'cse340-development-secret'


/* =========================================================
   PATH CONFIGURATION
========================================================= */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


/* =========================================================
   CREATE EXPRESS APPLICATION
========================================================= */

const app = express()


/* =========================================================
   VIEW ENGINE
========================================================= */

app.set('view engine', 'ejs')

app.set(
  'views',
  path.join(__dirname, 'src/views')
)


/* =========================================================
   REQUEST BODY MIDDLEWARE
========================================================= */

app.use(
  express.urlencoded({
    extended: true
  })
)

app.use(express.json())


/* =========================================================
   STATIC FILES
========================================================= */

app.use(
  express.static(
    path.join(__dirname, 'public')
  )
)


/* =========================================================
   REQUEST LOGGING
========================================================= */

app.use((req, res, next) => {
  if (NODE_ENV === 'development') {
    console.log(`${req.method} ${req.url}`)
  }

  next()
})


/* =========================================================
   SESSION MANAGEMENT
========================================================= */

/*
 * express-session must run before middleware or routes
 * that access req.session.
 *
 * The SESSION_SECRET should be configured in the
 * environment variables for the deployed application.
 */

app.use(
  session({
    secret: SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,

      secure: NODE_ENV === 'production',

      maxAge: 1000 * 60 * 60 * 24
    }
  })
)


/* =========================================================
   FLASH MESSAGES
========================================================= */

/*
 * Flash middleware depends on req.session and must
 * therefore run after express-session.
 */

app.use(flash)


/* =========================================================
   GLOBAL TEMPLATE VARIABLES
========================================================= */

/*
 * These variables are available to EJS templates.
 *
 * isLoggedIn:
 *   Indicates whether a user is logged in.
 *
 * user:
 *   Contains the current user's session data.
 *
 * isAdmin:
 *   Indicates whether the current user has the admin role.
 *
 * NODE_ENV:
 *   Identifies the application environment.
 *
 * currentPath:
 *   Identifies the current request path.
 */

app.use((req, res, next) => {

  /* -------------------------------------------------------
     LOGIN STATUS
  ------------------------------------------------------- */

  res.locals.isLoggedIn =
    Boolean(req.session?.user)


  /* -------------------------------------------------------
     CURRENT USER
  ------------------------------------------------------- */

  res.locals.user =
    req.session?.user || null


  /* -------------------------------------------------------
     ADMINISTRATOR STATUS
  ------------------------------------------------------- */

  res.locals.isAdmin =
    String(req.session?.user?.role_name || '')
      .toLowerCase() === 'admin'


  /* -------------------------------------------------------
     APPLICATION ENVIRONMENT
  ------------------------------------------------------- */

  res.locals.NODE_ENV =
    NODE_ENV


  /* -------------------------------------------------------
     CURRENT REQUEST PATH
  ------------------------------------------------------- */

  res.locals.currentPath =
    req.path


  next()
})


/* =========================================================
   APPLICATION ROUTES
========================================================= */

app.use(router)


/* =========================================================
   404 CATCH-ALL
========================================================= */

app.use((req, res, next) => {
  const error = new Error('Page Not Found')

  error.status = 404

  next(error)
})


/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {

  console.error(
    'Error occurred:',
    err.message
  )

  if (NODE_ENV === 'development') {
    console.error(err.stack)
  }

  const status =
    err.status || 500

  const template =
    status === 404
      ? '404'
      : '500'

  const context = {
    title:
      status === 404
        ? 'Page Not Found'
        : 'Server Error',

    error:
      NODE_ENV === 'development'
        ? err.message
        : 'An unexpected error occurred.',

    stack:
      NODE_ENV === 'development'
        ? err.stack
        : null
  }

  return res
    .status(status)
    .render(
      `errors/${template}`,
      context
    )
})


/* =========================================================
   START SERVER
========================================================= */

app.listen(PORT, async () => {
  try {
    await testConnection()

    console.log(
      `Server is running at http://127.0.0.1:${PORT}`
    )

    console.log(`Environment: ${NODE_ENV}`)
  } catch (error) {
    console.error(
      'Error connecting to the database:',
      error.message
    )
  }
})
