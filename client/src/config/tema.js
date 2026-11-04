// ============================================================
// Configurações visuais do sistema.
// Para mudar as cores ou o nome do restaurante, altere SOMENTE este arquivo.
// ============================================================

export const restaurante = {
  nome: 'Cantinho do Sabor',
  subtitulo: 'Salgadaria e Marmitaria',
  // Rodapé da imagem do cardápio
  telefone: '(67) 99802-6354',
  textoTelefone: 'Delivery',
  endereco: 'Rua Gildete Chaves Feiijó, 20', // conferir a grafia "Feiijó" com a cliente
  bairro: 'Vila Fernanda',
};

// Textos da imagem do cardápio
export const textosCardapio = {
  titulo: 'Cardápio',
  marmitas: 'Marmita',
  pratos: 'Pratos',
  proteinas: 'Proteínas',
  subtituloProteinas: '1 a 2', // quantas proteínas o cliente escolhe
  acompanhamentos: 'Acompanhamentos',
};

// Cores das telas do sistema (azul-marinho, mostarda/ouro velho, branco/gelo).
// Cada chave vira uma variável CSS: primaria → --cor-primaria
export const cores = {
  primaria: '#1E2A47', // azul-marinho: sidebar e cabeçalho
  primariaClara: '#2C3B5F', // hover / item ativo da sidebar
  destaque: '#C9A227', // mostarda / ouro velho: botões e destaques
  destaqueEscuro: '#A8861C', // hover dos botões de destaque
  fundo: '#F4F6F8', // gelo: fundo das telas
  superficie: '#FFFFFF', // cards e painéis
  texto: '#1F2937',
  textoSuave: '#6B7280',
  textoSobrePrimaria: '#FFFFFF',
  borda: '#E5E7EB',
  sucesso: '#2E7D32',
  erro: '#C62828',
};

// Cores das séries dos gráficos (Dashboard). Tons próximos do azul-marinho e do ouro velho,
// ajustados para serem distinguíveis por daltônicos e com contraste >= 3:1 sobre o branco
// (validados com o validador de paletas). Ao trocar, revalide o par.
export const coresGrafico = {
  faturamento: '#3A5FA8',
  lucro: '#B07D0A',
  grade: '#E5E7EB',
  eixo: '#6B7280',
};

// Cores da imagem do cardápio (modelo "Cardapio Cantinho.pptx"). Usadas na fase 5.
export const coresCardapio = {
  fundo: '#DC9251', // laranja
  bloco: '#FFF2E6', // creme dos blocos
  texto: '#420505', // marrom-escuro
  rodape: '#844933', // marrom do rodapé
  textoRodape: '#FFFFFF',
};

// Aplica as cores como variáveis CSS no :root (chamado em main.jsx).
export function aplicarTema(paleta = cores) {
  const raiz = document.documentElement;
  for (const [nome, valor] of Object.entries(paleta)) {
    const variavel = nome.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`);
    raiz.style.setProperty(`--cor-${variavel}`, valor);
  }
}
