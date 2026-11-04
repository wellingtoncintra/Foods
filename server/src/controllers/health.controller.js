import { prisma } from '../lib/prisma.js';

// GET /api/health — verifica o servidor e a conexão com o banco.
export async function verificarSaude(req, res) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', banco: 'conectado', horario: new Date().toISOString() });
  } catch (err) {
    console.error('Falha ao conectar no banco:', err.message);
    res.status(503).json({ status: 'erro', banco: 'desconectado', horario: new Date().toISOString() });
  }
}
