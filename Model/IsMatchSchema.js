const mongoose = require('mongoose');

const isMatchSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userSuggestion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isMatch: {
        type: Boolean,
        required: false
    },
    isLike: {
        type: Boolean,
        required: true
    }
});

module.exports = mongoose.models.IsMatch || mongoose.model('IsMatch', isMatchSchema);
