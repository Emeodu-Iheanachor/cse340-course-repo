/**
 * Flash Message Middleware
 *
 * Provides temporary messages that survive redirects and are removed
 * after retrieval.
 *
 * Supported message types:
 * notice, success, error, warning, info
 *
 * Requirements:
 * - express-session must run before this middleware.
 * - Flash messages are stored in the user's session.
 * - Messages can be retrieved by type or all at once.
 * - The flash() function is made available to EJS templates.
 */

/* =========================================================
   FLASH MESSAGE CONFIGURATION
========================================================= */

const ALLOWED_TYPES = [
  'notice',
  'success',
  'error',
  'warning',
  'info'
]

/**
 * Creates an empty flash message store.
 *
 * @returns {Object} An object containing an empty array
 * for each supported message type.
 */
const createFlashStore = () => ({
  notice: [],
  success: [],
  error: [],
  warning: [],
  info: []
})

/* =========================================================
   FLASH MESSAGE MIDDLEWARE
========================================================= */

/**
 * Initializes flash message storage and attaches the
 * req.flash() function to the request.
 *
 * Supported usage:
 *
 * Store a message:
 * req.flash('success', 'Operation completed successfully.')
 *
 * Retrieve messages of one type:
 * req.flash('error')
 *
 * Retrieve messages of all types:
 * req.flash()
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const flash = (req, res, next) => {
  /* -------------------------------------------------------
     VERIFY SESSION AVAILABILITY
  ------------------------------------------------------- */

  if (!req.session) {
    return next(
      new Error(
        'Flash middleware requires express-session to run first.'
      )
    )
  }

  /* -------------------------------------------------------
     INITIALIZE FLASH STORAGE
  ------------------------------------------------------- */

  if (!req.session.flash) {
    req.session.flash = createFlashStore()
  }

  /* -------------------------------------------------------
     DEFINE FLASH MESSAGE FUNCTION
  ------------------------------------------------------- */

  req.flash = (type, message) => {
    // Ensure flash storage exists.
    if (!req.session) {
      throw new Error(
        'Cannot access flash messages without an active session.'
      )
    }

    if (!req.session.flash) {
      req.session.flash = createFlashStore()
    }

    /* -----------------------------------------------------
       STORE A MESSAGE
    ----------------------------------------------------- */

    if (typeof type === 'string' && message !== undefined) {
      if (!ALLOWED_TYPES.includes(type)) {
        throw new Error(
          `Invalid flash message type: ${type}`
        )
      }

      if (typeof message !== 'string') {
        throw new TypeError(
          'Flash messages must be strings.'
        )
      }

      req.session.flash[type].push(message)

      return
    }

    /* -----------------------------------------------------
       RETRIEVE MESSAGES OF ONE TYPE
    ----------------------------------------------------- */

    if (typeof type === 'string') {
      if (!ALLOWED_TYPES.includes(type)) {
        return []
      }

      const messages = [
        ...req.session.flash[type]
      ]

      req.session.flash[type] = []

      return messages
    }

    /* -----------------------------------------------------
       RETRIEVE ALL MESSAGE TYPES
    ----------------------------------------------------- */

    const messages = {
      ...createFlashStore()
    }

    for (const messageType of ALLOWED_TYPES) {
      messages[messageType] = [
        ...req.session.flash[messageType]
      ]
    }

    // Clear all messages after retrieval.
    req.session.flash = createFlashStore()

    return messages
  }

  /* -------------------------------------------------------
     MAKE FLASH AVAILABLE TO EJS TEMPLATES
  ------------------------------------------------------- */

  res.locals.flash = req.flash

  next()
}

/* =========================================================
   EXPORT MIDDLEWARE
========================================================= */

export default flash