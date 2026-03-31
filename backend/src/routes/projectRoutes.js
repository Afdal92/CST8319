const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  createProject,
  joinProject,
  getMyProjects,
  updateProject,
  addProjectMember,
  deleteProject
} = require('../controllers/projectController');

const router = express.Router();

router.post('/', authMiddleware, createProject);
router.post('/join', authMiddleware, joinProject);
router.get('/my', authMiddleware, getMyProjects);

// UPDATE project
router.patch('/:id', authMiddleware, updateProject);

// ADD member to project
router.post('/:id/members', authMiddleware, addProjectMember);

// DELETE project
router.delete('/:id', authMiddleware, deleteProject);

module.exports = router;