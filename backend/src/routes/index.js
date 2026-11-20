const express = require('express');
const router = express.Router();

const roomRoutes = require('./room.routes');
const bookingRoutes = require('./booking.routes');

router.use('/', roomRoutes);
router.use('/', bookingRoutes);

module.exports = router;
