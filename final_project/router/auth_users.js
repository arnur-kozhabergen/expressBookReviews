const express = require('express');
const jwt = require('jsonwebtoken');
const books = require('./booksdb.js');
const regd_users = express.Router();

const users = [];
const JWT_SECRET = process.env.JWT_SECRET || 'access';

const isValid = (username) => users.some((user) => user.username === username);

const authenticatedUser = (username, password) =>
  users.find((user) => user.username === username && user.password === password);

//only registered users can login
regd_users.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  req.session.authorization = { accessToken: token };
  return res.status(200).json({ message: 'User successfully logged in.' });
});

// Add a book review
regd_users.put('/auth/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  const username = req.user?.username;
  const review = req.query.review ?? req.body?.review;

  if (!Object.prototype.hasOwnProperty.call(books, isbn)) {
    return res.status(404).json({ message: 'Book not found.' });
  }

  if (!username) {
    return res.status(401).json({ message: 'User is not authenticated.' });
  }

  if (typeof review !== 'string' || !review.trim()) {
    return res.status(400).json({ message: 'A review is required.' });
  }

  books[isbn].reviews[username] = review.trim();
  return res.status(200).json({
    message: 'Review added or updated successfully.',
    reviews: books[isbn].reviews
  });
});

// Delete only the authenticated user's review.
regd_users.delete('/auth/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  const username = req.user?.username;

  if (!Object.prototype.hasOwnProperty.call(books, isbn)) {
    return res.status(404).json({ message: 'Book not found.' });
  }

  if (!username || !Object.prototype.hasOwnProperty.call(books[isbn].reviews, username)) {
    return res.status(404).json({ message: 'No review found for this user.' });
  }

  delete books[isbn].reviews[username];
  return res.status(200).json({
    message: 'Review deleted successfully.',
    reviews: books[isbn].reviews
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
