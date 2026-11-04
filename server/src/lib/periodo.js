// Datas no fuso da marmitaria (regra 9).
// America/Cuiaba = UTC−4 fixo (o Brasil não tem horário de verão desde 2019).
// Assim, uma venda às 22h de Cuiabá conta no dia local, e não no dia seguinte (UTC).

export const FUSO = 'America/Cuiaba';
const OFFSET_HORAS = 4;
const MS_DIA = 86_400_000;

// "2026-11-03" → instante UTC de 03/11/2026 00:00 em Cuiabá (= 04:00 UTC)
export function inicioDoDia(data) {
  const [ano, mes, dia] = data.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia, OFFSET_HORAS));
}

// "2026-11-03" → instante UTC de 04/11/2026 00:00 em Cuiabá (limite exclusivo: usar "lt")
export function fimDoDiaExclusivo(data) {
  return new Date(inicioDoDia(data).getTime() + MS_DIA);
}

// Data de hoje em Cuiabá, "AAAA-MM-DD"
export function hojeCuiaba(agora = new Date()) {
  return new Date(agora.getTime() - OFFSET_HORAS * 3_600_000).toISOString().slice(0, 10);
}

// Valida "AAAA-MM-DD" com data real (rejeita 2026-02-30)
export function dataValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [ano, mes, dia] = texto.split('-').map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

// Filtro Prisma para um campo de data a partir de { inicio, fim } (ambos opcionais e inclusivos)
export function filtroPeriodo({ inicio, fim } = {}) {
  if (!inicio && !fim) return undefined;
  return {
    ...(inicio ? { gte: inicioDoDia(inicio) } : {}),
    ...(fim ? { lt: fimDoDiaExclusivo(fim) } : {}),
  };
}
