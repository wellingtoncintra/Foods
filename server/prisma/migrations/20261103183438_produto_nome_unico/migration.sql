-- Nome de produto único sem diferenciar maiúsculas/minúsculas (expressão não suportada no schema.prisma)
CREATE UNIQUE INDEX "produto_nome_unico" ON "produto" (lower("nome"));
