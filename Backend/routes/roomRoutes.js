const express = require('express');
const router = express.Router();
const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
} = require('../controllers/roomController');

// Route for /api/rooms
router.route('/')
  .get(getRooms)
  .post(createRoom);

// Route for /api/rooms/:id
router.route('/:id')
  .get(getRoomById)
  .put(updateRoom)
  .delete(deleteRoom);

module.exports = router;
