//jshint esversion:6
//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
//const encrypt = require("mongoose-encryption");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const url = 'mongodb://localhost:27017/userDB';
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(
	session({
		secret: 'Our little secret.',
		resave: false,
		saveUninitialized: false,
	})
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
	email: String,
	password: String,
	secret: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('user', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL: 'http://localhost:3000/auth/google/secrets',
			userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
		},
		function (accessToken, refreshToken, profile, cb) {
			console.log(profile);
			User.findOrCreate({ googleId: profile.id }, function (err, user) {
				return cb(err, user);
			});
		}
	)
);

app.get('/', (req, res) => {
	res.render('home');
});

app.get('/auth/google', (req, res) => {
	passport.authenticate('google', { scope: ['profile'] });
});

app.get(
	'/auth/google/secrets',
	passport.authenticate('google', { scope: ['profile'] }, { failureRedirect: '/login' }),
	function (req, res) {
		// Successful authentication, redirect secrets.
		res.redirect('/secrets');
	}
);
app.get('/submit', (req, res) => {
	if (req.isAuthenticated()) {
		res.render('submit');
	} else {
		res.redirect('/login');
	}
});
app.post('/submit', (req, res) => {
	const submittedSecret = req.body.secret;

	User.findById(req.user.id, (err, foundUser) => {
		if (err) {
			console.log(err);
		} else {
			if (foundUser) {
				foundUser.secret = submittedSecret;
				foundUser.save(() => {
					res.redirect('/secrets');
				});
			}
		}
	});
});
app.get('/login', (req, res) => {
	res.render('login');
});
app.get('/register', (req, res) => {
	res.render('register');
});
app.get('/secrets', (req, res) => {
	User.find({ secret: { $ne: null } }, (err, foundUser) => {
		if (err) {
			console.log(err);
		} else {
			if (foundUser) {
				res.render('secrets', {userWithSecrets:foundUser});
			}
		}
	});
});

app.post('/register', (req, res) => {
	User.register({ username: req.body.username }, req.body.password, (err, user) => {
		if (err) {
			console.log(err);
			res.redirect('/register');
		} else {
			passport.authenticate('local')(req, res, () => {
				res.redirect('/secrets');
			});
		}
	});
});

app.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});
app.post('/login', (req, res) => {
	const user = new User({
		username: req.body.username,
		password: req.body.password,
	});
	req.login(user, (err) => {
		if (err) {
			console.log(err);
		} else {
			passport.authenticate('local')(req, res, () => {
				res.redirect('/secrets');
			});
		}
	});
});

app.listen(3000, function () {
	console.log('Server started on port 3000');
});
