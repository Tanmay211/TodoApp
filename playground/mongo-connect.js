const {MongoClient, ObjectID} = require('mongodb');

MongoClient.connect("mongodb://localhost:27017/TodosApp",{useUnifiedTopology: true}, (err, client) => {
    if(err){
        return console.log("Unable to connect to the database!");
    }
    console.log("Successfully connected!");
    
    var db = client.db('TodosApp'); // required for mongodb v3 onwards

    db.collection('Todos').insertOne({task: 'Go to the gym',completed: true,at:'6 45'}).then((result) => {
        console.log(result.ops);
    }, (err) => {
        console.log("Unable to write to the database ",err);
    });
    
    // db.close(); Won't work from v3 onwards.
    client.close(); // Use this instead.
});