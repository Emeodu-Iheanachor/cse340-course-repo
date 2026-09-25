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

// Define the application environment
const NODE_ENV =
  process.env.NODE_ENV?.toLowerCase() || 'production'

// Define the port number the server will listen on
const PORT = process.env.PORT || 3000

// Load the session secret from the environment
// The fallback helps prevent a missing-secret error during
// local development. Set SESSION_SECRET in production.
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
   EXPRESS MIDDLEWARE
========================================================= */

// Allow Express to receive and process HTML form submissions.
// This MUST appear before the routes.
app.use(
  express.urlencoded({
    extended: true
  })
)

// Allow Express to receive JSON request bodies.
app.use(express.json())

// Serve static files from the public directory.
app.use(
  express.static(
    path.join(__dirname, 'public')
  )
)

// Set EJS as the templating engine.
app.set('view engine', 'ejs')

// Tell Express where to find EJS templates.
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
   GLOBAL TEMPLATE VARIABLES
========================================================= */

// Make NODE_ENV available to all EJS templates.
app.use((req, res, next) => {
  res.locals.NODE_ENV = NODE_ENV
  next()
})


/* =========================================================
   SESSION MANAGEMENT
========================================================= */

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,

    cookie: {
      maxAge: 60 * 60 * 1000
    }
  })
)


/* =========================================================
   FLASH MESSAGES
========================================================= */

// Flash middleware must come after the session middleware
// because it uses the session to store messages.
app.use(flash)


/* =========================================================
   APPLICATION ROUTES
========================================================= */

// All application routes are handled here.
app.use(router)


/* =========================================================
   404 CATCH-ALL
========================================================= */

// This must appear AFTER all regular routes.
app.use((req, res, next) => {
  const err = new Error('Page Not Found')

  err.status = 404

  next(err)
})


/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

// Express identifies this as error-handling middleware
// because it has four parameters.
app.use((err, req, res, next) => {
  // Log error details during development.
  console.error(
    'Error occurred:',
    err.message
  )

  if (NODE_ENV === 'development') {
    console.error(err.stack)
  }

  // Determine the HTTP status.
  const status = err.status || 500

  // Select the appropriate error template.
  const template =
    status === 404
      ? '404'
      : '500'

  // Data passed to the error template.
  const context = {
    title:
      status === 404
        ? 'Page Not Found'
        : 'Server Error',

    error: err.message,

    // Only expose the stack during development.
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