/*
  Warnings:

  - Added the required column `nome` to the `cardapio_preparo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nome` to the `cardapio_produto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cardapio_preparo" ADD COLUMN     "nome" VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE "cardapio_produto" ADD COLUMN     "nome" VARCHAR(100) NOT NULL;
