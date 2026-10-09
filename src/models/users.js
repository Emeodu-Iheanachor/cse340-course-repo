import db from './db.js'
import bcrypt from 'bcrypt'


/* =========================================================
   CREATE NEW USER
   Public registration always creates a normal user.
   The role is intentionally NOT supplied by the user.
========================================================= */
export const createUser = async (name, email, passwordHash) => {
  const defaultRole = 'user'

  const query = `
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
      (
        SELECT role_id
        FROM roles
        WHERE role_name = $4
      )
    )
    RETURNING user_id, name, email
  `

  const queryParams = [
    name,
    email,
    passwordHash,
    defaultRole
  ]

  const result = await db.query(query, queryParams)

  if (result.rows.length === 0) {
    throw new Error('Failed to create user.')
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
   GET USER BY EMAIL
========================================================= */
export const getUserByEmail = async (email) => {
  const query = `
    SELECT
      u.user_id,
      u.name,
      u.email,
      u.password_hash,
      r.role_name
    FROM users u
    JOIN roles r
      ON u.role_id = r.role_id
    WHERE LOWER(u.email) = LOWER($1)
    LIMIT 1
  `

  const result = await db.query(query, [email])

  return result.rows[0] || null
}


/* =========================================================
   VERIFY PASSWORD
========================================================= */
export const verifyPassword = async (password, passwordHash) => {
  return bcrypt.compare(password, passwordHash)
}


/* =========================================================
   AUTHENTICATE USER
   Returns only safe information.
   The password hash is never returned.
========================================================= */
export const authenticateUser = async (email, password) => {
  const user = await getUserByEmail(email)

  if (!user) {
    return null
  }

  const passwordIsValid = await verifyPassword(
    password,
    user.password_hash
  )

  if (!passwordIsValid) {
    return null
  }

  return {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    role_name: user.role_name
  }
}


/* =========================================================
   GET ALL USERS
   Used by the admin users page.
========================================================= */
export const getAllUsers = async () => {
  const query = `
    SELECT
      u.user_id,
      u.name,
      u.email,
      r.role_name
    FROM users u
    JOIN roles r
      ON u.role_id = r.role_id
    ORDER BY u.name ASC
  `

  const result = await db.query(query)

  return result.rows
}


/* =========================================================
   GET USER BY ID
========================================================= */
export const getUserById = async (userId) => {
  const query = `
    SELECT
      u.user_id,
      u.name,
      u.email,
      r.role_name
    FROM users u
    JOIN roles r
      ON u.role_id = r.role_id
    WHERE u.user_id = $1
    LIMIT 1
  `

  const result = await db.query(query, [userId])

  return result.rows[0] || null
}
