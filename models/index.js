var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/map_with_usersdb");

mongoose.set("debug", true);

// module.exports is basically a namespace, empty initially
// these get bundled into db. in app.js, which is also essentially a namespace
module.exports.Comment = require("./comment");
module.exports.Place = require("./place");
module.exports.User = require("./user");
