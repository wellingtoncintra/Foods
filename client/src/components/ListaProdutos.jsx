import { useMemo, useState } from 'react';
import { TIPOS_PRODUTO, rotuloTipo, moeda, moedaDeCentavos, paraCentavos } from '../utils/formatar.js';

// Remove acentos e caixa para a busca: "média" encontra "Media"
const simplificar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Lista de produtos com busca e filtros (RF002, RF003).
export default function ListaProdutos({ produtos, carregando, idEmEdicao, aoEditar, aoAlternarSituacao, aoExcluir }) {
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('');
  const [situacao, setSituacao] = useState('todos');

  const filtrados = useMemo(() => {
    const termo = simplificar(busca.trim());
    return produtos.filter(
      (p) =>
        (!termo || simplificar(p.nome).includes(termo)) &&
        (!tipo || p.tipo === tipo) &&
        (situacao === 'todos' || (situacao === 'ativos' ? p.ativo : !p.ativo)),
    );
  }, [produtos, busca, tipo, situacao]);

  return (
    <section className="card">
      <div className="filtros">
        <input type="search" placeholder="Buscar por nome..." value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar produto" />
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Filtrar por tipo">
          <option value="">Todos os tipos</option>
          {TIPOS_PRODUTO.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.rotulo}
            </option>
          ))}
        </select>
        <select value={situacao} onChange={(e) => setSituacao(e.target.value)} aria-label="Filtrar por situação">
          <option value="todos">Ativos e inativos</option>
          <option value="ativos">Somente ativos</option>
          <option value="inativos">Somente inativos</option>
        </select>
      </div>

      {carregando ? (
        <p className="texto-suave">Carregando produtos...</p>
      ) : filtrados.length === 0 ? (
        <p className="texto-suave">{produtos.length === 0 ? 'Nenhum produto cadastrado.' : 'Nenhum produto encontrado com esses filtros.'}</p>
      ) : (
        <div className="tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Tipo</th>
                <th className="numero">Preço</th>
                <th className="numero">Custo</th>
                <th className="numero">Margem</th>
                <th>Situação</th>
                <th className="acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => {
                const margem = paraCentavos(p.precoVenda) - paraCentavos(p.custoMedio);
                return (
                  <tr key={p.id} className={`${!p.ativo ? 'linha-inativa' : ''} ${p.id === idEmEdicao ? 'linha-editando' : ''}`}>
                    <td>
                      <div className="celula-produto">
                        {p.imagemUrl ? (
                          <img src={p.imagemUrl} alt="" className="miniatura" />
                        ) : (
                          <div className="miniatura miniatura-vazia">{p.nome.charAt(0).toUpperCase()}</div>
                        )}
                        <div>
                          <div className="nome-produto">{p.nome}</div>
                          {p.descricao && <div className="texto-suave texto-pequeno">{p.descricao}</div>}
                        </div>
                      </div>
                    </td>
                    <td>{rotuloTipo(p.tipo)}</td>
                    <td className="numero">{moeda(p.precoVenda)}</td>
                    <td className="numero">{moeda(p.custoMedio)}</td>
                    <td className={`numero ${margem < 0 ? 'valor-negativo' : ''}`}>{moedaDeCentavos(margem)}</td>
                    <td>
                      <span className={`etiqueta ${p.ativo ? 'etiqueta-ativo' : 'etiqueta-inativo'}`}>{p.ativo ? 'Ativo' : 'Inativo'}</span>
                    </td>
                    <td className="acoes">
                      <button type="button" className="botao botao-pequeno botao-secundario" onClick={() => aoEditar(p)}>
                        Editar
                      </button>
                      <button type="button" className="botao botao-pequeno botao-secundario" onClick={() => aoAlternarSituacao(p)}>
                        {p.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        type="button"
                        className="botao botao-pequeno botao-perigo"
                        onClick={() => aoExcluir(p)}
                        disabled={!p.podeExcluir}
                        title={
                          p.possuiVendas
                            ? 'Produto com vendas registradas: desative em vez de excluir.'
                            : p.usadoEmCardapio
                              ? 'Produto presente em cardápios salvos: desative em vez de excluir.'
                              : 'Excluir produto'
                        }
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {!carregando && produtos.length > 0 && (
        <p className="texto-suave texto-pequeno rodape-lista">
          {filtrados.length} de {produtos.length} produtos
        </p>
      )}
    </section>
  );
}
