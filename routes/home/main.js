const fs = require('fs');
const express = require('express');
const router = express.Router();
const Post= require('../../models/Post');
const Category= require('../../models/Category');
const User= require('../../models/User');
const path = require('path');
const {isEmpty, uploadDir} = require('../../helpers/upload-helper');
const bcrypt = require('bcryptjs');

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
    res.render('home/login');
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