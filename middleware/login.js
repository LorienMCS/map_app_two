var db = require("../models");

// intercepting some request
// building the logging in and logging out
// and attaching it to the request
var loginMiddleware = function (req, res, next) {

  req.login = function (user) {
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
