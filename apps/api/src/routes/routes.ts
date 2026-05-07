import { Router } from 'express';
import { prisma } from '../db/prisma';

export const routesRouter = Router();

routesRouter.get('/', async (req, res) => {
  try {
    const { vehicle, q } = req.query;
    
    let where: any = {};
    if (vehicle && vehicle !== 'all') {
      where.vehicle = vehicle;
    }
    
    if (q && typeof q === 'string') {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        // Ideally we'd search in JSONB but this matches simple string match
      ];
    }

    const routes = await prisma.route.findMany({ where });
    res.json({ data: routes, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message }, data: null });
  }
});

routesRouter.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid ID' }, data: null });
    }

    const route = await prisma.route.findUnique({ where: { id } });
    if (!route) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' }, data: null });
    }

    res.json({ data: route, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message }, data: null });
  }
});
