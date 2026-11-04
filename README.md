# Cantinho do Sabor — Gestão de Marmitaria

Sistema de gestão para marmitaria: cadastro de produtos, registro e histórico de vendas, dashboard com faturamento e lucro, cadastro de proteínas e acompanhamentos, cardápio do dia com calendário e geração da imagem de divulgação.

Projeto da disciplina de Análise e Projeto de Sistemas Orientados a Objetos (APSOO), UFMS. Autores: Melly Sabrina Araújo Miranda e Wellington Cintra da Silva.

## Tecnologias

- **Back-end:** Node.js, Express 5, Prisma 6, Multer, Zod
- **Front-end:** React 19, Vite, React Router, Recharts, html-to-image, fontes @fontsource (OFL)
- **Banco:** PostgreSQL 16 (Docker)

## Pré-requisitos

- Node.js 20 ou mais recente (testado com Node 24)
- Docker Desktop em execução

## Como rodar

```bash
# 1. Instalar as dependências (server e client juntos)
npm install

# 2. Criar o arquivo de configuração
cp .env.example .env

# 3. Subir o banco de dados
npm run db:up

# 4. Criar as tabelas
npm run db:migrate

# 5. (Opcional) Popular com dados de exemplo: 9 produtos, ~60 dias de vendas,
#    19 preparos e cardápios dos últimos 10 dias úteis
npm run db:seed

# 6. Rodar o sistema
npm run dev
```

Depois abra **http://localhost:5173** no navegador. A API roda em http://localhost:3333 (o Vite redireciona `/api` para ela).

Para conferir se o servidor e o banco estão funcionando: http://localhost:3333/api/health

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Roda o servidor e o front-end juntos |
| `npm run db:up` / `db:down` | Liga / desliga o PostgreSQL no Docker |
| `npm run db:migrate` | Aplica as migrações do banco |
| `npm run db:seed` | Apaga os dados e insere os dados de exemplo |
| `npm run seed:cardapio -w server` | Recria só preparos e cardápios de exemplo (não mexe em produtos e vendas) |
| `npm run db:reset` | Recria o banco do zero (migrações + seed) |
| `npm run build` | Gera a versão de produção do front-end |
| `npm run studio -w server` | Abre o Prisma Studio para ver os dados |

## Personalização

As cores das telas, o nome do restaurante, o telefone e o endereço do rodapé do cardápio, os textos e as cores da imagem do cardápio ficam em [client/src/config/tema.js](client/src/config/tema.js).

## Estrutura

```
├── docker-compose.yml     PostgreSQL 16
├── .env.example           variáveis de ambiente
├── server/
│   ├── prisma/            schema.prisma, migrações e seed.js
│   ├── uploads/           fotos dos produtos
│   └── src/               app.js, routes/, controllers/, services/, middlewares/, lib/
├── client/
│   └── src/               pages/, components/, services/, config/, styles/
└── docs/                  manual do sistema e modelo do cardápio
```
