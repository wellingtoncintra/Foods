import { useEffect } from 'react';

// Diálogo de confirmação para ações como excluir, desativar e cancelar venda.
// "children" permite incluir campos extras (ex.: motivo do cancelamento).
export default function Confirmacao({ dados, aoConfirmar, aoCancelar, processando, textoCancelar = 'Cancelar', children }) {
  useEffect(() => {
    if (!dados) return undefined;
    const aoTeclar = (e) => e.key === 'Escape' && !processando && aoCancelar();
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [dados, aoCancelar, processando]);

  if (!dados) return null;

  return (
    <div className="modal-fundo" onClick={() => !processando && aoCancelar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" onClick={(e) => e.stopPropagation()}>
        <h2 id="modal-titulo">{dados.titulo}</h2>
        <p>{dados.texto}</p>
        {children}
        <div className="modal-acoes">
          <button type="button" className="botao botao-secundario" onClick={aoCancelar} disabled={processando}>
            {textoCancelar}
          </button>
          <button
            type="button"
            className={`botao ${dados.perigo ? 'botao-perigo' : 'botao-primario'}`}
            onClick={aoConfirmar}
            disabled={processando}
            autoFocus
          >
            {processando ? 'Aguarde...' : dados.textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
