# 🌿 Folhagem & Cia — API

API da loja de plantas Folhagem & Cia, feita para o desafio de back-end do PS do CITi. Ela substitui a planilha da loja: cadastra as plantas, permite filtrar a lista, registra vendas sem deixar o estoque ficar negativo e calcula o valor total do estoque.

**Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL e Docker.

O código segue a mesma organização do CRUD de usuários do treinamento (que continua no projeto): `routes.ts` → `PlantaController` (valida e escolhe o status) → `PlantaRepository` (conversa com o banco) → PostgreSQL.

## Como rodar

Você precisa do Docker Desktop (aberto), do Node.js 20+ e do Yarn (`npm install -g yarn`).

```bash
git clone https://github.com/davidgabrielg10/desafio-backend-citi.git
cd desafio-backend-citi
cp .env.example .env          # no Windows: copy .env.example .env
yarn
docker compose up -d --build
yarn migration
```

A API fica em `http://localhost:3001` e o banco começa vazio. Para ver os logs da API: `docker compose logs -f server`.

## Modelo de dados

| Campo | Tipo | Regra |
|---|---|---|
| `id` | Int | Gerado pelo banco |
| `nome` | String | Nome popular, texto não vazio |
| `especie` | String | Nome científico, texto não vazio |
| `preco` | Int | Em centavos (`8990` = R$ 89,90), maior que zero |
| `estoque` | Int | Quantidade de vasos, maior ou igual a zero |
| `luminosidade` | Luminosidade | `SOMBRA`, `MEIA_SOMBRA` ou `SOL_PLENO` |
| `petFriendly` | Boolean | `true` ou `false` |
| `regaACadaDias` | Int | De quantos em quantos dias regar, pelo menos 1 |
| `createdAt` / `updatedAt` | DateTime | Preenchidos automaticamente |

`Luminosidade` é um enum com três valores: `SOMBRA`, `MEIA_SOMBRA` e `SOL_PLENO`.

## Rotas

| Método | Rota | O que faz | Sucesso |
|---|---|---|---|
| `POST` | `/plantas` | Cadastra uma planta | `201` |
| `GET` | `/plantas` | Lista as plantas (com filtros opcionais) | `200` |
| `GET` | `/plantas/esgotadas` | Lista as plantas com estoque zero | `200` |
| `GET` | `/plantas/:id` | Busca uma planta | `200` |
| `PATCH` | `/plantas/:id` | Edita só os campos enviados | `200` |
| `DELETE` | `/plantas/:id` | Remove uma planta | `204` |
| `POST` | `/plantas/:id/venda` | Registra uma venda e diminui o estoque | `200` |
| `GET` | `/plantas/estoque/valor-total` | Valor total do estoque e total de vasos | `200` |

### Cadastrar: `POST /plantas`

Todos os campos são obrigatórios.

```json
{
  "nome": "Costela-de-adão",
  "especie": "Monstera deliciosa",
  "preco": 8990,
  "estoque": 12,
  "luminosidade": "MEIA_SOMBRA",
  "petFriendly": false,
  "regaACadaDias": 3
}
```

Resposta `201`:

```json
{
  "id": 1,
  "nome": "Costela-de-adão",
  "especie": "Monstera deliciosa",
  "preco": 8990,
  "estoque": 12,
  "luminosidade": "MEIA_SOMBRA",
  "petFriendly": false,
  "regaACadaDias": 3,
  "createdAt": "2026-10-31T13:53:02.000Z",
  "updatedAt": "2026-10-31T13:53:02.000Z"
}
```

Erros: `400` se faltar algum campo (a mensagem diz quais faltaram) ou se algum valor não seguir as regras do modelo, como `"preco": 0` ou `"luminosidade": "LUA"`.

### Listar: `GET /plantas`

Os filtros são opcionais e podem ser combinados:

- `?luminosidade=MEIA_SOMBRA`
- `?petFriendly=true`
- `?nome=costela` (bônus): busca pelo nome, sem diferenciar maiúsculas
- `?ordem=preco` ou `?ordem=nome` (bônus): sem esse parâmetro, a lista sai na ordem de cadastro

Exemplo: `GET /plantas?luminosidade=MEIA_SOMBRA&petFriendly=false`

