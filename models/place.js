var mongoose = require('mongoose'),
	//this is only for remove; so don't need to require user
	Comment = require('./comment');

var placeSchema = new mongoose.Schema({
	address: String,
	lat:  Number,
  long:  Number,
	description: String,
	comments: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Comment"
	}],
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	}
});


// This code is why we need to require ./comment
placeSchema.pre('remove', function(next) {
	// *this* refers to the place in question
	// inside the comment model we have a field called place
	Comment.remove({
		place: this._id
	}).exec();
	next();
});

var Place = mongoose.model("Place", placeSchema);

module.exports = Place;