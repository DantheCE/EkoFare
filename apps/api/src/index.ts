import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { routesRouter } from './routes/routes';
import { contributionsRouter } from './routes/contributions';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/routes', routesRouter);
app.use('/api/contributions', contributionsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
