import { useEffect, useState } from 'react';
import { TIPOS_PRODUTO, normalizarValor, paraCentavos, moedaDeCentavos, valorParaCampo } from '../utils/formatar.js';

const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANHO_MAXIMO_FOTO = 2 * 1024 * 1024;

function estadoInicial(produto) {
  return {
    nome: produto?.nome ?? '',
    tipo: produto?.tipo ?? 'MARMITA',
    precoVenda: produto ? valorParaCampo(produto.precoVenda) : '',
    custoMedio: produto ? valorParaCampo(produto.custoMedio) : '',
    descricao: produto?.descricao ?? '',
  };
}

function validarCampos(campos) {
  const erros = {};
  if (!campos.nome.trim()) erros.nome = 'Nome é obrigatório.';
  else if (campos.nome.trim().length > 100) erros.nome = 'Nome deve ter no máximo 100 caracteres.';

  const preco = paraCentavos(campos.precoVenda);
  if (!campos.precoVenda.trim()) erros.precoVenda = 'Preço de venda é obrigatório.';
  else if (preco === null) erros.precoVenda = 'Informe um valor válido, ex.: 18,50.';
  else if (preco <= 0) erros.precoVenda = 'Preço de venda deve ser maior que zero.';

  if (!campos.custoMedio.trim()) erros.custoMedio = 'Custo médio é obrigatório.';
  else if (paraCentavos(campos.custoMedio) === null) erros.custoMedio = 'Informe um valor válido, ex.: 9,50.';

  if (campos.descricao.length > 1000) erros.descricao = 'Descrição deve ter no máximo 1000 caracteres.';
  return erros;
}

