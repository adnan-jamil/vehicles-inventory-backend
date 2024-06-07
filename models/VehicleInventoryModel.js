const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    condition: { type: String, required: true },
    description: { type: String, required: true },
    title: { type: String, required: true },
    brand: { type: String, required: true },
    price_value: { type: String, required: true },
    currency: { type: String, required: true },
    product_type: { type: String, required: true },
    custom_label_0: { type: String, required: true },
    timestamp: { type: String, required: true }
  }
);

const inventory = mongoose.model("Inventory", inventorySchema);

module.exports = inventory;
