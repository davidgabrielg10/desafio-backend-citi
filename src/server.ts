import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import routes from "./routes";

const app = express();

app.use(express.json());
app.use(routes);

// Qualquer rota que não existe cai aqui
app.use((req, res) => {
  res.status(404).json({ message: "Rota não encontrada" });
});

//erros que acontecem antes de chegar nas rotas, como um corpo com JSON formatado errado
//o Express reconhece esta funcao como tratador de erro porque ela tem 4 parametros
app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof SyntaxError) {
    return res.status(400).json({ message: "O corpo da requisição não é um JSON válido." });
  }

  console.error(error);
  return res.status(500).json({ message: "Erro interno do servidor." });
});

const port = process.env.SERVER_PORT || 3001;

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
