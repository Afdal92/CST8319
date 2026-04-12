const prisma = require('../config/prisma');

const createTask = async (req, res) => {
  try {
    const { title, description, projectId, sprintId, assignedToId, dueDate } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: 'Title and projectId are required' });
    }

    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (sprintId) {
      const sprint = await prisma.sprint.findUnique({
        where: { id: Number(sprintId) }
      });

      if (!sprint) {
        return res.status(404).json({ message: 'Sprint not found' });
      }
    }

    if (assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: Number(assignedToId) }
      });

      if (!assignedUser) {
        return res.status(404).json({ message: 'Assigned user not found' });
      }
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

    const existingTask = await prisma.task.findUnique({
      where: { id: Number(id) }
    });

    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
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

    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

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

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const existingTask = await prisma.task.findUnique({
      where: { id: Number(id) }
    });

    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createTask,
  updateTaskStatus,
  getProjectTasks,
  deleteTask
};