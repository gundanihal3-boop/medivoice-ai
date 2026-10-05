import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { initDatabase } from './db/database';
import { seedDatabase } from './db/seed';
import apiRoutes from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Initialize Database Schema
initDatabase();

// Seed initial demo data
try {
  seedDatabase();
} catch (e: any) {
  console.log('Database already initialized or seeded:', e.message);
}

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'MediVoice AI Server',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', apiRoutes);

// Serve static React build files if client dist exists
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log('📁 Serving static frontend client build from:', clientDistPath);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 MediVoice AI Unified App running on http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
});
