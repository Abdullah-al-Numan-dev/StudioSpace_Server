const express = require("express");
const { ObjectId } = require("mongodb");
const verifyToken = require("../middleware/verifyToken");

module.exports = (db) => {
  const router = express.Router();
  const wishlist = db.collection("wishlist");
  const studios = db.collection("studios");

  // GET /api/wishlist  (ids of studios I saved)
  router.get("/", verifyToken, async (req, res) => {
    try {
      const items = await wishlist.find({ userEmail: req.user.email }).toArray();
      res.send(items.map((i) => i.studioId));
    } catch (err) {
      res.status(500).send({ message: "Failed to load your saved studios" });
    }
  });

  // GET /api/wishlist/studios  (full studio documents I saved)
  router.get("/studios", verifyToken, async (req, res) => {
    try {
      const items = await wishlist
        .find({ userEmail: req.user.email })
        .sort({ createdAt: -1 })
        .toArray();
      const ids = items.filter((i) => ObjectId.isValid(i.studioId)).map((i) => new ObjectId(i.studioId));
      const list = await studios.find({ _id: { $in: ids } }).toArray();
      res.send(list);
    } catch (err) {
      res.status(500).send({ message: "Failed to load your saved studios" });
    }
  });

  // POST /api/wishlist/:studioId  (save, safe to call twice)
  router.post("/:studioId", verifyToken, async (req, res) => {
    try {
      const { studioId } = req.params;
      if (!ObjectId.isValid(studioId)) {
        return res.status(400).send({ message: "Invalid studio id" });
      }
      const exists = await studios.findOne({ _id: new ObjectId(studioId) });
      if (!exists) return res.status(404).send({ message: "Studio not found" });

      await wishlist.updateOne(
        { userEmail: req.user.email, studioId },
        { $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
      res.status(201).send({ message: "Saved" });
    } catch (err) {
      res.status(500).send({ message: "Failed to save studio" });
    }
  });

  // DELETE /api/wishlist/:studioId  (remove)
  router.delete("/:studioId", verifyToken, async (req, res) => {
    try {
      await wishlist.deleteOne({ userEmail: req.user.email, studioId: req.params.studioId });
      res.send({ message: "Removed" });
    } catch (err) {
      res.status(500).send({ message: "Failed to remove studio" });
    }
  });

  return router;
};