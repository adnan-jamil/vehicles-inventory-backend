const { request, response } = require("express");
const fs = require("fs");
const errorFormatter = require("../../utils/errorMessages");
const moment = require("moment");

const {
  getInventoryData,
  getAverageMSRP,
  getFilterData,
  getByConditionAverageMSRP,
  getFilterDataByBrand,
  getAverageMSRPForGraph
} = require("../../utils/functions");
const Inventory = require("../../models/VehicleInventoryModel");

const dashboardStats = async (request, response) => {
  try {
    const inventoryStats = await getInventoryData();

    const vehicleStats = await getAverageMSRP();

    const newVehicleCounts = await getAverageMSRPForGraph("new");
    const usedVehicleCounts = await getAverageMSRPForGraph("used");
    const cpoVehicleCounts = await getAverageMSRPForGraph("cpo");

    const newVehicleAverageMSRP = await getByConditionAverageMSRP("new");
    const usedVehicleAverageMSRP = await getByConditionAverageMSRP("used");
    const cpoVehicleAverageMSRP = await getByConditionAverageMSRP("cpo");

    return response.status(200).json({
      success: true,
      message: "Data has been fetched",
      data: {
        newVehicleAverageMSRP: newVehicleAverageMSRP,
        usedVehicleAverageMSRP: usedVehicleAverageMSRP,
        cpoVehicleAverageMSRP: cpoVehicleAverageMSRP,
        newVehicleCounts: newVehicleCounts,
        usedVehicleCounts: usedVehicleCounts,
        cpoVehicleCounts: cpoVehicleCounts,
        inventoryStats: inventoryStats,
        vehicleStats: vehicleStats,
      },
    });
  } catch (error) {
    return response
      .status(400)
      .json({ success: false, message: "Something Went Wrong", error });
  }
};

const dashboardFilterData = async (request, response) => {
  try {
    let vehiclesFilterData;

    const { date, brand } = request.query;

    if (date === "this_month") {
      const now = new Date();
      const startOfMonth = formatDate(
        new Date(now.getFullYear(), now.getMonth(), 1)
      );
      const endOfMonth = formatDate(
        new Date(now.getFullYear(), now.getMonth() + 1, 0)
      );

      vehiclesFilterData = await getFilterData(
        startOfMonth + " 00:00:00",
        endOfMonth + " 23:59:59"
      );
    } else if (date === "last_month") {
      const now = new Date();
      let previousMonth = now.getMonth() - 1;
      let year = now.getFullYear();
      if (previousMonth < 0) {
        previousMonth = 11;
        year -= 1;
      }

      const startOfPreviousMonth = new Date(year, previousMonth, 1);
      const endOfPreviousMonth = new Date(year, previousMonth + 1, 0);

      const startOfMonth = formatDate(startOfPreviousMonth);
      const endOfMonth = formatDate(endOfPreviousMonth);

      vehiclesFilterData = await getFilterData(
        startOfMonth + " 00:00:00",
        endOfMonth + " 23:59:59"
      );
    } else if (date === "last_3_months") {
      const currentDate = new Date();
      const threeMonthsAgo = new Date(currentDate);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const endOfMonth = formatDate(currentDate);

      const startOfMonth = formatDate(threeMonthsAgo);

      vehiclesFilterData = await getFilterData(
        startOfMonth + " 00:00:00",
        endOfMonth + " 23:59:59",
        brand
      );

    } else if (date === "last_6_months") {
      const currentDate = new Date();
      const sixMonthsAgo = new Date(currentDate);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const endOfMonth = formatDate(currentDate);
      const startOfMonth = formatDate(sixMonthsAgo);

      vehiclesFilterData = await getFilterData(
        startOfMonth + " 00:00:00",
        endOfMonth + " 23:59:59"
      );
    } else if (date === "this_year") {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();

      vehiclesFilterData = await getFilterData(
        currentYear+'-01-01' + " 00:00:00",
        currentYear+'-12-31' + " 23:59:59"
      );
    } else if (date === "last_year") {
      const currentDate = new Date();
      const lastYear = currentDate.getFullYear() - 1;

      vehiclesFilterData = await getFilterData(
        lastYear+'-01-01' + " 00:00:00",
        lastYear+'-12-31' + " 23:59:59"
      );
    } else {
      vehiclesFilterData = await getFilterDataByBrand(brand);
    }

    return response.status(200).json({
      success: true,
      message: "Data has been fetched",
      data: {
        newVehicleAverageMSRP: vehiclesFilterData.newVehicleAverageMSRP,
        usedVehicleAverageMSRP: vehiclesFilterData.usedVehicleAverageMSRP,
        cpoVehicleAverageMSRP: vehiclesFilterData.cpoVehicleAverageMSRP,
        newVehicleCounts: vehiclesFilterData.newVehicleCounts,
        usedVehicleCounts: vehiclesFilterData.usedVehicleCounts,
        cpoVehicleCounts: vehiclesFilterData.cpoVehicleCounts,
        inventoryStats: vehiclesFilterData.inventoryStats,
        vehicleStats: vehiclesFilterData.vehicleStats,
      },
    });
  } catch (error) {
    return response
      .status(400)
      .json({ success: false, message: error.message });
  }
};

const brandsData = async (request, response) => {
  try {
    const brandsData = await Inventory.find({}).distinct("brand");

    return response.status(200).json({
      success: true,
      message: "Data has been fetched",
      data: {
        brandsData: brandsData,
      },
    });
  } catch (error) {
    return response
      .status(400)
      .json({ success: false, message: "Something Went Wrong", error });
  }
};

// Format the date as YYYY-MM-DD
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

module.exports = {
  dashboardStats,
  dashboardFilterData,
  brandsData,
};
