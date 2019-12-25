const {ObjectID} = require("mongodb");
const jwt = require("jsonwebtoken");

const {Todo} = require("./../models/Todo");
const {User} = require("./../models/User");

var userid1 = new ObjectID();
var userid2 = new ObjectID();

var dummyUser = [
    {
        email: "user1@example.com",
        password: "abc123",
        _id: userid1,
        tokens: [
            {
                access: 'auth',
                token: jwt.sign({_id: userid1.toHexString(), access: 'auth'}, process.env.JWT_SECRET).toString()
            }
        ]
    },
    {
        email: "user2@example.com",
        password: "123abc",
        _id: userid2,
        tokens: [
            {
                access: 'auth',
                token: jwt.sign({_id: userid2.toHexString(), access: 'auth'}, process.env.JWT_SECRET).toString()
            }
        ]
    }
];

var dummyTodo = [
    {
        text: 'Dummy Task 1',
        _id: new ObjectID(),
        _creator: userid1
    },
    {
        text: 'Dummy Task 2',
        _id: new ObjectID(),
        _creator: userid2,
        completed: true,
        at: 100
    }
];

var populateTodos = (done) => {                      // beforeEach function is automatically executed before every testcase
    Todo.remove({}).then(() => {            // other remove methods are findOneAndRemove({..}) and findByIdAndRemove(id)
        return Todo.insertMany(dummyTodo);  // remove all todos from database and just leave dummy todos inside it
    }).then(() => done())
    .catch((e) => done(e));
};

var populateUsers = ((done) => {
    User.remove({}).then(() => {
        var userOne = new User(dummyUser[0]).save();
        var userTwo = new User(dummyUser[1]).save();

        return Promise.all([userOne, userTwo]);
    }).then(() => done())
    .catch((e) => done(e));
});

module.exports = {dummyTodo, dummyUser, populateTodos, populateUsers};