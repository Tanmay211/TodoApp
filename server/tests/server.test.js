const expect = require("expect");
const request = require("supertest");
const {ObjectID} = require("mongodb");

const {app} = require("./../server");
const {Todo} = require("./../models/Todo");

// TESTS NOT WORKING DUE TO SOME FAULTS IN beforeEach() FUNCTION.

var dummyTodo = [
    {
        text: 'Dummy Task 1',
        _id: new ObjectID()
    },
    {
        text: 'Dummy Task 2',
        _id: new ObjectID(),
        completed: true,
        at: 100
    }
];

describe("All test cases", () => {

    beforeEach((done) => {                      // beforeEach function is automatically executed before every testcase
        Todo.remove({}).then(() => {            // other remove methods are findOneAndRemove({..}) and findByIdAndRemove(id)
            return Todo.insertMany(dummyTodo);  // remove all todos from database and just leave dummy todos inside it
        }).then(() => done())
        .catch((e) => done(e));
    });
    
    describe("POST /todos", () => {
        it("should create a new todo if text is valid", (done) => {
            var testTodo = 'Testing task';
    
            request(app)    // creating a new post request using supertest
                .post("/todos")
                .send({text: testTodo}) // sending post data
                .expect(200)
                .expect((res) => {
                    expect(res.body.todo.text).toBe(testTodo); 
                })
                .end((err, res) => {
                    if(err){
                        return done(err);
                    }
                    Todo.find({text: testTodo}).then((todos) => {
                        expect(todos.length).toBe(1);
                        expect(todos[0].text).toBe(testTodo);
                        done();
                    }).catch((err) => done(err));
                });
    
        });
    
        it("should not create a new todo if text is invalid", (done) => {
    
            request(app)
                .post("/todos")
                .send({})
                .expect(400)
                .end((err, res) => {
                    if(err){
                        return done(err);
                    }
    
                    Todo.find().then((todos) => {
                        expect(todos.length).toBe(2);
                        done();
                    }).catch((err) => done(err));
                });
            });
    
    });
    
    describe("GET /todos", () => {
        it("should get back all todos", (done) => {
            request(app)
                .get("/todos")
                .expect(200)
                .expect((res) => {
                    expect(res.body.todos.length).toBe(2);
                })
                .end(done);
        });
    });
    
    describe("GET /todos/:id", () => {
        it("should check if id is valid", (done) => {
            request(app)
                .get("/todos/123")
                .expect(404)
                .end(done);
        });
    
        it("should return 404 if no corresponding todo is found", (done) => {
            var hexId = new ObjectID().toHexString();
            request(app)
                .get(`/todos/${hexId}`)
                .expect(404)
                .end(done);
        });
    
        it("should return the correct todo", (done) => {
            request(app)
            .get(`/todos/${dummyTodo[0]._id.toHexString()}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(dummyTodo[0].text);
            })
            .end(done);
        });
    });
    
    describe("DELETE /todos/:id", () => {
        it("should check if id is valid", (done) => {
            request(app)
                .delete("/todos/123")
                .expect(404)
                .end(done);
        });
    
        it("should return 404 if no corresponding todo is found", (done) => {
            var hexId = new ObjectID().toHexString();
            request(app)
                .delete(`/todos/${hexId}`)
                .expect(404)
                .end(done);
        });
    
        it("should return the deleted todo", (done) => {
            var hexId = dummyTodo[0]._id.toHexString();
            request(app)
                .delete(`/todos/${hexId}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.todo.text).toBe(dummyTodo[0].text);
                    expect(res.body.todo._id).toBe(dummyTodo[0]._id.toHexString());
                })
                .end((err,res) => {
                    if(err){
                        return done(err);
                    }
                    Todo.findById(hexId).then((todo) => {
                        expect(todo).toNotExist();
                        done();
                    }).catch((e) => done(e));
                });
        });
    });

    describe("PATCH /todos/:id", () => {
        it("should update a todo", (done) => {
            var hexId = dummyTodo[0]._id.toHexString();
            var newText = 'Some new text';

            request(app)
                .patch(`/todos/${hexId}`)
                .send({
                    completed: true,
                    text: newText
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body.todo.text).toBe(newText);
                    expect(res.body.todo.completed).toBe(true);
                    expect(res.body.todo.at).toBeA('number');
                })
                .end(done);
        });

        it("should set at to null if not completed", (done) => {
            var hexId = dummyTodo[1]._id.toHexString();
            var newText = 'Some new text';

            request(app)
                .patch(`/todos/${hexId}`)
                .send({
                    completed: false,
                    text: newText
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body.todo.text).toBe(newText);
                    expect(res.body.todo.completed).toBe(false);
                    expect(res.body.todo.at).toNotExist();
                })
                .end(done);
        });
    })

});