// Formulário de cadastro/alteração de produto (RF001, RF002).
// O componente pai troca a "key" para limpar o formulário ou carregar outro produto.
export default function FormProduto({ produto, aoSalvar, aoCancelar, salvando, errosServidor }) {
  const [campos, setCampos] = useState(() => estadoInicial(produto));
  const [erros, setErros] = useState({});
  const [arquivo, setArquivo] = useState(null);
  const [previa, setPrevia] = useState(null);
  const [removerFoto, setRemoverFoto] = useState(false);

  const editando = Boolean(produto);

  useEffect(() => setErros((atual) => ({ ...atual, ...errosServidor })), [errosServidor]);

  // Libera a URL temporária da pré-visualização
  useEffect(() => () => previa && URL.revokeObjectURL(previa), [previa]);

  const alterarCampo = (nome) => (e) => {
    setCampos((c) => ({ ...c, [nome]: e.target.value }));
    setErros((atual) => ({ ...atual, [nome]: undefined }));
  };

  function escolherFoto(e) {
    const escolhido = e.target.files?.[0];
    e.target.value = '';
    if (!escolhido) return;
    if (!TIPOS_FOTO.includes(escolhido.type)) {
      setErros((a) => ({ ...a, foto: 'Formato inválido. Envie JPG, PNG ou WebP.' }));
      return;
    }
    if (escolhido.size > TAMANHO_MAXIMO_FOTO) {
      setErros((a) => ({ ...a, foto: 'A foto deve ter no máximo 2 MB.' }));
      return;
    }
    setErros((a) => ({ ...a, foto: undefined }));
    setArquivo(escolhido);
    setPrevia(URL.createObjectURL(escolhido));
    setRemoverFoto(false);
  }

  function tirarFoto() {
    if (arquivo) {
      setArquivo(null);
      setPrevia(null);
    } else {
      setRemoverFoto(true);
    }
  }

  function enviar(e) {
    e.preventDefault();
    const encontrados = validarCampos(campos);
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    aoSalvar(
      {
        nome: campos.nome.trim(),
        tipo: campos.tipo,
        precoVenda: normalizarValor(campos.precoVenda),
        custoMedio: normalizarValor(campos.custoMedio),
        descricao: campos.descricao.trim() || null,
      },
      { arquivo, remover: removerFoto },
    );
  }

  const centavosPreco = paraCentavos(campos.precoVenda);
  const centavosCusto = paraCentavos(campos.custoMedio);
  const margem = centavosPreco !== null && centavosCusto !== null ? centavosPreco - centavosCusto : null;

  const fotoAtual = previa ?? (!removerFoto ? produto?.imagemUrl : null);

  return (
    <form className="card form-produto" onSubmit={enviar} noValidate>
      <h2 className="titulo-card">{editando ? `Editar: ${produto.nome}` : 'Novo produto'}</h2>

      <div className="campo">
        <label htmlFor="nome">Nome *</label>
        <input id="nome" value={campos.nome} onChange={alterarCampo('nome')} maxLength={100} aria-invalid={!!erros.nome} />
        {erros.nome && <span className="erro-campo">{erros.nome}</span>}
      </div>

      <div className="campo">
        <label htmlFor="tipo">Tipo *</label>
        <select id="tipo" value={campos.tipo} onChange={alterarCampo('tipo')}>
          {TIPOS_PRODUTO.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.rotulo}
            </option>
          ))}
        </select>
        {erros.tipo && <span className="erro-campo">{erros.tipo}</span>}
      </div>

      <div className="campos-lado-a-lado">
        <div className="campo">
          <label htmlFor="precoVenda">Preço de venda (R$) *</label>
          <input
            id="precoVenda"
            inputMode="decimal"
            placeholder="0,00"
            value={campos.precoVenda}
            onChange={alterarCampo('precoVenda')}
            aria-invalid={!!erros.precoVenda}
          />
          {erros.precoVenda && <span className="erro-campo">{erros.precoVenda}</span>}
        </div>
        <div className="campo">
          <label htmlFor="custoMedio">Custo médio (R$) *</label>
          <input
            id="custoMedio"
            inputMode="decimal"
            placeholder="0,00"
            value={campos.custoMedio}
            onChange={alterarCampo('custoMedio')}
            aria-invalid={!!erros.custoMedio}
          />
          {erros.custoMedio && <span className="erro-campo">{erros.custoMedio}</span>}
        </div>
      </div>

      {margem !== null && (
        <p className={margem < 0 ? 'aviso-margem' : 'texto-suave'}>
          Margem por unidade: <strong>{moedaDeCentavos(margem)}</strong>
          {margem < 0 && ' — atenção: o custo está maior que o preço de venda.'}
        </p>
      )}

      <div className="campo">
        <label htmlFor="descricao">Descrição (opcional)</label>
        <textarea id="descricao" rows={3} value={campos.descricao} onChange={alterarCampo('descricao')} maxLength={1000} />
        {erros.descricao && <span className="erro-campo">{erros.descricao}</span>}
      </div>

      <div className="campo">
        <span className="rotulo">Foto (opcional)</span>
        <div className="foto-campo">
          {fotoAtual ? (
            <img src={fotoAtual} alt="Foto do produto" className="foto-previa" />
          ) : (
            <div className="foto-previa foto-vazia">Sem foto</div>
          )}
          <div className="foto-acoes">
            <label className="botao botao-secundario">
              {fotoAtual ? 'Trocar foto' : 'Escolher foto'}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={escolherFoto} hidden />
            </label>
            {fotoAtual && (
              <button type="button" className="botao botao-link" onClick={tirarFoto}>
                Remover foto
              </button>
            )}
            <span className="texto-suave texto-pequeno">JPG, PNG ou WebP, até 2 MB.</span>
          </div>
        </div>
        {erros.foto && <span className="erro-campo">{erros.foto}</span>}
      </div>

      <div className="form-acoes">
        {editando && (
          <button type="button" className="botao botao-secundario" onClick={aoCancelar} disabled={salvando}>
            Cancelar edição
          </button>
        )}
        <button type="submit" className="botao botao-primario" disabled={salvando}>
          {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar produto'}
        </button>
      </div>
    </form>
  );
}
