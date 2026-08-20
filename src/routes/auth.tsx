import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { MandottiLogo } from "@/components/MandottiLogo";
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
 * Fundo em duas camadas, com posições fixas (sem Math.random) para não divergir
 * entre renders: brilhos difusos de atmosfera e, sobre eles, um aglomerado de
 * gotas que se sobrepõem para o filtro gooey fundi-las numa massa líquida.
 */
const GLOWS = [
  { size: 46, left: -6, top: -4, delay: -4, duration: 30, tint: "rgba(96,108,56,0.55)" },
  { size: 38, left: 72, top: 4, delay: -13, duration: 34, tint: "rgba(221,161,94,0.34)" },
  { size: 42, left: 60, top: 66, delay: -19, duration: 31, tint: "rgba(40,54,24,0.5)" },
  { size: 26, left: 4, top: 72, delay: -8, duration: 26, tint: "rgba(188,108,37,0.24)" },
];

const DROPS = [
  { size: 250, left: 22, top: 34, delay: -3, duration: 19, from: "#606c38", to: "#283618" },
  { size: 190, left: 34, top: 62, delay: -9, duration: 23, from: "#dda15e", to: "#bc6c25" },
  { size: 210, left: 70, top: 40, delay: -14, duration: 21, from: "#606c38", to: "#283618" },
  { size: 160, left: 60, top: 68, delay: -6, duration: 17, from: "#9aa56e", to: "#283618" },
  { size: 130, left: 82, top: 22, delay: -11, duration: 25, from: "#dda15e", to: "#bc6c25" },
];

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  const parallaxRefs = useRef<(HTMLDivElement | null)[]>([]);
  const markRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      const mustChange = data.session.user.user_metadata?.["must_change_password"];
      navigate({ to: mustChange ? "/trocar-senha" : "/dashboard" });
    });
  }, [navigate]);

  // Parallax nas bolhas + inclinação 3D da marca acompanhando o ponteiro.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;

      parallaxRefs.current.forEach((blob, index) => {
        if (!blob) return;
        const speed = (index + 1) * 14;
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const mustChange = data.user?.user_metadata?.["must_change_password"];
    navigate({ to: mustChange ? "/trocar-senha" : "/dashboard" });
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

      <div className="glows" aria-hidden="true">
        {GLOWS.map((glow, index) => (
          <div
            key={index}
            ref={(el) => {
              parallaxRefs.current[index] = el;
            }}
            className="glow"
            style={{
              width: `${glow.size}vmax`,
              height: `${glow.size}vmax`,
              left: `${glow.left}%`,
              top: `${glow.top}%`,
              animationDelay: `${glow.delay}s`,
              animationDuration: `${glow.duration}s`,
              background: `radial-gradient(circle at 38% 32%, ${glow.tint}, transparent 70%)`,
            }}
          />
        ))}
      </div>

      <div className="ambient" aria-hidden="true">
        {DROPS.map((drop, index) => (
          <div
            key={index}
            className="ambient-drop"
            style={{
              width: `${drop.size}px`,
              height: `${drop.size}px`,
              left: `${drop.left}%`,
              top: `${drop.top}%`,
              animationDelay: `${drop.delay}s`,
              animationDuration: `${drop.duration}s`,
              background: `linear-gradient(135deg, ${drop.from}, ${drop.to})`,
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
                <div className="mark-plate">
                  <MandottiLogo hires className="mark-logo" />
                </div>
              </div>
            </div>
          </div>

          <span className="brand-id">Grupo Mandotti</span>
          <h1>ACESSO INTEGRADO</h1>
        </header>

        <form autoComplete="on" onSubmit={entrar}>
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
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          <div className="submit-wrap">
            <span className="submit-liquid" aria-hidden="true" />
            <button type="submit" className="btn-base" disabled={carregando}>
              {carregando ? "Entrando..." : "Entrar na plataforma"}
            </button>
          </div>
        </form>

        <footer className="footer-nav">
          <button type="button" onClick={recuperarSenha}>
            Recuperar acesso
          </button>
        </footer>
      </main>
    </div>
  );
}

const AUTH_CSS = `
.mandotti-auth {
  --m-bg: #283618;
  --m-leaf: #606c38;
  --m-green: #606c38;
  --m-green-deep: #283618;
  --m-amber: #dda15e;

  /* Paleta da empresa */
  --m-logo-leaf: #606c38;
  --m-logo-field: #283618;
  --m-logo-seed: #bc6c25;
  --m-ink: #fefae0;
  --m-dim: rgba(254, 250, 224, 0.55);
  --m-line: rgba(254, 250, 224, 0.14);
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
    radial-gradient(1200px 700px at 12% -8%, rgba(96, 108, 56, 0.4), transparent 60%),
    radial-gradient(900px 600px at 96% 6%, rgba(221, 161, 94, 0.22), transparent 55%),
    var(--m-bg);
  color: var(--m-ink);
  font-family: var(--font-sans, "Plus Jakarta Sans", system-ui, sans-serif);
}

.mandotti-auth *,
.mandotti-auth *::before,
.mandotti-auth *::after { box-sizing: border-box; }

.mandotti-auth .svg-filter-hidden { position: absolute; width: 0; height: 0; }

/* ---------- Fundo: brilhos difusos ---------- */
.mandotti-auth .glows {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.mandotti-auth .glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  animation: mandotti-float 30s infinite alternate ease-in-out;
  transition: margin 0.3s ease-out;
}

/* ---------- Fundo: massa líquida ---------- */
.mandotti-auth .ambient {
  position: absolute;
  inset: -10%;
  z-index: 0;
  /* As gotas se sobrepõem: o gooey funde os contornos em vez de recortá-los */
  filter: var(--m-goo) blur(2px);
  opacity: 0.42;
  pointer-events: none;
}

.mandotti-auth .ambient-drop {
  position: absolute;
  border-radius: 50%;
  filter: blur(18px);
  box-shadow:
    inset -18px -18px 40px rgba(4, 16, 8, 0.55),
    14px 14px 50px rgba(96, 108, 56, 0.14);
  animation: mandotti-float 22s infinite alternate ease-in-out;
}

@keyframes mandotti-float {
  0%   { transform: translate(0, 0) scale(1); }
  33%  { transform: translate(5vw, 7vh) scale(1.14); }
  66%  { transform: translate(-4vw, 4vh) scale(0.9); }
  100% { transform: translate(3vw, -5vh) scale(1.07); }
}

/* ---------- Marca 3D + massa líquida alinhada ao ícone ---------- */
.mandotti-auth .brand-stage {
  position: relative;
  width: 176px;
  height: 176px;
  margin-bottom: 30px;
}

/* A massa líquida extrapola o disco para virar halo em volta da marca */
.mandotti-auth .liquid {
  position: absolute;
  inset: -22%;
  filter: var(--m-goo);
  opacity: 0.62;
}

.mandotti-auth .drop {
  position: absolute;
  border-radius: 50%;
  filter: blur(5px);
  animation: mandotti-pulse 9s infinite alternate ease-in-out;
}

/*
 * Cada gota espelha a posição real da arte dentro do PNG 512x512 da marca, então
 * a massa líquida funciona como aura do ícone e não como silhueta paralela.
 * Medido no arquivo oficial: folha centro 50%/38% (35x58), curvas centro 50%/75%
 * (70x32, largura cheia) e semente centro 50%/78% (10x18).
 */
.mandotti-auth .drop-leaf {
  left: 50%;
  top: 38%;
  width: 40%;
  height: 64%;
  transform: translate(-50%, -50%);
  border-radius: 50% 50% 46% 46% / 62% 62% 38% 38%;
  background: linear-gradient(150deg, #0a9d48, var(--m-logo-leaf) 55%, var(--m-logo-field));
}

.mandotti-auth .drop-arc {
  top: 75%;
  width: 40%;
  height: 36%;
  background: linear-gradient(120deg, var(--m-logo-leaf), var(--m-logo-field));
  animation-duration: 11s;
}

.mandotti-auth .drop-arc-left {
  left: 31%;
  transform: translate(-50%, -50%);
  border-radius: 60% 40% 46% 54% / 58% 52% 48% 42%;
}

.mandotti-auth .drop-arc-right {
  left: 69%;
  transform: translate(-50%, -50%);
  border-radius: 40% 60% 54% 46% / 52% 58% 42% 48%;
}

.mandotti-auth .drop-seed {
  left: 50%;
  top: 78%;
  width: 16%;
  height: 24%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle at 34% 28%, #f2cd7a, var(--m-logo-seed) 60%, #8f6207);
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
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.35s cubic-bezier(0.2, 1, 0.3, 1);
  animation: mandotti-bob 7s infinite alternate ease-in-out;
}

/*
 * A marca oficial é verde-escura, então precisa de base clara para as nervuras
 * brancas e as curvas de plantio aparecerem — sobre o fundo escuro ela sumia.
 */
.mandotti-auth .mark-plate {
  display: grid;
  place-items: center;
  width: 84%;
  height: 84%;
  border-radius: 50%;
  background: radial-gradient(circle at 34% 26%, #ffffff, #f1f7f1 56%, #d9e7db);
  box-shadow:
    inset 0 -12px 26px rgba(22, 71, 44, 0.18),
    0 22px 46px rgba(3, 18, 9, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.5);
}

.mandotti-auth .mark-logo {
  width: 78%;
  height: 78%;
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
  font-size: clamp(2rem, 7vw, 2.85rem);
  line-height: 1;
  letter-spacing: -1.5px;
  color: var(--m-ink);
  white-space: nowrap;
}

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
  background: rgba(254, 250, 224, 0.06);
  border: 1px solid var(--m-line);
  border-radius: 999px;
  color: var(--m-ink);
  padding: 14px 22px;
  font-size: 17px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.35s, box-shadow 0.35s, background 0.35s;
}

.mandotti-auth .form-group input:focus {
  border-color: rgba(96, 108, 56, 0.9);
  background: rgba(254, 250, 224, 0.1);
  box-shadow: 0 0 0 3px rgba(96, 108, 56, 0.28);
}

.mandotti-auth .form-group input::placeholder { color: rgba(241, 247, 241, 0.28); }

/* Autofill do navegador não pode voltar o campo para fundo branco */
.mandotti-auth .form-group input:-webkit-autofill,
.mandotti-auth .form-group input:-webkit-autofill:hover,
.mandotti-auth .form-group input:-webkit-autofill:focus {
  border-radius: 999px;
  -webkit-text-fill-color: var(--m-ink);
  -webkit-box-shadow: 0 0 0 1000px #243318 inset;
  caret-color: var(--m-ink);
}

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
  pointer-events: none;
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

/* ---------- Rodapé ---------- */
.mandotti-auth .footer-nav {
  display: flex;
  align-items: center;
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

.mandotti-auth :focus-visible {
  outline: 2px solid var(--m-leaf);
  outline-offset: 3px;
}

@media (min-width: 900px) {
  .mandotti-auth .brand-stage { width: 206px; height: 206px; }
}

@media (prefers-reduced-motion: reduce) {
  .mandotti-auth .glow,
  .mandotti-auth .ambient-drop,
  .mandotti-auth .drop,
  .mandotti-auth .mark-tilt { animation: none; }
  .mandotti-auth .form-group,
  .mandotti-auth .submit-liquid,
  .mandotti-auth .mark-tilt { transition: none; }
}
`;
