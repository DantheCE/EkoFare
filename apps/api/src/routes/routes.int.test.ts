import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../app';
import { prisma, resetDb } from '../test/db';

const app = createApp();
const ADMIN_EMAIL = 'admin@test.dev';
const ADMIN_PASSWORD = 'sup3r-secret-pw';

async function adminToken(): Promise<string> {
  const res = await request(app).post('/admin/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  expect(res.status).toBe(200);
  return res.body.token as string;
}

beforeAll(async () => {
  await prisma.adminUser.deleteMany({ where: { email: ADMIN_EMAIL } });
  await prisma.adminUser.create({
    data: { email: ADMIN_EMAIL, password_hash: bcrypt.hashSync(ADMIN_PASSWORD, 8) },
  });
});

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.adminUser.deleteMany({ where: { email: ADMIN_EMAIL } });
});

describe('GET /routes/queue', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/routes/queue');
    expect(res.status).toBe(401);
  });

  it('allows authenticated admins to view the queue', async () => {
    // Seed some unverified connections
    const from = await prisma.stop.create({ data: { name: 'Stop A', name_normalized: 'stop a' } });
    const to = await prisma.stop.create({ data: { name: 'Stop B', name_normalized: 'stop b' } });
    await prisma.connection.create({
      data: {
        from_stop_id: from.id,
        to_stop_id: to.id,
        vehicle: 'DANFO',
        median_fare: 100,
        status: 'UNVERIFIED',
      },
    });

    const token = await adminToken();
    const res = await request(app)
      .get('/routes/queue')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.queue).toHaveLength(1);
    expect(res.body.queue[0].from_stop.name).toBe('Stop A');
    expect(res.body.queue[0].to_stop.name).toBe('Stop B');
  });
});
