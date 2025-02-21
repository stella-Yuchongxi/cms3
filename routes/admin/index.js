const express = require('express');
const router = express.Router();
const {authenticateUser} = require('../../helpers/authentication')
const { faker } = require('@faker-js/faker');
const Post = require('../../models/Post');  // Ensure you are importing the correct model
const Category = require('../../models/Category');
const Comment = require('../../models/Comment');

router.all('/*', authenticateUser,(req, res, next) => {
    req.app.locals.layout = 'admin';
    next();
});

router.get('/', (req, res) => {
    Promise.all([
        Post.countDocuments(),        // Count the number of posts
        Category.countDocuments(),    // Count the number of categories
        Comment.countDocuments()      // Count the number of comments
    ])
        .then(([postCount, categoryCount, commentCount]) => {
            res.render('admin/dashboard', { postCount, categoryCount, commentCount }); // Pass counts to the view
        }).catch(err => {
        console.error('Error counting documents:', err);
        res.status(500).send('Internal Server Error');
    });

});

router.post('/generate-fake-posts', (req, res) => {


    for (let i = 0; i < req.body.amount; i++) {
        let post = new Post({
            title: faker.lorem.words(),
            status: 'public',
            allowComments:faker.datatype.boolean(),
            body: faker.lorem.paragraphs(3),
            slug: faker.lorem.words(),
            date: Date.now()
        });

        post.save().then(savedPost => {
            console.log(`Post ${i + 1} created.`);
        }).catch(err => {
            console.log(err);
        });
    }
    res.redirect('/admin/posts');

});

module.exports = router;
