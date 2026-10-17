const express = require('express');
const axios = require('axios');
const books = require('./booksdb.js');
const { isValid, users } = require('./auth_users.js');

const public_users = express.Router();

public_users.post('/register', (req, res) => {
  const { username, password } = req.body || {};

  if (typeof username !== 'string' || !username.trim() ||
      typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const normalizedUsername = username.trim();
  if (normalizedUsername === 'prototype' || normalizedUsername in Object.prototype) {
    return res.status(400).json({ message: 'Username is reserved.' });
  }
  if (isValid(normalizedUsername)) {
    return res.status(409).json({ message: 'Username already exists.' });
  }

  users.push({ username: normalizedUsername, password });
  return res.status(201).json({ message: 'User successfully registered.' });
});

// Get the book list available in the shop.
public_users.get('/', (req, res) => res.status(200).json(books));

// Get book details based on ISBN.
public_users.get('/isbn/:isbn', (req, res) => {
  if (!Object.prototype.hasOwnProperty.call(books, req.params.isbn)) {
    return res.status(404).json({ message: 'Book not found.' });
  }
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: 'Book not found.' });
  return res.status(200).json(book);
});

function findBooksBy(field, value) {
  const searchTerm = value.trim().toLocaleLowerCase();
  return Object.fromEntries(
    Object.entries(books).filter(([, book]) =>
      book[field].toLocaleLowerCase().includes(searchTerm)
    )
  );
}

// Get book details based on author.
public_users.get('/author/:author', (req, res) => {
  return res.status(200).json(findBooksBy('author', req.params.author));
});

// Get all books based on title.
public_users.get('/title/:title', (req, res) => {
  return res.status(200).json(findBooksBy('title', req.params.title));
});

// Get book reviews.
public_users.get('/review/:isbn', (req, res) => {
  if (!Object.prototype.hasOwnProperty.call(books, req.params.isbn)) {
    return res.status(404).json({ message: 'Book not found.' });
  }
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: 'Book not found.' });

  if (Object.keys(book.reviews).length === 0) {
    return res.status(200).json({ message: 'No reviews found for this book.' });
  }

  return res.status(200).json(book.reviews);
});

const apiBaseUrl = () =>
  process.env.BOOKS_API_URL || `http://localhost:${Number(process.env.PORT) || 5000}`;

// Promise-based Axios client examples for the four general book lookups.
async function getAllBooks() {
  const { data } = await axios.get(`${apiBaseUrl()}/`);
  return data;
}

async function getBookByISBN(isbn) {
  const { data } = await axios.get(`${apiBaseUrl()}/isbn/${encodeURIComponent(isbn)}`);
  return data;
}

async function getBooksByAuthor(author) {
  const { data } = await axios.get(`${apiBaseUrl()}/author/${encodeURIComponent(author)}`);
  return data;
}

async function getBooksByTitle(title) {
  const { data } = await axios.get(`${apiBaseUrl()}/title/${encodeURIComponent(title)}`);
  return data;
}

async function runClientExamples() {
  const [allBooks, byISBN, byAuthor, byTitle] = await Promise.all([
    getAllBooks(),
    getBookByISBN('1'),
    getBooksByAuthor('Chinua Achebe'),
    getBooksByTitle('Things Fall Apart')
  ]);

  console.log(JSON.stringify({ allBooks, byISBN, byAuthor, byTitle }, null, 2));
}

if (require.main === module) {
  runClientExamples().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  general: public_users,
  getAllBooks,
  getBookByISBN,
  getBooksByAuthor,
  getBooksByTitle
};
