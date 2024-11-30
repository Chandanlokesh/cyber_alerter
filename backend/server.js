const express = require('express');
const mongoose = require('mongoose');
const user_routes = require('./routes/users.js');
const app = express();
const port = 3000;

//midlewares
app.use(express.json());

//routes
app.use('/users', user_routes);

//connecting to the database
mongoose.connect('mongodb://localhost:27017/cyber_alerter')
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('Error connecting to MongoDB:', error));


//runnig the server
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})