Resposta `200`: a lista das plantas que combinam com os filtros, no mesmo formato do cadastro. Se nenhuma combinar, vem `[]`.

Erros: `400` se algum filtro tiver um valor inválido, como `?luminosidade=LUA`, `?petFriendly=sim` ou `?ordem=estoque`.

### Plantas esgotadas: `GET /plantas/esgotadas` (bônus)

Resposta `200`: a lista das plantas com `estoque` igual a zero.

### Buscar: `GET /plantas/:id`

Exemplo: `GET /plantas/1`

Resposta `200`: a planta, no mesmo formato do cadastro.

Erros: `400` se o id não for um número inteiro positivo (ex.: `/plantas/abc`) e `404` se a planta não existir.

### Editar: `PATCH /plantas/:id`

Só os campos enviados mudam, e eles passam pelas mesmas regras do cadastro.

```json
{ "preco": 9990 }
```

Resposta `200`: a planta atualizada, com o preço novo e o resto igual.

Erros: `400` se o id ou algum valor enviado for inválido e `404` se a planta não existir.

### Remover: `DELETE /plantas/:id`

Resposta `204`, sem corpo.

Erros: `400` se o id for inválido e `404` se a planta não existir (inclusive se ela já foi removida).

### Vender: `POST /plantas/:id/venda`

```json
{ "quantidade": 2 }
```

Resposta `200`: a planta com o estoque já atualizado.

```json
{
  "id": 1,
  "nome": "Costela-de-adão",
  "especie": "Monstera deliciosa",
  "preco": 9990,
  "estoque": 10,
  "luminosidade": "MEIA_SOMBRA",
  "petFriendly": false,
  "regaACadaDias": 3,
  "createdAt": "2026-10-31T13:53:02.000Z",
  "updatedAt": "2026-10-31T13:53:02.053Z"
}
```

Erros:

- `400` se a `quantidade` não for um número inteiro maior que zero;
- `400` se não houver estoque suficiente, por exemplo `"Estoque insuficiente: temos só 10 vasos de Costela-de-adão."`. Nesse caso, o estoque não muda;
- `404` se a planta não existir.

### Valor total do estoque: `GET /plantas/estoque/valor-total`

Soma `preco × estoque` de todas as plantas e o total de vasos.

Resposta `200`:

```json
{ "valorTotalEmCentavos": 99900, "totalDeVasos": 10 }
```

Com a loja vazia, os dois valores vêm zerados.

## Erros e status HTTP

Os erros respondem em JSON, com uma mensagem explicando o problema:

```json
{ "message": "estoque deve ser um número inteiro maior ou igual a zero." }
```

| Status | Quando |
|---|---|
| `400` | Dados inválidos no cadastro, na edição, nos filtros ou na venda; id que não é um número inteiro positivo; estoque insuficiente; corpo com JSON mal formatado |
| `404` | A planta não existe (ou a rota não existe) |
| `500` | Erro inesperado no servidor |

Os erros específicos de cada rota estão na seção dela, acima.

## Decisões e bônus

**Bônus feitos:** busca por nome, ordenação e a rota de plantas esgotadas. O script de seed não foi feito.

**Duas vendas ao mesmo tempo do último vaso.** Se a venda só conferisse o estoque e depois subtraísse, duas compras simultâneas poderiam passar na conferência e deixar o estoque em `-1`. Por isso, a subtração é feita num único comando no banco, que só diminui o estoque se ele ainda for suficiente (`updateMany` com `estoque >= quantidade`). Se outra venda chegou antes, nada muda e a API responde `400`. Testei com 5 vendas simultâneas de uma planta com 1 vaso: uma foi aceita, quatro foram recusadas e o estoque terminou em 0.

Outras decisões:

- Para saber se um campo foi enviado, comparo com `undefined` em vez de usar `!campo`, para não recusar `estoque: 0` nem `petFriendly: false`.
- Os números inteiros têm um limite (2.147.483.647, o máximo de uma coluna `Int` no PostgreSQL). Um valor maior responde `400` em vez de causar um erro `500` no banco.
- A busca por nome ignora maiúsculas, mas não acentos: `?nome=adao` não encontra "Costela-de-adão".
- Um corpo com JSON mal formatado responde `400` com mensagem em JSON, em vez da página de erro em HTML que o Express mostra por padrão.
