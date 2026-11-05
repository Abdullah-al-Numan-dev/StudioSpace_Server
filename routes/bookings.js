const express = require("express");
const { ObjectId } = require("mongodb");
const verifyToken = require("../middleware/verifyToken");

const toMinutes = (t) => {
  const m = /^(\d{2}):(\d{2})$/.exec(t || "");
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
};

module.exports = (db) => {
  const router = express.Router();
  const bookings = db.collection("bookings");
  const studios = db.collection("studios");

  // Finds a Confirmed booking on the same studio and date that overlaps the range.
  // Two ranges overlap when each one starts before the other ends.
  const findConflict = (studioId, date, startMinutes, endMinutes, excludeId) => {
    const query = {
      studioId,
      date,
      status: "Confirmed",
      startMinutes: { $lt: endMinutes },
      endMinutes: { $gt: startMinutes },
    };
    if (excludeId) query._id = { $ne: excludeId };
    return bookings.findOne(query);
  };

  const conflictMessage = (c) =>
    `This studio is already booked from ${c.startTime} to ${c.endTime} on ${c.date}. Please choose another time.`;

  // POST /api/bookings
  router.post("/", verifyToken, async (req, res) => {
    try {
      const { studioId, date, startTime, endTime, guests, notes } = req.body;

      if (!ObjectId.isValid(studioId)) {
        return res.status(400).send({ message: "Invalid studio" });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
        return res.status(400).send({ message: "Please choose a valid date" });
      }
      // Allow one day of slack so users in other timezones aren't rejected
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      if (date < yesterday) {
        return res.status(400).send({ message: "You can't book a date in the past" });
      }

      const startMinutes = toMinutes(startTime);
      const endMinutes = toMinutes(endTime);
      if (startMinutes === null || endMinutes === null) {
        return res.status(400).send({ message: "Please choose a start and end time" });
      }
      if (endMinutes <= startMinutes) {
        return res.status(400).send({ message: "End time must be after start time" });
      }
      if (endMinutes - startMinutes < 60) {
        return res.status(400).send({ message: "The minimum booking is one hour" });
      }

      const studio = await studios.findOne({ _id: new ObjectId(studioId) });
      if (!studio) return res.status(404).send({ message: "Studio not found" });
      if (studio.ownerEmail === req.user.email) {
        return res.status(403).send({ message: "You can't book your own studio" });
      }

      const guestCount = Number(guests) || 1;
      if (guestCount < 1 || guestCount > studio.maxCapacity) {
        return res
          .status(400)
          .send({ message: `This studio holds up to ${studio.maxCapacity} people` });
      }

      const conflict = await findConflict(studioId, date, startMinutes, endMinutes);
      if (conflict) {
        return res.status(409).send({ message: conflictMessage(conflict) });
      }

      const hours = (endMinutes - startMinutes) / 60;
      const doc = {
        studioId,
        studioTitle: studio.title,
        studioImage: studio.image,
        ownerEmail: studio.ownerEmail,
        userName: req.user.name,
        userEmail: req.user.email,
        date,
        startTime,
        endTime,
        startMinutes,
        endMinutes,
        hours,
        guests: guestCount,
        notes: String(notes || "").slice(0, 500),
        hourlyRate: studio.hourlyRate,
        totalPrice: Math.round(hours * studio.hourlyRate * 100) / 100,
        securityDeposit: studio.securityDeposit,
        status: "Pending",
        createdAt: new Date(),
      };
      const result = await bookings.insertOne(doc);
      res.status(201).send({ insertedId: result.insertedId });
    } catch (err) {
      res.status(500).send({ message: "Failed to create booking" });
    }
  });

  // GET /api/bookings/mine  (reservations I made)
  router.get("/mine", verifyToken, async (req, res) => {
    try {
      const list = await bookings
        .find({ userEmail: req.user.email })
        .sort({ createdAt: -1 })
        .toArray();
      res.send(list);
    } catch (err) {
      res.status(500).send({ message: "Failed to load your bookings" });
    }
  });

  // GET /api/bookings/host  (requests for studios I own)
  router.get("/host", verifyToken, async (req, res) => {
    try {
      const list = await bookings
        .find({ ownerEmail: req.user.email })
        .sort({ createdAt: -1 })
        .toArray();
      res.send(list);
    } catch (err) {
      res.status(500).send({ message: "Failed to load booking requests" });
    }
  });

  // PATCH /api/bookings/:id/cancel  (the guest cancels a Pending booking)
  router.patch("/:id/cancel", verifyToken, async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).send({ message: "Invalid booking id" });
      }
      const filter = { _id: new ObjectId(req.params.id) };
      const booking = await bookings.findOne(filter);
      if (!booking) return res.status(404).send({ message: "Booking not found" });
      if (booking.userEmail !== req.user.email) {
        return res.status(403).send({ message: "You can only cancel your own bookings" });
      }
      if (booking.status !== "Pending") {
        return res.status(400).send({ message: "Only pending bookings can be cancelled" });
      }
      await bookings.updateOne(filter, { $set: { status: "Cancelled" } });
      res.send({ message: "Booking cancelled" });
    } catch (err) {
      res.status(500).send({ message: "Failed to cancel booking" });
    }
  });

  // PATCH /api/bookings/:id/status  (the host confirms, declines or completes)
  const transitions = {
    Pending: ["Confirmed", "Cancelled"],
    Confirmed: ["Completed", "Cancelled"],
  };

  router.patch("/:id/status", verifyToken, async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).send({ message: "Invalid booking id" });
      }
      const { status } = req.body;
      const filter = { _id: new ObjectId(req.params.id) };
      const booking = await bookings.findOne(filter);
      if (!booking) return res.status(404).send({ message: "Booking not found" });
      if (booking.ownerEmail !== req.user.email) {
        return res.status(403).send({ message: "Only the studio host can change this booking" });
      }
      if (!transitions[booking.status]?.includes(status)) {
        return res
          .status(400)
          .send({ message: `A ${booking.status.toLowerCase()} booking can't become ${String(status).toLowerCase()}` });
      }

      // Re-check the overlap before confirming, in case another booking was confirmed first
      if (status === "Confirmed") {
        const conflict = await findConflict(
          booking.studioId,
          booking.date,
          booking.startMinutes,
          booking.endMinutes,
          booking._id
        );
        if (conflict) {
          return res.status(409).send({ message: conflictMessage(conflict) });
        }
      }

      await bookings.updateOne(filter, { $set: { status } });
      res.send({ message: `Booking ${status.toLowerCase()}` });
    } catch (err) {
      res.status(500).send({ message: "Failed to update booking" });
    }
  });

  return router;
};