const {MongoClient, ObjectID} = require('mongodb');

MongoClient.connect("mongodb://localhost:27017/TodosApp",{useUnifiedTopology: true}, (err, client) => {
    if(err){
        return console.log("Unable to connect to the database!");
    }
    console.log("Successfully connected!");
    
    var db = client.db('TodosApp'); // required for mongodb v3 onwards

    // db.collection('Todos').find().toArray().then((docs) => {
    //     console.log(JSON.stringify(docs, undefined, 2)); // pretty printing
    // }, (err) => {
    //     console.log("Unable to read from the database ",err);
    // });

    db.collection('Todos').find({completed: false}).toArray().then((docs) => {
        console.log(JSON.stringify(docs, undefined, 2)); // pretty printing
    }, (err) => {
        console.log("Unable to read from the database ",err);
    });

    // db.collection('Todos').find().count().then((count) => {
    //     console.log('Todos count =',count); // pretty printing
    // }, (err) => {
    //     console.log("Unable to read from the database ",err);
    // });
    
    // db.close(); Won't work from v3 onwards.
    client.close(); // Use this instead.
});