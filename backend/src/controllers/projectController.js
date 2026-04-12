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

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: Number(id) }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.ownerUserId !== req.user.id) {
      return res.status(403).json({ message: 'Only the project owner can update this project' });
    }

    const updatedProject = await prisma.project.update({
      where: { id: Number(id) },
      data: {
        name: name ?? project.name,
        description: description ?? project.description
      }
    });

    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addProjectMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const project = await prisma.project.findUnique({
      where: { id: Number(id) }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.ownerUserId !== req.user.id) {
      return res.status(403).json({ message: 'Only the project owner can add members' });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingMembership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: Number(userId),
          projectId: Number(id)
        }
      }
    });

    if (existingMembership) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }

    const member = await prisma.projectMember.create({
      data: {
        userId: Number(userId),
        projectId: Number(id),
        role: 'MEMBER'
      }
    });

    res.status(201).json({
      message: 'Member added successfully',
      member
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getProjectMembers = async (req, res) => {
  try {
    const { id } = req.params;

    const members = await prisma.projectMember.findMany({
      where: {
        projectId: Number(id)
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(members);
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
  updateProject,
  addProjectMember,
  getProjectMembers,
  deleteProject
};