import { forwardRef, useId } from 'react';
import { coresCardapio, restaurante, textosCardapio } from '../../config/tema.js';
import { diaDaSemana } from '../../utils/periodo.js';

// Imagem de divulgação do cardápio do dia (RF010), baseada em docs/Cardapio Cantinho.pptx.
// Tamanho fixo A4 em pé (1414 × 2000 px); a pré-visualização é reduzida com CSS.
export const LARGURA = 1414;
export const ALTURA = 2000;

const precoTexto = (preco) => String(preco).replace('.', ',');
// No bloco "Marmita", "Marmita Pequena" aparece como "Pequena" (como no modelo)
const nomeMarmita = (nome) => nome.replace(/^marmita\s+/i, '') || nome;

// Texto em arco (título "CARDÁPIO" e "ACOMPANHAMENTOS")
function TextoEmArco({ texto, largura, altura, curva, tamanho, espacamento, className }) {
  const id = useId().replace(/:/g, '');
  const base = altura - tamanho * 0.25;
  return (
    <svg className={className} width={largura} height={altura} viewBox={`0 0 ${largura} ${altura}`} aria-label={texto}>
      <path id={`arco-${id}`} d={`M 0 ${base} Q ${largura / 2} ${base - curva * 2} ${largura} ${base}`} fill="none" />
      {/* Fonte, peso e cor como atributos: o html-to-image não aplica o CSS ao texto do SVG */}
      <text fontSize={tamanho} letterSpacing={espacamento} textAnchor="middle" fontFamily="Montserrat, sans-serif" fontWeight="800" fill={coresCardapio.texto}>
        <textPath href={`#arco-${id}`} startOffset="50%">
          {texto}
        </textPath>
      </text>
    </svg>
  );
}

// Arabesco ao lado do dia da semana e do "1 a 2"
function Arabesco({ invertido = false, largura = 150 }) {
  return (
    <svg className="ci-arabesco" width={largura} height="40" viewBox="0 0 150 40" style={invertido ? { transform: 'scaleX(-1)' } : undefined} aria-hidden="true">
      <path d="M 148 22 C 120 22 105 8 80 10 C 55 12 40 30 20 28 C 8 27 4 18 12 14 C 18 11 24 18 18 22" fill="none" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

// Flor decorativa de traço (decoração própria, inspirada no fundo do modelo)
function Flor({ x, y, tamanho, rotacao = 0 }) {
  const petalas = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg className="ci-flor" style={{ left: x, top: y, width: tamanho, height: tamanho, transform: `rotate(${rotacao}deg)` }} viewBox="-100 -100 200 200" aria-hidden="true">
      {petalas.map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <path d="M 0 -18 C 18 -40 16 -78 0 -96 C -16 -78 -18 -40 0 -18 Z" fill="none" strokeWidth="2.5" />
          <path d="M 0 -26 L 0 -84" fill="none" strokeWidth="1.5" />
        </g>
      ))}
      <circle r="16" fill="none" strokeWidth="2.5" />
      <circle r="7" fill="none" strokeWidth="2" />
    </svg>
  );
}

function Logo() {
  return (
    <div className="ci-logo" aria-label={`${restaurante.nome} — ${restaurante.subtitulo}`}>
      <div className="ci-logo-circulo">
        <svg className="ci-logo-chapeu" viewBox="0 0 64 48" aria-hidden="true">
          <path d="M 16 36 C 6 36 4 22 14 20 C 14 10 26 6 32 12 C 38 6 50 10 50 20 C 60 22 58 36 48 36 Z M 18 36 L 18 44 L 46 44 L 46 36" fill="none" strokeWidth="3" strokeLinejoin="round" />
        </svg>
        <div className="ci-logo-nome">
          {restaurante.nome.split(' ').length > 2 ? (
            <>
              {restaurante.nome.split(' ')[0]}
              <br />
              {restaurante.nome.split(' ').slice(1).join(' ')}
            </>
          ) : (
            restaurante.nome
          )}
        </div>
      </div>
      <div className="ci-logo-faixa">{restaurante.subtitulo}</div>
    </div>
  );
}

function ItemComPreco({ nome, preco }) {
  return (
    <li className="ci-item">
      <span className="ci-item-nome">{nome}</span>
      <span className="ci-pontilhado" />
      <span className="ci-item-preco">{precoTexto(preco)}</span>
    </li>
  );
}

function ItemSemPreco({ nome }) {
  return (
    <li className="ci-item">
      <span className="ci-item-nome">{nome}</span>
      <span className="ci-pontilhado" />
    </li>
  );
}

