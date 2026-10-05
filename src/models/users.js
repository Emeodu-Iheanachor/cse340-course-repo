import db from './db.js'
import bcrypt from 'bcrypt'


/* =========================================================
   CREATE NEW USER
========================================================= */
const createUser = async (name, email, passwordHash) => {
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
    RETURNING user_id
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

  return result.rows[0].user_id
}


/* =========================================================
   FIND USER BY EMAIL
========================================================= */
const findUserByEmail = async (email) => {
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
    WHERE u.email = $1
  `

  const queryParams = [email]

  const result = await db.query(
    query,
    queryParams
  )

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0]
}


/* =========================================================
   VERIFY PASSWORD
========================================================= */
const verifyPassword = async (password, passwordHash) => {
  return bcrypt.compare(
    password,
    passwordHash
  )
}


/* =========================================================
   AUTHENTICATE USER
========================================================= */
const authenticateUser = async (email, password) => {
  const user = await findUserByEmail(email)

  /* -------------------------------------------------------
     USER NOT FOUND
  ------------------------------------------------------- */
  if (!user) {
    return null
  }

  /* -------------------------------------------------------
     VERIFY PASSWORD
  ------------------------------------------------------- */
  const passwordIsValid = await verifyPassword(
    password,
    user.password_hash
  )

  if (!passwordIsValid) {
    return null
  }

  /* -------------------------------------------------------
     RETURN ONLY SAFE USER INFORMATION
     
     The password hash is intentionally excluded.
     The role name is included for authorization.
  ------------------------------------------------------- */
  return {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    role_name: user.role_name
  }
}


/* =========================================================
   EXPORT MODEL FUNCTIONS
========================================================= */
export {
  createUser,
  authenticateUser
}