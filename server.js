const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('passport');
const expressLayouts = require('express-ejs-layouts');
const staticFiles = require('./routes/static');
const baseController = require('./controllers/baseController');
const utilities = require('./utilities/');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors');
const http = require('http');
const path = require('path');
const sharedSession = require('express-socket.io-session');

dotenv.config();

const app = express();
const port = process.env.PORT || 3100;

const server = http.createServer(app);

const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
};

const sessionMiddleware = session(sessionConfig);

require('./config/passport')(passport);

// setup mongodb before routes that may need the db
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
}

connectDB();

// middleware
app
  .use(require('connect-flash')())
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .use(cookieParser())

  // layout
  .set('view engine', 'ejs')
  .use(expressLayouts)
  .set('layout', './layouts/layout')

  .use(express.static('public'))

  // auth
  .use(sessionMiddleware)
  .use(passport.initialize())
  .use(passport.session())
  .use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Z-Key, Authorization'
    );
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    next();
  })
  .use((req, res, next) => {
    res.locals.messages = require('express-messages')(req, res);
    res.locals.loggedIn = req.user;
    next();
  })
  .use(cors({ methods: ['GET', 'POST', 'PUT', 'DELETE', 'UPDATE', 'PATCH'] }))
  .use(cors({ origin: '*' }))

  // routes
  .use(staticFiles)
  .get('/', utilities.handleErrors(baseController.buildHome))
  .use('/auth', require('./routes/authRoute'))
  .use('/dashboard', require('./routes/dashboardRoute'))
  .use('/room', require('./routes/roomRoute'))
  // 404 - must be last route in list
  .use(async (req, res, next) => {
    next({ status: 404, message: 'Sorry, we appear to have lost that page.' });
  })

  // error handler middleware
  .use(async (err, req, res, next) => {
    console.error(
      `Error at: "${req.originalUrl}": ${err.status}: ${err.message}`
    );
    if (err.status === 404) {
      message = err.message;
    } else if (err.status === 403) {
      message = 'Access denied';
    } else {
      message =
        'Something went wrong! Please try again. If the problem persists, contact me on the corner, near the flagpole, for your beating.';
    }
    res.render('errors/error', {
      title: err.status || 'Server Error',
      message: message,
    });
  });

const configureSocketIO = require('./config/socket-io');
configureSocketIO(server, sessionMiddleware);

if (require.main === module) {
  server.listen(port, () =>
    console.log(`Server is running on port ${process.env.HOST}:${port}`)
  );
}

module.exports = app;
