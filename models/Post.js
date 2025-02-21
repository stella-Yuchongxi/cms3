const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slugify = require('slugify'); // Install this package: npm install slugify

const PostSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    title: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: 'public',
    },
    allowComments: {
        type: Boolean,
        default: false,
    },
    body: {
        type: String,
        required: true,
    },
    file: {
        type: String,
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
    },
    date: {
        type: Date,
        default: Date.now(),
    },
    slug: {
        type: String,
        unique: true,
    },
    comments: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Comment',
        },
    ],
});

// Pre-save middleware to generate a slug
PostSchema.pre('save', async function (next) {
    if (this.isModified('title')) {
        // Generate a slug from the title
        this.slug = slugify(this.title, { lower: true, strict: true });

        // Ensure slug uniqueness
        const existingPost = await mongoose.models.Post.findOne({ slug: this.slug });
        if (existingPost) {
            this.slug = `${this.slug}-${Date.now()}`; // Append timestamp to make the slug unique
        }
    }
    next();
});

module.exports = mongoose.model('Post', PostSchema);
