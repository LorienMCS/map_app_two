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
   res.render('layout');
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
           currentuser: ""
         });
       } else {
         db.User.findById(req.session.id, function(err, user) {
           // key matches index.ejs, value comes from the database
           res.render('places/index', {
             // in view code, forEach and then place.user.name
             places: places,
             currentuser: user.name
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
 app.post('/places', routeMiddleware.ensureLoggedIn, function(req, res) {
   // req.body.place is an object
   // Tim explained: I don't need create because it's a call to database
   // which is taken care of by save, below (two calls would be redundant)
   var place = new db.Place(req.body.place);
   // get the user ID from the session, since can't create a place without being logged in
   // (so set place user ID equal to whatever user just logged in)
   // user is from key in Place schema; if user key is named something else (like userId)
   // need to change place.user to whatever the key is called (like place.userId)
   place.user = req.session.id;
   place.save(function(err) {
     if (err) {
       throw err;
     }
     res.redirect("/places");
   });
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
 // (the reddit code solution was missing some necessary auth code
 // which is how I learned about this stuff when I asked about it)
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
   // req.body captures from POST; req.body.country is an entire object
   db.Country.findByIdAndUpdate(req.params.id, req.body.place, function(err, country) {
     if (err) {
       res.render("errors/500");
     } else {
       res.redirect('/places/' + req.params.id);
     }
   });
 });

// look up a place by id and delete it
 app.delete('/countries/:id', routeMiddleware.ensureCorrectPlaceUser, function(req, res) {
   // we're getting the correct id from the form
   db.Country.findByIdAndRemove(req.params.id, function(err, country) {
     if (err) {
       res.render("errors/500");
     } else {
       res.redirect('/places');
     }
   });
 });


// TODO: comment routes


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

