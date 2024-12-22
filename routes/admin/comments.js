const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // To validate ObjectId
const Comment = require('../../models/Comment');
const Post = require('../../models/Post');
const {authenticateUser} = require('../../helpers/authentication')
// Middleware to set layout for admin routes
router.all('/*', authenticateUser,(req, res, next) => {
    req.app.locals.layout = 'admin';
    next();
});
async function removeTopThreeComments(postId) {
    try {
        // Find the post by ID
        const post = await Post.findById(postId);
        if (!post) {
            console.log('Post not found');
            return;
        }

        // Remove the first three comments from the `comments` array
        post.comments = post.comments.slice(2);

        // Save the updated post
        await post.save();

        console.log('Top three comments removed from the comments array.');
    } catch (error) {
        console.error('Error removing comments from the array:', error);
    }
}
// Route to create a new comment
router.post('/', (req, res) => {
    // removeTopThreeComments('671f0caa9d418b9d6624ef55');
    const { id, body } = req.body;

    // Validate post ID and comment body
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid or missing Post ID." });
    }
    if (!body) {
        return res.status(400).json({ error: "Comment body is required." });
    }
    // Validate user authentication
    if (!req.user || !req.user._id) {
        return res.status(401).json({ error: "User not authenticated." });
    }

    // Find the post by ID
    Post.findById(id)
        .then(post => {
            if (!post) {
                return res.status(404).json({ error: "Post not found." });
            }

            // Create a new comment
            const newComment = new Comment({
                user: req.user._id,
                body: body
            });

            // Save the comment and update the post
            newComment.save()
                .then(comment => {
                    post.comments.push(comment._id);

                    // Save the updated post
                    post.save()
                        .then(() => res.redirect(`/post/${post._id}`))
                        .catch(err => res.status(500).json({ error: "Error saving post with comment.", details: err.message }));
                })
                .catch(err => res.status(500).json({ error: "Error saving comment to the database.", details: err.message }));
        })
        .catch(err => res.status(500).json({ error: "Error finding post.", details: err.message }));
});
// Route to display comments
router.get('/index', (req, res)=>{
    Comment.find({}).populate('user').then(comments => {
        res.render('admin/comments',{comments:comments});
    });

});
module.exports = router;
