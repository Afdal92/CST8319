const prisma = require('../config/prisma');

const generateJoinCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const joinCode = generateJoinCode();

    const project = await prisma.project.create({
      data: {
        name,
        description,
        joinCode,
        ownerUserId: req.user.id,
        members: {
          create: {
            userId: req.user.id,
            role: 'OWNER'
          }
        }
      }
    });

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const joinProject = async (req, res) => {
  try {
    const { joinCode } = req.body;

    const project = await prisma.project.findUnique({
      where: { joinCode }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const existingMembership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: req.user.id,
          projectId: project.id
        }
      }
    });

    if (existingMembership) {
      return res.status(400).json({ message: 'You are already a member of this project' });
    }

    await prisma.projectMember.create({
      data: {
        userId: req.user.id,
        projectId: project.id,
        role: 'MEMBER'
      }
    });

    res.json({ message: 'Joined project successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyProjects = async (req, res) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        project: true
      }
    });

    const projects = memberships.map((membership) => membership.project);

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: Number(id) }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.ownerUserId !== req.user.id) {
      return res.status(403).json({ message: 'Only the project owner can delete this project' });
    }

    await prisma.projectMember.deleteMany({
      where: { projectId: Number(id) }
    });

    await prisma.task.deleteMany({
      where: { projectId: Number(id) }
    });

    await prisma.sprint.deleteMany({
      where: { projectId: Number(id) }
    });

    await prisma.project.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createProject,
  joinProject,
  getMyProjects,
  deleteProject
};