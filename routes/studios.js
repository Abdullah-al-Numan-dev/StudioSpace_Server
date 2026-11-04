const express = require("express");
const { ObjectId } = require("mongodb");

module.exports = (db) => {
  const router = express.Router();
  const studios = db.collection("studios");

  // GET /api/studios  (search, category filter, sort, price range)
  router.get("/", async (req, res) => {
    try {
      const { search, category, sort, minPrice, maxPrice, limit } = req.query;
      const query = {};

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
        ];
      }
      if (category && category !== "All") query.category = category;
      if (minPrice || maxPrice) {
        query.hourlyRate = {};
        if (minPrice) query.hourlyRate.$gte = Number(minPrice);
        if (maxPrice) query.hourlyRate.$lte = Number(maxPrice);
      }

      let sortOption = { createdAt: -1 };
      if (sort === "price-asc") sortOption = { hourlyRate: 1 };
      if (sort === "price-desc") sortOption = { hourlyRate: -1 };
      if (sort === "rating") sortOption = { rating: -1 };

      let cursor = studios.find(query).sort(sortOption);
      if (limit) cursor = cursor.limit(Number(limit));

      res.send(await cursor.toArray());
    } catch (err) {
      res.status(500).send({ message: "Failed to load studios" });
    }
  });

  // GET /api/studios/:id
  router.get("/:id", async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).send({ message: "Invalid studio id" });
      }
      const studio = await studios.findOne({ _id: new ObjectId(req.params.id) });
      if (!studio) return res.status(404).send({ message: "Studio not found" });
      res.send(studio);
    } catch (err) {
      res.status(500).send({ message: "Failed to load studio" });
    }
  });

  return router;
};