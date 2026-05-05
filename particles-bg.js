import { Renderer, Camera, Geometry, Program, Mesh } from "https://cdn.jsdelivr.net/npm/ogl@1.0.11/src/index.js";

const defaultColors = ["#ffffff", "#ffffff", "#ffffff"];

const defaultParticleConfig = {
  particleColors: ["#ffffff"],
  particleCount: 200,
  particleSpread: 20,
  speed: 0.1,
  particleBaseSize: 100,
  moveParticlesOnHover: true,
  alphaParticles: false,
  disableRotation: false,
  particleHoverFactor: 1,
  sizeRandomness: 1,
  cameraDistance: 20,
  pixelRatio: Math.min(window.devicePixelRatio || 1, 1.6)
};

const hexToRgb = (hex) => {
  let value = hex.replace(/^#/, "");
  if (value.length === 3) {
    value = value
      .split("")
      .map((character) => character + character)
      .join("");
  }

  const int = parseInt(value, 16);
  return [
    ((int >> 16) & 255) / 255,
    ((int >> 8) & 255) / 255,
    (int & 255) / 255
  ];
};

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec4 random;
  attribute vec3 color;

  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uSpread;
  uniform float uBaseSize;
  uniform float uSizeRandomness;

  varying vec4 vRandom;
  varying vec3 vColor;

  void main() {
    vRandom = random;
    vColor = color;

    vec3 pos = position * uSpread;
    pos.z *= 10.0;

    vec4 mPos = modelMatrix * vec4(pos, 1.0);
    float t = uTime;
    mPos.x += sin(t * random.z + 6.28 * random.w) * mix(0.1, 1.5, random.x);
    mPos.y += sin(t * random.y + 6.28 * random.x) * mix(0.1, 1.5, random.w);
    mPos.z += sin(t * random.w + 6.28 * random.y) * mix(0.1, 1.5, random.z);

    vec4 mvPos = viewMatrix * mPos;

    if (uSizeRandomness == 0.0) {
      gl_PointSize = uBaseSize;
    } else {
      gl_PointSize = (uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5))) / length(mvPos.xyz);
    }

    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uAlphaParticles;
  varying vec4 vRandom;
  varying vec3 vColor;

  void main() {
    vec2 uv = gl_PointCoord.xy;
    float d = length(uv - vec2(0.5));

    if(uAlphaParticles < 0.5) {
      if(d > 0.5) {
        discard;
      }
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), 1.0);
    } else {
      float circle = smoothstep(0.5, 0.4, d) * 0.8;
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), circle);
    }
  }
`;

const createParticles = (container, config = defaultParticleConfig) => {
  const renderer = new Renderer({
    dpr: config.pixelRatio,
    depth: false,
    alpha: true
  });
  const gl = renderer.gl;
  container.appendChild(gl.canvas);
  gl.clearColor(0, 0, 0, 0);

  const camera = new Camera(gl, { fov: 15 });
  camera.position.set(0, 0, config.cameraDistance);

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height);
    camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
  };

  window.addEventListener("resize", resize, false);
  resize();

  const mouse = { x: 0, y: 0 };
  const handleMouseMove = (event) => {
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  };

  if (config.moveParticlesOnHover) {
    container.addEventListener("mousemove", handleMouseMove);
  }

  const count = config.particleCount;
  const positions = new Float32Array(count * 3);
  const randoms = new Float32Array(count * 4);
  const colors = new Float32Array(count * 3);
  const palette = config.particleColors && config.particleColors.length > 0 ? config.particleColors : defaultColors;

  for (let index = 0; index < count; index += 1) {
    let x;
    let y;
    let z;
    let length;
    do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      z = Math.random() * 2 - 1;
      length = x * x + y * y + z * z;
    } while (length > 1 || length === 0);

    const radius = Math.cbrt(Math.random());
    positions.set([x * radius, y * radius, z * radius], index * 3);
    randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], index * 4);
    colors.set(hexToRgb(palette[Math.floor(Math.random() * palette.length)]), index * 3);
  }

  const geometry = new Geometry(gl, {
    position: { size: 3, data: positions },
    random: { size: 4, data: randoms },
    color: { size: 3, data: colors }
  });

  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      uTime: { value: 0 },
      uSpread: { value: config.particleSpread },
      uBaseSize: { value: config.particleBaseSize * config.pixelRatio },
      uSizeRandomness: { value: config.sizeRandomness },
      uAlphaParticles: { value: config.alphaParticles ? 1 : 0 }
    },
    transparent: true,
    depthTest: false
  });

  const particles = new Mesh(gl, { mode: gl.POINTS, geometry, program });
  let animationFrameId = null;
  let lastTime = performance.now();
  let elapsed = 0;
  let isVisible = true;

  const update = (time) => {
    animationFrameId = requestAnimationFrame(update);
    if (!isVisible) return;

    const delta = time - lastTime;
    lastTime = time;
    elapsed += delta * config.speed;
    program.uniforms.uTime.value = elapsed * 0.001;

    if (config.moveParticlesOnHover) {
      particles.position.x = -mouse.x * config.particleHoverFactor;
      particles.position.y = -mouse.y * config.particleHoverFactor;
    } else {
      particles.position.x = 0;
      particles.position.y = 0;
    }

    if (!config.disableRotation) {
      particles.rotation.x = Math.sin(elapsed * 0.0002) * 0.1;
      particles.rotation.y = Math.cos(elapsed * 0.0005) * 0.15;
      particles.rotation.z += 0.01 * config.speed;
    }

    renderer.render({ scene: particles, camera });
  };

  const visibilityObserver = new IntersectionObserver((entries) => {
    isVisible = entries.some((entry) => entry.isIntersecting);
    if (isVisible) {
      lastTime = performance.now();
      resize();
    }
  });
  visibilityObserver.observe(container);

  animationFrameId = requestAnimationFrame(update);

  return () => {
    window.removeEventListener("resize", resize);
    visibilityObserver.disconnect();
    if (config.moveParticlesOnHover) {
      container.removeEventListener("mousemove", handleMouseMove);
    }
    cancelAnimationFrame(animationFrameId);
    if (container.contains(gl.canvas)) {
      container.removeChild(gl.canvas);
    }
  };
};

const container = document.querySelector("[data-energy-particles]");

if (container) {
  createParticles(container);
}
