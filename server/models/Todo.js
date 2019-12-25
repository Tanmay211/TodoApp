const mongoose = require("mongoose");

var Todo = mongoose.model('Todo',{  // defining a new collection for the database
    text: {
        type: String,
        required: true,
        trim: true, // validation checks
        minLength: 1
    },
    completed: {
        type: Boolean,
        default: false
    },
    at: {
        type: Number,
        default: null
    },
    _creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
});

module.exports = { Todo };