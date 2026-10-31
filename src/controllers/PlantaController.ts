import { Request, Response } from "express";
import { Luminosidade } from "@prisma/client";
import * as PlantaRepository from "@repositories/PlantaRepository";

const CAMPOS_DA_PLANTA = [
  "nome",
  "especie",
  "preco",
  "estoque",
  "luminosidade",
  "petFriendly",
  "regaACadaDias",
];

//maior numero que uma coluna Int do PostgreSQL consegue guardar
const MAIOR_INT = 2147483647;

//inteiro, maior ou igual ao mínimo e que cabe no banco.

const ehInteiroValido = (valor: any, minimo: number) =>
  Number.isInteger(valor) && valor >= minimo && valor <= MAIOR_INT;

const ehTextoValido = (valor: any) => typeof valor === "string" && valor.trim() !== "";
const ehLuminosidadeValida = (valor: any) => Object.values(Luminosidade).includes(valor);

//confere so os campos que vieram no corpo (undefined = nao enviado), entao serve para o cadastro e para a edicao.
const validarCampos = (dados: any): string | null => {
  const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = dados;

  if (nome !== undefined && !ehTextoValido(nome)) {
    return "nome deve ser um texto não vazio.";
  }

  if (especie !== undefined && !ehTextoValido(especie)) {
    return "especie deve ser um texto não vazio.";
  }

  if (preco !== undefined && !ehInteiroValido(preco, 1)) {
    return "preco deve ser um número inteiro maior que zero, em centavos (ex.: 8990).";
  }

  if (estoque !== undefined && !ehInteiroValido(estoque, 0)) {
    return "estoque deve ser um número inteiro maior ou igual a zero.";
  }

  if (luminosidade !== undefined && !ehLuminosidadeValida(luminosidade)) {
    return "luminosidade deve ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO.";
  }

  if (petFriendly !== undefined && typeof petFriendly !== "boolean") {
    return "petFriendly deve ser true ou false.";
  }

  if (regaACadaDias !== undefined && !ehInteiroValido(regaACadaDias, 1)) {
    return "regaACadaDias deve ser um número inteiro maior ou igual a 1.";
  }

  return null;
};

export const createPlanta = async (req: Request, res: Response) => {
  try {
    const camposFaltando = CAMPOS_DA_PLANTA.filter((campo) => req.body[campo] === undefined);

    if (camposFaltando.length > 0) {
      return res.status(400).json({
        message: `Campos obrigatórios faltando: ${camposFaltando.join(", ")}.`,
      });
    }

    const erro = validarCampos(req.body);

    if (erro !== null) {
      return res.status(400).json({ message: erro });
    }

    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = req.body;

    const planta = await PlantaRepository.createPlanta({
      nome,
      especie,
      preco,
      estoque,
      luminosidade,
      petFriendly,
      regaACadaDias,
    });

    return res.status(201).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao cadastrar planta." });
  }
};

export const readAllPlantas = async (req: Request, res: Response) => {
  try {
    //ss filtros chegam da URL sempre como texto, ou undefined se nao foram enviados
    const luminosidade = req.query.luminosidade as string | undefined;
    const petFriendly = req.query.petFriendly as string | undefined;

    if (luminosidade !== undefined && !ehLuminosidadeValida(luminosidade)) {
      return res.status(400).json({
        message: "O filtro luminosidade deve ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO.",
      });
    }

    if (petFriendly !== undefined && petFriendly !== "true" && petFriendly !== "false") {
      return res.status(400).json({ message: "O filtro petFriendly deve ser true ou false." });
    }

    const plantas = await PlantaRepository.findAllPlantas({
      //depois da validaçao acima, luminosidade é um dos 3 valores do enum
      luminosidade: luminosidade as Luminosidade | undefined,
      //converte "true"/"false" em booleano, sem transformar o filtro não enviado em false
      petFriendly: petFriendly === undefined ? undefined : petFriendly === "true",
    });

    return res.status(200).json(plantas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar plantas." });
  }
};

export const readPlantaById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!ehInteiroValido(id, 1)) {
      return res.status(400).json({ message: "O id deve ser um número inteiro maior que zero." });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    return res.status(200).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar planta." });
  }
};

export const updatePlanta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!ehInteiroValido(id, 1)) {
      return res.status(400).json({ message: "O id deve ser um número inteiro maior que zero." });
    }

    const erro = validarCampos(req.body);

    if (erro !== null) {
      return res.status(400).json({ message: erro });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = req.body;

    //PATCH: campos nao enviados (undefined) nao sao alterados
    const plantaAtualizada = await PlantaRepository.updatePlanta(id, {
      nome,
      especie,
      preco,
      estoque,
      luminosidade,
      petFriendly,
      regaACadaDias,
    });

    return res.status(200).json(plantaAtualizada);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao atualizar planta." });
  }
};

export const deletePlanta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!ehInteiroValido(id, 1)) {
      return res.status(400).json({ message: "O id deve ser um número inteiro maior que zero." });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    await PlantaRepository.deletePlanta(id);

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao deletar planta." });
  }
};