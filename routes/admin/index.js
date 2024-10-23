const express = require('express');
const router = express.Router();
const {authenticateUser} = require('../../helpers/authentication')
const { faker } = require('@faker-js/faker');
const Post = require('../../models/Post');  // Ensure you are importing the correct model

router.all('/*', authenticateUser,(req, res, next) => {
    req.app.locals.layout = 'admin';
    next();
});

router.get('/', (req, res) => {
    res.render('admin/dashboard');
});

router.post('/generate-fake-posts', (req, res) => {


    for (let i = 0; i < req.body.amount; i++) {
        let post = new Post({
            title: faker.lorem.words(),
            status: 'public',
            allowComments:faker.datatype.boolean(),
            body: faker.lorem.paragraphs(3),
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
