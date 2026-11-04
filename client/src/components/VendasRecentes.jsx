import { Link } from 'react-router-dom';
import { moeda } from '../utils/formatar.js';
import { quando } from '../utils/periodo.js';

// Lista curta das últimas vendas (Registrar Venda e, na fase 4, Home).
export default function VendasRecentes({ vendas, carregando, erro }) {
  return (
    <section className="card vendas-recentes">
      <div className="cabecalho-card">
        <h2 className="titulo-card">Vendas recentes</h2>
        <Link to="/historico" className="link-discreto">
          Ver histórico
        </Link>
      </div>

      {erro ? (
        <p className="erro-campo">{erro}</p>
      ) : carregando ? (
        <p className="texto-suave">Carregando...</p>
      ) : vendas.length === 0 ? (
        <p className="texto-suave">Nenhuma venda registrada ainda.</p>
      ) : (
        <ul className="lista-recentes">
          {vendas.map((v) => (
            <li key={v.id} className={v.status === 'CANCELADA' ? 'recente-cancelada' : ''}>
              <div>
                <div className="recente-titulo">
                  Venda nº {v.id}
                  {v.status === 'CANCELADA' && <span className="etiqueta etiqueta-cancelada">Cancelada</span>}
                </div>
                <div className="texto-suave texto-pequeno">
                  {quando(v.dataHora)} · {v.itens.reduce((s, i) => s + i.quantidade, 0)} itens
                </div>
              </div>
              <strong className="recente-valor">{moeda(v.valorTotal)}</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
