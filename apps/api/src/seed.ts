import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Read routes from web's mock data
  const mockDataPath = path.resolve(__dirname, '../../web/src/api/mock/routes.json');
  if (!fs.existsSync(mockDataPath)) {
    console.error('Mock data file not found at:', mockDataPath);
    process.exit(1);
  }

  const rawData = fs.readFileSync(mockDataPath, 'utf-8');
  const routes = JSON.parse(rawData);

  for (const route of routes) {
    await prisma.route.create({
      data: {
        name: route.name,
        vehicle: route.vehicle,
        type: route.type,
        duration: route.duration,
        icon: route.icon,
        color: route.color,
        confirmations: route.confirmations || 0,
        isVerified: route.isVerified || true,
        stops: route.stops,
      }
    });
  }
  
  console.log(`Seeded ${routes.length} routes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
