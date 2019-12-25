const {User} = require("./../models/User");

const authenticate = (req, res, next) => {
    var token = req.header('x-auth');
    
    User.findByToken(token).then((user) => {
        if (!user) {    // if user is null then promise is rejected and 401 is returned
            return Promise.reject();
        }
        req.user = user; 
        req.token = token;
        next(); // has to be called sinct it is a middleware

    }).catch((e) => {
        res.status(401).send(); // 401 means unauthorised
        // next not called to prevent unauthorised access to private routes
    })
};

module.exports = { authenticate };