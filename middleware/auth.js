const jwt = require("jsonwebtoken");

exports.authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  console.log(token);
  if (!token) {
    return res.status(401).json({ Message: "Unauthorized user" });
  }

  try {
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = "67d41f3466038a56cba341ec";
    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({ Message: "Unauthorized user" });
  }
};
