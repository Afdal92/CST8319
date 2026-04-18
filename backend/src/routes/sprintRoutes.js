const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  createSprint,
  getProjectSprints,
  updateSprint,
  getSprintCompletion,
  deleteSprint
} = require('../controllers/sprintController');

const router = express.Router();

router.post('/', authMiddleware, createSprint);
router.get('/project/:projectId', authMiddleware, getProjectSprints);
router.patch('/:id', authMiddleware, updateSprint);

// GET sprint completion
router.get('/:id/completion', authMiddleware, getSprintCompletion);

router.delete('/:id', authMiddleware, deleteSprint);

module.exports = router;