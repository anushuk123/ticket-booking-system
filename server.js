const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

const { events, seats, seatLocks, bookings } = require("./data");

// ⏱️ CLEANUP expired locks every 5 sec
setInterval(() => {
  const now = Date.now();
  for (let seatId in seatLocks) {
    if (seatLocks[seatId].expiresAt < now) {
      delete seatLocks[seatId];
      console.log(`Lock expired for ${seatId}`);
    }
  }
}, 5000);

// 📌 GET EVENTS
app.get("/events", (req, res) => {
  res.json(events);
});

// 📌 GET SEATS
app.get("/seats", (req, res) => {
  const now = Date.now();

  const result = Object.values(seats).map((seat) => {
    let status = "available";

    if (seat.booked) status = "booked";
    else if (
      seatLocks[seat.id] &&
      seatLocks[seat.id].expiresAt > now
    ) {
      status = "locked";
    }

    return {
      ...seat,
      status,
    };
  });

  res.json(result);
});

// 🔒 LOCK SEAT
app.post("/lock-seat", (req, res) => {
  const { seatId, userId } = req.body;

  if (!seats[seatId]) {
    return res.status(400).json({ error: "Invalid seat" });
  }

  if (seats[seatId].booked) {
    return res.status(400).json({ error: "Already booked" });
  }

  const existingLock = seatLocks[seatId];
  const now = Date.now();

  if (existingLock && existingLock.expiresAt > now) {
    return res.status(400).json({ error: "Seat already locked" });
  }

  // Lock for 2 minutes
  seatLocks[seatId] = {
    userId,
    expiresAt: now + 2 * 60 * 1000,
  };

  res.json({ message: "Seat locked" });
});

// 🔓 RELEASE SEAT
app.post("/release-seat", (req, res) => {
  const { seatId, userId } = req.body;

  const lock = seatLocks[seatId];

  if (lock && lock.userId === userId) {
    delete seatLocks[seatId];
    return res.json({ message: "Seat released" });
  }

  res.status(400).json({ error: "Cannot release" });
});

// 🎟️ BOOK SEAT
app.post("/book", (req, res) => {
  const { seatId, userId } = req.body;

  const lock = seatLocks[seatId];

  if (!lock || lock.userId !== userId) {
    return res.status(400).json({ error: "Seat not locked by you" });
  }

  // Confirm booking
  seats[seatId].booked = true;

  // Remove lock
  delete seatLocks[seatId];

  const booking = {
    id: uuidv4(),
    seatId,
    userId,
    time: new Date(),
  };

  bookings.push(booking);

  res.json({
    message: "Booking confirmed",
    booking,
  });
});

// 📌 BOOKINGS (ADMIN)
app.get("/bookings", (req, res) => {
  res.json(bookings);
});

// 🚀 START SERVER
app.listen(3000, () => {
  console.log("Server running on port 3000");
});