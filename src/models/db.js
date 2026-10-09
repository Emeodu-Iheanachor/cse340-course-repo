import { Pool } from 'pg'


/**
 * PostgreSQL connection pool.
 *
 * The project uses the Render PostgreSQL database
 * through the DB_URL environment variable.
 *
 * Render PostgreSQL requires SSL connections.
 */
const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: {
        rejectUnauthorized: false
    }
})


/**
 * Export a wrapped database object in development mode
 * when SQL logging is enabled.
 */
let db = null

if (
    process.env.NODE_ENV === 'development' &&
    process.env.ENABLE_SQL_LOGGING === 'true'
) {

    db = {

        async query(text, params) {

            try {

                const start = Date.now()

                const res =
                    await pool.query(
                        text,
                        params
                    )

                const duration =
                    Date.now() - start

                console.log(
                    'Executed query:',
                    {
                        text: text
                            .replace(/\s+/g, ' ')
                            .trim(),

                        duration:
                            `${duration}ms`,

                        rows:
                            res.rowCount
                    }
                )

                return res

            } catch (error) {

                console.error(
                    'Error in query:',
                    {
                        text: text
                            .replace(/\s+/g, ' ')
                            .trim(),

                        error:
                            error.message
                    }
                )

                throw error
            }
        },


        async connect() {
            return pool.connect()
        },


        async close() {
            await pool.end()
        }

    }

} else {

    db = pool

}


/**
 * Test the PostgreSQL database connection.
 */
const testConnection = async () => {

    try {

        const result =
            await db.query(
                'SELECT NOW() AS current_time'
            )

        console.log(
            'Database connection successful:',
            result.rows[0].current_time
        )

        return true

    } catch (error) {

        console.error(
            'Database connection failed:',
            error.message
        )

        throw error
    }
}


export {
    db as default,
    testConnection
}
