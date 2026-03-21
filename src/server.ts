import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_URL = process.env.DATABASE_URL;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req: Request, res: Response)=>{
    res.sendFile(path.join(__dirname, 'public', 'homepage', 'index.html'));
});



//Testing API
app.get('/test', (req: Request, res: Response)=>{
    res.send('kocak lu!');
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});