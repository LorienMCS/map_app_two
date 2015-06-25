var db = require("../models");

// intercepting some request
// building the logging in and logging out
// and attaching it to the request
var loginMiddleware = function (req, res, next) {

  req.login = function (user) {
  	// set the user id which we're getting from the database
  	// we're attaching the id key onto the session object
  	// and giving it a value equal to whatever the id is of the user
  	// that is successfully authenticated
  	// everything set on the cookie will be stringified
  	// so req.session.id is a string
    req.session.id = user._id;
  };

  req.logout = function () {
    req.session.id = null;
  };

  // always need to have that next() in your middleware
  // to keep moving on after interception
  next();
};

module.exports = loginMiddleware;

// in our app.js
// app.use(loginMiddleware)

// // once that's been done we now have access to 2 functions
// // 1 - req.login()
// // 2 - req.logout()
