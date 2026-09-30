/**
 * Flash Message Middleware
 *
 * Provides temporary messages that survive redirects
 * and are removed after they are retrieved.
 *
 * Supported message types:
 * notice, success, error, warning, info
 */

/**
 * Creates the req.flash() function.
 */
const flashMiddleware = (req, res, next) => {

    req.flash = function (type, message) {

        // Initialize flash storage.
        if (!req.session.flash) {
            req.session.flash = {
                notice: [],
                success: [],
                error: [],
                warning: [],
                info: []
            }
        }

        /*
         * SET MESSAGE
         *
         * Example:
         * req.flash(
         *     'notice',
         *     'Category was created successfully.'
         * )
         */
        if (type && message) {

            // Create the message type if necessary.
            if (!req.session.flash[type]) {
                req.session.flash[type] = []
            }

            req.session.flash[type].push(message)

            return
        }

        /*
         * GET ONE MESSAGE TYPE
         *
         * Example:
         * const messages = req.flash('notice')
         */
        if (type && !message) {

            const messages = req.session.flash[type] || []

            // Remove the messages after retrieving them.
            req.session.flash[type] = []

            return messages
        }

        /*
         * GET ALL MESSAGE TYPES
         *
         * Example:
         * const messages = req.flash()
         */
        const allMessages = req.session.flash

        // Clear all messages after retrieving them.
        req.session.flash = {
            notice: [],
            success: [],
            error: [],
            warning: [],
            info: []
        }

        return allMessages
    }

    next()
}


/**
 * Makes flash() available to EJS templates.
 */
const flashLocals = (req, res, next) => {

    res.locals.flash = req.flash

    next()
}


/**
 * Combined flash middleware.
 */
const flash = (req, res, next) => {

    flashMiddleware(req, res, () => {
        flashLocals(req, res, next)
    })
}


export default flash