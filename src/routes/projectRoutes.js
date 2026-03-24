const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  createProject,
  joinProject,
  getMyProjects
} = require('../controllers/projectController');

const router = express.Router();

router.post('/', authMiddleware, createProject);
router.post('/join', authMiddleware, joinProject);
router.get('/my', authMiddleware, getMyProjects);

module.exports = router;