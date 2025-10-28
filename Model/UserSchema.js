const mongoose = require('mongoose')

const User = new mongoose.Schema({

    Email: { type: String, default: '' },
    Password: { type: String, default: '', required: true },
    Name: { type: String, default: '' },
    Age: { type: Number, default: 0, required: true },
    bio: { type: String, default: '' },
    Image: { type: Buffer, default: null },
    
    //! location fields
    Longitude: { type: String, default: '' },
    Latitude: { type: String, default: '' },

})
module.exports = mongoose.models.Services || mongoose.model('User', User);
