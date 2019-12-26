# TodoApp
Get started by downloading or cloning this project to your local repository and run the following commands -

> cd TodoApp
> npm install

Now set up your config.json file in the config folder as - 
{
  "test": {
      "PORT": 3000,
      "MONGODB_URI": your local database url
      "JWT_SECRET": some string of your choice
   },
   "development": {
       "PORT": 3000,
       "MONGODB_URI": your local test database url,
       "JWT_SECRET": some string
   }
}

At the end run - 
> npm start

You can start sending requests at localhost:3000
