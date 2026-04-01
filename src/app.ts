import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', async (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
});

// API routes (to be mounted as modules are built)
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/records', recordRoutes);
// app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

// Global error handler
app.use(errorHandler);

export default app;
