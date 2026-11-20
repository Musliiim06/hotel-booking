const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');

// GET /api/available-rooms (also aliases /api/rooms/available)
router.get('/available-rooms', roomController.getAvailableRooms);
router.get('/rooms/available', roomController.getAvailableRooms);

module.exports = router;
