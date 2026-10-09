

import bcrypt from 'bcrypt'
import db from '../src/models/db.js'


/* =========================================================
   ADMIN ACCOUNT SETUP
========================================================= */

/*
 * Administrator credentials are loaded from environment
 * variables.
 *
 * The actual password is NOT stored in this JavaScript file.
 *
 * For the CSE 340 testing account, the .env file should
 * contain:
 *
 * ADMIN_NAME
 * ADMIN_EMAIm
 * ADMIN_PASSWORD
 *
 * Do NOT commit the .env file to GitHub.
 */

const name =
    process.env.ADMIN_NAME || 'Admin'

const email =
    process.env.ADMIN_EMAIL

const password =
    process.env.ADMIN_PASSWORD


/* =========================================================
   CREATE OR UPDATE ADMIN ACCOUNT
========================================================= */

const createAdmin = async () => {

    try {

        /* -----------------------------------------------------
           VERIFY DATABASE CONFIGURATION
        ----------------------------------------------------- */

        if (!process.env.DB_URL) {

            throw new Error(
                'DB_URL is not defined. Check your .env file.'
            )
        }


        /* -----------------------------------------------------
           VERIFY ADMIN EMAIL
        ----------------------------------------------------- */

        if (!email) {

            throw new Error(
                'ADMIN_EMAIL is not defined. Check your .env file.'
            )
        }


        /* -----------------------------------------------------
           VERIFY ADMIN PASSWORD
        ----------------------------------------------------- */

        if (!password) {

            throw new Error(
                'ADMIN_PASSWORD is not defined. Check your .env file.'
            )
        }


        /* -----------------------------------------------------
           HASH ADMIN PASSWORD
        ----------------------------------------------------- */

        const passwordHash =
            await bcrypt.hash(password, 10)


        /* -----------------------------------------------------
           FIND ADMIN ROLE
        ----------------------------------------------------- */

        const roleResult =
            await db.query(`
                SELECT role_id
                FROM roles
                WHERE role_name = 'admin'
                LIMIT 1
            `)


        if (roleResult.rows.length === 0) {

            throw new Error(
                'The admin role does not exist in the roles table.'
            )
        }


        const adminRoleId =
            roleResult.rows[0].role_id


        /* -----------------------------------------------------
           CHECK WHETHER ADMIN ACCOUNT ALREADY EXISTS
        ----------------------------------------------------- */

        const existingUser =
            await db.query(
                `
                    SELECT user_id
                    FROM users
                    WHERE LOWER(email) = LOWER($1)
                    LIMIT 1
                `,
                [email]
            )


        /* =====================================================
           UPDATE EXISTING ADMIN ACCOUNT
        ===================================================== */

        if (existingUser.rows.length > 0) {

            await db.query(
                `
                    UPDATE users
                    SET
                        name = $1,
                        password_hash = $2,
                        role_id = $3
                    WHERE user_id = $4
                `,
                [
                    name,
                    passwordHash,
                    adminRoleId,
                    existingUser.rows[0].user_id
                ]
            )

            console.log(
                'Existing admin account updated successfully.'
            )

        } else {

            /* =================================================
               CREATE NEW ADMIN ACCOUNT
            ================================================= */

            await db.query(
                `
                    INSERT INTO users (
                        name,
                        email,
                        password_hash,
                        role_id
                    )
                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4
                    )
                `,
                [
                    name,
                    email,
                    passwordHash,
                    adminRoleId
                ]
            )

            console.log(
                'Admin account created successfully.'
            )
        }


        /* -----------------------------------------------------
           DISPLAY SAFE ACCOUNT INFORMATION
        ----------------------------------------------------- */

        console.log('')
        console.log(
            `Admin name: ${name}`
        )
        console.log(
            `Admin email: ${email}`
        )
        console.log('Role: admin')
        console.log(
            'Password: securely stored as a bcrypt hash.'
        )


    } catch (error) {

        console.error(
            'Unable to create admin account:',
            error.message
        )

        process.exitCode = 1

    } finally {

        /* -----------------------------------------------------
           CLOSE DATABASE CONNECTION
        ----------------------------------------------------- */

        if (typeof db.close === 'function') {

            await db.close()

        } else if (typeof db.end === 'function') {

            await db.end()
        }
    }
}


/* =========================================================
   RUN SCRIPT
========================================================= */

await createAdmin()