import { z } from 'zod';
import { valorMonetario } from './comuns.js';

export const TIPOS_PRODUTO = ['MARMITA', 'PRATO', 'BEBIDA', 'OUTRO'];

// Corpo de POST /api/produtos e PUT /api/produtos/:id
export const produtoBody = z.object({
  nome: z
    .string({ error: 'Nome é obrigatório.' })
    .trim()
    .min(1, 'Nome é obrigatório.')
    .max(100, 'Nome deve ter no máximo 100 caracteres.'),
  tipo: z.enum(TIPOS_PRODUTO, { error: 'Tipo inválido. Use MARMITA, PRATO, BEBIDA ou OUTRO.' }),
  precoVenda: valorMonetario('Preço de venda').refine((v) => Number(v) > 0, 'Preço de venda deve ser maior que zero.'),
  custoMedio: valorMonetario('Custo médio'),
  descricao: z
    .string()
    .trim()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres.')
    .nullish()
    .transform((v) => (v ? v : null)),
});

// Query de GET /api/produtos
export const produtoQuery = z.object({
  ativo: z
    .enum(['true', 'false'], { error: 'Filtro "ativo" deve ser true ou false.' })
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  tipo: z.enum(TIPOS_PRODUTO, { error: 'Filtro "tipo" inválido.' }).optional(),
});

// Corpo de PATCH /api/produtos/:id/situacao
export const situacaoBody = z.object({
  ativo: z.boolean({ error: 'Informe "ativo" como true ou false.' }),
});
