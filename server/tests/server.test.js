const expect = require("expect");
const request = require("supertest");
const {ObjectID} = require("mongodb");

const {app} = require("./../server");
const {Todo} = require("./../models/Todo");
const {User} = require("./../models/User");
const {dummyTodo, dummyUser, populateTodos, populateUsers} = require("./seed-data");

beforeEach(populateUsers);
beforeEach(populateTodos);

describe("POST /todos", () => {
    it("should create a new todo if text is valid", (done) => {
        var testTodo = 'Testing task';

        request(app)    // creating a new post request using supertest
            .post("/todos")
            .send({text: testTodo}) // sending post data
            .set('x-auth', dummyUser[0].tokens[0].token)    // setting the header as token of 1st user
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
            .set('x-auth', dummyUser[0].tokens[0].token)
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

        it("should not create a new todo if user is not logged in", (done) => {
            var testTodo = 'Testing task';

            request(app)    // creating a new post request using supertest
                .post("/todos")
                .send({text: testTodo}) // sending post data
                .expect(401)
                .end((err, res) => {
                    if(err){
                        return done(err);
                    }
                    Todo.findOne({text: testTodo}).then((todo) => {
                        expect(todo).toNotExist();
                        done();
                    }).catch((err) => done(err));
                });
        });

});

describe("GET /todos", () => {
    it("should get back all todos for a particular user", (done) => {
        request(app)
            .get("/todos")
            .set('x-auth', dummyUser[0].tokens[0].token)    // getting the todos for user 1
            .expect(200)
            .expect((res) => {
                expect(res.body.todos.length).toBe(1);  // only 1 todo is created by userOne
            })
            .end(done);
    });
});

describe("GET /todos/:id", () => {
    it("should check if id is valid or not", (done) => {
        request(app)
            .get("/todos/123")
            .set('x-auth', dummyUser[0].tokens[0].token)    // user1 is logged in
            .expect(404)
            .end(done);
    });

    it("should return 404 if no corresponding todo is found", (done) => {
        var hexId = new ObjectID().toHexString();
        request(app)
            .get(`/todos/${hexId}`)
            .set('x-auth', dummyUser[0].tokens[0].token)    // user 1 is logged in
            .expect(404)
            .end(done);
    });

    it("should return the correct todo", (done) => {
        request(app)
            .get(`/todos/${dummyTodo[0]._id.toHexString()}`)
            .set('x-auth', dummyUser[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(dummyTodo[0].text);
            })
            .end(done);
    });

    it("should not get back todo of another user", (done) => {
        request(app)
            .get(`/todos/${dummyTodo[0]._id.toHexString()}`) // asking for todo of 1st user
            .set('x-auth', dummyUser[1].tokens[0].token)    // user 2 is logged in
            .expect(404)
            .end(done);
    });

    it("should not get back a todo if no one is logged in", (done) => {
        request(app)
            .get(`/todos/${dummyTodo[0]._id.toHexString()}`) // asking for todo of 1st user
            .expect(401)
            .end(done);
    });
});

describe("DELETE /todos/:id", () => {
    it("should check if id is valid", (done) => {
        request(app)
            .delete("/todos/123")
            .set('x-auth', dummyUser[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it("should return 404 if no corresponding todo is found", (done) => {
        var hexId = new ObjectID().toHexString();
        request(app)
            .delete(`/todos/${hexId}`)
            .set('x-auth', dummyUser[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it("should return the deleted todo", (done) => {
        var hexId = dummyTodo[0]._id.toHexString();
        request(app)
            .delete(`/todos/${hexId}`)
            .set('x-auth', dummyUser[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(dummyTodo[0].text);
                expect(res.body.todo._id).toBe(dummyTodo[0]._id.toHexString());
                expect(res.body.todo._creator).toBe(dummyTodo[0]._creator.toHexString());
            })
            .end((err,res) => {
                if(err){
                    return done(err);
                }
                Todo.findOne({_id: hexId, _creator: dummyTodo[0]._creator}).then((todo) => {
                    expect(todo).toNotExist();
                    done();
                }).catch((e) => done(e));
            });
    });

    it("should not delete the todo of some other user", (done) => {
        var hexId = dummyTodo[0]._id.toHexString();
        request(app)
            .delete(`/todos/${hexId}`)
            .set('x-auth', dummyUser[1].tokens[0].token)
            .expect(404)
            .end((err,res) => {
                if(err){
                    return done(err);
                }
                Todo.findOne({_id: hexId, _creator: dummyTodo[0]._creator}).then((todo) => {
                    expect(todo).toExist();
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
            .set('x-auth', dummyUser[0].tokens[0].token)
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

    it("should set 'at' to null if not completed", (done) => {
        var hexId = dummyTodo[1]._id.toHexString();
        var newText = 'Some new text';

        request(app)
            .patch(`/todos/${hexId}`)
            .set('x-auth', dummyUser[1].tokens[0].token)
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

    it("should not update the todo of some other user", (done) => {
        var hexId = dummyTodo[0]._id.toHexString();
        var newText = 'Some new text';

        request(app)
            .patch(`/todos/${hexId}`)
            .set('x-auth', dummyUser[1].tokens[0].token)
            .send({
                completed: true,
                text: newText
            })
            .expect(404)
            .end(done);
    });
});

describe("POST /users/login", () => {
    it("should login a user and return auth token", (done) => {
        request(app)
            .post("/users/login")
            .send({
                email: dummyUser[1].email,
                password: dummyUser[1].password
            })
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toExist();
            })
            .end((err, res) => {
                if(err) {
                    return done(err);
                }
                User.findById(dummyUser[1]._id).then((user) => {
                    expect(user.tokens[1]).toInclude({
                        access: 'auth',
                        token: res.headers['x-auth']
                    });
                    done();
                }).catch((e) => done(e));
            });
    });

    it("should reject invalid login", (done) => {
        request(app)
            .post("/users/login")
            .send({
                email: dummyUser[1].email,
                password: dummyUser[1].password + '1'
            })
            .expect(400)
            .expect((res) => {
                expect(res.headers['x-auth']).toNotExist();
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }
                User.findById(dummyUser[1]._id).then((user) => {
                    expect(user.tokens.length).toBe(1);
                    done();
                }).catch((e) => done(e));
            });
    });

});

describe("DELETE /users/me/token", () => {
    it("should remove auth token on logout", (done) => {
        request(app)
            .delete("/users/me/token")
            .set('x-auth', dummyUser[1].tokens[0].token)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }
                User.findById(dummyUser[1]._id).then((user) => {
                    expect(user.tokens.length).toBe(0);
                    done();
                }).catch((e) => done(e));
            });
    });
});

describe("GET /users/me", () => {
    it("should return user if authenticated", (done) => {
        request(app)
            .get("/users/me")
            .set('x-auth', dummyUser[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body._id).toBe(dummyUser[0]._id.toHexString());
                expect(res.body.email).toBe(dummyUser[0].email);
            })
            .end(done);
    });

    it("should return 401 if unauthenticated", (done) => {
        request(app)
            .get("/users/me")
            .expect(401)
            .expect((res) => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });
});

describe("POST /users", () => {
    it("should create a user", (done) => {
        var email = "user3@example.com";
        var password = "abcdef";
        request(app)
            .post("/users")
            .send({email, password})
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toExist();
                expect(res.body._id).toExist();
                expect(res.body.email).toBe(email);
            })
            .end((err, res) => {
                if(err) {
                    return done(err);
                }
                User.findOne({email}).then((user) => {
                    expect(user).toExist();
                    expect(user.password).toNotBe(password);
                    done();
                }).catch((e) => done(e));
            });
    });

    it("should return validation error if request is invalid", (done) => {
        var email = "user3example.com";
        var password = "adef";
        request(app)
            .post("/users")
            .send({email, password})
            .expect(400)
            .end(done);
    });

    it("should not create is email is already in use", (done) => {
        var email = dummyUser[0].email;
        var password = "abcdef";
        request(app)
            .post("/users")
            .send({email, password})
            .expect(400)
            .end(done);
    });
});