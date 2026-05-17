import { useState } from "react";
import "./App.css";

const apiBase =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

/** Mesmo valor que ADMIN_TOKEN no backend; injetado no build (Render: variável de ambiente). */
const adminToken = (import.meta.env.VITE_ADMIN_TOKEN ?? "").trim();

export default function App() {
  const [grokApiKey, setGrokApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    if (!adminToken) {
      setError(
        "O painel não está configurado para enviar a configuração. Defina VITE_ADMIN_TOKEN no deploy do front-end (mesmo valor que ADMIN_TOKEN na API)."
      );
      setLoading(false);
      return;
    }

    const url = `${apiBase.replace(/\/$/, "")}/config`;
    const headers = {
      "Content-Type": "application/json",
      "X-ADMIN-TOKEN": adminToken,
    };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          GROK_API_KEY: grokApiKey.trim(),
          BASE_URL: baseUrl.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          const detail = data.detail;
          const msg =
            typeof detail === "string"
              ? detail
              : Array.isArray(detail)
                ? detail
                    .map((item) =>
                      typeof item === "object" && item?.msg != null
                        ? item.msg
                        : JSON.stringify(item)
                    )
                    .join(" ")
                : null;
          setError(
            msg ||
              "Não foi possível aplicar a configuração. Verifique sua chave Grok e a URL do site e tente novamente."
          );
          return;
        }
        setError(
          data.detail
            ? typeof data.detail === "string"
              ? data.detail
              : JSON.stringify(data.detail)
            : res.statusText || `Erro HTTP ${res.status}`
        );
        return;
      }
      setResult(data);
    } catch (err) {
      setError(
        err?.message ||
          "Não foi possível conectar à API. Verifique se o backend está rodando e a URL base."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="header">
        <h1>Chatbot para atendimento online com IA Especialista no seu Site </h1>
        <p className="lead">
        <br />
          Serviço gratuito.<br />
          Para configurar o chatbot, basta fornecer uma chave Grok e a URL de seu site.<br />
          Enviar para nosso serviço, copiar o script "widget chat" gerado e colar na pagina de seu site.<br />
          Pronto, chatbot especialista no seu site ativado e funcionando.<br />
        </p>
        <p className="lead">
          <br />
          Links uteis para configurar o chatbot:
        </p>
        <div className="useful-links">
          <a
            className="link-chip"
            href="https://grok.com/"
            target="_blank"
            rel="noopener noreferrer"
            title="Não possui chave Grok? Clique aqui para criar uma conta e obter uma chave gratuita."
          >
            <img
              className="link-icon link-icon-grok"
              src="https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/grok.png"
              alt="Grok"
            />
            <span>Grok</span>
          </a>
          <a
            className="link-chip"
            href="https://youtu.be/bLFhUd9NUKo"
            target="_blank"
            rel="noopener noreferrer"
            title="Tutorial como gerar chave Grok"
          >
            <img
              className="link-icon link-icon-youtube"
              src="https://logosmarcas.net/wp-content/uploads/2020/04/YouTube-S%C3%ADmbolo.jpg"
              alt="Tutorial YouTube"
            />
            <span>Tutorial</span>
          </a>
        </div>
      </header>

      <main className="card">
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Sua chave Grok IA</span>
            <input
              type="password"
              autoComplete="off"
              value={grokApiKey}
              onChange={(e) => setGrokApiKey(e.target.value)}
              placeholder="gsk_..."
              required
            />
          </label>

          <label className="field">
            <span>URL do site</span>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://exemplo.com/"
              required
            />
          </label>

          <button type="submit" className="submit" disabled={loading}>
            {loading ? "Enviando…" : "Aplicar configuração"}
          </button>
        </form>

        {error && (
          <div className="banner error" role="alert">
            {error}
          </div>
        )}

        {result && (
          <div className="banner success">
            <p>
              <strong>{result.message}</strong>
            </p>
            {result.config?.widget_script_url && (
              <p className="embed">
                <span>Script do widget:</span>
                <code>
                  {`<script src="${result.config.widget_script_url}"></script>`}
                </code>
              </p>
            )}
            <details className="raw">
              <summary>Resposta JSON completa</summary>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </details>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>
          Projeto <code>bot_ia_sites</code> (FastAPI).
        </p>
      </footer>
    </div>
  );
}
