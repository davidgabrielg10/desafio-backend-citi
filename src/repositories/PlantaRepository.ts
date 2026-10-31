import { Luminosidade, Prisma } from "@prisma/client";
import prisma from "@database";

export const createPlanta = async (data: Prisma.PlantaCreateInput) => {
  return await prisma.planta.create({
    data: data,
  });
};

type FiltrosPlanta = {
  luminosidade?: Luminosidade;
  petFriendly?: boolean;
  nome?: string;
};

type OrdemPlanta = "id" | "preco" | "nome";

//como o Prisma ordena em cada opção de ?ordem=
const ORDENACAO: Record<OrdemPlanta, Prisma.PlantaOrderByWithRelationInput> = {
  id: { id: "asc" },
  preco: { preco: "asc" },
  nome: { nome: "asc" },
};

//No where do Prisma, condições com valor undefined são ignoradas: uma única consulta resolve sem filtro com um deles ou com todos
export const findAllPlantas = async (filtros: FiltrosPlanta, ordem: OrdemPlanta) => {
  return await prisma.planta.findMany({
    where: {
      luminosidade: filtros.luminosidade,
      petFriendly: filtros.petFriendly,
      // contains = "contem o texto" / mode insensitive = sem diferenciar maisuculas
      nome: filtros.nome === undefined ? undefined : { contains: filtros.nome, mode: "insensitive" },
    },
    orderBy: ORDENACAO[ordem],
  });
};

export const findPlantaById = async (id: number) => {
  return await prisma.planta.findUnique({
    where: { id: id },
  });
};

export const updatePlanta = async (id: number, data: Prisma.PlantaUpdateInput) => {
  return await prisma.planta.update({
    where: { id: id },
    data: data,
  });
};

export const deletePlanta = async (id: number) => {
  return await prisma.planta.delete({
    where: { id: id },
  });
};

//diminui o estoque só se ainda houver vasos suficientes
//a conferência e a subtraçao acontecem num unico comando no banco, entao duas vendas ao mesmo tempo nunca deixam estoque negativo
//devolve true se vendeu e false se nao havia estoque suficiente
export const diminuirEstoque = async (id: number, quantidade: number) => {
  const resultado = await prisma.planta.updateMany({
    where: { id: id, estoque: { gte: quantidade } },
    data: { estoque: { decrement: quantidade } },
  });

  return resultado.count > 0;
};

//busca so o preço e o estoque de cada planta, pra calcular o valor total
export const findPrecosEEstoques = async () => {
  return await prisma.planta.findMany({
    select: { preco: true, estoque: true },
  });
};

export const findPlantasEsgotadas = async () => {
  return await prisma.planta.findMany({
    where: { estoque: 0 },
    orderBy: { id: "asc" },
  });
};