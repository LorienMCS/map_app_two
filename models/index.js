var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/map_with_usersdb");

mongoose.set("debug", true);

module.exports.Comment = require("./comment");
module.exports.Place = require("./place");
module.exports.User = require("./user");
