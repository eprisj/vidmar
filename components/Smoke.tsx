"use client";

import { useEffect, useRef } from "react";
import styles from "./Smoke.module.css";

type Props = {
  /** warm light rising through the smoke, 0–1 per channel */
  tint?: [number, number, number];
  /** overall brightness */
  intensity?: number;
  /** where the light source sits, in 0–1 of the canvas (y from the bottom) */
  source?: [number, number];
  className?: string;
};

const VERT = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

// domain-warped fbm: slow, heavy smoke with a warm light under it.
// highp where available: on Apple GPUs mediump is 16-bit, and the classic
// sin(x * 43758) hash overflows to infinity there and burns the frame white.
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_res;
uniform float u_t;
uniform vec3 u_tint;
uniform float u_int;
uniform vec2 u_src;

// sin-free hash (Hoskins): stays in small numbers, safe at low precision
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv * vec2(u_res.x / u_res.y, 1.0) * 2.4;
  float t = u_t * 0.03;
  vec2 q = vec2(fbm(p + vec2(0.0, -t)), fbm(p + vec2(5.2, 1.3 + t)));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) - t * 1.4),
                fbm(p + 3.0 * q + vec2(8.3, 2.8) + t));
  float f = fbm(p + 2.6 * r);
  // only the densest folds show, squared into thin wisps; thinning upward
  float smoke = smoothstep(0.52, 1.0, f);
  smoke *= smoke;
  smoke *= smoothstep(1.05, 0.15, uv.y);
  vec2 d = (uv - u_src) * vec2(1.3, 1.0);
  float glow = exp(-dot(d, d) * 5.5);
  // wheat-lit smoke: the house has no neutral grey, so the body of the
  // smoke carries the paper colour and the tint stays in the light under it
  vec3 col = vec3(0.96, 0.87, 0.70) * smoke * 0.34
           + u_tint * glow * (0.07 + smoke * 0.55);
  gl_FragColor = vec4(col * u_int, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

/**
 * Living smoke, drawn in a fragment shader at half resolution. Screen-blended
 * over the dark fields, so black reads as transparent. Pauses off-screen, and
 * holds a single still frame for people who asked for reduced motion.
 */
export default function Smoke({
  tint = [0.76, 0.6, 0.3],
  intensity = 1,
  source = [0.5, 0.12],
  className = "",
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    // a full-screen fragment shader is the single heaviest thing on the site;
    // on a phone it cost smooth scrolling for a haze most people never saw
    if (window.matchMedia("(max-width: 760px), (pointer: coarse)").matches) return;
    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl || gl.isContextLost()) return;

    // a lost context paints the canvas white in some browsers; hide it rather
    // than let it glare over the section
    const onLost = (e: Event) => {
      e.preventDefault();
      canvas.style.opacity = "0";
    };
    canvas.addEventListener("webglcontextlost", onLost);

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uT = gl.getUniformLocation(prog, "u_t");
    gl.uniform3f(gl.getUniformLocation(prog, "u_tint"), tint[0], tint[1], tint[2]);
    gl.uniform1f(gl.getUniformLocation(prog, "u_int"), intensity);
    gl.uniform2f(gl.getUniformLocation(prog, "u_src"), source[0], source[1]);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scale = Math.min(window.devicePixelRatio || 1, 2) * 0.5;

    // compared against what *this* program was last told, not the canvas: on a
    // remount the canvas is already the right size, and a fresh program would
    // otherwise never receive u_res and divide by zero
    let rw = 0;
    let rh = 0;
    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * scale));
      const h = Math.max(1, Math.round(canvas.clientHeight * scale));
      if (rw !== w || rh !== h) {
        rw = w;
        rh = h;
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uRes, w, h);
      }
    };

    let raf = 0;
    let visible = false;
    const start = performance.now() - Math.random() * 40000;

    const draw = () => {
      resize();
      gl.uniform1f(uT, (performance.now() - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = () => {
      draw();
      if (visible && !reduced) raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) loop();
    });
    io.observe(canvas);
    draw();

    // no loseContext() here: React remounts effects in development and would
    // get the same, now dead, context back from getContext()
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      canvas.removeEventListener("webglcontextlost", onLost);
    };
    // tint/source are fixed per instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={ref} className={`${styles.smoke} ${className}`} aria-hidden="true" />;
}
