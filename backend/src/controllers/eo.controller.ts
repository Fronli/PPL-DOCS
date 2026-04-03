import type {Request, Response} from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../db/primsa.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename), '../../../');

export const getEOdashboard = async (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'frontend', 'eopage', 'index.html'));
}
