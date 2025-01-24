const express = require("express");
const router = express.Router();
const itemController = require("../controller/InventoryController");
const upload = require("../middleware/multerConfig");
// CRUD Routes
router.post("/items",  upload.single("image"), itemController.createInventory); // Create item
router.get("/items", itemController.getAllInventorys); // Get all items
router.get("/items/:id", itemController.getInventoryById); // Get item by ID
router.put("/items/:id", itemController.updateInventory); // Update item


router.delete("/items/:id", itemController.markAsDeleted);
router.patch("/items/:id/mark-as-out-of-stock", itemController.markAsOutOfStock); // Mark as out of stock
router.get('/brands',itemController.fetchBrands)
router.get('/categories',itemController.fetchCategories)
module.exports = router;
