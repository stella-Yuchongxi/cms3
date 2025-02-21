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
        const perPage = 10;
        let page = parseInt(req.query.page, 10) || 1;
        const categoryQuery = req.query.category;
        let filter = {};

        // Ensure page is at least 1
        if (page < 1) {
            return res.redirect('/?page=1');
        }

        // Apply category filter if provided
        if (categoryQuery) {
            const category = await Category.findOne({ name: categoryQuery }).lean();
            if (category) {
                filter.category = category._id;
            }
        }

        // Count total posts for pagination
        const totalPosts = await Post.countDocuments(filter);
        const totalPages = Math.ceil(totalPosts / perPage);

        // Ensure `page` doesn't exceed total pages
        if (page > totalPages && totalPages > 0) {
            return res.redirect(`/?page=${totalPages}`);
        }

        // Fetch posts with category filter, pagination, and populate category details
        const posts = await Post.find(filter)
            .populate('category')
            .skip((page - 1) * perPage)
            .limit(perPage)
            .lean();

        // Fetch all categories
        const categories = await Category.find({}).lean();

        res.render('home/index', {
            posts,
            categories,
            selectedCategory: categoryQuery,
            current: page,
            pages: totalPages,
        });
    } catch (err) {
        console.error('Error fetching posts:', err);
        res.status(500).send('An error occurred while fetching posts.');
    }
});

router.get('/post/:slug', async (req, res) => {
    try {
        // Find the post by ID and populate comments and their user details
        const post = await Post.findOne({ slug: req.params.slug })
            .populate({
                path: 'comments',
                match:{approveComment:true},
                populate: { path: 'user', model: 'User' },
            })
            .populate('user')
            .lean();

        // Handle missing post
        if (!post) {
            req.flash('error', 'Post not found');
            return res.redirect('/');
        }

        // Fetch all categories
        const categories = await Category.find({}).lean();

        // Render the 'home/post' view with post and category data
        res.render('home/post', { post, categories });
    } catch (err) {
        console.error('Error fetching post or categories:', err);

        // Handle errors gracefully
        req.flash('error', 'An unexpected error occurred. Please try again later.');
        res.redirect('/');
    }
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
            return res.redirect('/');
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