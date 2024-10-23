const express = require('express');
const router = express.Router();
const Category = require('../../models/Category');
const Post = require("../../models/Post");
const {isEmpty} = require("../../helpers/upload-helper");
const {authenticateUser} = require('../../helpers/authentication')
// Middleware to set layout for admin routes
router.all('/*', authenticateUser,(req, res, next) => {
    req.app.locals.layout = 'admin';
    next();
});

// Route to display categories
router.get('/index', (req, res) => {
    Category.find({}).lean().then(categories => {
        res.render('admin/categories/index', { categories: categories });
    }).catch(err => {
        console.log(err);
        res.redirect('/admin/categories'); // Handle errors appropriately
    });
});

// Route to create a new category
router.post('/create', (req, res) => {

    if (!req.body.name || req.body.name.trim() === '') {
        // Handle the case where the name is missing or empty
        req.flash('error', 'Category name is required.');
        // Instead of redirecting, render the page with the flash message
        Category.find({}).lean().then(categories => {
            res.render('admin/categories/index', {
                categories: categories,
                errors: [{ message: 'Category name is required.' }]  // Pass errors to template
            });
        }).catch(err => {
            console.log(err);
            res.redirect('/admin/categories/index');  // Handle error appropriately
        });
        return;
    }

    const newCategory = new Category({
        name: req.body.name
    });

    newCategory.save().then(savedCategory => {
        req.flash('success', `New category added successfully!`);
        res.redirect('/admin/categories/index'); // Redirect after category creation
    }).catch(err => {
        console.log(err);
        res.redirect('/admin/categories/index'); // Handle any errors and redirect
    });
});
// Route to edit categories
router.put('/edit/:id', (req, res) => {
    Category.findById(req.params.id).then(category => {
        if (!category) {
            return res.status(404).send('Category not found');
        }
        if (!req.body.name || req.body.name.trim() === '') {
            req.flash('error', 'Category name is required.');
            return res.redirect('/admin/categories/edit/' + req.params.id);
        }

        // Update post fields
        category.name = req.body.name;
        // Save updated post
        category.save().then(updatedCategory => {
            req.flash('success', `Category ${category._id} updated!`);
            res.redirect('/admin/categories/index');
        }).catch(err => {
            console.log(err);
            req.flash('error', 'Error creating category.');
            res.redirect('/admin/categories/index');
        });
    }).catch(err => {
        console.log(err);
    });
});
//Edit categories view
router.get('/edit/:id', (req, res) => {
    Category.findOne({_id:req.params.id}).lean().then(category => {
        res.render('admin/categories/edit', { category: category });
    }).catch(err => {
        console.log(err);
        res.redirect('/admin/categories'); // Handle errors appropriately
    });
});
module.exports = router;
