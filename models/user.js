var bcrypt = require('bcrypt'),
	SALT_WORK_FACTOR = 10,
	mongoose = require('mongoose'),
	// this is not being used in the schema, but in the pre-remove hook
	// Elie suggested requiring index instead of requiring place and comment separately
	// now user.js behaves like index.js when I type node user.js in terminal
	// because I'm requiring ./index
	db = require ("./index");

var userSchema = new mongoose.Schema({
	name: String,
	email: {
		type: String,
		required: true,
		lowercase: true,
		unique: true
	},
	password: {
		type: String,
		required: true
	},
	places: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Place"
	}],
	comments: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Comment"
	}]
});

userSchema.pre('save', function(next) {
	var user = this;
	// if password has not been changed, save user and move on
	if (!user.isModified('password')) {
		return next();
	}

	return bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		if (err) {
			return next(err);
		}
		return bcrypt.hash(user.password, salt, function(err, hash) {
			if (err) {
				return next(err);
			}
			// define what the password is for the user
			user.password = hash;
			// everything looks good, let's save
			return next();
		});
	});
});

// don't want to call this first param "user" because we have another user defined
// statics === class methods
userSchema.statics.authenticate = function(formData, callback) {
	// *this* refers to the model
	this.findOne({
			email: formData.email
		},
		function(err, user) {
			if (user === null) {
				callback("Invalid email or password", null);
			} else {
				user.checkPassword(formData.password, callback);
			}

		});
};

// methods === instance methods
userSchema.methods.checkPassword = function(password, callback) {
	var user = this;
	// password === plain text
	// user.password === hashed password that we store in our database
	bcrypt.compare(password, user.password, function(err, isMatch) {
		if (isMatch) {
			callback(null, user);
		} else {
			callback("Invalid email or password", null);
		}
	});
};

// This code is why we need to require ./place and ./comment
// But Elie pointed out, require db instead, like we do in app.js
// then prefix Place and Comment, below, with db
userSchema.pre('remove', function(next) {
	// *this* refers to the user in question
	// inside the place and comment models we have a field called user
	db.Place.remove({
		user: this._id
	}).exec();
	db.Comment.remove({
		user: this._id
	}).exec();
	next();
})

var User = mongoose.model("User", userSchema);

module.exports = User;

// your models have to work or nothing else will work