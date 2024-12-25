const { Pool } = require('pg');

// Configure the database connection
const pool = new Pool({
  user: 'your_db_user',
  password: 'your_db_password',
  host: 'localhost',
  database: 'lightbnb',
  port: 5432,
});

// Functions

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

/**
 * Get all properties based on filter options.
 * @param {object} options - Filtering options for properties.
 * @param {number} limit - The maximum number of properties to return (default: 10).
 * @return {Promise<Array>} - A promise that resolves to an array of properties.
 */
const getAllProperties = function (options, limit = 10) {
  const queryParams = [];
  let queryString = `
    SELECT properties.*, AVG(property_reviews.rating) as average_rating
    FROM properties
    LEFT JOIN property_reviews ON properties.id = property_reviews.property_id
  `;

  let whereClauses = [];

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    whereClauses.push(`city LIKE $${queryParams.length}`);
  }

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    whereClauses.push(`owner_id = $${queryParams.length}`);
  }

  if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);
    whereClauses.push(`cost_per_night >= $${queryParams.length}`);
  }

  if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night * 100);
    whereClauses.push(`cost_per_night <= $${queryParams.length}`);
  }

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    whereClauses.push(`AVG(property_reviews.rating) >= $${queryParams.length}`);
  }

  if (whereClauses.length > 0) {
    queryString += `WHERE ${whereClauses.join(' AND ')} `;
  }

  queryParams.push(limit);
  queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
  `;

  console.log(queryString, queryParams);

  return pool.query(queryString, queryParams)
    .then(res => res.rows)
    .catch(err => {
      console.error("Error in getAllProperties:", err.message);
      return [];
    });
};

/**
 * Add a new property to the database.
 * @param {object} property - The property object containing details of the property.
 * @return {Promise<object|null>} - A promise that resolves to the newly created property object.
 */
const addProperty = function (property) {
  const queryString = `
    INSERT INTO properties (
      owner_id, title, description, thumbnail_photo_url, cover_photo_url, 
      cost_per_night, street, city, province, post_code, country, 
      parking_spaces, number_of_bathrooms, number_of_bedrooms
    )
    VALUES (
      $1, $2, $3, $4, $5, 
      $6, $7, $8, $9, $10, $11, 
      $12, $13, $14
    )
    RETURNING *;
  `;

  const queryParams = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night * 100, // Convert to cents
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms,
  ];

  return pool.query(queryString, queryParams)
    .then(res => res.rows[0])
    .catch(err => {
      console.error("Error in addProperty:", err.message);
      return null;
    });
};

/**
 * Get all reservations for a specific user.
 * @param {number} guest_id - The ID of the guest (user).
 * @param {number} limit - The maximum number of reservations to return (default: 10).
 * @return {Promise<Array>} - A promise that resolves to an array of reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  const queryString = `
    SELECT reservations.*, properties.*, AVG(property_reviews.rating) as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    LEFT JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    GROUP BY reservations.id, properties.id
    ORDER BY reservations.start_date
    LIMIT $2;
  `;

  const queryParams = [guest_id, limit];

  return pool.query(queryString, queryParams)
    .then(result => result.rows)
    .catch(err => {
      console.error("Error in getAllReservations:", err.message);
      return [];
    });
};

// Export the functions
module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllProperties,
  addProperty,
  getAllReservations,
};
