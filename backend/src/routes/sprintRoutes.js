const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { createSprint, deleteSprint } = require('../controllers/sprintController');

const router = express.Router();

router.post('/', authMiddleware, createSprint);
router.delete('/:id', authMiddleware, deleteSprint);

module.exports = router;