const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  createSprint,
  getSprintCompletion,
  deleteSprint
} = require('../controllers/sprintController');

const router = express.Router();

router.post('/', authMiddleware, createSprint);

// GET sprint completion
router.get('/:id/completion', authMiddleware, getSprintCompletion);

router.delete('/:id', authMiddleware, deleteSprint);

module.exports = router;