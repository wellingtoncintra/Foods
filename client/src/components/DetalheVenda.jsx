import { moeda } from '../utils/formatar.js';
import { dataHora } from '../utils/periodo.js';

// Detalhe dos itens de uma venda, exibido ao expandir uma linha do Histórico.
export default function DetalheVenda({ venda, aoCancelar }) {
  const cancelada = venda.status === 'CANCELADA';

  return (
    <div className="detalhe-venda">
      <table className="tabela tabela-itens">
        <thead>
          <tr>
            <th>Produto</th>
            <th className="numero">Qtd.</th>
            <th className="numero">Preço unit.</th>
            <th className="numero">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {venda.itens.map((i) => (
            <tr key={i.id}>
              <td>{i.produtoNome}</td>
              <td className="numero">{i.quantidade}</td>
              <td className="numero">{moeda(i.precoUnitario)}</td>
              <td className="numero">{moeda(i.subtotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="numero">
              Total
            </td>
            <td className="numero">
              <strong>{moeda(venda.valorTotal)}</strong>
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="detalhe-rodape">
        {cancelada ? (
          <p className="texto-cancelamento">
            Cancelada em {dataHora(venda.canceladaEm)}
            {venda.motivoCancelamento ? ` — Motivo: ${venda.motivoCancelamento}` : ' — sem motivo informado'}. Esta venda não entra no
            faturamento.
          </p>
        ) : (
          <button type="button" className="botao botao-perigo botao-pequeno" onClick={() => aoCancelar(venda)}>
            Cancelar venda
          </button>
        )}
      </div>
    </div>
  );
}
