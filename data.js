const { v4: uuidv4 } = require("uuid");

// 1 Event
const events = [
  {
    id: "event1",
    name: "Live Concert",
  },
];

// Create 5x5 seats
const seats = {};
for (let i = 1; i <= 5; i++) {
  for (let j = 1; j <= 5; j++) {
    const seatId = `${String.fromCharCode(64 + i)}${j}`;
    seats[seatId] = {
      id: seatId,
      booked: false,
    };
  }
}

// Locks
const seatLocks = {}; 
// Example: { A1: { userId: "123", expiresAt: 123456 } }

// Bookings
const bookings = [];

module.exports = {
  events,
  seats,
  seatLocks,
  bookings,
};