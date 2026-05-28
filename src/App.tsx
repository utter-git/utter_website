import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const signalColors = ["#80d6a3", "#f58aa6", "#e4b65e", "#78c7d8"];
const logoModelUrl =
  "https://raw.githubusercontent.com/utter-git/utter_website/modelos%26%26imagens/utterlogo.glb";

type VectorTuple = [number, number, number];

type HeroModelViewerProps = {
  modelUrl: string;
  fitSize?: number;
  initialRotation?: VectorTuple;
  modelOffset?: VectorTuple;
};

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

function HeroModelViewer({
  modelUrl,
  fitSize = 3.2,
  initialRotation = [0, 0.3, 0],
  modelOffset = [0, 0, 0],
}: HeroModelViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!canvas || !container) return;

    const renderingContainer = container;
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    camera.position.set(0, 0, 7);

    const modelGroup = new THREE.Group();
    modelGroup.rotation.set(...initialRotation);
    scene.add(modelGroup);

    scene.add(new THREE.AmbientLight(0xffffff, 1.55));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(3, 4, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x80d6a3, 1.2);
    rimLight.position.set(-4, 2, 3);
    scene.add(rimLight);

    const loader = new GLTFLoader();
    let animationFrame = 0;

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        model.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;

          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

          materials.forEach((material) => {
            if (!(material instanceof THREE.MeshStandardMaterial)) return;

            material.color.set("#f6f1e8");
            material.emissive.set("#4a4a42");
            material.emissiveIntensity = 0.22;
            material.metalness = 0.2;
            material.roughness = 0.42;
            material.needsUpdate = true;
          });
        });

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxAxis = Math.max(size.x, size.y, size.z) || 1;
        const scale = fitSize / maxAxis;

        model.scale.setScalar(scale);
        model.position.set(
          -center.x * scale + modelOffset[0],
          -center.y * scale + modelOffset[1],
          -center.z * scale + modelOffset[2],
        );

        modelGroup.add(model);
      },
      undefined,
      (error) => {
        console.error("Error loading GLB model:", error);
      },
    );

    function resize() {
      const width = renderingContainer.clientWidth;
      const height = renderingContainer.clientHeight;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function render(now: number) {
      if (!reduceMotion.matches) {
        modelGroup.rotation.y =
          initialRotation[1] + Math.sin(now * 0.00055) * 0.12;
      }

      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(renderingContainer);
    resize();
    animationFrame = requestAnimationFrame(render);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrame);
      modelGroup.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;

        object.geometry.dispose();

        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];

        materials.forEach((material) => material.dispose());
      });
      renderer.dispose();
    };
  }, [fitSize, initialRotation, modelOffset, modelUrl]);

  return (
    <div className="model-stage" aria-label="Logo 3D da Utter">
      <canvas ref={canvasRef} />
    </div>
  );
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

          <HeroModelViewer
            modelUrl={logoModelUrl}
            fitSize={3.2}
            initialRotation={[Math.PI / 2, 0.2, 0]}
            modelOffset={[0, 0, 0]}
          />

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
