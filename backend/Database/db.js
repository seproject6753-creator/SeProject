const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const mongoURI = process.env.MONGODB_URI;

const connectToMongo = () => {
  mongoose
    .connect(mongoURI, { useNewUrlParser: true })
    .then(() => {
      console.log("Connected to MongoDB Successfully");
    })
    .catch((error) => {
      console.error("Error connecting to MongoDB", error);
    });
};

module.exports = connectToMongo;
