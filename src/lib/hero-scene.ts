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

// 값 노이즈 두 겹으로 흐르는 그라디언트 + 같은 필드에서 뽑은 등고선. 포인터가 밝은 점을, 스크롤이 위상을 민다.
//
// 팔레트는 global.css 토큰에서 유도했다(oklch → sRGB, 소수 둘째 자리):
//   dark  a = paper   oklch(16% 0.008 80) ≈ (0.11, 0.10, 0.09)
//         b = paper-2 를 accent 쪽으로 밀어 낸 중간톤 ≈ (0.24, 0.20, 0.15) — 선이 이미지를 이끌도록 이전(0.34/0.28/0.20)보다 낮췄다
//         accent      oklch(78% 0.11 70)  ≈ (0.85, 0.62, 0.32)
//   light a = paper   oklch(97% 0.008 85) ≈ (0.96, 0.94, 0.90)
//         b = paper-2 oklch(94% 0.01 85) 를 같은 방향으로 조금 밀어 낸 중간톤 ≈ (0.90, 0.87, 0.80)
//         line accent = accent oklch(48% 0.12 70)을 paper 쪽으로 반쯤 밝힌 값(≈ oklch 66% 0.08 70) ≈ (0.70, 0.56, 0.40)
//           — 원래 accent(0.55, 0.36, 0.14)를 30% 섞으면 등고선 픽셀의 B 채널이 0.55(≈139)까지 떨어져
//             "종이 위의 연필선"이 아니라 회갈색 얼룩이 된다. 밝힌 값은 최소 채널을 0.68(≈173) 위로 지킨다.
//         glow accent = accent 원값 (0.55, 0.36, 0.14)
// 라이트에서 글로우는 더하지 않고 (0.10, 0.14, 0.20)을 빼서 갈색 accent 쪽으로 어두워진다(부호 반전 없음).
const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime; uniform vec2 uPointer; uniform float uScroll; uniform vec2 uAspect; uniform float uLight;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  void main() {
    vec2 p = (vUv - 0.5) * uAspect;
    float t = uTime * 0.05 + uScroll * 0.6;
    float n = noise(p * 2.0 + t) * 0.6 + noise(p * 5.0 - t * 1.3) * 0.4;
    vec3 a = mix(vec3(0.11, 0.10, 0.09), vec3(0.96, 0.94, 0.90), uLight);
    vec3 b = mix(vec3(0.24, 0.20, 0.15), vec3(0.90, 0.87, 0.80), uLight);
    vec3 accent = mix(vec3(0.85, 0.62, 0.32), vec3(0.55, 0.36, 0.14), uLight);
    vec3 lineColor = mix(vec3(0.85, 0.62, 0.32), vec3(0.70, 0.56, 0.40), uLight);
    vec3 base = mix(a, b, n);
    float k = fract(n * 7.0);
    float line = 1.0 - smoothstep(0.0, fwidth(n * 7.0) * 1.5, min(k, 1.0 - k));
    vec3 c = mix(base, lineColor, line * 0.30);
    float d = distance(p, (uPointer - 0.5) * uAspect);
    float glow = smoothstep(0.45, 0.0, d) * 0.28;
    c += mix(accent * glow, -vec3(0.10, 0.14, 0.20) * glow, uLight);
    gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
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
  const lightQuery = window.matchMedia("(prefers-color-scheme: light)");
  const material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      uTime: { value: 0 },
      uPointer: { value: new Vector2(0.5, 0.5) },
      uScroll: { value: 0 },
      uAspect: { value: new Vector2(1, 1) },
      uLight: { value: lightQuery.matches ? 1 : 0 },
    },
  });
  const mesh = new Mesh(new PlaneGeometry(2, 2), material);
  scene.add(mesh);
  // 포인터는 목표값을 두고 프레임마다 8%씩 따라간다(급격한 점프 대신 미끄러지는 글로우).
  const pointerTarget = new Vector2(0.5, 0.5);

  const onScheme = (e: MediaQueryListEvent) => {
    if (material.uniforms.uLight) material.uniforms.uLight.value = e.matches ? 1 : 0;
  };
  lightQuery.addEventListener("change", onScheme);

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    material.uniforms.uAspect?.value.set(w / Math.max(h, 1), 1);
  };
  resize();

  return {
    setPointer: (x, y) => pointerTarget.set(x, 1 - y),
    setScroll: (p) => {
      if (material.uniforms.uScroll) material.uniforms.uScroll.value = p;
    },
    resize,
    frame: (t) => {
      if (material.uniforms.uTime) material.uniforms.uTime.value = t / 1000;
      const pointer = material.uniforms.uPointer?.value as Vector2 | undefined;
      pointer?.lerp(pointerTarget, 0.08);
      renderer.render(scene, camera);
    },
    dispose: () => {
      lightQuery.removeEventListener("change", onScheme);
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
