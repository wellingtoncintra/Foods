import { moedaDeCentavos } from '../utils/formatar.js';

// Resumo da venda em andamento: serve de conferência antes de concluir (UC002, passo 6).
// O total aqui é só para exibição; o servidor recalcula ao registrar.
export default function ResumoVenda({ itens, totalCentavos, aoRemover, aoLimpar, aoConcluir, enviando }) {
  const vazio = itens.length === 0;

  return (
    <section className="card resumo-venda">
      <h2 className="titulo-card">Venda atual</h2>

      {vazio ? (
        <p className="texto-suave">Nenhum produto selecionado. Clique nos produtos para adicioná-los.</p>
      ) : (
        <ul className="resumo-itens">
          {itens.map((i) => (
            <li key={i.produto.id}>
              <span className="resumo-qtd">{i.quantidade}×</span>
              <span className="resumo-nome">{i.produto.nome}</span>
              <span className="resumo-subtotal">{moedaDeCentavos(i.subtotalCentavos)}</span>
              <button
                type="button"
                className="resumo-remover"
                onClick={() => aoRemover(i.produto.id)}
                disabled={enviando}
                aria-label={`Remover ${i.produto.nome}`}
                title="Remover"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="resumo-total">
        <span>Total</span>
        <strong>{moedaDeCentavos(totalCentavos)}</strong>
      </div>

      <div className="resumo-acoes">
        <button type="button" className="botao botao-secundario" onClick={aoLimpar} disabled={vazio || enviando}>
          Limpar
        </button>
        <button type="button" className="botao botao-primario botao-grande" onClick={aoConcluir} disabled={vazio || enviando}>
          {enviando ? 'Registrando...' : 'Concluir venda'}
        </button>
      </div>
    </section>
  );
}
