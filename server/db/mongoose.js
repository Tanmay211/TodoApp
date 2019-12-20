const mongoose = require("mongoose");

mongoose.Promise = global.Promise;  // basic setup

mongoose.connect(process.env.MONGODB_URI ,{useNewUrlParser: true}); // defining the connection to the database running at localhost

module.exports = { mongoose };