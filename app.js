 //mongod before nodemon or nodemon will crash
 //In browser, test starting with localhost:3000 */

 var express = require("express"),
   app = express(),
   methodOverride = require('method-override'),
   bodyParser = require("body-parser"),
   // User agents request favicon.ico frequently and indiscriminately,
   // so can exclude these requests from your logs
   // by using this middleware before your logger middleware.
   // Caches the icon in memory to improve performance by skipping disk access.
   favicon = require('serve-favicon'),
   request = require('request'),
   session = require("cookie-session"),
   // just console.log a few things; useful for debugging
   morgan = require('morgan'),
   // db is just an object with all of the models attached
   // it's essentially a namespace for grouping the mongoose models
   // it doesn't have any methods
   // need ./ because can't follow relative path
   db = require("./models"),
   // Elie wrote this middleware; it's a couple of helper functions
   // to keep app.js from getting too cluttered
   // going to use this everywhere
   loginMiddleware = require("./middleware/login"),
   // going to use parts of this in specific routes
   routeMiddleware = require("./middleware/route");

 app.set('view engine', 'ejs');

 // purpose of middleware is to intercept requests
 app.use(morgan('tiny'));
 app.use(express.static(__dirname + '/public'));
 app.use(bodyParser.urlencoded({
   extended: true
 }));
 app.use(methodOverride('_method'));
 app.use(favicon(__dirname + '/public/favicon.ico'));
 app.use(loginMiddleware);
 app.use(session({
   // only let the cookie live this long (in milliseconds)
   maxAge: 1800000,
   // ideally something longer and more secure
   // we need to have some way for the session to decrypt cookie information
   secret: 'foobarbazblah',
   // should be "something less dumb"
   name: "snickerdoodle"
 }));

 var errMsg;
 var signupErr;
 var loginErr;

 app.get('/', function(req, res) {
   // this is part of RESTful routing
   // adding info to URL about what we're viewing
   // don't need to be logged into view places
   res.render('map');
 });

 app.get('/signup', routeMiddleware.preventLoginSignup, function(req, res) {
   res.render('users/signup', {
     error: undefined
   });
 });

 app.post("/signup", function(req, res) {
   var newUser = req.body.user;
   db.User.create(newUser, function(err, user) {
     if (user) {
       req.login(user);
       res.redirect("/");
     } else {
       signupErr = "Fields can't be blank; email must be unique (not already in database)";
       res.render("users/signup", {
         error: signupErr
       });
     }
   });
 });

 app.get("/login", routeMiddleware.preventLoginSignup, function(req, res) {
   res.render("users/login", {
     error: undefined
   });
 });

 // when you press enter in the login form
 app.post("/login", function(req, res) {
   db.User.authenticate(req.body.user,
     function(err, user) {
       // if everything goes well
       if (!err && user !== null) {
         req.login(user);
         res.redirect("/");
       } else {
         loginErr = "Incorrect Email or Password"
         res.render("users/login", {
           error: loginErr
         });
       }
     });
 });


 // user pages

 // index of all of the users
 app.get('/users/index', routeMiddleware.preventLoginSignup, function(req, res) {
   res.render('users/index')
 });

 // look up user by id and display their info
 // TODO: need a corresponding ejs template
 app.get('/users/:id', function(req, res) {
   // db.User.findById(req.params.id, function(err,user){
   //   res.render('users/show', user:user)
   // }
 })


 // place pages

 // index of all of the places; have to be logged in to see them
 // (if change login requirement here, have to also add ensureLoggedIn
 // to a bunch of other routes below, because middleware is assuming /places
 // has ensureLoggedIn)
 app.get('/places', routeMiddleware.ensureLoggedIn, function(req, res) {
   // find is a class method (Place is a class)
   // find is going to return an array
   db.Place.find({}).populate("user", "name").exec(function(err, places) {
     if (err) {
       res.render("errors/500");
     } else {
       if (req.session.id == null) {
         res.render('places/index', {
           places: places,
           user: ""
         });
       } else {
         db.User.findById(req.session.id, function(err, user) {
           res.format({
             'text/html': function() {
              // key matches index.ejs, value comes from the database
               res.render("places/index", {
                // in view code, forEach and then place.user.name
                 places: places,
                 user: user.name,
               });
             },
             'application/json': function() {
               res.send({
                 places: places
               });
             },
             'default': function() {
               res.status(406).send('Not Acceptable');
             }
           });
         })
       }
     }
   });
 });

 // get to a page to add a new place
 // has to run before /places/:id
 // it took me forever to remember that as long as a user is logged in
 // don't need user id in route for new place (it's taken care of through middleware)
 app.get('/places/new', routeMiddleware.ensureLoggedIn, function(req, res) {
   res.render('places/new', {
     user_id: req.session.id
   });
 });

 // create a new place
 // geolocation stuff from server-side (I had it client side in prev projects)
 app.post('/places', routeMiddleware.ensureLoggedIn, function(req, res) {
   // req.body.place is an object; Miles said he thinks of it as basically data
   // analogy in Java would be plain old object
   // we're passing req.body.place to the mongoose Place constructor
   // now we have access to mongoose methods
   // Tim explained: I don't need create because it's a call to database
   // which is taken care of by save, below (two calls would be redundant)
   var placeInstance = new db.Place(req.body.place);
   // get the user ID from the session, since can't create a place without being logged in
   // (so set place user ID equal to whatever user just logged in)
   // user is from key in Place schema; if user key is named something else (like userId)
   // need to change place.user to whatever the key is called (like place.userId)
   placeInstance.user = req.session.id;

   // this variable name is from Tim (as is how a lot of this is done)
   var savePlaceAndRespond = function(res, place) {
     place.save(function(err, place) {
       if (err) {
         // Send an error if the data could not be saved
         // Most likely a validation error
         res.status(422).send("Error: Invalid Input");
       } else {
         res.format({
           'text/html': function() {
             res.redirect("/places");
           },
           'application/json': function() {
             res.send(place);
           },
           'default': function() {
             res.status(406).send('Not Acceptable');
           }
         });
       }
     });
   }; // closing tag of savePlaceAndRespond function

   if (!placeInstance.address || placeInstance.address === '') {
     res.status(422).send('Invalid input');
   } else {
     var address = encodeURIComponent(placeInstance.address);
     // A Geocoding API request must be of the following form
     // you can instruct the Geocoding service to prefer results within a given
     // viewport (expressed as a bounding box).
     // Note that biasing only prefers results within the bounds;
     // if more relevant results exist outside of these bounds, they may be included.
     // The bounds parameter defines the lat/long of SW and NE corners
     // of this bounding box using pipe (|) character to separate the coordinates
     var geocodeApi = 'http://maps.googleapis.com/maps/api/geocode/json?address=' + address + '&bounds=37.5,-122.8|37.9,-122.2';
     request(geocodeApi, function(error, response, body) {
       // Google docs say status code will be "OK" if all is well
       console.log(response.statusCode);
       if (error) {
         res.status(500).send('Server Error');
       } else if (!error && response.statusCode === 200) {
         // results generally need to be parsed to extract values
         var data = JSON.parse(body);
         // Even if the geocoder returns no results (such as if the address doesn't exist)
         // it still returns an empty results array, so checking to make sure data exists
         if (data.results && data.results.length >= 1 &&
           data.results[0].geometry && data.results[0].geometry.location) {
           //Addresses are returned in the order of best to least matches
           // location contains the geocoded lat,long value.
           // For normal address lookups, this field is typically the most important
           placeInstance.lat = data.results[0].geometry.location.lat;
           placeInstance.long = data.results[0].geometry.location.lng;

           savePlaceAndRespond(res, placeInstance);
         } else {
           res.status(422).send('Place not found');
         }
       } else {
         res.status(500).send('Server Error');
       }
     });
   }
 });


 // lookup place by id and display it
 app.get('/places/:id', routeMiddleware.ensureLoggedIn, function(req, res) {
   // findById is a class method on the Place model
   // req.params.id getting info by an id
   db.Place.findById(req.params.id).populate('comments').exec(function(err, foundPlace) {
     if (err) {
       res.render("errors/404");
     } else {
       // the data is coming from the database now
       res.render('places/show', {
         place: foundPlace
       });
     }
   });
 });

 // display a form to edit a specific place
 // need to make sure only the correct user can edit
 // don't need to ensureLoggedIn, because ensureCorrectPlaceUser
 // redirects to /places, and we've got ensureLoggedIn in /places route
 app.get('/places/:id/edit', routeMiddleware.ensureCorrectPlaceUser, function(req, res) {
   db.Place.findById(req.params.id, function(err, foundPlace) {
     if (err) {
       // Elie says, not 404; 500 is correct
       res.render("errors/500");
     } else {
       res.render('places/edit', {
         place: foundPlace
       });
     }
   });
 });

 // update specific place with data from edit
 app.put('/places/:id', routeMiddleware.ensureCorrectPlaceUser, function(req, res) {
   // what we're finding, what we're updating it with
   // params is from the part of the URL that is not the query string
   // req.body captures from POST; req.body.place is an entire object
   db.Place.findByIdAndUpdate(req.params.id, req.body.place, function(err, place) {
     if (err) {
       res.render("errors/500");
     } else {
       res.redirect('/places/' + req.params.id);
     }
   });
 });

 // look up a place by id and delete it
 app.delete('/places/:id', routeMiddleware.ensureCorrectPlaceUser, function(req, res) {
   // we're getting the correct id from the form
   db.Place.findByIdAndRemove(req.params.id, function(err, place) {
     if (err) {
       res.render("errors/500");
     } else {
       res.redirect('/places');
     }
   });
 });


 // TODO: comment routes

 // index of all comments on a place; have to be logged in to see them
 app.get('/places/:place_id/comments', routeMiddleware.ensureLoggedIn, function(req, res) {
   // find is a class method (Comment is a class)
   // find is going to return an array
   db.Comment.find({
     place: req.params.place_id
   }).populate("user").exec(function(err, comments) {
     res.format({
       'text/html': function() {
         res.render("comments/index", {
           comments: comments
         });
       },
       'application/json': function() {
         res.send({
           comments: comments
         });
       },
       'default': function() {
         // log the request and respond with 406
         res.status(406).send('Not Acceptable');
       }
     });
   })
 });

 // get to a page to add a new comment
 // has to run before /comments/:id
 app.get('/places/:place_id/comments/new', routeMiddleware.ensureLoggedIn, function(req, res) {
   db.Place.findById(req.params.place_id, function(err, place) {
     res.render("comments/new", {
       place: place,
       user_id: req.session.id
     });
   });
 });

 // create a new comment
 // TODO (someday): refactor this code so it's not doing both create and save
 app.post('/places/:place_id/comments', routeMiddleware.ensureLoggedIn, function(req, res) {
   db.Comment.create(req.body.comment, function(err, comments) {
     if (err) {
       console.log(err);
       res.render('comments/new');
     } else {
       db.Place.findById(req.params.place_id, function(err, place) {
         place.comments.push(comments);
         comments.place = place._id;
         comments.save();
         place.save();
         res.redirect("/places/" + req.params.place_id + "/comments");
       });
     }
   });
 });

 // display a form to edit a specific comment
 // need to make sure only the correct user can edit
 // don't need to ensureLoggedIn, because ensureCorrectCommentUser
 // redirects to /places, and we've got ensureLoggedIn in /places route
 app.get('/comments/:id/edit', routeMiddleware.ensureCorrectCommentUser, function(req, res) {
   db.Comment.findById(req.params.id, function(err, foundComment) {
     if (err) {
       // Elie says, not 404; 500 is correct
       res.render("errors/500");
     } else {
       res.render('comments/edit', {
         comment: foundComment
       });
     }
   });
 });

 // update specific comment with data from edit
 app.put('/comments/:id', routeMiddleware.ensureCorrectCommentUser, function(req, res) {
   // what we're finding, what we're updating it with
   // params is from the part of the URL that is not the query string
   // req.body captures from POST; req.body.place is an entire object
   db.Comment.findByIdAndUpdate(req.params.id, req.body.comment, function(err, comment) {
     if (err) {
       res.render("errors/500");
     } else {
       res.redirect('/places/' + comment.place + '/comments');
     }
   });
 });

 // look up a place by id and delete it
 app.delete('/comments/:id', routeMiddleware.ensureCorrectCommentUser, function(req, res) {
   // we're getting the correct id from the form
   db.Comment.findByIdAndRemove(req.params.id, function(err, comment) {
     if (err) {
       res.render("errors/500");
     } else {
       res.redirect('/places' + comment.place + '/comments');
     }
   });
 });



 app.get("/logout", function(req, res) {
   req.logout();
   res.redirect("/");
 });

 // a catchall that takes care of all of the other 404 situations
 // has to be at the bottom
 app.get('*', function(req, res) {
   res.render('errors/404');
 });

 app.listen(3000, function() {
   console.log("Server is listening on port 3000");
 });