-- CreateEnum
CREATE TYPE "TipoPreparo" AS ENUM ('PROTEINA', 'ACOMPANHAMENTO');

-- CreateTable
CREATE TABLE "preparo" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "tipo" "TipoPreparo" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preparo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cardapio" (
    "id" SERIAL NOT NULL,
    "data" DATE NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cardapio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cardapio_produto" (
    "cardapio_id" INTEGER NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "cardapio_produto_pkey" PRIMARY KEY ("cardapio_id","produto_id")
);

-- CreateTable
CREATE TABLE "cardapio_preparo" (
    "cardapio_id" INTEGER NOT NULL,
    "preparo_id" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "cardapio_preparo_pkey" PRIMARY KEY ("cardapio_id","preparo_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cardapio_data_key" ON "cardapio"("data");

-- CreateIndex
CREATE INDEX "cardapio_produto_produto_id_idx" ON "cardapio_produto"("produto_id");

-- CreateIndex
CREATE INDEX "cardapio_preparo_preparo_id_idx" ON "cardapio_preparo"("preparo_id");

-- AddForeignKey
ALTER TABLE "cardapio_produto" ADD CONSTRAINT "cardapio_produto_cardapio_id_fkey" FOREIGN KEY ("cardapio_id") REFERENCES "cardapio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cardapio_produto" ADD CONSTRAINT "cardapio_produto_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cardapio_preparo" ADD CONSTRAINT "cardapio_preparo_cardapio_id_fkey" FOREIGN KEY ("cardapio_id") REFERENCES "cardapio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cardapio_preparo" ADD CONSTRAINT "cardapio_preparo_preparo_id_fkey" FOREIGN KEY ("preparo_id") REFERENCES "preparo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Nome de preparo único sem diferenciar maiúsculas/minúsculas (expressão não suportada no schema.prisma)
CREATE UNIQUE INDEX "preparo_nome_unico" ON "preparo" (lower("nome"));
