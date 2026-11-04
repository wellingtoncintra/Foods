import { z } from 'zod';
import { dataValida } from '../lib/periodo.js';

const data = (rotulo) => z.string().refine(dataValida, `${rotulo} deve ser uma data válida no formato AAAA-MM-DD.`).optional();

// Query de GET /api/dashboard (sem datas = "Tudo")
export const dashboardQuery = z
  .object({
    inicio: data('Data inicial'),
    fim: data('Data final'),
  })
  .refine((q) => !q.inicio || !q.fim || q.inicio <= q.fim, {
    message: 'A data inicial não pode ser posterior à data final.',
    path: ['inicio'],
  });
