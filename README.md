# front-end-bot_ia_sites

Painel web mínimo em **React** (Vite) para configurar o backend **bot_ia_sites** (FastAPI em `D:\projetos\bot_ia_sites`), que expõe `POST /config`, `POST /chat`, `GET /widget.js`, etc.

Este repositório existe para **não misturar** a interface de configuração com o código do bot/API. No futuro você pode evoluir para login, múltiplos ambientes, preview do widget, histórico de configurações, etc.


---

## O que faz hoje (v0.1)

- Uma única página com:
  - **URL base da API** — onde o FastAPI está rodando (padrão: `http://localhost:8000`).
  - **ADMIN_TOKEN** (opcional no formulário) — se preenchido, enviado no header `X-ADMIN-TOKEN` no `POST /config` (deve coincidir com `ADMIN_TOKEN` no backend).
  - **GROK_API_KEY** — chave da Grok enviada no corpo do `POST /config`.
  - **BASE_URL** — URL do site cujo conteúdo será usado como contexto (RAG), também no `POST /config`.
- Ao enviar o formulário, chama:

  `POST {API_BASE}/config`

  com header `X-ADMIN-TOKEN` quando o campo token estiver preenchido, e JSON:

  ```json
  {
    "GROK_API_KEY": "...",
    "BASE_URL": "https://..."
  }
  ```

  Em **401**, a página mostra a mensagem retornada pela API (token ausente/incorreto ou servidor sem `ADMIN_TOKEN`).

- Exibe mensagem de sucesso/erro e, se a API retornar `config.widget_script_url`, mostra o snippet `<script src="..."></script>` para embutir o widget.

---

## Pré-requisitos

- **Node.js** 18+ (recomendado 20 LTS) e npm.
- Backend **bot_ia_sites** rodando (ex.: `uvicorn app.views.api:app --host 0.0.0.0 --port 8000`) com **CORS** habilitado para o domínio deste front (em desenvolvimento o Vite usa outra origem que `localhost:8000`).

---

## Como rodar em desenvolvimento

1. Na raiz deste projeto:

   ```bash
   npm install
   ```

2. (Opcional) Copie `.env.example` para `.env` e ajuste:

   ```bash
   cp .env.example .env
   ```

   Variáveis suportadas:

   | Variável              | Descrição                                      |
   | --------------------- | ---------------------------------------------- |
   | `VITE_API_BASE_URL`   | URL base do FastAPI, sem `/` no final.       |
   | `VITE_ADMIN_TOKEN`    | (Opcional) Pré-preenche o campo do token admin no painel. Evite expor em builds públicos. |

3. Inicie o Vite:

   ```bash
   npm run dev
   ```

4. Abra o endereço indicado no terminal (geralmente `http://localhost:5173`).

---

## Build para produção

```bash
npm run build
```

Saída em `dist/`. Sirva com qualquer servidor estático ou CDN. Lembre-se de definir `VITE_API_BASE_URL` **no momento do build** (variáveis `VITE_*` são embutidas no bundle) apontando para a URL **pública** da API.

---

## Relação com o backend (bot_ia_sites)

| Front (este projeto) | Backend (bot_ia_sites) |
| -------------------- | ---------------------- |
| `POST /config`       | `app/views/api.py` — exige `X-ADMIN-TOKEN` (= `ADMIN_TOKEN` no servidor); aplica `GROK_API_KEY` e `BASE_URL` no processo |
| (futuro) preview     | `GET /widget.js` — script do chat |
| (futuro) teste chat  | `POST /chat` — mensagens do widget |

O front **não** implementa o widget em si; apenas ajuda a configurar a API e exibir o link do script retornado.

---

## Melhorias sugeridas (roadmap)

- **Segurança:** não logar nem persistir chaves no navegador além do necessário; em produção, preferir fluxo onde a chave não passa por um front público (ou usar backend próprio que guarda segredos).
- **Validação:** feedback visual para URL inválida, máscara opcional para a chave.
- **Ambientes:** seletor “Local / Staging / Produção” com URLs pré-definidas.
- **Teste do widget:** iframe ou link “Abrir página de demo” que carrega `widget.js` da API configurada.
- **Autenticação:** quando o backend tiver auth, login e token Bearer aqui.
- **Testes:** Vitest + Testing Library nos componentes do formulário.
- **CI:** lint (ESLint), format (Prettier), `npm run build` em pipeline.

---

## Estrutura de pastas

```
front-end-bot_ia_sites/
├── README.md           ← este arquivo
├── package.json
├── vite.config.js
├── index.html
├── .env.example
└── src/
    ├── main.jsx        ← entrada React
    ├── App.jsx         ← página de configuração + fetch /config
    ├── App.css
    └── index.css
```

---

## Licença

Defina conforme o restante dos seus projetos (ex.: MIT, proprietário).
