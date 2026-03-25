const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  createTask,
  updateTaskStatus,
  getProjectTasks,
  deleteTask
} = require('../controllers/taskController');

const router = express.Router();

router.post('/', authMiddleware, createTask);
router.patch('/:id/status', authMiddleware, updateTaskStatus);
router.get('/project/:projectId', authMiddleware, getProjectTasks);
router.delete('/:id', authMiddleware, deleteTask);

module.exports = router;