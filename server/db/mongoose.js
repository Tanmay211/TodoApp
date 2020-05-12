const mongoose = require("mongoose");

mongoose.Promise = global.Promise;  // basic setup

const uri = `mongodb+srv://admin:root@cluster0-c3skp.mongodb.net/test?retryWrites=true&w=majority`

mongoose.connect(`${uri}`, {useNewUrlParser: true})
.then((res) => {
    console.log(res);
}, (err) => {
    console.log("Error is ",err);
});
 // required in the latest version */
 // defining the connection to the database running at localhost or heroku

module.exports = { mongoose };