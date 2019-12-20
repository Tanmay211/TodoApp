var env = process.env.NODE_ENV || 'development'; // if nothing is set then its 'development' by default
/* node_env is automatically set to 'production' by heroku and PORT and MONGODB_URI is also set by it so we need not change them in that case*/

if (env === 'development'){
    process.env.PORT = 3000;
    process.env.MONGODB_URI = "mongodb://localhost:27017/TodoApp"; // development database
}
else if(env === 'test') {
    process.env.PORT = 3000;
    process.env.MONGODB_URI = "mongodb://localhost:27017/TodoAppTest"; // testing database
}