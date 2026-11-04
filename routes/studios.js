const express = require("express");
const { ObjectId } = require("mongodb");
const verifyToken = require("../middleware/verifyToken");

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

  // GET /api/studios/mine/list  (the logged-in user's listings)
  router.get("/mine/list", verifyToken, async (req, res) => {
    try {
      const list = await studios
        .find({ ownerEmail: req.user.email })
        .sort({ createdAt: -1 })
        .toArray();
      res.send(list);
    } catch (err) {
      res.status(500).send({ message: "Failed to load your listings" });
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

  // POST /api/studios
  router.post("/", verifyToken, async (req, res) => {
    try {
      const b = req.body;
      if (!b.title || !b.category || !b.hourlyRate || !b.location || !b.image) {
        return res.status(400).send({ message: "Please fill in all required fields" });
      }
      const doc = {
        title: String(b.title).trim(),
        category: b.category,
        hourlyRate: Number(b.hourlyRate),
        securityDeposit: Number(b.securityDeposit) || 0,
        maxCapacity: Number(b.maxCapacity) || 1,
        location: String(b.location).trim(),
        image: b.image,
        gallery: Array.isArray(b.gallery) && b.gallery.length ? b.gallery : [b.image],
        amenities: Array.isArray(b.amenities) ? b.amenities : [],
        overview: b.overview || "",
        rating: 0,
        reviews: [],
        ownerName: req.user.name,
        ownerEmail: req.user.email,
        createdAt: new Date(),
      };
      const result = await studios.insertOne(doc);
      res.status(201).send({ insertedId: result.insertedId });
    } catch (err) {
      res.status(500).send({ message: "Failed to create studio" });
    }
  });

  // PATCH /api/studios/:id  (owner only)
  router.patch("/:id", verifyToken, async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).send({ message: "Invalid studio id" });
      }
      const filter = { _id: new ObjectId(req.params.id) };
      const existing = await studios.findOne(filter);
      if (!existing) return res.status(404).send({ message: "Studio not found" });
      if (existing.ownerEmail !== req.user.email) {
        return res.status(403).send({ message: "You can only edit your own listings" });
      }

      const b = req.body;
      const update = {
        title: b.title,
        category: b.category,
        hourlyRate: Number(b.hourlyRate),
        securityDeposit: Number(b.securityDeposit) || 0,
        maxCapacity: Number(b.maxCapacity) || 1,
        location: b.location,
        image: b.image,
        gallery: Array.isArray(b.gallery) && b.gallery.length ? b.gallery : [b.image],
        amenities: Array.isArray(b.amenities) ? b.amenities : [],
        overview: b.overview || "",
      };
      await studios.updateOne(filter, { $set: update });
      res.send({ message: "Studio updated" });
    } catch (err) {
      res.status(500).send({ message: "Failed to update studio" });
    }
  });

  // DELETE /api/studios/:id  (owner only)
  router.delete("/:id", verifyToken, async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).send({ message: "Invalid studio id" });
      }
      const filter = { _id: new ObjectId(req.params.id) };
      const existing = await studios.findOne(filter);
      if (!existing) return res.status(404).send({ message: "Studio not found" });
      if (existing.ownerEmail !== req.user.email) {
        return res.status(403).send({ message: "You can only delete your own listings" });
      }
      await studios.deleteOne(filter);
      res.send({ message: "Studio deleted" });
    } catch (err) {
      res.status(500).send({ message: "Failed to delete studio" });
    }
  });

  return router;
};