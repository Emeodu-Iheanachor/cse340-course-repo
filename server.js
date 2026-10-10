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
    console.log(
      `${req.method} ${req.url}`
    )
  }

  next()
})


/* =========================================================
   SESSION MANAGEMENT
========================================================= */

/*
 * express-session MUST come before any middleware
 * or route that accesses req.session.
 */
app.use(
  session({
    secret: SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,

      secure:
        NODE_ENV === 'production',

      maxAge:
        1000 * 60 * 60 * 24
    }
  })
)


/* =========================================================
   FLASH MESSAGES
========================================================= */

/*
 * Flash middleware uses req.session, so it MUST
 * come after express-session.
 */
app.use(flash)


/* =========================================================
   GLOBAL TEMPLATE VARIABLES
========================================================= */

/*
 * This middleware comes AFTER session and flash.
 *
 * Therefore:
 * - req.session is available
 * - req.session.user is available
 * - res.locals.flash is already available
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
     APPLICATION ENVIRONMENT
  ------------------------------------------------------- */
  res.locals.NODE_ENV =
    NODE_ENV

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
  const error =
    new Error('Page Not Found')

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

    console.log(
      `Environment: ${NODE_ENV}`
    )

  } catch (error) {

    console.error(
      'Error connecting to the database:',
      error
    )
  }
})