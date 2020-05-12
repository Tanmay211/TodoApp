const mongoose = require("mongoose");   // database functionality
const validator = require("validator"); // for validating email
const jwt = require("jsonwebtoken");    // for creating a auth token
const _ = require("lodash");
const bcrypt = require("bcryptjs"); // for hashing a password

// using schema method to create a model so that we can add INSTANCE METHODS to the model which can be called by any document of this model
var UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        minLength: 1,
        unique: true,   // ensuring every doc in the model has unique emails i.e. 2 accounts cannot have same email
        validate: {
            validator: validator.isEmail,   // in-built function to check validity of an email
            message: '{VALUE} is not a valid email' // error msg if email is invalid
        }
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    tokens: [{  // array of objects where each object is a token
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,   // actual hashed token value created by jwt library
            required: true
        }
    }]
});

// MONGOOSE MIDDLEWARE (pre) that is called before an event occurs
UserSchema.pre('save', function(next) { //  this middleware is always called before the save event
    var user = this;
    
    if (user.isModified('password')) {    // if the password is not modified then we need not hash it again
        
        bcrypt.genSalt(1, (err, salt) => { // generating a salt in 10 rounds
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;   // password is hashed before saving the document in database
                next(); // end of the middleware
            });
        });

    }
    else {
        next();
    }
});

/* this is a OVERRIDDEN method of mongoose library
   automatically called when we send data back in json format
   we override this to control what properties of user are sent back to the client */
UserSchema.methods.toJSON = function() {        // not using arrow func to enable 'this' binding
    var user = this;                            // refering to the user document by which the function has been called
    var userObject = user.toObject();           // converting the mongoose variable user to a regular object
    return _.pick(userObject, ['_id','email']); // picking only 2 properties as we dont wanna return the password and tokens array
}

// INSTANCE METHOD to generate and send an auth token to the client when a new client signs up!
UserSchema.methods.generateAuthToken = function() {
    var user = this;
    var access = 'auth';
    // var id = user._id.toHexString(); alternate option
    var token = jwt.sign({_id: user._id.toHexString() /* id */ , access}, process.env.JWT_SECRET).toString(); // obj converted to string
    /* jwt library is used to create the auth token as it stringifies the data(1st argument) and adds the salt(2nd arg) to it & the string 
        created is then converted to a new hashed token */
    /* A normal token usually consists of data and its hash together as an object and if some modifications are made in data by a hacker
        then data does not match its hash anymore and authorisation can thus be denied */
    user.tokens = user.tokens.concat([{access, token}]);
    return user.save().then(() => { // returns a promise which saves the document in the database and then returns the token to client
        return token;   // token is returned to be sent back to the client
    });
}

// INSTANCE METHOD to remove a token and logout a user
UserSchema.methods.removeToken = function (token) {
    var user = this;
    
    return user.update({    // updating the user doc from which the token has to be removed
        $pull: {            // pull property is used to pull out a value from an array or object
            tokens: {
                token: token
            }
        }
    });
}

// MODEL METHOD setup using statics
// such method is called on the model itself and not on individual document
UserSchema.statics.findByToken = function (token) {
    var User = this; // pointing to the user model and not a particular document
    var decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);    // decodes the hashed token into the object
    }
    catch(e) {
        return Promise.reject();    // if there is some error then a promise that rejects is returned
    }

    console.log(decoded); // contains id , access , issuedat(iat)

    return User.findOne({   // if there's no error then the user object corresponding to that token is found and returned as a promise
        '_id': decoded._id, // working perfectly in the video but not in my case for some reason.
        'tokens.token': token,
        'tokens.access': 'auth'
    });
};

// MODEL METHOD to find whether the user can login or not by verifying his email and password
UserSchema.statics.findByCredentials = function (email, password) {
    var User = this;
    return User.findOne({email}).then((user) => {   // finding a user with given email in database
        if (!user) {
            return Promise.reject();    // if not found then promise is rejected and 400 is returned
        }
        
        // if user is found then we verify if the password entered by him is correct or not
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, res) => { // 1st arg is plain text password and 2nd arg is hashed password
                if(res) {   // res is true or false
                    resolve(user);  // if password is correct then user is returned and its new token can be generated
                }
                else {
                    reject();   // otherwise promise is rejected leading to a 400
                }
            });
        });
    });
}

var User = mongoose.model('User', UserSchema);  // model is finally created for the above schema

module.exports = { User };