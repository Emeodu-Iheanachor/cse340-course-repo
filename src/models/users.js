import db from './db.js'
import bcrypt from 'bcrypt'


/* =========================================================
   CREATE NEW USER
   Public registration always creates a normal user.
   Password is already hashed by the controller.
========================================================= */

export const createUser = async (
  name,
  email,
  passwordHash
) => {
  const defaultRole = 'user'

  const query = `
    INSERT INTO users (
      name,
      email,
      password_hash,
      role_id
    )
    SELECT
      $1,
      $2,
      $3,
      role_id
    FROM roles
    WHERE role_name = $4
    ON CONFLICT (email) DO NOTHING
    RETURNING user_id, name, email, role_id
  `

  const values = [
    name,
    email,
    passwordHash,
    defaultRole
  ]

  const result = await db.query(query, values)

  if (result.rows.length === 0) {

    const existingUser = await db.query(
      `
        SELECT user_id
        FROM users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
      `,
      [email]
    )

    if (existingUser.rows.length > 0) {
      const error = new Error(
        'An account with this email already exists.'
      )

      error.code = '23505'
      throw error
    }

    const roleResult = await db.query(
      `
        SELECT role_id
        FROM roles
        WHERE role_name = $1
        LIMIT 1
      `,
      [defaultRole]
    )

    if (roleResult.rows.length === 0) {
      const error = new Error(
        'The default user role does not exist.'
      )

      error.code = 'USER_ROLE_NOT_FOUND'
      throw error
    }

    throw new Error(
      'Unable to create the user account.'
    )
  }

  if (process.env.ENABLE_SQL_LOGGING === 'true') {
    console.log(
      'Created new user with ID:',
      result.rows[0].user_id
    )
  }

  return result.rows[0]
}


/* =========================================================
   AUTHENTICATE USER
   Finds the account and verifies its password.
   Returns the user information and role.
========================================================= */

export const authenticateUser = async (
  email,
  password
) => {

  const query = `
    SELECT
      u.user_id,
      u.name,
      u.email,
      u.password_hash,
      r.role_name
    FROM users AS u
    INNER JOIN roles AS r
      ON u.role_id = r.role_id
    WHERE LOWER(u.email) = LOWER($1)
    LIMIT 1
  `

  const result = await db.query(query, [email])

  if (result.rows.length === 0) {
    return null
  }

  const user = result.rows[0]

  const passwordMatches = await bcrypt.compare(
    password,
    user.password_hash
  )

  if (!passwordMatches) {
    return null
  }

  delete user.password_hash

  return user
}


/* =========================================================
   GET ALL USERS
   Retrieves registered users for the admin users page.
   Never returns password hashes.
========================================================= */

export const getAllUsers = async () => {

  const query = `
    SELECT
      u.user_id,
      u.name,
      u.email,
      r.role_name
    FROM users AS u
    INNER JOIN roles AS r
      ON u.role_id = r.role_id
    ORDER BY u.user_id DESC
  `

  const result = await db.query(query)

  return result.rows
}