import { z } from 'zod';

export const contributionSchema = z.object({
  route_name: z.string().min(1),
  vehicle: z.enum(['danfo', 'brt', 'keke', 'okada', 'ferry', 'uber']),
  stops_data: z.array(z.object({
    name: z.string().min(1),
    fare_from_previous: z.number().min(0),
  })).min(2),
  notes: z.string().optional(),
});
