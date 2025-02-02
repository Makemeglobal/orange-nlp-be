const express = require("express");
const { createReview, getReviews, updateReview, deleteReview ,getReviewsByProduct} = require("../controller/reviewController");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.post("/",authMiddleware, createReview);
router.get("/", getReviews);
router.put("/:reviewId", updateReview);
router.delete("/:reviewId", deleteReview);
router.get('/product/:productId',getReviewsByProduct)

module.exports = router;
