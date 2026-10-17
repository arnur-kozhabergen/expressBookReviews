const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const JWT_SECRET = process.env.JWT_SECRET || 'access';

const app = express();

app.use(express.json());

app.use('/customer', session({
  secret: process.env.SESSION_SECRET || 'fingerprint_customer',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));

app.use('/customer/auth/*', function auth(req, res, next) {
  const token = req.session?.authorization?.accessToken;

  if (!token) {
    return res.status(401).json({ message: 'User is not authenticated.' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'User is not authenticated.' });
  }
});
 
const PORT = Number(process.env.PORT) || 5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT,()=>console.log("Server is running"));
