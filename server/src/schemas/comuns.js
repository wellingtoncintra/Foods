import { z } from 'zod';

// Id numérico vindo da URL (/:id)
export const paramsId = z.object({
  id: z.coerce.number({ error: 'Id inválido.' }).int('Id inválido.').positive('Id inválido.'),
});

// Valor monetário: aceita 18.5, "18.50" ou "18,50". Devolve string normalizada ("18.50"),
// que o Prisma grava como Decimal — nunca passa por float.
// numeric(10,2): até 8 dígitos inteiros e 2 decimais.
export function valorMonetario(rotulo) {
  return z
    .union([z.string(), z.number()], { error: `${rotulo} é obrigatório.` })
    .transform((v) => String(v).trim().replace(',', '.'))
    .refine((v) => v !== '', `${rotulo} é obrigatório.`)
    .refine((v) => /^\d{1,8}(\.\d{1,2})?$/.test(v), `${rotulo} deve ser um valor válido com até 2 casas decimais (ex.: 18,50).`)
    .transform(formatarDuasCasas);
}

// "18" → "18.00", "18.5" → "18.50", "007.10" → "7.10" (só manipula texto)
function formatarDuasCasas(v) {
  const [inteiro, decimal = ''] = v.split('.');
  return `${inteiro.replace(/^0+(?=\d)/, '')}.${decimal.padEnd(2, '0')}`;
}
