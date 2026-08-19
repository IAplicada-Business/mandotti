import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { MandottiMark } from "@/components/MandottiMark";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar | Sistema Grupo Mandotti" },
      {
        name: "description",
        content: "Acesse a plataforma de gestão agrícola do Grupo Mandotti.",
      },
      { property: "og:title", content: "Entrar | Sistema Grupo Mandotti" },
      {
        property: "og:description",
        content: "Acesse a plataforma de gestão agrícola do Grupo Mandotti.",
      },
    ],
  }),
  component: AuthPage,
});

/**
 * Bolhas de fundo: posições fixas (sem Math.random) para não divergir entre
 * renders e para manter a composição alinhada à marca.
 */
const AMBIENT = [
  { size: 520, left: 4, top: 6, delay: -4, duration: 26, from: "#3f7d49", to: "#16301a" },
  { size: 420, left: 76, top: 12, delay: -12, duration: 32, from: "#7fa832", to: "#2e6636" },
  { size: 460, left: 64, top: 72, delay: -18, duration: 29, from: "#2e6636", to: "#0d2412" },
  { size: 280, left: 12, top: 76, delay: -8, duration: 24, from: "#c99012", to: "#6e5537" },
];

type Modo = "entrar" | "cadastrar";

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [carregando, setCarregando] = useState(false);

  const ambientRefs = useRef<(HTMLDivElement | null)[]>([]);
  const markRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  // Parallax nas bolhas + inclinação 3D da marca acompanhando o ponteiro.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;

      ambientRefs.current.forEach((blob, index) => {
        if (!blob) return;
        const speed = (index + 1) * 18;
        blob.style.marginLeft = `${(x - 0.5) * speed}px`;
        blob.style.marginTop = `${(y - 0.5) * speed}px`;
      });

      if (markRef.current) {
        markRef.current.style.transform = `rotateX(${(0.5 - y) * 16}deg) rotateY(${(x - 0.5) * 22}deg)`;
      }
    };

    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/dashboard" });
  };

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { nome },
      },
    });
    setCarregando(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cadastro criado. Verifique seu e-mail se a confirmação estiver ativa.");
  };

  const recuperarSenha = async () => {
    if (!email) {
      toast.info("Informe o e-mail acima para receber o link de recuperação.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Link de recuperação enviado para o seu e-mail.");
  };

  return (
    <div className="mandotti-auth">
      <style>{AUTH_CSS}</style>

      <svg className="svg-filter-hidden" aria-hidden="true">
        <defs>
          <filter id="mandotti-gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="ambient" aria-hidden="true">
        {AMBIENT.map((blob, index) => (
          <div
            key={index}
            ref={(el) => {
              ambientRefs.current[index] = el;
            }}
            className="ambient-blob"
            style={{
              width: `${blob.size}px`,
              height: `${blob.size}px`,
              left: `${blob.left}%`,
              top: `${blob.top}%`,
              animationDelay: `${blob.delay}s`,
              animationDuration: `${blob.duration}s`,
              background: `linear-gradient(135deg, ${blob.from}, ${blob.to})`,
            }}
          />
        ))}
      </div>

      <main className="auth-container">
        <header className="header">
          {/* Massa líquida com a silhueta do ícone: folha, curvas de plantio e semente */}
          <div className="brand-stage">
            <div className="liquid" aria-hidden="true">
              <span className="drop drop-leaf" />
              <span className="drop drop-arc drop-arc-left" />
              <span className="drop drop-arc drop-arc-right" />
              <span className="drop drop-seed" />
            </div>
            <div className="mark-3d">
              <div className="mark-tilt" ref={markRef}>
                <MandottiMark />
              </div>
            </div>
          </div>

          <span className="brand-id">Grupo Mandotti · Pedro Afonso / TO</span>
          <h1>
            ACESSO
            <br />
            INTEGRADO
          </h1>
          <p className="brand-sub">Gestão agrícola, fiscal e financeira em um só lugar.</p>
        </header>

        <nav className="mode-switch" aria-label="Alternar entre entrar e criar conta">
          {(["entrar", "cadastrar"] as Modo[]).map((valor) => (
            <button
              key={valor}
              type="button"
              className={modo === valor ? "mode-btn is-active" : "mode-btn"}
              aria-pressed={modo === valor}
              onClick={() => setModo(valor)}
            >
              {valor === "entrar" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </nav>

        <form autoComplete="on" onSubmit={modo === "entrar" ? entrar : cadastrar}>
          {modo === "cadastrar" ? (
            <div className="form-group">
              <label htmlFor="nome">Nome completo</label>
              <input
                id="nome"
                name="nome"
                type="text"
                required
                autoComplete="name"
                placeholder="Eder Mandotti"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              <span className="input-glow" />
            </div>
          ) : null}

          <div className="form-group">
            <label htmlFor="email">E-mail corporativo</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="nome@grupomandotti.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <span className="input-glow" />
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              minLength={modo === "cadastrar" ? 6 : undefined}
              autoComplete={modo === "entrar" ? "current-password" : "new-password"}
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <span className="input-glow" />
          </div>

          <div className="submit-wrap">
            <span className="submit-liquid" aria-hidden="true" />
            <button type="submit" className="btn-base" disabled={carregando}>
              {carregando
                ? modo === "entrar"
                  ? "Entrando..."
                  : "Criando..."
                : modo === "entrar"
                  ? "Entrar na plataforma"
                  : "Criar minha conta"}
            </button>
          </div>

          {modo === "cadastrar" ? (
            <p className="fine-print">
              Novas contas entram como <strong>visualizador</strong>. Um administrador ajusta o
              papel depois.
            </p>
          ) : null}
        </form>

        <footer className="footer-nav">
          <button type="button" onClick={recuperarSenha}>
            Recuperar acesso
          </button>
          <span className="footer-meta">Ambiente interno · 4 emissores</span>
        </footer>
      </main>
    </div>
  );
}

const AUTH_CSS = `
.mandotti-auth {
  --m-bg: #07130c;
  --m-leaf: #7fa832;
  --m-green: #3f7d49;
  --m-green-deep: #16301a;
  --m-amber: #c99012;
  --m-ink: #f1f7f1;
  --m-dim: rgba(241, 247, 241, 0.55);
  --m-line: rgba(241, 247, 241, 0.14);
  --m-goo: url('#mandotti-gooey');

  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  overflow: hidden;
  padding: 48px 20px;
  background:
    radial-gradient(1200px 700px at 12% -8%, rgba(63, 125, 73, 0.28), transparent 60%),
    radial-gradient(900px 600px at 96% 6%, rgba(127, 168, 50, 0.18), transparent 55%),
    var(--m-bg);
  color: var(--m-ink);
  font-family: var(--font-sans, "Plus Jakarta Sans", system-ui, sans-serif);
}

.mandotti-auth *,
.mandotti-auth *::before,
.mandotti-auth *::after { box-sizing: border-box; }

.mandotti-auth .svg-filter-hidden { position: absolute; width: 0; height: 0; }

/* ---------- Fundo ---------- */
.mandotti-auth .ambient {
  position: absolute;
  inset: 0;
  z-index: 0;
  filter: var(--m-goo);
  opacity: 0.5;
  pointer-events: none;
}

.mandotti-auth .ambient-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(26px);
  box-shadow:
    inset -14px -14px 30px rgba(4, 16, 8, 0.6),
    12px 12px 40px rgba(127, 168, 50, 0.12);
  animation: mandotti-float 26s infinite alternate ease-in-out;
  transition: margin 0.25s ease-out;
}

@keyframes mandotti-float {
  0%   { transform: translate(0, 0) scale(1); }
  33%  { transform: translate(6vw, 8vh) scale(1.15); }
  66%  { transform: translate(-4vw, 5vh) scale(0.9); }
  100% { transform: translate(3vw, -6vh) scale(1.08); }
}

/* ---------- Marca 3D + massa líquida alinhada ao ícone ---------- */
.mandotti-auth .brand-stage {
  position: relative;
  width: 168px;
  height: 168px;
  margin-bottom: 28px;
}

.mandotti-auth .liquid {
  position: absolute;
  inset: -18%;
  filter: var(--m-goo);
  opacity: 0.85;
}

.mandotti-auth .drop {
  position: absolute;
  border-radius: 50%;
  filter: blur(6px);
  animation: mandotti-pulse 9s infinite alternate ease-in-out;
}

/* Folha */
.mandotti-auth .drop-leaf {
  left: 50%;
  top: 30%;
  width: 44%;
  height: 62%;
  transform: translate(-50%, -50%);
  border-radius: 50% 50% 46% 46% / 64% 64% 36% 36%;
  background: linear-gradient(150deg, var(--m-leaf), var(--m-green) 58%, var(--m-green-deep));
}

/* Curvas de plantio */
.mandotti-auth .drop-arc {
  top: 74%;
  width: 46%;
  height: 34%;
  background: linear-gradient(120deg, var(--m-green), var(--m-green-deep));
  animation-duration: 11s;
}

.mandotti-auth .drop-arc-left {
  left: 16%;
  transform: translate(-50%, -50%);
  border-radius: 60% 40% 46% 54% / 58% 52% 48% 42%;
}

.mandotti-auth .drop-arc-right {
  left: 84%;
  transform: translate(-50%, -50%);
  border-radius: 40% 60% 54% 46% / 52% 58% 42% 48%;
}

/* Semente */
.mandotti-auth .drop-seed {
  left: 50%;
  top: 84%;
  width: 20%;
  height: 26%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle at 34% 28%, #f2cd7a, var(--m-amber) 60%, #8f6207);
  animation-duration: 7s;
}

@keyframes mandotti-pulse {
  0%   { transform: translate(-50%, -50%) scale(1); }
  50%  { transform: translate(-50%, -52%) scale(1.08); }
  100% { transform: translate(-50%, -50%) scale(0.96); }
}

.mandotti-auth .mark-3d {
  position: absolute;
  inset: 0;
  perspective: 700px;
  z-index: 2;
}

.mandotti-auth .mark-tilt {
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.35s cubic-bezier(0.2, 1, 0.3, 1);
  animation: mandotti-bob 7s infinite alternate ease-in-out;
  filter:
    drop-shadow(0 18px 32px rgba(4, 16, 8, 0.75))
    drop-shadow(0 0 26px rgba(127, 168, 50, 0.35));
}

@keyframes mandotti-bob {
  0%   { translate: 0 -4px; }
  100% { translate: 0 6px; }
}

/* ---------- Cabeçalho ---------- */
.mandotti-auth .auth-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 460px;
}

.mandotti-auth .header { margin-bottom: 44px; }

.mandotti-auth .brand-id {
  display: block;
  font-family: var(--font-mono, "JetBrains Mono", monospace);
  font-size: 10px;
  letter-spacing: 3.5px;
  text-transform: uppercase;
  color: var(--m-dim);
  margin-bottom: 10px;
}

.mandotti-auth .header h1 {
  margin: 0;
  font-weight: 800;
  font-size: clamp(2.4rem, 8vw, 3.1rem);
  line-height: 0.92;
  letter-spacing: -2px;
  color: var(--m-ink);
}

.mandotti-auth .brand-sub {
  margin: 14px 0 0;
  font-size: 14px;
  color: var(--m-dim);
  max-width: 34ch;
}

/* ---------- Alternador ---------- */
.mandotti-auth .mode-switch {
  display: flex;
  gap: 26px;
  margin-bottom: 34px;
  border-bottom: 1px solid var(--m-line);
}

.mandotti-auth .mode-btn {
  position: relative;
  background: none;
  border: none;
  padding: 0 0 12px;
  cursor: pointer;
  color: var(--m-dim);
  font-family: var(--font-mono, "JetBrains Mono", monospace);
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  transition: color 0.3s;
}

.mandotti-auth .mode-btn::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -1px;
  width: 0;
  height: 2px;
  background: var(--m-leaf);
  box-shadow: 0 0 12px var(--m-leaf);
  transition: width 0.45s cubic-bezier(0.2, 1, 0.3, 1);
}

.mandotti-auth .mode-btn:hover { color: var(--m-ink); }
.mandotti-auth .mode-btn.is-active { color: var(--m-ink); }
.mandotti-auth .mode-btn.is-active::after { width: 100%; }

/* ---------- Formulário ---------- */
.mandotti-auth .form-group {
  position: relative;
  margin-bottom: 28px;
  transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
}

.mandotti-auth .form-group:focus-within { transform: translateX(8px); }

.mandotti-auth .form-group label {
  display: block;
  font-family: var(--font-mono, "JetBrains Mono", monospace);
  font-size: 10px;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  color: var(--m-dim);
  margin-bottom: 10px;
}

.mandotti-auth .form-group input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--m-line);
  border-radius: 0;
  color: var(--m-ink);
  padding: 12px 0;
  font-size: 17px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.4s;
}

.mandotti-auth .form-group input::placeholder { color: rgba(241, 247, 241, 0.28); }

/* Autofill do navegador não pode voltar o campo para fundo branco */
.mandotti-auth .form-group input:-webkit-autofill,
.mandotti-auth .form-group input:-webkit-autofill:hover,
.mandotti-auth .form-group input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--m-ink);
  -webkit-box-shadow: 0 0 0 1000px #0b1a10 inset;
  caret-color: var(--m-ink);
}

.mandotti-auth .input-glow {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--m-leaf);
  box-shadow: 0 0 14px var(--m-leaf);
  transition: width 0.6s cubic-bezier(0.2, 1, 0.3, 1);
}

.mandotti-auth .form-group input:focus ~ .input-glow { width: 100%; }

/* ---------- Botão líquido ---------- */
.mandotti-auth .submit-wrap {
  position: relative;
  margin-top: 40px;
  filter: var(--m-goo);
}

.mandotti-auth .submit-liquid {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  border-radius: 48px;
  background: linear-gradient(120deg, var(--m-leaf), var(--m-green));
  z-index: 1;
  transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.4s;
}

.mandotti-auth .submit-wrap:hover .submit-liquid {
  transform: translate(-50%, -50%) scale(1.04, 1.18);
  filter: brightness(1.15);
}

.mandotti-auth .btn-base {
  position: relative;
  z-index: 2;
  width: 100%;
  border: none;
  cursor: pointer;
  padding: 19px 32px;
  background: var(--m-ink);
  color: var(--m-green-deep);
  font-family: inherit;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 2px;
  text-transform: uppercase;
  transition: letter-spacing 0.3s, opacity 0.3s;
}

.mandotti-auth .btn-base:hover:not(:disabled) { letter-spacing: 3.6px; }
.mandotti-auth .btn-base:disabled { cursor: progress; opacity: 0.7; }

.mandotti-auth .fine-print {
  margin: 20px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--m-dim);
}

.mandotti-auth .fine-print strong { color: var(--m-ink); font-weight: 700; }

/* ---------- Rodapé ---------- */
.mandotti-auth .footer-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 36px;
  font-family: var(--font-mono, "JetBrains Mono", monospace);
  font-size: 10px;
  letter-spacing: 1.4px;
  text-transform: uppercase;
}

.mandotti-auth .footer-nav button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  color: var(--m-dim);
  transition: color 0.3s;
}

.mandotti-auth .footer-nav button:hover { color: var(--m-leaf); }
.mandotti-auth .footer-meta { color: rgba(241, 247, 241, 0.3); }

.mandotti-auth :focus-visible {
  outline: 2px solid var(--m-leaf);
  outline-offset: 3px;
}

@media (min-width: 900px) {
  .mandotti-auth .brand-stage { width: 196px; height: 196px; }
}

@media (prefers-reduced-motion: reduce) {
  .mandotti-auth .ambient-blob,
  .mandotti-auth .drop,
  .mandotti-auth .mark-tilt { animation: none; }
  .mandotti-auth .form-group,
  .mandotti-auth .submit-liquid,
  .mandotti-auth .mark-tilt { transition: none; }
}
`;
