import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename), '../../');
const DB_URL = process.env.DATABASE_URL;

app.use(cors({ origin:['http://localhost:3000', 'http://127.0.0.1:3000'] }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.static(path.join(__dirname, 'backend', 'src' , 'public')));

app.get('/', (req: Request, res: Response)=>{
    res.sendFile(path.join(__dirname, 'frontend', 'homepage', 'index.html'));
});


//Routes 
import eventRoutes from './routes/event.routes.js';
app.use('/event', eventRoutes);

import userRoutes from './routes/auth.routes.js';
app.use('/auth', userRoutes);

import eoRoutes from './routes/eo.routes.js';
app.use('/eo', eoRoutes);

import adminRoutes from './routes/admin.routes.js';
app.use('/admin', adminRoutes);



app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});