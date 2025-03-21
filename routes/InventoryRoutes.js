const express = require("express");
const router = express.Router();
const itemController = require("../controller/InventoryController");
const {upload,uploadCSV} = require("../middleware/multerConfig");
const { authMiddleware } = require("../middleware/auth");
// CRUD Routes
router.post("/items",authMiddleware,  upload.single("image"), itemController.createInventory); // Create item
router.get("/items",authMiddleware, itemController.getAllInventorys); // Get all items
router.get("/items/v2",authMiddleware, itemController.getAllInventorys2); // Get all items
router.get("/items/:id", itemController.getInventoryById); // Get item by ID
router.put("/items/:id", upload.single("image"),itemController.updateInventory); // Update item

router.post('/bulk-create', authMiddleware, uploadCSV.single('csvFile'), itemController.bulkCreateInventory);

router.delete("/items/:id", itemController.markAsDeleted);
router.patch("/items/:id/mark-as-out-of-stock", itemController.markAsOutOfStock); // Mark as out of stock
router.get('/brands',itemController.fetchBrands)
router.get('/categories',itemController.fetchCategories)
module.exports = router;
