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
  ensureCorrectPlaceUser: function(req, res, next) {
    // if you do place.user without populating, you just get user id
    db.Place.findById(req.params.id, function(err, place) {
      // not necessarily best practice to use double equals
      // but in this case we know for sure that the types don't matter
      // mongoose object lets you cast it to a string
      // console.log(place.user.toString());
      // console.log(req.session.id);
      // place.user will be an object
      if (place.user.toString() !== req.session.id) {
        // redirect to /places, which includes ensureLoggedIn in its route
        res.redirect('/places');
      } else {
        return next();
      }
    });
  },

  // to make sure users can't delete each other's comments
  ensureCorrectCommentUser: function(req, res, next) {
    // need .populate because using ref (one to many, etc)
    db.Comment.findById(req.params.id, function(err, comment) {
      // undefined is a falsey value, so can do ! instead of == undefined
      // and vice-versa, I think
      if (comment.user.toString() !== req.session.id) {
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