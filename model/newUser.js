const mongoose = require('mongoose');

const NewUserSchema = new mongoose.Schema({
    name:{
        type:String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    }
});

const newUser = new mongoose.model('customer',NewUserSchema);

module.exports = newUser;