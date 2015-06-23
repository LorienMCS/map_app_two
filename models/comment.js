var mongoose = require('mongoose');

var commentSchema = new mongoose.Schema({
	body: String,
	place: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Place"
	},
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	}
});

var Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;