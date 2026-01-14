import { Request, Response, NextFunction } from 'express';

export const validateTurnInput = (req: Request, res: Response, next: NextFunction) => {
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: 'Content is required' });
    }

    if (content.length > 10000) {
        return res.status(400).json({ error: 'Content too long (max 10000 characters)' });
    }

    next();
};

export const validateSessionInput = (req: Request, res: Response, next: NextFunction) => {
    const { title } = req.body;

    if (title && typeof title !== 'string') {
        return res.status(400).json({ error: 'Title must be a string' });
    }

    next();
};