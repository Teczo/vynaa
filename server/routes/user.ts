import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
    getMe,
    updateMe,
    exportData,
    deleteAccount
} from '../controllers/userController';

const router = express.Router();

router.use(protect); // All routes below are protected

router.get('/me', getMe);
router.patch('/me', updateMe);
router.post('/export', exportData);
router.delete('/me', deleteAccount);

export default router;
