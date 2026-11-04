// Marcador temporário das telas que ainda serão implementadas.
export default function EmConstrucao({ fase, descricao }) {
  return (
    <div className="card">
      <p>{descricao}</p>
      <p className="texto-suave" style={{ marginTop: 8 }}>
        Será implementada na fase {fase}.
      </p>
    </div>
  );
}
