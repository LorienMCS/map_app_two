var db = require("../models");

var routeMiddleware = {
  // ensure the user is logged in
  ensureLoggedIn: function(req, res, next) {
    if (req.session.id !== null && req.session.id !== undefined) {
      // return function(req,res) on app.js page (since that's where
      // this routeMiddleware is being used)
      return next();
    } else {
      // otherwise, redirect user to login page
      res.redirect('/login');
    }
  },

  // to make sure users can't delete each other's places
  ensureCorrectPostUser: function(req, res, next) {
    // need .populate because using ref (one to many, etc)
    db.Place.findById(req.params.id).populate('user').exec(function(err, place) {
      if (place.user !== req.session.id) {
        // TODO: make sure this is really where I want to redirect to
        res.redirect('/places');
      } else {
        return next();
      }
    });
  },

  // to make sure users can't delete each other's comments
  ensureCorrectCommentUser: function(req, res, next) {
    // need .populate because using ref (one to many, etc)
    db.Comment.findById(req.params.id).populate('user').exec(function(err, comment) {
      if (comment.user != undefined && comment.user.id != req.session.id) {
        // TODO: make sure this is really where I want to redirect to
        res.redirect('/places/' + comment.place + '/comments');
      } else {
        return next();
      }
    });
  },

  // make sure user can't log in twice
  preventLoginSignup: function(req, res, next) {
    if (req.session.id !== null && req.session.id !== undefined) {
      // TODO: make sure this is really where I want to redirect to
      res.redirect('/places');
    } else {
      return next();
    }
  }
};
module.exports = routeMiddleware;