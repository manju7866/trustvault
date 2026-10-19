import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';

const app = express();

// Standard middleware configuration profiles
app.use(cors());
app.use(express.json());

// Application Routing Entry Points
app.use('/api/auth', authRoutes);

// Base status monitoring health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'UP', secure_ledger: true, timestamp: new Date() });
});

export { app };
