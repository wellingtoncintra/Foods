// Seed de desenvolvimento: produtos do Cantinho do Sabor, ~60 dias de vendas,
// preparos (proteínas e acompanhamentos) e cardápios dos últimos 10 dias úteis.
// Executar com: npm run db:seed (na raiz). APAGA os dados atuais antes de inserir.
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const D = (v) => new Prisma.Decimal(v);

// America/Cuiaba = UTC−4 fixo (sem horário de verão desde 2019).
const OFFSET_CUIABA_HORAS = 4;
const DIAS = 60;

// Gerador pseudoaleatório com semente: o seed produz sempre os mesmos dados.
function criarAleatorio(semente) {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const aleatorio = criarAleatorio(20261103);
const inteiro = (min, max) => min + Math.floor(aleatorio() * (max - min + 1));

// Data/hora local de Cuiabá → instante UTC
function horarioCuiaba(ano, mes, dia, hora, minuto) {
  return new Date(Date.UTC(ano, mes, dia, hora + OFFSET_CUIABA_HORAS, minuto));
}

const produtos = [
  { nome: 'Marmita Pequena', tipo: 'MARMITA', precoVenda: '18.00', custoMedio: '8.50', descricao: 'Arroz, feijão, 1 proteína e acompanhamentos do dia.' },
  { nome: 'Marmita Média', tipo: 'MARMITA', precoVenda: '22.00', custoMedio: '10.50', descricao: 'Arroz, feijão, até 2 proteínas e acompanhamentos do dia.' },
  { nome: 'Marmita Grande', tipo: 'MARMITA', precoVenda: '27.00', custoMedio: '13.00', descricao: 'Porção grande com até 2 proteínas e acompanhamentos do dia.' },
  { nome: 'Prato Feito', tipo: 'PRATO', precoVenda: '20.00', custoMedio: '9.50', descricao: 'Prato servido no local.' },
  { nome: 'Self-Service', tipo: 'PRATO', precoVenda: '27.00', custoMedio: '13.50', descricao: 'Self-service à vontade.' },
  { nome: 'Refrigerante Lata', tipo: 'BEBIDA', precoVenda: '6.00', custoMedio: '3.20' },
  { nome: 'Suco Natural', tipo: 'BEBIDA', precoVenda: '8.00', custoMedio: '3.00' },
  { nome: 'Água Mineral', tipo: 'BEBIDA', precoVenda: '3.50', custoMedio: '1.20' },
  { nome: 'Coxinha', tipo: 'OUTRO', precoVenda: '7.00', custoMedio: '2.50', descricao: 'Salgado frito.' },
];

// Peso de escolha de cada produto (marmitas vendem mais)
const PESOS = { 'Marmita Pequena': 18, 'Marmita Média': 22, 'Marmita Grande': 12, 'Prato Feito': 10, 'Self-Service': 8, 'Refrigerante Lata': 10, 'Suco Natural': 6, 'Água Mineral': 6, Coxinha: 8 };

const MOTIVOS = ['Cliente desistiu', 'Lançamento duplicado', 'Erro no pedido', null];

const PROTEINAS = ['Costela de panela', 'Coxinha da asa empanada', 'Frango grelhado', 'Bife acebolado', 'Linguiça toscana', 'Carne moída', 'Peixe frito', 'Frango assado'];
const ACOMPANHAMENTOS = ['Arroz branco', 'Feijão carioca', 'Macarrão à bolonhesa', 'Batata chips', 'Mandioca cozida', 'Farofa', 'Saladas', 'Purê de batata', 'Feijão tropeiro', 'Legumes refogados', 'Vinagrete'];
const DIAS_CARDAPIO = 10;

function sortearProduto(lista) {
  const total = lista.reduce((s, p) => s + PESOS[p.nome], 0);
  let r = aleatorio() * total;
  for (const p of lista) {
    r -= PESOS[p.nome];
    if (r < 0) return p;
  }
  return lista[lista.length - 1];
}

function montarVenda(lista, dataHora) {
  const escolhidos = new Map();
  const qtdItens = inteiro(1, 3);
  for (let i = 0; i < qtdItens; i++) {
    const p = sortearProduto(lista);
    escolhidos.set(p.id, { produto: p, quantidade: (escolhidos.get(p.id)?.quantidade ?? 0) + inteiro(1, 2) });
  }

  // Mesma regra do servidor: copia preço e custo do produto e soma no Decimal.
  let valorTotal = D(0);
  const itens = [...escolhidos.values()].map(({ produto, quantidade }) => {
    const subtotal = produto.precoVenda.mul(quantidade);
    valorTotal = valorTotal.add(subtotal);
    return {
      produtoId: produto.id,
      quantidade,
      precoUnitario: produto.precoVenda,
      custoUnitario: produto.custoMedio,
      subtotal,
    };
  });

  const venda = { dataHora, valorTotal, itens: { create: itens } };

  if (aleatorio() < 0.05) {
    venda.status = 'CANCELADA';
    venda.canceladaEm = new Date(dataHora.getTime() + inteiro(2, 30) * 60_000);
    venda.motivoCancelamento = MOTIVOS[inteiro(0, MOTIVOS.length - 1)];
  }
  return venda;
}

async function main() {
  console.log('Limpando dados...');
  await prisma.cardapio.deleteMany(); // apaga também os itens do cardápio (cascade)
  await prisma.preparo.deleteMany();
  await prisma.itemVenda.deleteMany();
  await prisma.venda.deleteMany();
  await prisma.produto.deleteMany();

  console.log('Inserindo produtos...');
  const criados = [];
  for (const p of produtos) {
    criados.push(await prisma.produto.create({ data: { ...p, precoVenda: D(p.precoVenda), custoMedio: D(p.custoMedio) } }));
  }

  // "Agora" e "hoje" no fuso de Cuiabá
  const agora = new Date();
  const agoraLocal = new Date(agora.getTime() - OFFSET_CUIABA_HORAS * 3_600_000);

  const vendas = [];
  for (let d = DIAS - 1; d >= 0; d--) {
    const dia = new Date(Date.UTC(agoraLocal.getUTCFullYear(), agoraLocal.getUTCMonth(), agoraLocal.getUTCDate() - d));
    if (dia.getUTCDay() === 0) continue; // fechado aos domingos

    const [ano, mes, diaMes] = [dia.getUTCFullYear(), dia.getUTCMonth(), dia.getUTCDate()];
    const almoco = inteiro(8, 18);
    const noite = inteiro(0, 4); // vendas entre 20h e 23h testam o fuso (UTC já é o dia seguinte)

    for (let i = 0; i < almoco; i++) vendas.push(horarioCuiaba(ano, mes, diaMes, inteiro(10, 13), inteiro(0, 59)));
    for (let i = 0; i < noite; i++) vendas.push(horarioCuiaba(ano, mes, diaMes, inteiro(20, 22), inteiro(0, 59)));
  }

  const passadas = vendas.filter((dh) => dh <= agora).sort((a, b) => a - b);

  console.log(`Inserindo ${passadas.length} vendas...`);
  const LOTE = 50;
  for (let i = 0; i < passadas.length; i += LOTE) {
    await prisma.$transaction(passadas.slice(i, i + LOTE).map((dh) => prisma.venda.create({ data: montarVenda(criados, dh) })));
  }

  const resultado = await semearCardapios(criados, agoraLocal);
  const canceladas = await prisma.venda.count({ where: { status: 'CANCELADA' } });
  console.log(
    `Seed concluído: ${criados.length} produtos, ${passadas.length} vendas (${canceladas} canceladas), ` +
      `${resultado.preparos} preparos, ${resultado.cardapios} cardápios.`,
  );
}

// Preparos e cardápios dos últimos dias úteis (sem o de hoje, que é montado pela tela).
// Marmitas e pratos com nome e preço copiados, como faz o sistema.
async function semearCardapios(produtosExistentes, agoraLocal) {
  console.log('Inserindo preparos e cardápios...');
  const proteinas = [];
  for (const nome of PROTEINAS) proteinas.push(await prisma.preparo.create({ data: { nome, tipo: 'PROTEINA' } }));
  const acompanhamentos = [];
  for (const nome of ACOMPANHAMENTOS) acompanhamentos.push(await prisma.preparo.create({ data: { nome, tipo: 'ACOMPANHAMENTO' } }));

  const doCardapio = produtosExistentes.filter((p) => p.ativo && (p.tipo === 'MARMITA' || p.tipo === 'PRATO'));
  let cardapios = 0;
  for (let d = 1; cardapios < DIAS_CARDAPIO && d < DIAS; d++) {
    const dia = new Date(Date.UTC(agoraLocal.getUTCFullYear(), agoraLocal.getUTCMonth(), agoraLocal.getUTCDate() - d));
    if (dia.getUTCDay() === 0) continue;
    const prots = [...proteinas].sort(() => aleatorio() - 0.5).slice(0, inteiro(2, 3));
    const extras = acompanhamentos.slice(2).sort(() => aleatorio() - 0.5).slice(0, inteiro(4, 6));
    const acomps = [acompanhamentos[0], acompanhamentos[1], ...extras]; // arroz e feijão sempre
    await prisma.cardapio.create({
      data: {
        data: dia,
        produtos: { create: doCardapio.map((p, ordem) => ({ produtoId: p.id, nome: p.nome, preco: p.precoVenda, ordem })) },
        preparos: { create: [...prots, ...acomps].map((p, ordem) => ({ preparoId: p.id, nome: p.nome, ordem })) },
      },
    });
    cardapios++;
  }
  return { preparos: proteinas.length + acompanhamentos.length, cardapios };
}

// Modo parcial: recria só preparos e cardápios, sem tocar em produtos e vendas.
// Uso: npm run seed:cardapio -w server
async function somenteCardapios() {
  console.log('Modo --somente-cardapio: produtos e vendas não serão alterados.');
  await prisma.cardapio.deleteMany();
  await prisma.preparo.deleteMany();
  const produtosExistentes = await prisma.produto.findMany({ orderBy: { id: 'asc' } });
  const agoraLocal = new Date(Date.now() - OFFSET_CUIABA_HORAS * 3_600_000);
  const r = await semearCardapios(produtosExistentes, agoraLocal);
  console.log(`Concluído: ${r.preparos} preparos, ${r.cardapios} cardápios.`);
}

(process.argv.includes('--somente-cardapio') ? somenteCardapios() : main())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
