
import express from 'express'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import { fileURLToPath } from 'url'
import path from 'path'

import { pool, testConnection } from './src/models/db.js'
import flash from './src/middleware/flash.js'
import router from './src/routes.js'


/* =========================================================
   APPLICATION CONFIGURATION
========================================================= */

const NODE_ENV =
    process.env.NODE_ENV?.toLowerCase() || 'development'

const PORT = process.env.PORT || 3000

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
   FILE PATH CONFIGURATION
========================================================= */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


/* =========================================================
   INITIALIZE EXPRESS
========================================================= */

const app = express()

if (NODE_ENV === 'production') {
    app.set('trust proxy', 1)
}


/* =========================================================
   VIEW ENGINE
========================================================= */

app.set('view engine', 'ejs')

app.set(
    'views',
    path.join(__dirname, 'src', 'views')
)


/* =========================================================
   BODY PARSING
========================================================= */

app.use(express.urlencoded({ extended: true }))
app.use(express.json())


/* =========================================================
   STATIC FILES
========================================================= */

app.use(express.static(path.join(__dirname, 'public')))


/* =========================================================
   REQUEST LOGGING
========================================================= */

app.use((req, res, next) => {
    if (NODE_ENV === 'development') {
        console.log(`${req.method} ${req.originalUrl}`)
    }

    next()
})


/* =========================================================
   POSTGRESQL SESSION STORE
========================================================= */

const PgSession = connectPgSimple(session)

const sessionStore = new PgSession({
    // Reuse the existing PostgreSQL connection pool.
    pool,

    // Store sessions in this table.
    tableName: 'user_sessions',

    // Create the table if it does not exist.
    createTableIfMissing: true,

    // Session lifetime: 24 hours.
    ttl: 24 * 60 * 60,

    // Remove expired sessions every 15 minutes.
    pruneSessionInterval: 15 * 60
})


/* =========================================================
   SESSION MIDDLEWARE
========================================================= */

app.use(
    session({
        name: 'connect.sid',

        secret: SESSION_SECRET,

        store: sessionStore,

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

// The session middleware must run before flash middleware.
app.use(flash)


/* =========================================================
   GLOBAL TEMPLATE LOCALS
========================================================= */

app.use((req, res, next) => {
    const user = req.session.user || null

    res.locals.isLoggedIn = Boolean(user)

    res.locals.user = user

    res.locals.isAdmin =
        user?.role_name?.toLowerCase() === 'admin'

    res.locals.NODE_ENV = NODE_ENV

    res.locals.currentPath = req.originalUrl

    next()
})


/* =========================================================
   APPLICATION ROUTES
========================================================= */

app.use(router)



/* =========================================================
   404 NOT FOUND HANDLER
========================================================= */

app.use((req, res, next) => {
    res.status(404).render('errors/404', {
        title: 'Page Not Found',

        message: 'Sorry, the page you requested could not be found.',

        currentPath: req.originalUrl,

        user: req.session?.user || null,

        isLoggedIn: Boolean(req.session?.user),

        isAdmin:
            req.session?.user?.role_name?.toLowerCase() === 'admin',

        NODE_ENV
    })
})


/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {
    console.error('Application error:', err)

    if (res.headersSent) {
        return next(err)
    }

    const status = err.status || err.statusCode || 500

    res.status(status).render('errors/500', {
        title: 'Server Error',

        message:
            NODE_ENV === 'development'
                ? err.message
                : 'An unexpected error occurred. Please try again later.',

        error:
            NODE_ENV === 'development'
                ? err.message
                : 'An unexpected error occurred.',

        stack:
            NODE_ENV === 'development'
                ? err.stack
                : '',

        currentPath: req.originalUrl,

        user: req.session?.user || null,

        isLoggedIn: Boolean(req.session?.user),

        isAdmin:
            req.session?.user?.role_name?.toLowerCase() === 'admin',

        NODE_ENV
    })
})



/* =========================================================
   START SERVER
========================================================= */

app.listen(PORT, async () => {
    try {
        await testConnection()

        console.log('Database connection successful')

        console.log(
            `Server is running at http://127.0.0.1:${PORT}`
        )

        console.log(`Environment: ${NODE_ENV}`)

        console.log('Session storage: PostgreSQL')
    } catch (error) {
        console.error(
            'Error connecting to the database:',
            error.message
        )
    }
})
