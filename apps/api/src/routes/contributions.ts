import { Router } from 'express';
import { prisma } from '../db/prisma';
import { contributionSchema } from '../schemas';
import { z } from 'zod';

export const contributionsRouter = Router();

const THRESHOLD = parseInt(process.env.VERIFICATION_THRESHOLD || '3', 10);

contributionsRouter.post('/', async (req, res) => {
  try {
    const data = contributionSchema.parse(req.body);
    const contribution = await prisma.contribution.create({
      data: {
        route_name: data.route_name,
        vehicle: data.vehicle,
        stops_data: data.stops_data as any,
        notes: data.notes,
        status: 'pending',
        votedBy: [],
      },
    });
    res.status(201).json({ data: contribution, error: null });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'INVALID', fields: error.flatten().fieldErrors }, data: null });
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message }, data: null });
  }
});

contributionsRouter.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let where: any = {};
    if (status) where.status = status;
    const contributions = await prisma.contribution.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json({ data: contributions, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message }, data: null });
  }
});

contributionsRouter.post('/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    // In real app we get deviceId from header/body
    // For now we just increment without checking deviceId to simplify since it's an MVP without auth
    let contribution = await prisma.contribution.findUnique({ where: { id } });
    if (!contribution) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' }, data: null });
    }

    const confirmations = contribution.confirmations + 1;
    const isVerified = confirmations >= THRESHOLD;
    
    contribution = await prisma.contribution.update({
      where: { id },
      data: {
        confirmations,
        status: isVerified ? 'verified' : contribution.status,
      },
    });

    if (isVerified && contribution.status === 'verified') {
      // promote to verified routes list
      // basic mapping
      const stops_data = contribution.stops_data as any[];
      const stops = stops_data.map((s) => ({
        name: s.name,
        legFare: s.fare_from_previous
      }));
      let color = '#2DA574'; // fallback
      let icon = contribution.vehicle;

      await prisma.route.create({
        data: {
          name: contribution.route_name,
          vehicle: contribution.vehicle,
          type: 'community',
          duration: stops.length * 5,
          icon,
          color,
          confirmations: contribution.confirmations,
          isVerified: true,
          stops,
        }
      });
    }

    res.json({ data: { success: true, confirmations, isVerified }, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message }, data: null });
  }
});

contributionsRouter.post('/:id/dispute', async (req, res) => {
  try {
    const { id } = req.params;
    let contribution = await prisma.contribution.findUnique({ where: { id } });
    if (!contribution) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' }, data: null });
    }

    const disputes = contribution.disputes + 1;
    const isRejected = disputes >= THRESHOLD;

    await prisma.contribution.update({
      where: { id },
      data: {
        disputes,
        status: isRejected ? 'rejected' : contribution.status,
      },
    });

    res.json({ data: { success: true, confirmations: contribution.confirmations, isVerified: false }, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message }, data: null });
  }
});
