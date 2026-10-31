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
};

//no where do Prisma, condicoes com valor undefined são ignoradas: uma so consulta resolve sem filtro
export const findAllPlantas = async (filtros: FiltrosPlanta) => {
  return await prisma.planta.findMany({
    where: {
      luminosidade: filtros.luminosidade,
      petFriendly: filtros.petFriendly,
    },
    orderBy: { id: "asc" },
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
//conferência e a subtraçao acontecem num unico comando no banco, entao duas vendas ao msm tempo nunca deixam estoque negativo
//devolve true se vendeu e false se n havia estoque suficiente
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