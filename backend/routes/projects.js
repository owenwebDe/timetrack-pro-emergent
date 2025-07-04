const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const Project = require('../models/Project');
const Task = require('../models/Task');
const TimeEntry = require('../models/TimeEntry');
const { authMiddleware, requireManager } = require('../middleware/auth');

const router = express.Router();

// Get all projects
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    const query = {};
    
    // Filter by user role
    if (req.user.role === 'user') {
      query.members = req.user.id;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };
    
    const projects = await Project.find(query)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);
    
    const total = await Project.countDocuments(query);
    
    res.json({
      projects: projects,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findOne({ id });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if user has access to this project
    if (req.user.role === 'user' && !project.members.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new project
router.post('/', authMiddleware, requireManager, [
  body('name').trim().isLength({ min: 2 }).withMessage('Project name must be at least 2 characters'),
  body('description').optional().trim(),
  body('client').optional().trim(),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date'),
  body('members').optional().isArray().withMessage('Members must be an array'),
  body('budget').optional().isNumeric().withMessage('Budget must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      client,
      status = 'active',
      priority = 'medium',
      budget = 0,
      currency = 'USD',
      startDate,
      endDate,
      members = [],
      tags = [],
      color = '#3B82F6',
      settings = {}
    } = req.body;
    
    const project = new Project({
      id: uuidv4(),
      name,
      description,
      client,
      status,
      priority,
      budget,
      currency,
      startDate,
      endDate,
      manager: req.user.id,
      members,
      tags,
      color,
      settings: {
        trackTime: true,
        trackActivity: true,
        screenshots: true,
        allowManualTime: true,
        ...settings
      },
      createdBy: req.user.id
    });
    
    await project.save();
    
    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update project
router.put('/:id', authMiddleware, requireManager, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Project name must be at least 2 characters'),
  body('description').optional().trim(),
  body('client').optional().trim(),
  body('status').optional().isIn(['active', 'completed', 'paused', 'cancelled']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('budget').optional().isNumeric().withMessage('Budget must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;
    
    const project = await Project.findOneAndUpdate(
      { id },
      updateData,
      { new: true }
    );
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete project
router.delete('/:id', authMiddleware, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findOneAndDelete({ id });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Delete related tasks and time entries
    await Task.deleteMany({ project_id: id });
    await TimeEntry.deleteMany({ project_id: id });
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project tasks
router.get('/:id/tasks', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignee, page = 1, limit = 10 } = req.query;
    
    // Check if project exists and user has access
    const project = await Project.findOne({ id });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (req.user.role === 'user' && !project.members.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const query = { project_id: id };
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by assignee
    if (assignee) {
      query.assignee_id = assignee;
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };
    
    const tasks = await Task.find(query)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);
    
    const total = await Task.countDocuments(query);
    
    res.json({
      tasks,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('Get project tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create task in project
router.post('/:id/tasks', authMiddleware, requireManager, [
  body('title').trim().isLength({ min: 2 }).withMessage('Task title must be at least 2 characters'),
  body('description').optional().trim(),
  body('assignee_id').notEmpty().withMessage('Assignee is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('estimatedHours').optional().isNumeric().withMessage('Estimated hours must be a number'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      title,
      description,
      assignee_id,
      priority = 'medium',
      category,
      tags = [],
      estimatedHours = 0,
      dueDate
    } = req.body;
    
    // Check if project exists
    const project = await Project.findOne({ id });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const task = new Task({
      id: uuidv4(),
      title,
      description,
      project_id: id,
      assignee_id,
      priority,
      category,
      tags,
      estimatedHours,
      dueDate,
      createdBy: req.user.id
    });
    
    await task.save();
    
    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project statistics
router.get('/stats/dashboard', authMiddleware, requireManager, async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({ status: 'active' });
    const completedProjects = await Project.countDocuments({ status: 'completed' });
    
    const projectsByStatus = await Project.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const recentProjects = await Project.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('id name status createdAt');
    
    const taskStats = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      project_stats: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        paused: await Project.countDocuments({ status: 'paused' }),
        cancelled: await Project.countDocuments({ status: 'cancelled' })
      },
      recent_projects: recentProjects,
      task_stats: taskStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;