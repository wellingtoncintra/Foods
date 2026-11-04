import { useState } from 'react';

// Escolha ordenada de proteínas ou acompanhamentos para o cardápio do dia.
// selecionados: lista de ids na ordem da imagem; disponiveis: preparos ativos do tipo.
export default function SeletorPreparos({ titulo, rotuloNovo, selecionados, disponiveis, limite, aoAlterar, aoCadastrar, desabilitado }) {
  const [escolhido, setEscolhido] = useState('');
  const [novoAberto, setNovoAberto] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [erroNovo, setErroNovo] = useState(null);
  const [cadastrando, setCadastrando] = useState(false);

  const porId = new Map(disponiveis.map((p) => [p.id, p]));
  const naoEscolhidos = disponiveis.filter((p) => !selecionados.includes(p.id));
  const cheio = selecionados.length >= limite;

  const mover = (indice, delta) => {
    const nova = [...selecionados];
    [nova[indice], nova[indice + delta]] = [nova[indice + delta], nova[indice]];
    aoAlterar(nova);
  };

  function adicionar() {
    if (!escolhido) return;
    aoAlterar([...selecionados, Number(escolhido)]);
    setEscolhido('');
  }

  async function cadastrar(e) {
    e.preventDefault();
    const nome = novoNome.trim();
    if (!nome) return setErroNovo('Informe o nome.');
    setCadastrando(true);
    try {
      const criado = await aoCadastrar(nome);
      aoAlterar([...selecionados, criado.id]);
      setNovoNome('');
      setNovoAberto(false);
      setErroNovo(null);
    } catch (err) {
      setErroNovo(err.message);
    } finally {
      setCadastrando(false);
    }
  }

  return (
    <div className="editor-secao">
      <h3>
        {titulo}
        <span className="editor-contagem">
          {selecionados.length} de {limite}
        </span>
      </h3>

      {selecionados.length === 0 ? (
        <p className="texto-suave texto-pequeno" style={{ marginBottom: 10 }}>
          Nenhum item escolhido.
        </p>
      ) : (
        <ol className="lista-ordenavel">
          {selecionados.map((id, i) => (
            <li key={id}>
              <span className="nome-item">{porId.get(id)?.nome ?? '(inativo)'}</span>
              <button type="button" className="botao-icone" onClick={() => mover(i, -1)} disabled={desabilitado || i === 0} aria-label="Subir">
                ↑
              </button>
              <button type="button" className="botao-icone" onClick={() => mover(i, 1)} disabled={desabilitado || i === selecionados.length - 1} aria-label="Descer">
                ↓
              </button>
              <button type="button" className="botao-icone remover" onClick={() => aoAlterar(selecionados.filter((s) => s !== id))} disabled={desabilitado} aria-label="Remover">
                ×
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="adicionar-item">
        <select value={escolhido} onChange={(e) => setEscolhido(e.target.value)} disabled={desabilitado || cheio || naoEscolhidos.length === 0} aria-label={`Adicionar a ${titulo}`}>
          <option value="">{cheio ? `Limite de ${limite} atingido` : naoEscolhidos.length === 0 ? 'Todos já escolhidos' : 'Escolher...'}</option>
          {naoEscolhidos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        <button type="button" className="botao botao-secundario botao-pequeno" onClick={adicionar} disabled={desabilitado || !escolhido}>
          Adicionar
        </button>
      </div>

      {novoAberto ? (
        <form className="novo-preparo" onSubmit={cadastrar}>
          <input
            value={novoNome}
            onChange={(e) => {
              setNovoNome(e.target.value);
              setErroNovo(null);
            }}
            maxLength={100}
            placeholder={`Nome do(a) ${rotuloNovo}`}
            autoFocus
            aria-label={`Nome do(a) ${rotuloNovo}`}
          />
          <button type="submit" className="botao botao-primario botao-pequeno" disabled={cadastrando}>
            {cadastrando ? '...' : 'Salvar'}
          </button>
          <button type="button" className="botao botao-secundario botao-pequeno" onClick={() => setNovoAberto(false)} disabled={cadastrando}>
            Cancelar
          </button>
          {erroNovo && <span className="erro-campo" style={{ gridColumn: '1 / -1' }}>{erroNovo}</span>}
        </form>
      ) : (
        <button type="button" className="botao botao-link link-discreto" onClick={() => setNovoAberto(true)} disabled={desabilitado || cheio} style={{ marginTop: 6 }}>
          + Cadastrar {rotuloNovo}
        </button>
      )}
    </div>
  );
}
