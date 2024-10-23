const fs = require('fs');
const express = require('express');
const router = express.Router();
const Post= require('../../models/Post');
const Category= require('../../models/Category');
const User= require('../../models/User');
const path = require('path');
const {isEmpty, uploadDir} = require('../../helpers/upload-helper');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

router.all('/*', (req, res,next) => {
    req.app.locals.layout = 'home';
    next();
});

router.get('/', async (req, res) => {
    try {
        const categoryQuery = req.query.category; // Get the category parameter from the query string
        let filter = {};

        // If a category is specified, add it to the filter for posts
        if (categoryQuery) {
            const category = await Category.findOne({ name: categoryQuery }).lean();
            if (category) {
                filter.category = category._id; // Filter posts by the selected category's ID
            }
        }

        // Find posts with or without the category filter and populate the category details
        const posts = await Post.find(filter).lean().populate('category');
        const categories = await Category.find({}).lean();

        res.render('home/index', {
            posts: posts,
            categories: categories,
            selectedCategory: categoryQuery // Pass the selected category to the template
        });
    } catch (err) {
        console.log('Error fetching posts:', err);
        res.status(500).send('An error occurred while fetching posts.');
    }
});

router.get('/post/:id', (req, res) => {
    Post.findById(req.params.id).lean().then(post => {
        if (!post) {
            return res.status(404).send('Post not found');
        }
        Category.find({}).then(categories=>{
            res.render('home/post', { post: post , categories: categories});  // Corrected the path to 'home/post'
        });
    }).catch(err => {
        console.log(err);
        res.redirect('/');  // Redirect to the home page in case of error
    });
});
router.get('/about', (req, res) => {
    res.render('home/about');
});
router.get('/login', (req, res) => {
    res.render('home/login', {
        error: req.flash('error') // Pass the flash message to the view
    });
});
passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id); // Store user ID in session
});

passport.deserializeUser(async (id, done) => {
    console.log('Deserializing user with ID:', id);
    try {
        const user = await User.findById(id).lean(); // Using async/await
        done(null, user); // If user is found, pass it to the done callback
    } catch (err) {
        done(err, null); // If there's an error, pass the error
    }
});

// Local strategy for user authentication
passport.use(
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
        // Find user by email
        User.findOne({ email: email })
            .then((user) => {
                if (!user) {
                    // No user found with that email
                    return done(null, false, { message: 'No user found with this email.' });
                }

                // Match password using bcrypt
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) throw err;

                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, { message: 'Password is incorrect.' });
                    }
                });
            })
            .catch((err) => {
                console.log(err);
                return done(err);
            });
    })
);

router.post('/login', (req, res,next) => {
    console.log('Login attempt:', req.body, req.user);
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error('Authentication error:', err);
            return next(err);
        }
        if (!user) {
            req.flash('error', info ? info.message : 'Login failed.');
            return res.redirect('/login');
        }
        req.logIn(user, (err) => {
            if (err) {
                console.error('Login error:', err);
                return next(err);
            }
            console.log('User logged in successfully:', req.user); // Verify user in session
            return res.redirect('/admin');
        });
    })(req, res, next);
    // passport.authenticate('local', {
    //     successRedirect: '/admin',
    //     failureRedirect: '/login',
    //     failureFlash: true
    // })(req,res,next);
});
router.get('/logout', (req, res) => {
    req.logOut((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.redirect('/admin'); // Redirect to a fallback page if needed
        }
        console.log('Logout session:', req.user); // Should log `null` or `undefined` after logout
        req.flash('success', 'You have logged out successfully');
        res.redirect('/login');
    });
});
router.get('/register', (req, res) => {
    res.render('home/register');
});

router.post('/register', (req, res) => {
    let errors = [];

    // Validate user inputs
    if (!req.body.firstName) {
        errors.push({ message: 'Please enter a first name' });
    }
    if (!req.body.lastName) {
        errors.push({ message: 'Please enter a last name' });
    }
    if (!req.body.email) {
        errors.push({ message: 'Please enter an email' });
    }
    if (!req.body.password) {
        errors.push({ message: 'Please enter an password' });
    }
    if (!req.body.passwordConfirm) {
        errors.push({ message: 'Please enter an confirm password' });
    }
    console.log(req.body);
    if (!req.body.password || req.body.password !== req.body.passwordConfirm) {
        errors.push({ message: 'Password fields do not match' });
    }

    // If there are errors, render the registration form again with the errors
    if (errors.length > 0) {
        return res.render('home/register', {
            errors: errors,  // Pass the errors to the template
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email
        });
    }else{
        User.findOne({email: req.body.email}).then((user) => {
            if (user) {
                req.flash('warn', 'You have already created an account. Please login.');
                res.redirect('/register');
            }else{
                // Create a new user if no validation errors
                const newUser = new User({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    password: req.body.password
                });
                bcrypt.genSalt(10, (err, salt) => {
                    if (err) throw err;
                    bcrypt.hash(newUser.password,salt, (err, hash) => {
                        if (err) throw err;
                        newUser.password = hash;
                        // Save the new user to the database
                        newUser.save().then(savedUser => {
                            req.flash('success', 'You are now registered and can login');
                            res.redirect('/register');
                        }).catch(err => {
                            req.flash('error', 'You are fail to register. Please try again');
                            res.redirect('/register');
                        });
                    })
                })
            }
        })

    }



});

module.exports = router;