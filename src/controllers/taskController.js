const prisma = require('../config/prisma');

const createTask = async (req, res) => {
  try {
    const { title, description, projectId, sprintId, assignedToId, dueDate } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: 'Title and projectId are required' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId: Number(projectId),
        sprintId: sprintId ? Number(sprintId) : null,
        assignedToId: assignedToId ? Number(assignedToId) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: req.user.id
      }
    });

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const task = await prisma.task.update({
      where: { id: Number(id) },
      data: { status }
    });

    res.json({
      message: 'Task status updated successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = await prisma.task.findMany({
      where: {
        projectId: Number(projectId)
      }
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createTask,
  updateTaskStatus,
  getProjectTasks
};