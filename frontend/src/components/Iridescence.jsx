import { Renderer, Program, Mesh, Color, Triangle } from "ogl";
import { useEffect, useRef } from "react";
import "./Iridescence.css";

const vertexShader = `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0, 1);
  }
`;

const fragmentShader = `
  precision highp float;
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uResolution;
  uniform vec2 uMouse;
  uniform float uAmplitude;
  uniform float uSpeed;
  varying vec2 vUv;
  
  void main() {
    float mr = min(uResolution.x, uResolution.y);
    vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;
    uv += (uMouse - vec2(0.5)) * uAmplitude;
    
    float d = -uTime * 0.5 * uSpeed;
    float a = 0.0;
    for (float i = 0.0; i < 8.0; ++i) {
      a += cos(i - d - a * uv.x);
      d += sin(uv.y * i + a);
    }
    d += uTime * 0.5 * uSpeed;
    
    vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
    col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
    
    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function Iridescence({
  color = [0.055, 0.647, 0.914], // Primary blue from tailwind config
  speed = 1.0,
  amplitude = 0.1,
  mouseReact = true,
  ...rest
}) {
  const ctnDom = useRef(null);
  const mousePos = useRef({ x: 0.5, y: 0.5 });
  const uniformsRef = useRef(null);

  // Detect touch devices to disable mouse react by default
  const isTouch =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);
  const enableMouseReact = !isTouch && mouseReact;

  // Initialize WebGL once
  useEffect(() => {
    if (!ctnDom.current) {
      console.log("Iridescence: Container ref not ready");
      return;
    }

    console.log("Iridescence: Initializing WebGL...");
    const ctn = ctnDom.current;

    try {
      // Use devicePixelRatio for crisp rendering, capped at 1.5 for performance
      const renderer = new Renderer({
        alpha: true,
        dpr: Math.min(window.devicePixelRatio || 1, 1.5),
      });
      const gl = renderer.gl;

      if (!gl) {
        console.error("Iridescence: WebGL not supported");
        return;
      }

      console.log("Iridescence: WebGL context created");
      gl.clearColor(1, 1, 1, 0); // Transparent background
      let program;

      function resize() {
        const { width, height } = ctn.getBoundingClientRect();
        renderer.setSize(width, height);
        if (program) {
          program.uniforms.uResolution.value.set(
            gl.drawingBufferWidth,
            gl.drawingBufferHeight,
            gl.drawingBufferWidth / gl.drawingBufferHeight
          );
        }
      }
      window.addEventListener("resize", resize, false);
      resize();

      const geometry = new Triangle(gl);
      program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new Color(...color) },
          uResolution: {
            value: new Color(
              gl.canvas.width,
              gl.canvas.height,
              gl.canvas.width / gl.canvas.height
            ),
          },
          uMouse: {
            value: new Float32Array([mousePos.current.x, mousePos.current.y]),
          },
          uAmplitude: { value: amplitude },
          uSpeed: { value: speed },
        },
      });

      // Store uniforms reference for updates
      uniformsRef.current = program.uniforms;

      const mesh = new Mesh(gl, { geometry, program });
      let animateId;

      function update(t) {
        animateId = requestAnimationFrame(update);
        program.uniforms.uTime.value = t * 0.001;
        renderer.render({ scene: mesh });
      }
      animateId = requestAnimationFrame(update);
      ctn.appendChild(gl.canvas);
      console.log("Iridescence: Canvas appended to container");

      function handleMouseMove(e) {
        const rect = ctn.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = 1.0 - (e.clientY - rect.top) / rect.height;
        mousePos.current = { x, y };
        program.uniforms.uMouse.value[0] = x;
        program.uniforms.uMouse.value[1] = y;
      }
      if (enableMouseReact) {
        ctn.addEventListener("mousemove", handleMouseMove);
      }

      return () => {
        cancelAnimationFrame(animateId);
        window.removeEventListener("resize", resize);
        if (enableMouseReact) {
          ctn.removeEventListener("mousemove", handleMouseMove);
        }
        if (ctn.contains(gl.canvas)) {
          ctn.removeChild(gl.canvas);
        }
        uniformsRef.current = null;
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
    } catch (error) {
      console.error("Iridescence: Error initializing WebGL:", error);
      // Fallback: add a CSS gradient background
      ctn.style.background =
        "linear-gradient(135deg, rgba(14, 165, 233, 0.3) 0%, rgba(147, 51, 234, 0.3) 100%)";
    }
  }, []);

  // Update uniforms when props change
  useEffect(() => {
    const uniforms = uniformsRef.current;
    if (!uniforms) return;

    uniforms.uColor.value.set(color[0], color[1], color[2]);
    uniforms.uSpeed.value = speed;
    uniforms.uAmplitude.value = amplitude;
  }, [color, speed, amplitude]);

  return <div ref={ctnDom} className="iridescence-container" {...rest} />;
}
