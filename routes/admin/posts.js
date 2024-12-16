const fs = require('fs');
const express = require('express');
const router = express.Router();
const {authenticateUser} = require('../../helpers/authentication')
const Category = require('../../models/Category');
const Post = require('../../models/Post'); // Ensure this line correctly imports the Post model
const path = require('path');
const {isEmpty, uploadDir} = require('../../helpers/upload-helper');
const upload = require("../../helpers/upload-helper");

router.all('/*',authenticateUser, (req, res, next) => {
    req.app.locals.layout = 'admin';
    next();
});

router.get('/', (req, res) => {
    // Uncomment the following block to fetch and render posts
    Post.find({}).lean().populate('category').then(posts => {
        res.render('admin/posts/index', {posts: posts});
    }).catch(err => {
        console.log(err);
    });
    // Temporary line to test the route
    // res.render('admin/posts/create');
});
router.get('/edit/:id', (req, res) => {
    Post.findById(req.params.id).lean().then(post => {
        if (!post) {
            return res.status(404).send('Post not found');
        }
        Category.find({}).then(categories=> {
            res.render('admin/posts/edit', {post: post, categories: categories});
        });
    }).catch(err => {
        console.log(err);
        res.redirect('/admin/posts');
    });
});
router.get('/my-posts', (req, res) => {
    // Post.find({ user: req.user.id }).populate('category').lean().then(posts => {
    //     res.render('admin/posts/my-posts', { posts: posts });
    // });
    res.render('admin/posts/my-posts');
});
router.get('/create', (req, res) => {
    Category.find({}).then(categories=>{
        res.render('admin/posts/create',{categories:categories});
    });

});
router.put('/edit/:id', upload.single('file'), (req, res) => {
    Post.findById(req.params.id).then(post => {
        if (!post) {
            return res.status(404).send('Post not found');
        }

        // 處理 allowComments
        let allowComments = req.body.allowComments ? true : false;

        // 更新帖子字段
        post.title = req.body.title;
        post.status = req.body.status;
        post.allowComments = allowComments;
        post.category = req.body.category;
        post.body = req.body.body;

        // 處理文件上傳（如果有文件）
        if (req.file) {
            post.file = req.file.path;
            // 移動文件到目標目錄（multer 自動處理）
        }

        // 保存更新的帖子
        post.save().then(updatedPost => {
            req.flash('success', `Post ${post._id} updated!`);
            res.redirect('/admin/posts');
        }).catch(err => {
            console.error(err);
            res.redirect('/admin/posts/edit/' + req.params.id);
        });
    }).catch(err => {
        console.error(err);
        res.redirect('/admin/posts');
    });
});

router.delete('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            req.flash('error', 'Post not found');
            return res.redirect('/admin/posts');
        }

        const uploadDir = './public/uploads/';
        const filePath = path.join(uploadDir, post.file || '');

        // Delete the associated file if it exists
        if (post.file && fs.existsSync(filePath)) {
            try {
                await fs.promises.unlink(filePath);
                console.log('File deleted:', filePath);
            } catch (err) {
                console.error('Error deleting file:', err);
                req.flash('error', `Failed to delete file associated with post ${post._id}`);
                return res.redirect('/admin/posts');
            }
        }

        // Delete the post from the database
        await Post.deleteOne({ _id: post._id });
        req.flash('success', `Post ${post._id} was deleted successfully`);
        res.redirect('/admin/posts');
    } catch (err) {
        console.error('Error during deletion:', err);
        req.flash('error', 'Error occurred while deleting the post');
        res.redirect('/admin/posts');
    }
});
router.post('/create', upload.single('file'), async (req, res) => {
    try {
        console.log(req.file); // 确保文件信息被接收
        console.log(req.body); // 确保表单字段被接收

        if (!req.file) {
            return res.status(400).send('File is required.');
        }

        // 创建新帖子
        const newPost = new Post({
            title: req.body.title,
            body: req.body.body,
            file: req.file.path, // Cloudinary 返回的 URL
            allowComments: req.body.allowComments === 'on',
            status: req.body.status || 'public'
        });

        newPost.save().then(savedPost => {
            req.flash('success', `Post ${savedPost.id } added successfully!`);
            res.redirect('/admin/posts');
        }).catch(error => {
            console.log(error, 'could not save post');
            // res.redirect('/admin/posts/create');
        });
    } catch (error) {
        console.error('Error creating post:', error.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
