import { useCallback, useEffect, useMemo, useState } from 'react';
import Mensagem from '../components/Mensagem.jsx';
import Confirmacao from '../components/Confirmacao.jsx';
import { listarPreparos, cadastrarPreparo, alterarPreparo, alterarSituacaoPreparo, excluirPreparo } from '../services/preparos.js';

export const TIPOS_PREPARO = [
  { valor: 'PROTEINA', rotulo: 'Proteína' },
  { valor: 'ACOMPANHAMENTO', rotulo: 'Acompanhamento' },
];
const rotuloTipo = (v) => TIPOS_PREPARO.find((t) => t.valor === v)?.rotulo ?? v;
const simplificar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Cadastro de preparos: proteínas e acompanhamentos usados no cardápio do dia (RF011)
export default function Preparos() {
  const [preparos, setPreparos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [emEdicao, setEmEdicao] = useState(null);
  const [campos, setCampos] = useState({ nome: '', tipo: 'PROTEINA' });
  const [erroNome, setErroNome] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('');
  const [situacao, setSituacao] = useState('todos');
  const [mensagem, setMensagem] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);
  const [processando, setProcessando] = useState(false);

  const fecharMensagem = useCallback(() => setMensagem(null), []);

  const carregar = useCallback(async () => {
    try {
      setPreparos(await listarPreparos());
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: `Não foi possível carregar os preparos: ${err.message}` });
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function limpar() {
    setEmEdicao(null);
    setCampos((c) => ({ nome: '', tipo: c.tipo }));
    setErroNome(null);
  }

  function editar(p) {
    setEmEdicao(p);
    setCampos({ nome: p.nome, tipo: p.tipo });
    setErroNome(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function salvar(e) {
    e.preventDefault();
    const nome = campos.nome.trim();
    if (!nome) return setErroNome('Nome é obrigatório.');
    if (nome.length > 100) return setErroNome('Nome deve ter no máximo 100 caracteres.');

    setSalvando(true);
    try {
      const salvo = emEdicao ? await alterarPreparo(emEdicao.id, { nome, tipo: campos.tipo }) : await cadastrarPreparo({ nome, tipo: campos.tipo });
      setMensagem({ tipo: 'sucesso', texto: emEdicao ? `Preparo "${salvo.nome}" alterado.` : `Preparo "${salvo.nome}" cadastrado.` });
      limpar();
      carregar();
    } catch (err) {
      const doCampo = err.detalhes?.find((d) => d.campo === 'nome');
      if (doCampo) setErroNome(doCampo.mensagem);
      setMensagem({ tipo: 'erro', texto: err.message });
    } finally {
      setSalvando(false);
    }
  }

  async function executar(acao, sucesso, depois) {
    setProcessando(true);
    try {
      await acao();
      setMensagem({ tipo: 'sucesso', texto: sucesso });
      depois?.();
      await carregar();
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message });
    } finally {
      setProcessando(false);
      setConfirmacao(null);
    }
  }

  function alternarSituacao(p) {
    if (!p.ativo) return executar(() => alterarSituacaoPreparo(p.id, true), `Preparo "${p.nome}" ativado.`);
    setConfirmacao({
      titulo: 'Desativar preparo',
      texto: `"${p.nome}" deixará de aparecer para montar o cardápio. Cardápios já salvos não mudam. Você pode reativá-lo depois.`,
      textoConfirmar: 'Desativar',
      acao: () => alterarSituacaoPreparo(p.id, false),
      sucesso: `Preparo "${p.nome}" desativado.`,
    });
  }

  function pedirExclusao(p) {
    setConfirmacao({
      titulo: 'Excluir preparo',
      texto: `Tem certeza que deseja excluir "${p.nome}"? Esta ação não pode ser desfeita.`,
      textoConfirmar: 'Excluir',
      perigo: true,
      acao: () => excluirPreparo(p.id),
      sucesso: `Preparo "${p.nome}" excluído.`,
      depois: () => emEdicao?.id === p.id && limpar(),
    });
  }

  const filtrados = useMemo(() => {
    const termo = simplificar(busca.trim());
    return preparos.filter(
      (p) =>
        (!termo || simplificar(p.nome).includes(termo)) &&
        (!tipo || p.tipo === tipo) &&
        (situacao === 'todos' || (situacao === 'ativos' ? p.ativo : !p.ativo)),
    );
  }, [preparos, busca, tipo, situacao]);

  return (
    <div>
      <Mensagem mensagem={mensagem} aoFechar={fecharMensagem} />

      <div className="grade-produtos">
        <form className="card" onSubmit={salvar} noValidate>
          <h2 className="titulo-card">{emEdicao ? `Editar: ${emEdicao.nome}` : 'Novo preparo'}</h2>
          <p className="texto-suave texto-pequeno" style={{ marginBottom: 14 }}>
            Proteínas e acompanhamentos usados para montar o cardápio do dia.
          </p>

          <div className="campo">
            <span className="rotulo">Tipo *</span>
            <div className="chips" role="radiogroup" aria-label="Tipo">
              {TIPOS_PREPARO.map((t) => (
                <button
                  key={t.valor}
                  type="button"
                  role="radio"
                  aria-checked={campos.tipo === t.valor}
                  className={`chip ${campos.tipo === t.valor ? 'chip-ativo' : ''}`}
                  onClick={() => setCampos((c) => ({ ...c, tipo: t.valor }))}
                >
                  {t.rotulo}
                </button>
              ))}
            </div>
          </div>

          <div className="campo">
            <label htmlFor="nome-preparo">Nome *</label>
            <input
              id="nome-preparo"
              value={campos.nome}
              maxLength={100}
              placeholder={campos.tipo === 'PROTEINA' ? 'Ex.: Costela de panela' : 'Ex.: Arroz branco'}
              onChange={(e) => {
                setCampos((c) => ({ ...c, nome: e.target.value }));
                setErroNome(null);
              }}
              aria-invalid={!!erroNome}
            />
            {erroNome && <span className="erro-campo">{erroNome}</span>}
          </div>

          <div className="form-acoes">
            {emEdicao && (
              <button type="button" className="botao botao-secundario" onClick={limpar} disabled={salvando}>
                Cancelar edição
              </button>
            )}
            <button type="submit" className="botao botao-primario" disabled={salvando}>
              {salvando ? 'Salvando...' : emEdicao ? 'Salvar alterações' : 'Cadastrar preparo'}
            </button>
          </div>
        </form>

        <section className="card">
          <div className="filtros">
            <input type="search" placeholder="Buscar por nome..." value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar preparo" />
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Filtrar por tipo">
              <option value="">Todos os tipos</option>
              {TIPOS_PREPARO.map((t) => (
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
            <p className="texto-suave">Carregando preparos...</p>
          ) : filtrados.length === 0 ? (
            <p className="texto-suave">{preparos.length === 0 ? 'Nenhum preparo cadastrado.' : 'Nenhum preparo encontrado com esses filtros.'}</p>
          ) : (
            <div className="tabela-rolagem">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Preparo</th>
                    <th>Tipo</th>
                    <th>Situação</th>
                    <th className="acoes">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((p) => (
                    <tr key={p.id} className={`${!p.ativo ? 'linha-inativa' : ''} ${p.id === emEdicao?.id ? 'linha-editando' : ''}`}>
                      <td className="nome-produto">{p.nome}</td>
                      <td>{rotuloTipo(p.tipo)}</td>
                      <td>
                        <span className={`etiqueta ${p.ativo ? 'etiqueta-ativo' : 'etiqueta-inativo'}`}>{p.ativo ? 'Ativo' : 'Inativo'}</span>
                      </td>
                      <td className="acoes">
                        <button type="button" className="botao botao-pequeno botao-secundario" onClick={() => editar(p)}>
                          Editar
                        </button>
                        <button type="button" className="botao botao-pequeno botao-secundario" onClick={() => alternarSituacao(p)}>
                          {p.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          type="button"
                          className="botao botao-pequeno botao-perigo"
                          onClick={() => pedirExclusao(p)}
                          disabled={!p.podeExcluir}
                          title={p.podeExcluir ? 'Excluir preparo' : 'Já usado em cardápios: desative em vez de excluir.'}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!carregando && preparos.length > 0 && (
            <p className="texto-suave texto-pequeno rodape-lista">
              {filtrados.length} de {preparos.length} preparos
            </p>
          )}
        </section>
      </div>

      <Confirmacao
        dados={confirmacao}
        processando={processando}
        aoCancelar={() => setConfirmacao(null)}
        aoConfirmar={() => executar(confirmacao.acao, confirmacao.sucesso, confirmacao.depois)}
      />
    </div>
  );
}
