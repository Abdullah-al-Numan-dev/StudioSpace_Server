const jwt = require("jsonwebtoken");

module.exports = function verifyToken(req, res, next) {
  const token = req.cookies?.studiospace_token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized: please log in" });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).send({ message: "Unauthorized: invalid or expired session" });
  }
};