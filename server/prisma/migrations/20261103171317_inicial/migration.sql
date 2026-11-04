-- CreateEnum
CREATE TYPE "TipoProduto" AS ENUM ('MARMITA', 'PRATO', 'BEBIDA', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusVenda" AS ENUM ('CONCLUIDA', 'CANCELADA');

-- CreateTable
CREATE TABLE "produto" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoProduto" NOT NULL,
    "preco_venda" DECIMAL(10,2) NOT NULL,
    "custo_medio" DECIMAL(10,2) NOT NULL,
    "imagem_url" VARCHAR(255),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venda" (
    "id" SERIAL NOT NULL,
    "data_hora" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor_total" DECIMAL(10,2) NOT NULL,
    "status" "StatusVenda" NOT NULL DEFAULT 'CONCLUIDA',
    "cancelada_em" TIMESTAMPTZ(6),
    "motivo_cancelamento" VARCHAR(255),

    CONSTRAINT "venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_venda" (
    "id" SERIAL NOT NULL,
    "venda_id" INTEGER NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario" DECIMAL(10,2) NOT NULL,
    "custo_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "item_venda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "venda_data_hora_idx" ON "venda"("data_hora");

-- CreateIndex
CREATE INDEX "item_venda_venda_id_idx" ON "item_venda"("venda_id");

-- CreateIndex
CREATE INDEX "item_venda_produto_id_idx" ON "item_venda"("produto_id");

-- AddForeignKey
ALTER TABLE "item_venda" ADD CONSTRAINT "item_venda_venda_id_fkey" FOREIGN KEY ("venda_id") REFERENCES "venda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_venda" ADD CONSTRAINT "item_venda_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Restrições de integridade (NF008) — adicionadas manualmente, o Prisma não gera CHECK
ALTER TABLE "produto" ADD CONSTRAINT "produto_preco_venda_positivo" CHECK ("preco_venda" > 0);
ALTER TABLE "produto" ADD CONSTRAINT "produto_custo_medio_nao_negativo" CHECK ("custo_medio" >= 0);
ALTER TABLE "venda" ADD CONSTRAINT "venda_valor_total_nao_negativo" CHECK ("valor_total" >= 0);
ALTER TABLE "venda" ADD CONSTRAINT "venda_cancelamento_consistente"
  CHECK (("status" = 'CANCELADA') = ("cancelada_em" IS NOT NULL));
ALTER TABLE "item_venda" ADD CONSTRAINT "item_venda_quantidade_positiva" CHECK ("quantidade" > 0);
ALTER TABLE "item_venda" ADD CONSTRAINT "item_venda_preco_unitario_positivo" CHECK ("preco_unitario" > 0);
ALTER TABLE "item_venda" ADD CONSTRAINT "item_venda_custo_unitario_nao_negativo" CHECK ("custo_unitario" >= 0);
