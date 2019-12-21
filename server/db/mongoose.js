const mongoose = require("mongoose");

mongoose.Promise = global.Promise;  // basic setup

mongoose.connect(process.env.MONGODB_URI); /*,{useNewUrlParser: true}); required in the latest version */
 // defining the connection to the database running at localhost or heroku

module.exports = { mongoose };