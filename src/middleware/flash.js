/**
 * Flash Message Middleware
 *
 * Provides temporary message storage that survives redirects
 * but is consumed when retrieved.
 *
 * Message types:
 * success, error, warning, info
 */

const flashMiddleware = (req, res, next) => {
    req.flash = function (type, message) {

        // Initialize flash storage
        if (!req.session.flash) {
            req.session.flash = {
                success: [],
                error: [],
                warning: [],
                info: []
            }
        }

        // SET: req.flash('success', 'Message')
        if (type && message) {

            // Create the message type if it does not exist
            if (!req.session.flash[type]) {
                req.session.flash[type] = []
            }

            req.session.flash[type].push(message)

            return
        }

        // GET ONE TYPE: req.flash('success')
        if (type && !message) {
            const messages = req.session.flash[type] || []

            // Clear messages after retrieving them
            req.session.flash[type] = []

            return messages
        }

        // GET ALL: req.flash()
        const allMessages = req.session.flash

        // Clear all messages after retrieving them
        req.session.flash = {
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
 * Make flash() available to EJS templates.
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
