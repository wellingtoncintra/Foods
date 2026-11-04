import { moeda } from '../utils/formatar.js';

export const QUANTIDADE_MAXIMA = 999;

// Card de produto em Registrar Venda: clicar no card soma 1; botões − e + ajustam a quantidade.
export default function CardProduto({ produto, quantidade, aoAlterar, desabilitado }) {
  const selecionado = quantidade > 0;
  const somar = () => quantidade < QUANTIDADE_MAXIMA && aoAlterar(quantidade + 1);
  const subtrair = (e) => {
    e.stopPropagation();
    if (quantidade > 0) aoAlterar(quantidade - 1);
  };
  const adicionar = (e) => {
    e.stopPropagation();
    somar();
  };

  return (
    <div
      className={`card-produto ${selecionado ? 'card-produto-selecionado' : ''}`}
      onClick={desabilitado ? undefined : somar}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => !desabilitado && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), somar())}
      aria-label={`${produto.nome}, ${moeda(produto.precoVenda)}. Quantidade: ${quantidade}`}
    >
      {produto.imagemUrl ? (
        <img src={produto.imagemUrl} alt="" className="card-produto-foto" />
      ) : (
        <div className="card-produto-foto card-produto-sem-foto">{produto.nome.charAt(0).toUpperCase()}</div>
      )}
      <div className="card-produto-nome">{produto.nome}</div>
      <div className="card-produto-preco">{moeda(produto.precoVenda)}</div>
      <div className="contador">
        <button type="button" onClick={subtrair} disabled={desabilitado || quantidade === 0} aria-label={`Diminuir ${produto.nome}`}>
          −
        </button>
        <span className="contador-valor">{quantidade}</span>
        <button type="button" onClick={adicionar} disabled={desabilitado || quantidade >= QUANTIDADE_MAXIMA} aria-label={`Aumentar ${produto.nome}`}>
          +
        </button>
      </div>
    </div>
  );
}
