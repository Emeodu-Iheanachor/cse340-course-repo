/**
 * Flash Message Middleware
 *
 * Provides temporary messages that survive redirects
 * and are removed after they are retrieved.
 *
 * Supported message types:
 * notice, success, error, warning, info
 */


/* =========================================================
   FLASH STORAGE FACTORY
========================================================= */
const createFlashStore = () => ({
  notice: [],
  success: [],
  error: [],
  warning: [],
  info: []
})


/* =========================================================
   FLASH MIDDLEWARE
========================================================= */
const flash = (req, res, next) => {

  /* ---------------------------------------------------------
     INITIALIZE FLASH STORAGE
     
     This runs when the middleware first processes
     the request.
  --------------------------------------------------------- */
  if (!req.session.flash) {
    req.session.flash = createFlashStore()
  }


  /* =========================================================
     CREATE req.flash()

     SET:
       req.flash(
         'success',
         'Registration successful.'
       )

     GET ONE TYPE:
       req.flash('success')

     GET ALL:
       req.flash()
  ========================================================= */
  req.flash = (type, message) => {

    /* -------------------------------------------------------
       REINITIALIZE FLASH STORAGE IF NECESSARY

       IMPORTANT:
       express-session's req.session.regenerate()
       creates a new session object.

       Therefore, req.session.flash may no longer exist
       after login/logout session regeneration.
    ------------------------------------------------------- */
    if (!req.session.flash) {
      req.session.flash = createFlashStore()
    }


    /* -------------------------------------------------------
       SET A MESSAGE
    ------------------------------------------------------- */
    if (type && message) {

      if (!req.session.flash[type]) {
        req.session.flash[type] = []
      }

      req.session.flash[type].push(message)

      return
    }


    /* -------------------------------------------------------
       GET ONE MESSAGE TYPE
    ------------------------------------------------------- */
    if (type) {

      const messages =
        req.session.flash[type] || []

      req.session.flash[type] = []

      return messages
    }


    /* -------------------------------------------------------
       GET ALL MESSAGE TYPES

       The messages are returned to the template and
       removed from the session so they appear only once.
    ------------------------------------------------------- */
    const messages = {
      ...req.session.flash
    }


    req.session.flash = createFlashStore()


    return messages
  }


  /* =========================================================
     MAKE req.flash() AVAILABLE TO EJS

     IMPORTANT:
     EJS expects flash to be a FUNCTION because your
     header.ejs uses:

       const messages = flash()
  ========================================================= */
  res.locals.flash = req.flash


  next()
}


export default flash
