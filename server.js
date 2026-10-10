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
  process.env.SESSION_SECRET ||
  (NODE_ENV === 'development'
    ? 'cse340-development-secret'
    : undefined)

if (!SESSION_SECRET) {
  throw new Error(
    'SESSION_SECRET must be configured in production.'
  )
}


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
   TRUST RENDER HTTPS REVERSE PROXY
========================================================= */

if (NODE_ENV === 'production') {
  app.set('trust proxy', 1)
}


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
  console.log(
    `${new Date().toISOString()} ${req.method} ${req.originalUrl}`
  )

  res.on('finish', () => {
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode}`
    )
  })

  next()
})


/* =========================================================
   SESSION MANAGEMENT
========================================================= */

app.use(
  session({
    name: 'serviceNetwork.sid',

    secret: SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,

      secure: NODE_ENV === 'production',

      sameSite: 'lax',

      maxAge: 1000 * 60 * 60 * 24
    }
  })
)


/* =========================================================
   FLASH MESSAGES
========================================================= */

app.use(flash)


/* =========================================================
   GLOBAL TEMPLATE VARIABLES
========================================================= */

app.use((req, res, next) => {
  res.locals.isLoggedIn =
    Boolean(req.session?.user)

  res.locals.user =
    req.session?.user || null

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

  if (res.headersSent) {
    return next(err)
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
  console.log(
    `Server is running on port ${PORT}`
  )

  console.log(
    `Environment: ${NODE_ENV}`
  )

  try {
    await testConnection()

    console.log(
      'Database connection successful.'
    )
  } catch (error) {
    console.error(
      'Error connecting to the database:',
      error
    )
  }
})
