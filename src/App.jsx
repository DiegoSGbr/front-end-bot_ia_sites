import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./App.css";

const apiBase =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

/** Mesmo valor que ADMIN_TOKEN no backend; injetado no build (Render: variável de ambiente). */
const adminToken = (import.meta.env.VITE_ADMIN_TOKEN ?? "").trim();

export default function App() {
  const canvasRef = useRef(null);
  const [grokApiKey, setGrokApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 90;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const particlesCount = 2000;
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i += 1) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 260;
      positions[i3 + 1] = (Math.random() - 0.5) * 260;
      positions[i3 + 2] = (Math.random() - 0.5) * 260;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      size: 0.85,
      color: 0x8fb6ff,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const mouse = { x: 0, y: 0 };
    const targetRotation = { x: 0, y: 0 };
    const targetCamera = { x: 0, y: 0 };

    let frameId = 0;
    const animate = () => {
      targetRotation.y = mouse.x * 0.35;
      targetRotation.x = mouse.y * 0.2;
      targetCamera.x = mouse.x * 6;
      targetCamera.y = mouse.y * 3;

      points.rotation.y += (targetRotation.y - points.rotation.y) * 0.03;
      points.rotation.x += (targetRotation.x - points.rotation.x) * 0.03;
      camera.position.x += (targetCamera.x - camera.position.x) * 0.02;
      camera.position.y += (-targetCamera.y - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const onMouseMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (event.clientY / window.innerHeight) * 2 - 1;
    };

    const onMouseLeave = () => {
      mouse.x = 0;
      mouse.y = 0;
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.cancelAnimationFrame(frameId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

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
    <>
      <div className="bg3d" aria-hidden="true">
        <canvas ref={canvasRef} />
      </div>
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
          <div
            className={`banner ${result.config?.index_ok === false ? "warning" : "success"}`}
          >
            <p>
              <strong>{result.message}</strong>
            </p>
            {result.config?.index_ok === false && (
              <p className="hint">
                O conteúdo do site não foi indexado corretamente (
                {result.config?.context_chars ?? 0} caracteres). Confira a URL e tente
                novamente; sites com proteção JavaScript podem exigir alguns minutos no
                primeiro deploy.
              </p>
            )}
            {result.config?.index_ok !== false && result.config?.context_chars != null && (
              <p className="hint">
                Conteúdo indexado: {result.config.context_chars} caracteres do site.
              </p>
            )}
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
        <p className="contact-label">Contato / redes</p>
        <div className="useful-links contact-links">
          <a
            className="link-chip"
            href="https://api.whatsapp.com/send/?phone=%2B5534984150460&text=Ola%21&type=phone_number&app_absent=0"
            target="_blank"
            rel="noopener noreferrer"
            title="Falar no WhatsApp"
          >
            <img
              className="link-icon link-icon-whatsapp"
              src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
              alt="WhatsApp"
            />
            <span>WhatsApp</span>
          </a>
          <a
            className="link-chip"
            href="https://github.com/DiegoSGbr"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub — DiegoSGbr"
          >
            <img
              className="link-icon link-icon-github"
              src="https://cdn.simpleicons.org/github/e9ebef"
              alt="GitHub"
            />
            <span>GitHub</span>
          </a>
          <a
            className="link-chip"
            href="https://www.linkedin.com/in/diegosgbr/"
            target="_blank"
            rel="noopener noreferrer"
            title="LinkedIn — Diego SG"
          >
            <img
              className="link-icon link-icon-linkedin"
              src="https://cdn.simpleicons.org/linkedin/0A66C2"
              alt="LinkedIn"
            />
            <span>LinkedIn</span>
          </a>
        </div>
      </footer>
      </div>
    </>
  );
}
