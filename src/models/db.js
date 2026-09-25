import { Pool } from 'pg';


/**
 * Connection pool for PostgreSQL database.
 *
 * Uses the database connection string stored in the DB_URL
 * environment variable.
 */
const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: {
        rejectUnauthorized: false
    }
});


/**
 * Export a wrapped database object in development mode
 * when SQL logging is enabled.
 */
let db = null;


if (
    process.env.NODE_ENV === 'development' &&
    process.env.ENABLE_SQL_LOGGING === 'true'
) {
    db = {
        /**
         * Execute a SQL query.
         */
        async query(text, params) {
            try {
                const start = Date.now();

                const res = await pool.query(text, params);

                const duration = Date.now() - start;

                console.log('Executed query:', {
                    text: text.replace(/\s+/g, ' ').trim(),
                    duration: `${duration}ms`,
                    rows: res.rowCount
                });

                return res;
            } catch (error) {
                console.error('Error in query:', {
                    text: text.replace(/\s+/g, ' ').trim(),
                    error: error.message
                });

                throw error;
            }
        },

        /**
         * Get a PostgreSQL client from the connection pool.
         *
         * Required for transactions such as:
         * BEGIN, COMMIT, and ROLLBACK.
         */
        async connect() {
            return pool.connect();
        },

        /**
         * Close the PostgreSQL connection pool.
         */
        async close() {
            await pool.end();
        }
    };
} else {
    db = pool;
}


/**
 * Tests the database connection.
 */
const testConnection = async () => {
    try {
        const result = await db.query(
            'SELECT NOW() AS current_time'
        );

        console.log(
            'Database connection successful:',
            result.rows[0].current_time
        );

        return true;
    } catch (error) {
        console.error(
            'Database connection failed:',
            error.message
        );

        throw error;
    }
};


export { db as default, testConnection };