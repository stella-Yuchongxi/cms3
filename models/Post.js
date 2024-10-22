const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    title: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'public'
    },
    allowComments: {
        type: Boolean,
        default: false
    },
    body: {
        type: String,
        required: true
    },
    file: {
        type: String,
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
    },
    date: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('Post', PostSchema);
