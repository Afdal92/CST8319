const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { createSprint } = require('../controllers/sprintController');

const router = express.Router();

router.post('/', authMiddleware, createSprint);

module.exports = router;