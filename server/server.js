require("./config/config.js");

const express = require("express"); // to create the server
const bodyParser = require("body-parser"); // to parse the request body
const {ObjectID} = require("mongodb");  // to validate an object id
const _ = require("lodash"); // to handle a update todo request

const {mongoose} = require("./db/mongoose");  // importing the mongoose object which has been setup for the TodoApp database
const {Todo} = require("./models/Todo");  // importing the collections (models)
const {User} = require("./models/User"); // using object destructuring to avoid writing like this --> User = require("./models/User").User ;

var app = express();    // creating the server

app.use(bodyParser.json()); // to parse the json data in the request into javascript objects

// route setup to create a new Todo
app.post("/todos", (req, res) => {
    var newTodo = new Todo({
        text: req.body.text
    }); // new document created for the collection(model) Todo

    newTodo.save().then((todo) => {  // saving the document into the database
        res.send({todo});
    }, (err) => {
        res.status(400).send(err);  // bad request
    });
});

// route to get all todos
app.get("/todos", (req, res) => {

    Todo.find().then((todos) => {   // finding all todos
        res.send({todos});  // returning an object containing todos array as a property
    }, (err) => {
        res.status(400).send();
    });
});

// route to fetch a particular todo by its id provided by the user
app.get("/todos/:id", (req, res) => {
    var id = req.params.id; 
    // :id is an url parameter which can take variable value and in the url /todos/123, 123 is automatically stored in the req obj
    
    if(!ObjectID.isValid(id)){
        return res.status(404).send();  // return 404 if object id is not valid
    }

    Todo.findById(id).then((todo) => {  // using findById(id) instead of find({_id:id}) or findOne({_id:id})
        if(!todo){
            return res.status(404).send(); // if no todo is found corresponding to that object id then return a 404
        }
        
        res.send({todo});   // sending the desired todo as a property of another object
    }, (err) => {
        res.status(400).send(); // sending bad request if an error occurs
    });
});

// route to delete a todo from the database
app.delete("/todos/:id", (req, res) => {
    var id = req.params.id;

    if(!ObjectID.isValid(id)){
        return res.status(404).send();
    }

    Todo.findByIdAndRemove(id).then((todo) => {
        if(!todo){  // if no todo is found corresponding to the id then null is returned and thus we send a 404 back to user
            return res.status(404).send();
        }

        res.send({todo});   // returning the deleted todo
    }, (err) => {
        return res.status(400).send();
    })
});

// route to update a todo
app.patch("/todos/:id", (req, res) => {
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

    Todo.findByIdAndUpdate(id,{$set: body},{new: true}).then((todo) => { // finding the todo by its id and updating it (similar to findOneAndUpdate())
        // new : true is like returnOriginal : false
        if(!todo){
            return res.status(404).send();  // if no todo is found for that id
        }

        res.send({todo});
    },(e) => {
        res.status(400).send();
    })
});

// listening to http requests
app.listen(process.env.PORT, () => {
    console.log(`Server started at port ${process.env.PORT}`);
});

module.exports = { app };   // exporting the server for testing