const outerOrbitImages = [
  "assets/energy/frame-838.jpg",
  "assets/energy/frame-841.jpg"
];

const coreOrbitImages = [
  "assets/energy/frame-840-replacement.png",
  "assets/energy/frame-839.jpg",
  "assets/energy/frame-842.jpg"
];

const orbitImageLabels = {
  "frame-838.jpg": "妈妈",
  "frame-839.jpg": "我",
  "frame-840.jpg": "爸爸",
  "frame-840-replacement.png": "爸爸",
  "frame-841.jpg": "爷爷",
  "frame-842.jpg": "奶奶"
};

const defaultOrbitConfig = {
  altPrefix: "Orbiting image",
  shape: "ellipse",
  baseWidth: 1400,
  rotation: -8,
  duration: 30,
  itemSize: 80,
  direction: "normal",
  fill: true,
  responsive: true,
  showPath: true,
  pathColor: "rgba(255,255,255,0.32)",
  pathWidth: 2,
  easing: "linear",
  paused: false,
  rings: [
    {
      className: "orbit-ring--outer",
      images: outerOrbitImages,
      radiusX: 460,
      radiusY: 110
    }
  ],
  coreImages: coreOrbitImages
};

function generateEllipsePath(cx, cy, rx, ry) {
  return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`;
}

function createPathSvg(path, config) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");

  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("viewBox", `0 0 ${config.baseWidth} ${config.baseWidth}`);
  svg.classList.add("orbit-path-svg");
  pathElement.setAttribute("d", path);
  pathElement.setAttribute("fill", "none");
  pathElement.setAttribute("stroke", config.pathColor);
  pathElement.setAttribute("stroke-width", String(config.pathWidth));
  svg.append(pathElement);

  return svg;
}

function getOrbitImageLabel(src) {
  const filename = src.split("/").pop();
  return orbitImageLabels[filename] || "Source of energy";
}

function spawnOrbitHeart(container, heartField, target) {
  const heart = document.createElement("span");
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const centerX = targetRect.left - containerRect.left + targetRect.width / 2;
  const centerY = targetRect.top - containerRect.top + targetRect.height / 2;
  const coreRect = container.querySelector(".orbit-core-images")?.getBoundingClientRect();
  const isOuterOrbitTarget = target.classList.contains("orbit-item");
  let driftX = (Math.random() - 0.5) * 96;
  let driftY = -42 - Math.random() * 96;
  const rotation = (Math.random() - 0.5) * 60;
  const scale = 0.72 + Math.random() * 0.72;

  if (isOuterOrbitTarget && coreRect) {
    const coreCenterX = coreRect.left - containerRect.left + coreRect.width / 2;
    const coreCenterY = coreRect.top - containerRect.top + coreRect.height / 2;
    const vectorX = coreCenterX - centerX;
    const vectorY = coreCenterY - centerY;
    const distance = Math.hypot(vectorX, vectorY) || 1;
    const unitX = vectorX / distance;
    const unitY = vectorY / distance;
    const travel = Math.min(Math.max(distance * 0.58, 72), 210);
    const scatter = (Math.random() - 0.5) * 42;

    driftX = unitX * travel + -unitY * scatter;
    driftY = unitY * travel + unitX * scatter;
  }

  heart.className = "orbit-heart";
  heart.textContent = "♥";
  heart.style.left = `${centerX + (Math.random() - 0.5) * targetRect.width}px`;
  heart.style.top = `${centerY + (Math.random() - 0.5) * targetRect.height}px`;
  heart.style.setProperty("--heart-x", `${driftX}px`);
  heart.style.setProperty("--heart-y", `${driftY}px`);
  heart.style.setProperty("--heart-rotate", `${rotation}deg`);
  heart.style.setProperty("--heart-scale", String(scale));
  heartField.append(heart);

  window.setTimeout(() => heart.remove(), 920);
}

function createOrbitHoverEffects(container) {
  const layer = document.createElement("div");
  const heartField = document.createElement("div");
  const label = document.createElement("div");
  let activeTarget = null;
  let heartTimer = null;

  layer.className = "orbit-hover-layer";
  heartField.className = "orbit-heart-field";
  label.className = "orbit-hover-label";
  layer.append(heartField, label);
  container.append(layer);

  const positionLabel = () => {
    if (!activeTarget) return;
    const containerRect = container.getBoundingClientRect();
    const targetRect = activeTarget.getBoundingClientRect();
    const x = targetRect.left - containerRect.left + targetRect.width / 2;
    const y = targetRect.top - containerRect.top - 12;
    label.style.left = `${x}px`;
    label.style.top = `${y}px`;
  };

  const start = (target) => {
    activeTarget = target;
    label.textContent = target.dataset.orbitHoverLabel || "Source of energy";
    container.classList.add("is-orbit-hovering");
    positionLabel();
    spawnOrbitHeart(container, heartField, target);
    heartTimer = window.setInterval(() => {
      if (activeTarget) spawnOrbitHeart(container, heartField, activeTarget);
    }, 110);
  };

  const stop = () => {
    activeTarget = null;
    container.classList.remove("is-orbit-hovering");
    window.clearInterval(heartTimer);
    heartTimer = null;
    heartField.replaceChildren();
  };

  const bindTarget = (target, src) => {
    target.classList.add("orbit-hover-target");
    target.dataset.orbitHoverLabel = getOrbitImageLabel(src);
    target.addEventListener("pointerenter", () => start(target));
    target.addEventListener("pointermove", positionLabel);
    target.addEventListener("pointerleave", stop);
  };

  return {
    bindTarget,
    update: positionLabel,
    cleanup: () => {
      window.clearInterval(heartTimer);
      layer.remove();
    }
  };
}

function createOrbitRing(ring, config, center, items, hoverEffects) {
  const path = generateEllipsePath(center, center, ring.radiusX, ring.radiusY);
  const rotationWrapper = document.createElement("div");

  rotationWrapper.className = `orbit-rotation-wrapper orbit-ring ${ring.className}`;
  rotationWrapper.style.transform = `rotate(${config.rotation}deg)`;
  rotationWrapper.style.setProperty("--orbit-path", `"${path}"`);

  if (config.showPath) {
    rotationWrapper.append(createPathSvg(path, config));
  }

  ring.images.forEach((src, index) => {
    const item = document.createElement("div");
    const inner = document.createElement("div");
    const image = document.createElement("img");
    const itemOffset = config.fill ? (index / ring.images.length) * 100 : 0;

    item.className = "orbit-item";
    item.style.width = `${config.itemSize}px`;
    item.style.height = `${config.itemSize}px`;
    item.style.offsetPath = `path("${path}")`;
    item.style.offsetDistance = `${itemOffset}%`;
    inner.className = "orbit-item-inner";
    inner.style.transform = `rotate(${-config.rotation}deg)`;
    image.className = "orbit-image";
    image.src = src;
    image.alt = `${config.altPrefix} ${items.length + 1}`;
    image.draggable = false;

    inner.append(image);
    item.append(inner);
    hoverEffects.bindTarget(item, src);
    rotationWrapper.append(item);
    items.push({ element: item, offset: itemOffset });
  });

  return rotationWrapper;
}

function createOrbitCoreImages(config, hoverEffects, startIndex = 0) {
  const core = document.createElement("div");

  core.className = "orbit-core-images";

  config.coreImages.forEach((src, index) => {
    const imageWrap = document.createElement("div");
    const image = document.createElement("img");

    imageWrap.className = "orbit-core-image";
    image.style.width = `${config.itemSize}px`;
    image.style.height = `${config.itemSize}px`;
    image.className = "orbit-image";
    image.src = src;
    image.alt = `${config.altPrefix} ${startIndex + index + 1}`;
    image.draggable = false;

    imageWrap.append(image);
    hoverEffects.bindTarget(imageWrap, src);
    core.append(imageWrap);
  });

  return core;
}

function createOrbitImages(container, config = defaultOrbitConfig) {
  const center = config.baseWidth / 2;
  const scalingContainer = document.createElement("div");
  const hoverEffects = createOrbitHoverEffects(container);
  const items = [];

  scalingContainer.className = "orbit-scaling-container orbit-scaling-container--responsive";

  config.rings.forEach((ring) => {
    scalingContainer.append(createOrbitRing(ring, config, center, items, hoverEffects));
  });
  scalingContainer.append(createOrbitCoreImages(config, hoverEffects, items.length));

  container.append(scalingContainer);

  const resize = () => {
    const scale = container.clientWidth / config.baseWidth;
    scalingContainer.style.transform = `translate(-50%, -50%) scale(${scale})`;
  };

  let animationFrameId = null;
  let startTime = performance.now();
  let isVisible = true;

  const update = (time) => {
    animationFrameId = requestAnimationFrame(update);
    if (config.paused || !isVisible) return;

    const directionFactor = config.direction === "reverse" ? -1 : 1;
    const elapsed = ((time - startTime) / (config.duration * 1000)) * 100 * directionFactor;
    items.forEach(({ element, offset }) => {
      const distance = (((elapsed + offset) % 100) + 100) % 100;
      element.style.offsetDistance = `${distance}%`;
    });
    hoverEffects.update();
  };

  const visibilityObserver = new IntersectionObserver((entries) => {
    isVisible = entries.some((entry) => entry.isIntersecting);
    if (isVisible) {
      startTime = performance.now();
      resize();
    }
  });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  visibilityObserver.observe(container);
  resize();
  animationFrameId = requestAnimationFrame(update);

  return () => {
    cancelAnimationFrame(animationFrameId);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    hoverEffects.cleanup();
    scalingContainer.remove();
  };
}

const container = document.querySelector("[data-energy-orbit]");

if (container) {
  createOrbitImages(container);
}
