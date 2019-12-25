require("./config/config.js");

const express = require("express"); // to create the server
const bodyParser = require("body-parser"); // to parse the request body
const {ObjectID} = require("mongodb");  // to validate an object id
const _ = require("lodash"); // to handle a update todo request

const {mongoose} = require("./db/mongoose");  // importing the mongoose object which has been setup for the TodoApp database
const {Todo} = require("./models/Todo");  // importing the collections (models)
const {User} = require("./models/User"); // using object destructuring to avoid writing like this --> User = require("./models/User").User ;
const {authenticate} = require("./middleware/authenticate"); // middleware for authenticating using the token in req header to access private routes

var app = express();    // creating the server

app.use(bodyParser.json()); // to parse the json data in the request into javascript objects

const port = process.env.PORT;

// route setup to create a new Todo
// made PRIVATE by AUTHENTICATE middleware
app.post("/todos", authenticate, (req, res) => {
    var newTodo = new Todo({
        text: req.body.text,
        _creator: req.user._id  // setting the creator of todo as the currently signed in user whose info is returned in req object by middleware
    }); // new document created for the collection(model) Todo

    newTodo.save().then((todo) => {  // saving the document into the database
        res.send({todo});
    }, (err) => {
        res.status(400).send(err);  // bad request
    });
});

// route to get all todos
// made PRIVATE using AUTHENTICATE
app.get("/todos", authenticate, (req, res) => {

    Todo.find({_creator: req.user._id}).then((todos) => {   // finding all todos having the creator as user id
        res.send({todos});  // returning an object containing todos array as a property
    }, (err) => {
        res.status(400).send();
    });
});

// route to fetch a particular todo by its id provided by the user
// made PRIVATE using AUTHENTICATE
app.get("/todos/:id", authenticate, (req, res) => {
    var id = req.params.id; 
    // :id is an url parameter which can take variable value and in the url /todos/123, 123 is automatically stored in the req obj
    
    if(!ObjectID.isValid(id)){
        return res.status(404).send();  // return 404 if object id is not valid
    }

    Todo.findOne({_id: id, _creator: req.user._id}).then((todo) => {  // can also use findById(id) or find({_id:id})
        if(!todo){
            return res.status(404).send(); // if no todo is found corresponding to that object id then return a 404
        }
        
        res.send({todo});   // sending the desired todo as a property of another object
    }, (err) => {
        res.status(400).send(); // sending bad request if an error occurs
    });
});

// route to delete a todo from the database
// made private using authenticate
app.delete("/todos/:id", authenticate, (req, res) => {
    var id = req.params.id;

    if(!ObjectID.isValid(id)){
        return res.status(404).send();
    }

    // other options are findByIdAndRemove(id) and remove({})
    Todo.findOneAndRemove({_id: id, _creator: req.user._id}).then((todo) => {
        if(!todo){  // if no todo is found corresponding to the id then null is returned and thus we send a 404 back to user
            return res.status(404).send();
        }

        res.send({todo});   // returning the deleted todo
    }, (err) => {
        return res.status(400).send();
    })
});

// route to update a todo
// made private using authenticate middleware
app.patch("/todos/:id", authenticate, (req, res) => {
    var id = req.params.id; // fetching the id from the url
    var body = _.pick(req.body, ['text','completed']);
    /* copying only two properties in body leaving the others as user is not allowed to update anything apart from the text and
     whether the todo task has been completed or not. If other properties are also provided in req.body they are ignored. */

    if(!ObjectID.isValid(id)){  // validating the object id
        return res.status(404).send();
    }

    if(_.isBoolean(body.completed) && body.completed){
        body.completed = true;
        body.at = new Date().getTime(); // if completed = true then 'at' prop is set to the cuurent timestamp
    }
    else{
        body.completed = false; // if completed = false or is not specified by the user then 'at' is set to null
        body.at = null;
    }

    // other options are findByIdAndUpdate(id, ....)
    Todo.findOneAndUpdate({_id:id, _creator: req.user._id}/* Filter object */,{$set: body}/* updates req */,{new: true}).then((todo) => { 
        // new : true is like returnOriginal : false
        if(!todo){
            return res.status(404).send();  // if no todo is found for that id
        }

        res.send({todo});
    },(e) => {
        res.status(400).send();
    })
});

// Private route to get a particular user
app.get("/users/me", authenticate /* Assigning a middleware to be called */ , (req, res) => {
    res.send(req.user); // returning the user as set by the middleware in the req object
});

// PRIVATE route to log a user out by deleting his token from the database
app.delete("/users/me/token", authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {    // remove the token present in the req-header from the logged-in user
        res.status(200).send();
    }).catch((e) => {
        res.status(400).send();
    });
});

// to sign up a new user
app.post("/users", (req, res) => {
    var body = _.pick(req.body, ['email','password']); // considering only email and password sent by the client
    var user = new User(body); // new document created having email and password with proper validation
    
    user.generateAuthToken()  // before saving the document we generate its auth token. Promise is returned
    .then((token) => {
        res.header('x-auth', token).send(user); // token value sent back to the client as a header property
        // x-auth signifies a custom header set by the user and not required by http
    }).catch((err) => {
        res.status(400).send(err);
    });
});

// route to login a user
app.post("/users/login", (req, res) => {
    var body = _.pick(req.body, ['email','password']);  // extracting user email and password from req body
    User.findByCredentials(body.email, body.password).then((user) => {  // user is returned if credentials are correct
        user.generateAuthToken()
        .then((token) => {  // generate a token for the user
            res.header('x-auth', token).send(user); // token is sent as response header and user details as body
        }).catch((e) => {
            res.status(400).send(e);    // bad request in case of an error
        });
    }, (e) => res.status(400).send());  // if user's credentials are not correct
});

// testing heroku route
app.get("/", (req, res) => {
    res.send("<h1>Welcome to the Todo App</h1>");
});

// listening to http requests
app.listen(port, () => {
    console.log(`Server started at port ${port}`);
});

module.exports = { app };   // exporting the server for testing