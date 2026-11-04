import { z } from 'zod';

export const TIPOS_PREPARO = ['PROTEINA', 'ACOMPANHAMENTO'];

// Corpo de POST /api/preparos e PUT /api/preparos/:id
export const preparoBody = z.object({
  nome: z
    .string({ error: 'Nome é obrigatório.' })
    .trim()
    .min(1, 'Nome é obrigatório.')
    .max(100, 'Nome deve ter no máximo 100 caracteres.'),
  tipo: z.enum(TIPOS_PREPARO, { error: 'Tipo inválido. Use PROTEINA ou ACOMPANHAMENTO.' }),
});

// Query de GET /api/preparos
export const preparoQuery = z.object({
  ativo: z
    .enum(['true', 'false'], { error: 'Filtro "ativo" deve ser true ou false.' })
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  tipo: z.enum(TIPOS_PREPARO, { error: 'Filtro "tipo" inválido.' }).optional(),
});
