const express = require('express');
const router = express.Router();
const Post= require('../../models/Post');

router.all('/*', (req, res,next) => {
    req.app.locals.layout = 'home';
    next();
});

router.get('/', (req, res) => {
    Post.find({}).lean()  // Converts the Mongoose documents into plain JS objects
        .then(posts => {
            res.render('home/index', { posts: posts });
        })
        .catch(err => {
            console.log('Error fetching posts:', err);
            res.status(500).send('An error occurred while fetching posts.');
        });
});
router.get('/post/:id', (req, res) => {
    Post.findById(req.params.id).lean().then(post => {
        if (!post) {
            return res.status(404).send('Post not found');
        }
        res.render('home/post', { post: post });  // Corrected the path to 'home/post'
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

module.exports = router;