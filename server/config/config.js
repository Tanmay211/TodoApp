var env = process.env.NODE_ENV || 'development'; // if nothing is set then its 'development' by default
/* node_env is automatically set to 'production' by heroku and PORT and MONGODB_URI is also set by it so we need not change them in that case*/

if (env === 'development' || env === 'test') {
    // Such config is better bcoz all crucial data is present in config.json file which will not be sent to anyone
    // config.json is not committed to github as well

    var config = require("./config.json"); // json data is automatically sent back as a proper object
    var envConfig = config[env];    // extracting the config for current environment i.e. test or development

    Object.keys(envConfig).forEach((key) => {
        process.env[key] = envConfig[key];  // setting the system environment variables as per the config set in json file
    });
}   /* For heroku PORT and MONGODB_URI are set automatically and JWT_SECRET is set manually by terminal
        The command is heroku config:set JWT_SECRET=VALUE */

// The below config method is not safe as some crucial data can be leaked by such hard coding

// if (env === 'development'){
//     process.env.PORT = 3000;
//     process.env.MONGODB_URI = "mongodb://localhost:27017/TodoApp"; // development database
// }
// else if(env === 'test') {
//     process.env.PORT = 3000;
//     process.env.MONGODB_URI = "mongodb://localhost:27017/TodoAppTest"; // testing database
// }