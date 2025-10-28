require('dotenv').config();
const mongoose = require('mongoose');

const DATABASE_URL = process.env.DATABASE_URL;
mongoose
    .connect(DATABASE_URL, {})
    .then(() => console.log(`Database connected`))
    .catch((err) => console.log(`error connect to the database`, err))







