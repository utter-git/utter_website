import { useEffect, useRef } from "react";

const signalColors = ["#80d6a3", "#f58aa6", "#e4b65e", "#78c7d8"];

function SignalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!canvas || !ctx || reduceMotion.matches) return;

    const drawingCanvas = canvas;
    const drawingCtx = ctx;
    let width = 0;
    let height = 0;
    let animationFrame = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      drawingCanvas.width = Math.floor(width * dpr);
      drawingCanvas.height = Math.floor(height * dpr);
      drawingCanvas.style.width = `${width}px`;
      drawingCanvas.style.height = `${height}px`;
      drawingCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(now: number) {
      drawingCtx.clearRect(0, 0, width, height);
      drawingCtx.globalCompositeOperation = "lighter";

      const centerY = height * 0.55;
      const baseX = width * 0.48;
      const columns = Math.max(22, Math.floor(width / 36));
      const gap = width / columns;

      for (let index = 0; index < columns; index += 1) {
        const x = index * gap + gap * 0.5;
        const drift = Math.sin(now * 0.001 + index * 0.42);
        const proximity =
          1 - Math.min(1, Math.abs(x - baseX) / (width * 0.55));
        const barHeight =
          (46 + Math.sin(now * 0.0015 + index * 0.8) * 34) *
          (0.35 + proximity * 1.6);
        const alpha = 0.08 + proximity * 0.18;

        drawingCtx.fillStyle = `${signalColors[index % signalColors.length]}${Math.round(
          alpha * 255,
        )
          .toString(16)
          .padStart(2, "0")}`;
        drawingCtx.fillRect(
          x,
          centerY - barHeight * 0.5 + drift * 18,
          2,
          barHeight,
        );
      }

      drawingCtx.globalCompositeOperation = "source-over";
      animationFrame = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    animationFrame = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return <canvas ref={canvasRef} id="signal" />;
}

export default function App() {
  return (
    <>
      <div className="visual" aria-hidden="true">
        <SignalCanvas />
      </div>
      <div className="grain" aria-hidden="true" />

      <main>
        <section className="hero" aria-labelledby="headline">
          <div className="brand">
            <div className="mark" aria-hidden="true">
              <span />
            </div>
            <span>utter</span>
          </div>

          <h1 id="headline">Já, já.</h1>
          <p className="copy">
            A Utter está quase pronta. Em breve, este será o lugar para conhecer
            o que estamos construindo.
          </p>

          <div className="status">Disponível em breve</div>
        </section>

        <footer className="footer">
          <span>Utter estará disponível em breve.</span>
          <nav className="contacts" aria-label="Contatos">
            <span>Contato</span>
            <a
              href="https://www.linkedin.com/company/utterbr"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
          </nav>
        </footer>
      </main>
    </>
  );
}
