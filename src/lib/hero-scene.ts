import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from "three";

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
`;

// 값 노이즈 두 겹으로 흐르는 그라디언트. 포인터가 밝은 점을, 스크롤이 위상을 민다.
const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime; uniform vec2 uPointer; uniform float uScroll; uniform vec2 uAspect;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  void main() {
    vec2 p = (vUv - 0.5) * uAspect;
    float t = uTime * 0.05 + uScroll * 0.6;
    float n = noise(p * 2.0 + t) * 0.6 + noise(p * 5.0 - t * 1.3) * 0.4;
    float d = distance(p, (uPointer - 0.5) * uAspect);
    float glow = smoothstep(0.6, 0.0, d) * 0.35;
    vec3 a = vec3(0.06, 0.09, 0.16), b = vec3(0.16, 0.30, 0.62);
    vec3 c = mix(a, b, n) + glow;
    gl_FragColor = vec4(c, 1.0);
  }
`;

export type HeroScene = {
  setPointer(x: number, y: number): void;
  setScroll(p: number): void;
  resize(): void;
  frame(t: number): void;
  dispose(): void;
};

export function createHeroScene(canvas: HTMLCanvasElement, scale: number): HeroScene {
  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * scale);
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      uTime: { value: 0 },
      uPointer: { value: new Vector2(0.5, 0.5) },
      uScroll: { value: 0 },
      uAspect: { value: new Vector2(1, 1) },
    },
  });
  const mesh = new Mesh(new PlaneGeometry(2, 2), material);
  scene.add(mesh);

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    material.uniforms.uAspect?.value.set(w / Math.max(h, 1), 1);
  };
  resize();

  return {
    setPointer: (x, y) => material.uniforms.uPointer?.value.set(x, 1 - y),
    setScroll: (p) => {
      if (material.uniforms.uScroll) material.uniforms.uScroll.value = p;
    },
    resize,
    frame: (t) => {
      if (material.uniforms.uTime) material.uniforms.uTime.value = t / 1000;
      renderer.render(scene, camera);
    },
    dispose: () => {
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
