const { Pool } = require('pg');

// Configure the database connection
const pool = new Pool({
  user: 'your_db_user',
  password: 'your_db_password',
  host: 'localhost',
  database: 'lightbnb',
  port: 5432,
});

// Refactored Functions

/**
 * Get a user with a specific email address.
 * @param {string} email - The email address of the user.
 * @return {Promise<object|null>} - A promise that resolves to the user object or null if no user is found.
 */
const getUserWithEmail = function (email) {
  const queryString = `
    SELECT *
    FROM users
    WHERE email = $1;
  `;

  return pool.query(queryString, [email])
    .then(result => result.rows[0] || null)
    .catch(err => {
      console.error("Error in getUserWithEmail:", err.message);
      return null;
    });
};

/**
 * Get a user with a specific ID.
 * @param {number} id - The ID of the user.
 * @return {Promise<object|null>} - A promise that resolves to the user object or null if no user is found.
 */
const getUserWithId = function (id) {
  const queryString = `
    SELECT *
    FROM users
    WHERE id = $1;
  `;

  return pool.query(queryString, [id])
    .then(result => result.rows[0] || null)
    .catch(err => {
      console.error("Error in getUserWithId:", err.message);
      return null;
    });
};

/**
 * Add a new user to the database.
 * @param {object} user - An object containing name, email, and password of the user.
 * @return {Promise<object|null>} - A promise that resolves to the newly created user object.
 */
const addUser = function (user) {
  const queryString = `
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const queryParams = [user.name, user.email, user.password];

  return pool.query(queryString, queryParams)
    .then(result => result.rows[0])
    .catch(err => {
      console.error("Error in addUser:", err.message);
      return null;
    });
};

// Export the functions
module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
};
