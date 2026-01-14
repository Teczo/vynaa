import express from 'express';
import Project from '../models/Project';
import Conversation from '../models/Conversation';
import { IProject } from '../models/Project';

const router = express.Router();

// GET /api/projects - List all projects
router.get('/', async (req: any, res) => {
    try {
        const userId = req.user?.id; // Assuming auth middleware populates this
        // Also fetch "Ungrouped" conversations count?
        // For now, just return projects.
        const projects = await Project.find({ ownerId: userId }).sort({ order: 1, createdAt: 1 });
        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// POST /api/projects - Create a new project
router.post('/', async (req: any, res) => {
    try {
        const userId = req.user?.id;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        const project = new Project({
            ownerId: userId,
            name,
            order: await Project.countDocuments({ ownerId: userId }) // Append to end
        });

        await project.save();
        res.status(201).json(project);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// PATCH /api/projects/:id - Rename or Reorder
router.patch('/:id', async (req: any, res) => {
    try {
        const { id } = req.params;
        const { name, order, isExpanded } = req.body;
        const userId = req.user?.id;

        const update: any = {};
        if (name !== undefined) update.name = name;
        if (order !== undefined) update.order = order;
        if (isExpanded !== undefined) update.isExpanded = isExpanded;

        const project = await Project.findOneAndUpdate(
            { _id: id, ownerId: userId },
            { $set: update },
            { new: true }
        );

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json(project);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// DELETE /api/projects/:id - Delete project (Safe or Hard)
router.delete('/:id', async (req: any, res) => {
    try {
        const { id } = req.params;
        const { mode } = req.query; // 'soft' (default) or 'hard'
        const userId = req.user?.id;

        const project = await Project.findOne({ _id: id, ownerId: userId });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (mode === 'hard') {
            // Delete all conversations in this project
            await Conversation.deleteMany({ projectId: id });
        } else {
            // Move conversations to "Ungrouped" (null projectId)
            await Conversation.updateMany(
                { projectId: id },
                { $set: { projectId: null } }
            );
        }

        await project.deleteOne();
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

export default router;