const ImagemCardapio = forwardRef(function ImagemCardapio({ cardapio }, ref) {
  const { data, marmitas = [], pratos = [], proteinas = [], acompanhamentos = [] } = cardapio;

  // Ajusta o tamanho das letras dos blocos de baixo conforme a quantidade de itens
  const maiorLista = Math.max(proteinas.length, acompanhamentos.length);
  const escalaBaixo = maiorLista <= 7 ? 1 : maiorLista === 8 ? 0.9 : maiorLista === 9 ? 0.82 : 0.75;

  const topo = [
    marmitas.length > 0 && (
      <section key="m" className="ci-bloco">
        <h2 className="ci-bloco-titulo">{textosCardapio.marmitas}</h2>
        <ul className="ci-lista">
          {marmitas.map((m) => (
            <ItemComPreco key={m.produtoId ?? m.nome} nome={nomeMarmita(m.nome)} preco={m.preco} />
          ))}
        </ul>
      </section>
    ),
    pratos.length > 0 && (
      <section key="p" className="ci-bloco">
        <h2 className="ci-bloco-titulo">{textosCardapio.pratos}</h2>
        <ul className="ci-lista">
          {pratos.map((p) => (
            <ItemComPreco key={p.produtoId ?? p.nome} nome={p.nome} preco={p.preco} />
          ))}
        </ul>
      </section>
    ),
  ].filter(Boolean);

  const baixo = [
    proteinas.length > 0 && (
      <section key="pr" className="ci-bloco">
        <div className="ci-bloco-cabecalho">
          <h2 className="ci-bloco-titulo">{textosCardapio.proteinas}</h2>
          {textosCardapio.subtituloProteinas && (
            <div className="ci-subtitulo">
              <Arabesco largura={110} />
              <span>{textosCardapio.subtituloProteinas}</span>
              <Arabesco largura={110} invertido />
            </div>
          )}
        </div>
        <ul className="ci-lista ci-lista-baixo">
          {proteinas.map((p) => (
            <ItemSemPreco key={p.preparoId ?? p.nome} nome={p.nome} />
          ))}
        </ul>
      </section>
    ),
    acompanhamentos.length > 0 && (
      <section key="ac" className="ci-bloco">
        <div className="ci-bloco-cabecalho">
          <TextoEmArco className="ci-titulo-arco" texto={textosCardapio.acompanhamentos.toUpperCase()} largura={540} altura={110} curva={30} tamanho={38} espacamento={4.5} />
        </div>
        <ul className="ci-lista ci-lista-baixo">
          {acompanhamentos.map((a) => (
            <ItemSemPreco key={a.preparoId ?? a.nome} nome={a.nome} />
          ))}
        </ul>
      </section>
    ),
  ].filter(Boolean);

  const estilo = {
    '--cc-fundo': coresCardapio.fundo,
    '--cc-bloco': coresCardapio.bloco,
    '--cc-texto': coresCardapio.texto,
    '--cc-rodape': coresCardapio.rodape,
    '--cc-texto-rodape': coresCardapio.textoRodape,
    '--cc-escala-baixo': escalaBaixo,
    width: LARGURA,
    height: ALTURA,
  };

  return (
    <div ref={ref} className="cardapio-imagem" style={estilo}>
      <Flor x={-90} y={20} tamanho={360} rotacao={10} />
      <Flor x={250} y={-120} tamanho={300} rotacao={25} />
      <Flor x={1060} y={250} tamanho={380} rotacao={-12} />
      <Flor x={-140} y={1150} tamanho={320} rotacao={30} />
      <Flor x={1180} y={1500} tamanho={300} rotacao={5} />

      <Logo />

      <header className="ci-cabecalho">
        <TextoEmArco className="ci-titulo" texto={textosCardapio.titulo.toUpperCase()} largura={1000} altura={200} curva={46} tamanho={124} espacamento={14} />
        <div className="ci-dia">
          <Arabesco />
          <span>{data ? diaDaSemana(data) : ''}</span>
          <Arabesco invertido />
        </div>
        <div className="ci-traco" />
      </header>

      {topo.length > 0 && <div className="ci-linha ci-linha-topo">{topo}</div>}
      {baixo.length > 0 && <div className="ci-linha ci-linha-baixo">{baixo}</div>}

      <footer className="ci-rodape">
        <div className="ci-rodape-caixa ci-rodape-telefone">
          <span className="ci-icone-telefone">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z" />
            </svg>
          </span>
          <div>
            <div>{restaurante.textoTelefone.toUpperCase()}</div>
            <div>{restaurante.telefone}</div>
          </div>
        </div>
        <div className="ci-rodape-caixa ci-rodape-endereco">
          <svg className="ci-icone-local" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7z" fill="none" strokeWidth="2" />
            <circle cx="12" cy="9" r="2.6" fill="none" strokeWidth="2" />
          </svg>
          <div>
            <div>{restaurante.endereco.toUpperCase()}</div>
            <div>{restaurante.bairro.toUpperCase()}</div>
          </div>
        </div>
      </footer>
    </div>
  );
});

export default ImagemCardapio;
