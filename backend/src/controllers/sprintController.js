const prisma = require('../config/prisma');

const createSprint = async (req, res) => {
  try {
    const { name, startDate, endDate, projectId } = req.body;

    if (!name || !startDate || !endDate || !projectId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const sprint = await prisma.sprint.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        projectId: Number(projectId)
      }
    });

    res.status(201).json({
      message: 'Sprint created successfully',
      sprint
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteSprint = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.task.updateMany({
      where: { sprintId: Number(id) },
      data: { sprintId: null }
    });

    await prisma.sprint.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Sprint deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createSprint,
  deleteSprint
};