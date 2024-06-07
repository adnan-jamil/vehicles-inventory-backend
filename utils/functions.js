const { req, res } = require("express");
const Inventory = require("../models/VehicleInventoryModel");

const getInventoryData = async () => {
  const inventoryStats = await Inventory.aggregate([
    {
      $addFields: {
        date: {
          $toDate: "$timestamp", // Simplified to directly convert timestamp to date
        },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        },
        newCount: {
          $sum: { $cond: [{ $eq: ["$condition", "new"] }, 1, 0] },
        },
        newTotalMSRP: {
          $sum: {
            $cond: [
              { $eq: ["$condition", "new"] },
              {
                $toDouble: {
                  $arrayElemAt: [{ $split: ["$price", " USD"] }, 0],
                },
              },
              0,
            ],
          },
        },
        usedCount: {
          $sum: { $cond: [{ $eq: ["$condition", "used"] }, 1, 0] },
        },
        usedTotalMSRP: {
          $sum: {
            $cond: [
              { $eq: ["$condition", "used"] },
              {
                $toDouble: {
                  $arrayElemAt: [{ $split: ["$price", " USD"] }, 0],
                },
              },
              0,
            ],
          },
        },
        cpoCount: {
          $sum: { $cond: [{ $eq: ["$condition", "cpo"] }, 1, 0] },
        },
        cpoTotalMSRP: {
          $sum: {
            $cond: [
              { $eq: ["$condition", "cpo"] },
              {
                $toDouble: {
                  $arrayElemAt: [{ $split: ["$price", " USD"] }, 0],
                },
              },
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        date: "$_id.date",
        newCount: 1,
        newTotalMSRP: 1,
        newAverageMSRP: {
          $cond: [
            { $gt: ["$newCount", 0] },
            { $round: [{ $divide: ["$newTotalMSRP", "$newCount"] }, 2] },
            0,
          ],
        },
        usedCount: 1,
        usedTotalMSRP: 1,
        usedAverageMSRP: {
          $cond: [
            { $gt: ["$usedCount", 0] },
            { $round: [{ $divide: ["$usedTotalMSRP", "$usedCount"] }, 2] },
            0,
          ],
        },
        cpoCount: 1,
        cpoTotalMSRP: 1,
        cpoAverageMSRP: {
          $cond: [
            { $gt: ["$cpoCount", 0] },
            { $round: [{ $divide: ["$cpoTotalMSRP", "$cpoCount"] }, 2] },
            0,
          ],
        },
      },
    },
    { $sort: { date: 1 } },
  ]);

  return inventoryStats;
};

const getAverageMSRP = async (
  brand = null,
  startOfMonth = null,
  endOfMonth = null
) => {
  const baseMatchQuery = {};
  if (startOfMonth !== null && endOfMonth !== null) {
    baseMatchQuery.timestamp = {
      $gte: startOfMonth,
      $lte: endOfMonth,
    };
  }
  if (brand !== null) {
    baseMatchQuery.brand = brand;
  }

  let averageMSRP;
  averageMSRP = await Inventory.aggregate([
    {
      $match: baseMatchQuery,
    },
    {
      $group: {
        _id: "$condition",
        count: { $sum: 1 },
        totalMSRP: {
          $sum: {
            $toDouble: { $arrayElemAt: [{ $split: ["$price", " USD"] }, 0] },
          },
        },
        averageMSRP: {
          $avg: {
            $toDouble: { $arrayElemAt: [{ $split: ["$price", " USD"] }, 0] },
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        condition: "$_id",
        count: 1,
        totalMSRP: 1,
        averageMSRP: { $round: ["$averageMSRP", 2] },
      },
    },
  ]);

  // if (brand == null && startOfMonth == null && endOfMonth == null) {
  //   averageMSRP = await Inventory.aggregate([
  //     {
  //       $group: {
  //         _id: "$condition",
  //         count: { $sum: 1 },
  //         totalMSRP: {
  //           $sum: {
  //             $toDouble: { $arrayElemAt: [{ $split: ["$price", " USD"] }, 0] },
  //           },
  //         },
  //         averageMSRP: {
  //           $avg: {
  //             $toDouble: { $arrayElemAt: [{ $split: ["$price", " USD"] }, 0] },
  //           },
  //         },
  //       },
  //     },
  //     {
  //       $project: {
  //         _id: 0,
  //         condition: "$_id",
  //         count: 1,
  //         totalMSRP: 1,
  //         averageMSRP: { $round: ["$averageMSRP", 2] },
  //       },
  //     },
  //   ]);
  // } else if (startOfMonth != null && endOfMonth != null) {
  //   averageMSRP = await Inventory.aggregate([
  //     {
  //       $match: {
  //         timestamp: {
  //           $gte: startOfMonth,
  //           $lte: endOfMonth,
  //         },
  //       },
  //     },
  //     {
  //       $group: {
  //         _id: "$condition",
  //         count: { $sum: 1 },
  //         totalMSRP: {
  //           $sum: {
  //             $toDouble: { $arrayElemAt: [{ $split: ["$price", " USD"] }, 0] },
  //           },
  //         },
  //         averageMSRP: {
  //           $avg: {
  //             $toDouble: { $arrayElemAt: [{ $split: ["$price", " USD"] }, 0] },
  //           },
  //         },
  //       },
  //     },
  //     {
  //       $project: {
  //         _id: 0,
  //         condition: "$_id",
  //         count: 1,
  //         totalMSRP: 1,
  //         averageMSRP: { $round: ["$averageMSRP", 2] },
  //       },
  //     },
  //   ]);
  // } else {
  //   averageMSRP = await Inventory.aggregate([
  //     {
  //       $match: { brand: brand },
  //     },
  //     {
  //       $group: {
  //         _id: "$condition",
  //         count: { $sum: 1 },
  //         totalMSRP: {
  //           $sum: {
  //             $toDouble: { $arrayElemAt: [{ $split: ["$price", " USD"] }, 0] },
  //           },
  //         },
  //         averageMSRP: {
  //           $avg: {
  //             $toDouble: { $arrayElemAt: [{ $split: ["$price", " USD"] }, 0] },
  //           },
  //         },
  //       },
  //     },
  //     {
  //       $project: {
  //         _id: 0,
  //         condition: "$_id",
  //         count: 1,
  //         totalMSRP: 1,
  //         averageMSRP: { $round: ["$averageMSRP", 2] },
  //       },
  //     },
  //   ]);
  // }
  return averageMSRP;
};

const getAverageMSRPForGraph = async (
  condition,
  brand = null,
  startOfMonth = null,
  endOfMonth = null
) => {
  const baseMatchQuery = { condition: condition };
  if (startOfMonth !== null && endOfMonth !== null) {
    baseMatchQuery.timestamp = {
      $gte: startOfMonth,
      $lte: endOfMonth,
    };
  }
  if (brand !== null) {
    baseMatchQuery.brand = brand;
  }

  let conditionCount;

  conditionCount = await Inventory.aggregate([
    {
      $match: baseMatchQuery,
    },
    {
      $addFields: {
        date: {
          $toDate: "$timestamp",
        },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        },
        counts: {
          $sum: { $cond: [{ $eq: ["$condition", condition] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        date: "$_id.date",
        counts: 1,
      },
    },
    { $sort: { date: 1 } },
  ]);
  // if (brand == null && startOfMonth == null && endOfMonth == null) {
  //   conditionCount = await Inventory.aggregate([
  //     {
  //       $match: { condition: condition },
  //     },
  //     {
  //       $addFields: {
  //         date: {
  //           $toDate: "$timestamp",
  //         },
  //       },
  //     },
  //     {
  //       $group: {
  //         _id: {
  //           date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
  //         },
  //         counts: {
  //           $sum: { $cond: [{ $eq: ["$condition", condition] }, 1, 0] },
  //         },
  //       },
  //     },
  //     {
  //       $project: {
  //         _id: 0,
  //         date: "$_id.date",
  //         counts: 1,
  //       },
  //     },
  //     { $sort: { date: 1 } },
  //   ]);
  // } else if (startOfMonth != null && endOfMonth != null) {
  //   conditionCount = await Inventory.aggregate([
  //     {
  //       $match: {
  //         condition: condition,
  //         timestamp: {
  //           $gte: startOfMonth,
  //           $lte: endOfMonth,
  //         },
  //       },
  //     },
  //     {
  //       $addFields: {
  //         date: {
  //           $toDate: "$timestamp",
  //         },
  //       },
  //     },
  //     {
  //       $group: {
  //         _id: {
  //           date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
  //         },
  //         counts: {
  //           $sum: { $cond: [{ $eq: ["$condition", condition] }, 1, 0] },
  //         },
  //       },
  //     },
  //     {
  //       $project: {
  //         _id: 0,
  //         date: "$_id.date",
  //         counts: 1,
  //       },
  //     },
  //     { $sort: { date: 1 } },
  //   ]);
  // } else {
  //   conditionCount = await Inventory.aggregate([
  //     {
  //       $match: { condition: condition, brand: brand },
  //     },
  //     {
  //       $addFields: {
  //         date: {
  //           $toDate: "$timestamp",
  //         },
  //       },
  //     },
  //     {
  //       $group: {
  //         _id: {
  //           date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
  //         },
  //         counts: {
  //           $sum: { $cond: [{ $eq: ["$condition", condition] }, 1, 0] },
  //         },
  //       },
  //     },
  //     {
  //       $project: {
  //         _id: 0,
  //         date: "$_id.date",
  //         counts: 1,
  //       },
  //     },
  //     { $sort: { date: 1 } },
  //   ]);
  // }

  return conditionCount;
};

const getByConditionAverageMSRP = async (
  condition,
  brand = null,
  startOfMonth = null,
  endOfMonth = null
) => {
  const baseMatchQuery = { condition: condition };
  if (startOfMonth !== null && endOfMonth !== null) {
    baseMatchQuery.timestamp = {
      $gte: startOfMonth,
      $lte: endOfMonth,
    };
  }
  if (brand !== null) {
    baseMatchQuery.brand = brand;
  }

  let inventoryaverageMSRP;

  inventoryaverageMSRP = await Inventory.aggregate([
    {
      $match: baseMatchQuery,
    },
    {
      $addFields: {
        date: {
          $toDate: "$timestamp",
        },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        },
        newCount: {
          $sum: { $cond: [{ $eq: ["$condition", "new"] }, 1, 0] },
        },
        newTotalMSRP: {
          $sum: {
            $cond: [
              { $eq: ["$condition", "new"] },
              {
                $toDouble: {
                  $arrayElemAt: [{ $split: ["$price", " USD"] }, 0],
                },
              },
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        date: "$_id.date",
        averageMSRP: {
          $cond: [
            { $gt: ["$newCount", 0] },
            { $round: [{ $divide: ["$newTotalMSRP", "$newCount"] }, 2] },
            0,
          ],
        },
      },
    },
    { $sort: { date: 1 } },
  ]);

  // if (brand == null && startOfMonth == null && endOfMonth == null) {
  //   inventoryaverageMSRP = await Inventory.aggregate([
  //     {
  //       $match: { condition: condition },
  //     },
  //     {
  //       $addFields: {
  //         date: {
  //           $toDate: "$timestamp",
  //         },
  //       },
  //     },
  //     {
  //       $group: {
  //         _id: {
  //           date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
  //         },
  //         newCount: {
  //           $sum: { $cond: [{ $eq: ["$condition", "new"] }, 1, 0] },
  //         },
  //         newTotalMSRP: {
  //           $sum: {
  //             $cond: [
  //               { $eq: ["$condition", "new"] },
  //               {
  //                 $toDouble: {
  //                   $arrayElemAt: [{ $split: ["$price", " USD"] }, 0],
  //                 },
  //               },
  //               0,
  //             ],
  //           },
  //         },
  //       },
  //     },
  //     {
  //       $project: {
  //         _id: 0,
  //         date: "$_id.date",
  //         averageMSRP: {
  //           $cond: [
  //             { $gt: ["$newCount", 0] },
  //             { $round: [{ $divide: ["$newTotalMSRP", "$newCount"] }, 2] },
  //             0,
  //           ],
  //         },
  //       },
  //     },
  //     { $sort: { date: 1 } },
  //   ]);
  // } else if (startOfMonth != null && endOfMonth != null) {
  //   inventoryaverageMSRP = await Inventory.aggregate([
  //     {
  //       $match: {
  //         condition: condition,
  //         timestamp: {
  //           $gte: startOfMonth,
  //           $lte: endOfMonth,
  //         },
  //       },
  //     },
  //     {
  //       $addFields: {
  //         date: {
  //           $toDate: "$timestamp",
  //         },
  //       },
  //     },
  //     {
  //       $group: {
  //         _id: {
  //           date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
  //         },
  //         newCount: {
  //           $sum: { $cond: [{ $eq: ["$condition", "new"] }, 1, 0] },
  //         },
  //         newTotalMSRP: {
  //           $sum: {
  //             $cond: [
  //               { $eq: ["$condition", "new"] },
  //               {
  //                 $toDouble: {
  //                   $arrayElemAt: [{ $split: ["$price", " USD"] }, 0],
  //                 },
  //               },
  //               0,
  //             ],
  //           },
  //         },
  //       },
  //     },
  //     {
  //       $project: {
  //         _id: 0,
  //         date: "$_id.date",
  //         averageMSRP: {
  //           $cond: [
  //             { $gt: ["$newCount", 0] },
  //             { $round: [{ $divide: ["$newTotalMSRP", "$newCount"] }, 2] },
  //             0,
  //           ],
  //         },
  //       },
  //     },
  //     { $sort: { date: 1 } },
  //   ]);
  // } else {
  //   inventoryaverageMSRP = await Inventory.aggregate([
  //     {
  //       $match: { condition: condition, brand: brand },
  //     },
  //     {
  //       $addFields: {
  //         date: {
  //           $toDate: "$timestamp",
  //         },
  //       },
  //     },
  //     {
  //       $group: {
  //         _id: {
  //           date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
  //         },
  //         newCount: {
  //           $sum: { $cond: [{ $eq: ["$condition", "new"] }, 1, 0] },
  //         },
  //         newTotalMSRP: {
  //           $sum: {
  //             $cond: [
  //               { $eq: ["$condition", "new"] },
  //               {
  //                 $toDouble: {
  //                   $arrayElemAt: [{ $split: ["$price", " USD"] }, 0],
  //                 },
  //               },
  //               0,
  //             ],
  //           },
  //         },
  //       },
  //     },
  //     {
  //       $project: {
  //         _id: 0,
  //         date: "$_id.date",
  //         averageMSRP: {
  //           $cond: [
  //             { $gt: ["$newCount", 0] },
  //             { $round: [{ $divide: ["$newTotalMSRP", "$newCount"] }, 2] },
  //             0,
  //           ],
  //         },
  //       },
  //     },
  //     { $sort: { date: 1 } },
  //   ]);
  // }

  return inventoryaverageMSRP;
};

const getFilterDataByBrand = async (brand) => {
  const inventoryStats = await Inventory.aggregate([
    {
      $match: { brand: brand },
    },
    {
      $addFields: {
        date: {
          $toDate: "$timestamp",
        },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        },
        newCount: {
          $sum: { $cond: [{ $eq: ["$condition", "new"] }, 1, 0] },
        },
        newTotalMSRP: {
          $sum: {
            $cond: [
              { $eq: ["$condition", "new"] },
              {
                $toDouble: {
                  $arrayElemAt: [{ $split: ["$price", " USD"] }, 0],
                },
              },
              0,
            ],
          },
        },
        usedCount: {
          $sum: { $cond: [{ $eq: ["$condition", "used"] }, 1, 0] },
        },
        usedTotalMSRP: {
          $sum: {
            $cond: [
              { $eq: ["$condition", "used"] },
              {
                $toDouble: {
                  $arrayElemAt: [{ $split: ["$price", " USD"] }, 0],
                },
              },
              0,
            ],
          },
        },
        cpoCount: {
          $sum: { $cond: [{ $eq: ["$condition", "cpo"] }, 1, 0] },
        },
        cpoTotalMSRP: {
          $sum: {
            $cond: [
              { $eq: ["$condition", "cpo"] },
              {
                $toDouble: {
                  $arrayElemAt: [{ $split: ["$price", " USD"] }, 0],
                },
              },
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        date: "$_id.date",
        newCount: 1,
        newTotalMSRP: 1,
        newAverageMSRP: {
          $cond: [
            { $gt: ["$newCount", 0] },
            { $round: [{ $divide: ["$newTotalMSRP", "$newCount"] }, 2] },
            0,
          ],
        },
        usedCount: 1,
        usedTotalMSRP: 1,
        usedAverageMSRP: {
          $cond: [
            { $gt: ["$usedCount", 0] },
            { $round: [{ $divide: ["$usedTotalMSRP", "$usedCount"] }, 2] },
            0,
          ],
        },
        cpoCount: 1,
        cpoTotalMSRP: 1,
        cpoAverageMSRP: {
          $cond: [
            { $gt: ["$cpoCount", 0] },
            { $round: [{ $divide: ["$cpoTotalMSRP", "$cpoCount"] }, 2] },
            0,
          ],
        },
      },
    },
    { $sort: { date: 1 } },
  ]);

  const newVehicleCounts = await getAverageMSRPForGraph("new", brand);
  const usedVehicleCounts = await getAverageMSRPForGraph("used", brand);
  const cpoVehicleCounts = await getAverageMSRPForGraph("cpo", brand);

  const newVehicleAverageMSRP = await getByConditionAverageMSRP("new", brand);
  const usedVehicleAverageMSRP = await getByConditionAverageMSRP("used", brand);
  const cpoVehicleAverageMSRP = await getByConditionAverageMSRP("cpo", brand);

  const vehicleStats = await getAverageMSRP(brand);

  const dataFilter = {
    newVehicleAverageMSRP: newVehicleAverageMSRP,
    usedVehicleAverageMSRP: usedVehicleAverageMSRP,
    cpoVehicleAverageMSRP: cpoVehicleAverageMSRP,
    newVehicleCounts: newVehicleCounts,
    usedVehicleCounts: usedVehicleCounts,
    cpoVehicleCounts: cpoVehicleCounts,
    inventoryStats: inventoryStats,
    vehicleStats: vehicleStats,
  };

  return dataFilter;
};

const getFilterData = async (startOfMonth, endOfMonth, brand) => {
  const inventoryStats = await Inventory.aggregate([
    {
      $match: {
        timestamp: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      },
    },
    {
      $addFields: {
        date: {
          $toDate: "$timestamp",
        },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        },
        newCount: {
          $sum: { $cond: [{ $eq: ["$condition", "new"] }, 1, 0] },
        },
        newTotalMSRP: {
          $sum: {
            $cond: [
              { $eq: ["$condition", "new"] },
              {
                $toDouble: {
                  $arrayElemAt: [{ $split: ["$price", " USD"] }, 0],
                },
              },
              0,
            ],
          },
        },
        usedCount: {
          $sum: { $cond: [{ $eq: ["$condition", "used"] }, 1, 0] },
        },
        usedTotalMSRP: {
          $sum: {
            $cond: [
              { $eq: ["$condition", "used"] },
              {
                $toDouble: {
                  $arrayElemAt: [{ $split: ["$price", " USD"] }, 0],
                },
              },
              0,
            ],
          },
        },
        cpoCount: {
          $sum: { $cond: [{ $eq: ["$condition", "cpo"] }, 1, 0] },
        },
        cpoTotalMSRP: {
          $sum: {
            $cond: [
              { $eq: ["$condition", "cpo"] },
              {
                $toDouble: {
                  $arrayElemAt: [{ $split: ["$price", " USD"] }, 0],
                },
              },
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        date: "$_id.date",
        newCount: 1,
        newTotalMSRP: 1,
        newAverageMSRP: {
          $cond: [
            { $gt: ["$newCount", 0] },
            { $round: [{ $divide: ["$newTotalMSRP", "$newCount"] }, 2] },
            0,
          ],
        },
        usedCount: 1,
        usedTotalMSRP: 1,
        usedAverageMSRP: {
          $cond: [
            { $gt: ["$usedCount", 0] },
            { $round: [{ $divide: ["$usedTotalMSRP", "$usedCount"] }, 2] },
            0,
          ],
        },
        cpoCount: 1,
        cpoTotalMSRP: 1,
        cpoAverageMSRP: {
          $cond: [
            { $gt: ["$cpoCount", 0] },
            { $round: [{ $divide: ["$cpoTotalMSRP", "$cpoCount"] }, 2] },
            0,
          ],
        },
      },
    },
    { $sort: { date: 1 } },
  ]);

  const newVehicleCounts = await getAverageMSRPForGraph(
    "new",
    brand,
    startOfMonth,
    endOfMonth
  );

  const usedVehicleCounts = await getAverageMSRPForGraph(
    "used",
    null,
    startOfMonth,
    endOfMonth
  );

  const cpoVehicleCounts = await getAverageMSRPForGraph(
    "cpo",
    null,
    startOfMonth,
    endOfMonth
  );

  const newVehicleAverageMSRP = await getByConditionAverageMSRP(
    "new",
    null,
    startOfMonth,
    endOfMonth
  );
  const usedVehicleAverageMSRP = await getByConditionAverageMSRP(
    "used",
    null,
    startOfMonth,
    endOfMonth
  );
  const cpoVehicleAverageMSRP = await getByConditionAverageMSRP(
    "cpo",
    null,
    startOfMonth,
    endOfMonth
  );

  const vehicleStats = await getAverageMSRP(null, startOfMonth, endOfMonth);

  const dataFilter = {
    newVehicleAverageMSRP: newVehicleAverageMSRP,
    usedVehicleAverageMSRP: usedVehicleAverageMSRP,
    cpoVehicleAverageMSRP: cpoVehicleAverageMSRP,
    newVehicleCounts: newVehicleCounts,
    usedVehicleCounts: usedVehicleCounts,
    cpoVehicleCounts: cpoVehicleCounts,
    inventoryStats: inventoryStats,
    vehicleStats: vehicleStats,
  };

  return dataFilter;
};

module.exports = {
  getInventoryData,
  getAverageMSRP,
  getAverageMSRPForGraph,
  getByConditionAverageMSRP,
  getFilterDataByBrand,
  getFilterData,
};
