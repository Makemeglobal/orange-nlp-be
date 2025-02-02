const ProductReview = require("../model/Review");

exports.createReview = async (req, res) => {
  try {
    const { productId, userId, title, review, rating, images } = req.body;

    const newReview = await ProductReview.create({ productId, userId:req.user, title, review, rating, images });

    return res.status(201).json({ success: true, data: newReview });
  } catch (error) {
    console.log(
        error
    )
    return res.status(500).json({ success: false, message: "Error creating review", error:error.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const { productId } = req.query;

    const query = { isDeleted: false };
    if (productId) query.productId = productId;

    const reviews = await ProductReview.find(query).populate("userId", "name");

    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error fetching reviews", error });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const updates = req.body;

    const updatedReview = await ProductReview.findOneAndUpdate(
      { _id: reviewId, isDeleted: false },
      updates,
      { new: true }
    );

    if (!updatedReview) return res.status(404).json({ success: false, message: "Review not found" });

    return res.status(200).json({ success: true, data: updatedReview });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error updating review", error });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const deletedReview = await ProductReview.findOneAndUpdate(
      { _id: reviewId },
      { isDeleted: true },
      { new: true }
    );

    if (!deletedReview) return res.status(404).json({ success: false, message: "Review not found" });

    return res.status(200).json({ success: true, message: "Review marked as deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error deleting review", error });
  }
};


exports.getReviewsByProduct = async (req, res) => {
    try {
      const { productId } = req.params; 
  
      const reviews = await ProductReview.find({ productId, isDeleted: false })
        .populate('userId', 'name email') 
        .populate('productId', 'itemName brand'); 
  
      if (!reviews.length) {
        return res.status(404).json({ message: "No reviews found for this product." });
      }
  
    
      res.status(200).json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };