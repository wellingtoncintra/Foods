import { useEffect } from 'react';

// Aviso na tela. tipo: 'sucesso' | 'erro' | 'aviso'. Mensagens de sucesso somem sozinhas.
export default function Mensagem({ mensagem, aoFechar }) {
  useEffect(() => {
    if (mensagem?.tipo !== 'sucesso') return undefined;
    const t = setTimeout(aoFechar, 4000);
    return () => clearTimeout(t);
  }, [mensagem, aoFechar]);

  if (!mensagem) return null;

  return (
    <div className={`mensagem mensagem-${mensagem.tipo}`} role={mensagem.tipo === 'erro' ? 'alert' : 'status'}>
      <span>{mensagem.texto}</span>
      <button type="button" className="mensagem-fechar" onClick={aoFechar} aria-label="Fechar">
        ×
      </button>
    </div>
  );
}
