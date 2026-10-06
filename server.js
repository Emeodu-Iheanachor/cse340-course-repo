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
  process.env.NODE_ENV?.toLowerCase() || 'production'

const PORT =
  process.env.PORT || 3000

const SESSION_SECRET =
  process.env.SESSION_SECRET || 'development-session-secret'


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
   EJS CONFIGURATION
========================================================= */

app.set('view engine', 'ejs')

app.set(
  'views',
  path.join(__dirname, 'src/views')
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
 * Session middleware must come before any middleware
 * or route that accesses req.session.
 */
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    cookie: {
      maxAge: 60 * 60 * 1000,
      httpOnly: true,
      secure: NODE_ENV === 'production'
    }
  })
)


/* =========================================================
   FLASH MESSAGES
========================================================= */

/*
 * Flash middleware uses the session, so it must
 * come after express-session.
 */
app.use(flash)


/* =========================================================
   GLOBAL TEMPLATE VARIABLES
========================================================= */

/*
 * Make authentication information available
 * to every EJS template.
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
  const err =
    new Error('Page Not Found')

  err.status = 404

  next(err)
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

  res
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
