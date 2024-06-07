const express = require("express");
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");
const dbConnection = require("./config/db-connection");

const port = process.env.PORT;

// routes import
const adminRoutes = require('./routes/admin/basicRoutes')
dbConnection();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use("/api/inventory", adminRoutes);

app.get("/", (req, res) => {
  res.send("Vehicle inventory APIs are running perfect!");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("error stack", err.stack);
  res.status(500).json({ success: false, message: err.stack});
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
