const express = require("express");
const multer = require("multer");

// Controllers imports
const {dashboardStats, dashboardFilterData, brandsData} = require("../../controller/admin/VehicleInventoryController");

const adminRoute = express();

// Admin dashboard
adminRoute.get("/", dashboardStats);
adminRoute.get("/brands", brandsData);
adminRoute.get("/filter", dashboardFilterData);

module.exports = adminRoute;
