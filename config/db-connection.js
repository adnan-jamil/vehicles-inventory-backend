const mongoose = require("mongoose");

const dbConnection = async () => {
  try {
   await mongoose
      .connect(process.env.DB_URL)
      .then(() => console.log("Connected with database successfully"))
      .catch((error) => console.log(error));
  } catch (error) {
    console.log("Database conneting error");
  }
};

module.exports = dbConnection;