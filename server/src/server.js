import { app } from './app.js';
import { prisma } from './lib/prisma.js';

const PORT = Number(process.env.PORT) || 3333;

// No Express 5, erros ao abrir a porta (ex.: porta ocupada) chegam no callback do listen.
const servidor = app.listen(PORT, (erro) => {
  if (erro) {
    console.error(
      erro.code === 'EADDRINUSE'
        ? `ERRO: a porta ${PORT} já está em uso. Feche a outra instância do servidor (ou mude PORT no .env) e tente de novo.`
        : `ERRO ao iniciar o servidor: ${erro.message}`,
    );
    process.exit(1);
  }
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

async function encerrar() {
  servidor.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
