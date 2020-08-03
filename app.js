//jshint esversion:6
//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
//const encrypt = require("mongoose-encryption");
const mongoose = require('mongoose');
//const md5 = require('md5')
const bcrypt = require('bcrypt');
const saltRounds = 10;

const url = 'mongodb://localhost:27017/userDB';
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
	email: String,
	password: String,
});

const User = new mongoose.model('user', userSchema);

app.get('/', (req, res) => {
	res.render('home');
});
app.get('/login', (req, res) => {
	res.render('login');
});
app.get('/register', (req, res) => {
	res.render('register');
});

app.post('/register', (req, res) => {
	bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
		if (!err) {
			const newUser = new User({
				email: req.body.username,
				password: hash,
			});

			newUser.save((err) => {
				if (err) {
					console.log(err);
				} else {
					res.render('secrets');
				}
			});
		} else {
			res.send(err);
		}
	});
});

app.post('/login', (req, res) => {
	const username = req.body.username;
	const password = req.body.password;

	User.findOne({ email: username }, (err, foundUser) => {
		if (err) {
			console.log(err);
		} else {
			if (foundUser) {
					bcrypt.compare(password, foundUser.password, function (err, result) {
            // result == true
           

						if (result === true) {
							res.render('secrets');
						} else {
							res.send(err);
						}
					});
			}
		}
	});
});

app.listen(3000, function () {
	console.log('Server started on port 3000');
});
