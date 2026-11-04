// Card de indicador (número em destaque) — Home e Dashboard.
export default function CardIndicador({ rotulo, valor, detalhe, destaque = false, carregando = false }) {
  return (
    <div className={`card card-indicador ${destaque ? 'card-indicador-destaque' : ''}`}>
      <span className="indicador-rotulo">{rotulo}</span>
      <strong className="indicador-valor">{carregando ? '…' : valor}</strong>
      {detalhe && <span className="indicador-detalhe">{carregando ? ' ' : detalhe}</span>}
    </div>
  );
}
