const mongoose = require("mongoose");

mongoose.Promise = global.Promise;  // basic setup

mongoose.connect("mongodb+srv://tanmay:cena%40123%23@cluster0-oidqo.gcp.mongodb.net/test?retryWrites=true&w=majority", {useMongoClient: true}); /*,{useNewUrlParser: true}); required in the latest version */
 // defining the connection to the database running at localhost or heroku

module.exports = { mongoose };