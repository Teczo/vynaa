import './loadEnv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

// Env vars are now loaded by ./loadEnv import above


// Validate critical environment variables
if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not defined in .env.local');
    console.error('   Please ensure .env.local contains: GEMINI_API_KEY=your_api_key_here');
    process.exit(1);
}
console.log('✅ GEMINI_API_KEY loaded successfully');

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import projectRoutes from './routes/projects';
import conversationRoutes from './routes/conversations';
import searchRoutes from './routes/search';
import sessionRoutes from './routes/sessions';
import turnRoutes from './routes/turns';
import { protect } from './middleware/authMiddleware';
import ttsRoutes from './routes/tts';

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
// Database Connection
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            console.error('❌ MONGODB_URI is not defined in .env.local');
            process.exit(1);
        }

        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB Connected');

        // Mongoose will automatically create indexes defined in schemas
        // on the first operation for each model
        console.log('ℹ️  Database indexes will be created automatically');

    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    }
};

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/projects', protect, projectRoutes);
app.use('/api/conversations', protect, conversationRoutes); // Keep for backward compatibility
app.use('/api/search', protect, searchRoutes);

// New normalized schema routes
app.use('/api/sessions', protect, sessionRoutes);
app.use('/api/sessions', protect, turnRoutes);

app.use('/api/tts', protect, ttsRoutes);

// Error handling middleware (add at the end)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start Server
const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log('\n🚀 Vynaa AI Server');
        console.log(`📡 Server: http://localhost:${PORT}`);
        console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    process.exit(1);
});

startServer();