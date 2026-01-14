import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', process.env.VITE_APP_URL || ''],
    credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 audio
app.use(cookieParser());

// Database Connection
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            console.error('MONGODB_URI is not defined in .env.local');
            process.exit(1);
        }
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};

// Placeholder Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Import Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import projectRoutes from './routes/projects';
import conversationRoutes from './routes/conversations';
import searchRoutes from './routes/search';
import { protect } from './middleware/authMiddleware';

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/projects', protect, projectRoutes);
app.use('/api/conversations', protect, conversationRoutes);
app.use('/api/search', protect, searchRoutes);

// Start Server
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
