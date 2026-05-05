import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const container = document.querySelector("[data-hero-computer]");
const LEGACY_MODEL_URL = "assets/computers/scene.gltf";
const MODEL_URL = "assets/computers-candidate/source/computers.glb";
const SELECTED_COMPUTER_NODE = "monitor02_reference.smd";
const COMPUTER_NODE_CANDIDATES = [
  "monitor02_reference.smd",
  "monitor02_reference.smd_2",
  "monitor02_reference_smd_2",
  "monitor02_referencesmd"
];
const DEBUG_QUERY = new URLSearchParams(window.location.search);
const DEBUG_SCREEN_ALIGNMENT = DEBUG_QUERY.has("screen-debug");
const SHOULD_PROBE_PIXELS = DEBUG_SCREEN_ALIGNMENT || DEBUG_QUERY.has("screen-probe");
const SCREEN_PLANE_OFFSET = 0.1;
const SCREEN_VIDEO_SCALE = 1.1;
const SCREEN_SURFACE_SEGMENTS = { columns: 28, rows: 18 };
const SCREEN_EDGE_CURVE = { top: 0.014, right: 0.009 };
const SCREEN_FRAME_MASK_OVERSCAN = { horizontal: 0.012, vertical: 0.008 };
const SCREEN_CUT_PLANE_TOLERANCE = 0.055;
const MANUAL_SCREEN_CORNERS = {
  topLeft: [0.217, 0.418, -0.162],
  topRight: [0.217, 0.416, 0.166],
  bottomLeft: [0.217, 0.157, -0.162],
  bottomRight: [0.217, 0.156, 0.166]
};

if (container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
  camera.position.set(0, 0.28, 5.1);
  const screenYaw = THREE.MathUtils.degToRad(10);
  const screenPitch = THREE.MathUtils.degToRad(10);
  const baseRotation = { x: -screenPitch, y: -Math.PI / 2 + screenYaw, z: 0.004 };
  const targetRotation = { ...baseRotation };

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: true
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  const heroPin = container.closest(".hero-pin") || document.querySelector(".hero-pin");
  let isHeroComputerActive = true;
  let renderFrameId = null;

  const modelRoot = new THREE.Group();
  modelRoot.rotation.set(baseRotation.x, baseRotation.y, baseRotation.z);
  modelRoot.position.set(0.02, -0.1, 0);
  scene.add(modelRoot);

  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = 640;
  screenCanvas.height = 360;
  const screenContext = screenCanvas.getContext("2d");
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.minFilter = THREE.LinearFilter;
  screenTexture.magFilter = THREE.LinearFilter;
  screenTexture.wrapS = THREE.ClampToEdgeWrapping;
  screenTexture.wrapT = THREE.ClampToEdgeWrapping;

  const videoPath = container.dataset.screenVideo;
  const useVideo = Boolean(videoPath);
  let videoTexture = null;
  let videoElement = null;
  let isVideoTextureReady = false;
  if (useVideo) {
    videoElement = document.createElement("video");
    videoElement.crossOrigin = "anonymous";
    videoElement.src = videoPath;
    videoElement.loop = true;
    videoElement.muted = true;
    videoElement.defaultMuted = true;
    videoElement.volume = 0;
    videoElement.setAttribute("muted", "");
    videoElement.playsInline = true;
    videoElement.autoplay = true;
    videoTexture = createVideoTexture(videoElement);
    videoElement.play().catch(() => {});
  }

  function vectorFromArray(value) {
    return new THREE.Vector3(value[0], value[1], value[2]);
  }

  function createVideoTexture(video) {
    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.flipY = false;
    return texture;
  }

  function orientVideoTextureForManualPlane(texture) {
    texture.flipY = true;
    texture.needsUpdate = true;
    container.dataset.videoFlipY = "true";
  }

  function applyStretchUV(texture) {
    texture.repeat.set(1, 1);
    texture.offset.set(0, 0);
    texture.needsUpdate = true;
    container.dataset.videoFit = "stretch";
  }

  function findScreenMesh(sceneRoot) {
    const screenNamePattern = /(screen|display|monitor|lcd|glass|panel)/i;
    let screenMesh = null;

    sceneRoot.traverse((child) => {
      if (screenMesh || !child.isMesh) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      const materialNames = materials.map((material) => material?.name || "").join(" ");
      const searchableName = `${child.name || ""} ${materialNames}`;
      if (screenNamePattern.test(searchableName) && !/Monitor0?2/i.test(materialNames)) {
        screenMesh = child;
      }
    });

    return screenMesh;
  }

  function getScreenBasis(corners) {
    const topLeft = vectorFromArray(corners.topLeft);
    const topRight = vectorFromArray(corners.topRight);
    const bottomLeft = vectorFromArray(corners.bottomLeft);
    const bottomRight = vectorFromArray(corners.bottomRight);

    const xAxis = new THREE.Vector3().subVectors(topRight, topLeft).normalize();
    const yAxis = new THREE.Vector3().subVectors(topLeft, bottomLeft).normalize();
    const downAxis = new THREE.Vector3().subVectors(bottomLeft, topLeft).normalize();
    const normal = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
    const width = topLeft.distanceTo(topRight);
    const height = topLeft.distanceTo(bottomLeft);

    return {
      topLeft,
      topRight,
      bottomLeft,
      bottomRight,
      xAxis,
      yAxis,
      downAxis,
      normal,
      width,
      height
    };
  }

  function expandScreenCorners(corners) {
    const basis = getScreenBasis(corners);
    const horizontal = SCREEN_FRAME_MASK_OVERSCAN.horizontal;
    const vertical = SCREEN_FRAME_MASK_OVERSCAN.vertical;
    const expanded = {
      topLeft: basis.topLeft.clone().addScaledVector(basis.xAxis, -horizontal).addScaledVector(basis.yAxis, vertical),
      topRight: basis.topRight.clone().addScaledVector(basis.xAxis, horizontal).addScaledVector(basis.yAxis, vertical),
      bottomLeft: basis.bottomLeft.clone().addScaledVector(basis.xAxis, -horizontal).addScaledVector(basis.yAxis, -vertical),
      bottomRight: basis.bottomRight.clone().addScaledVector(basis.xAxis, horizontal).addScaledVector(basis.yAxis, -vertical)
    };

    return {
      topLeft: expanded.topLeft.toArray(),
      topRight: expanded.topRight.toArray(),
      bottomLeft: expanded.bottomLeft.toArray(),
      bottomRight: expanded.bottomRight.toArray()
    };
  }

  function scaleScreenCorners(corners, scale) {
    const basis = getScreenBasis(corners);
    const center = new THREE.Vector3()
      .addVectors(basis.topLeft, basis.topRight)
      .add(basis.bottomLeft)
      .add(basis.bottomRight)
      .multiplyScalar(0.25);
    const scaled = {};

    ["topLeft", "topRight", "bottomLeft", "bottomRight"].forEach((key) => {
      const point = vectorFromArray(corners[key]);
      scaled[key] = center.clone().add(point.sub(center).multiplyScalar(scale)).toArray();
    });

    return scaled;
  }

  function isTriangleInsideScreenOpening(centroid, basis) {
    const relative = new THREE.Vector3().subVectors(centroid, basis.topLeft);
    const u = relative.dot(basis.xAxis) / Math.max(basis.width, 0.001);
    const v = relative.dot(basis.downAxis) / Math.max(basis.height, 0.001);
    const planeDistance = Math.abs(relative.dot(basis.normal));

    return (
      u >= 0 &&
      u <= 1 &&
      v >= 0 &&
      v <= 1 &&
      planeDistance <= SCREEN_CUT_PLANE_TOLERANCE
    );
  }

  function cutScreenOpeningFromMesh(mesh, corners) {
    if (!mesh?.isMesh || !mesh.geometry?.attributes?.position) {
      return { removedTriangles: 0, totalTriangles: 0 };
    }

    mesh.geometry = mesh.geometry.clone();
    const geometry = mesh.geometry;
    const position = geometry.getAttribute("position");
    const existingIndex = geometry.getIndex();
    const sourceIndices = existingIndex
      ? Array.from(existingIndex.array)
      : Array.from({ length: position.count }, (_, index) => index);
    const basis = getScreenBasis(corners);
    const keptIndices = [];
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    const centroid = new THREE.Vector3();
    let removedTriangles = 0;
    let totalTriangles = 0;

    for (let index = 0; index < sourceIndices.length; index += 3) {
      const ai = sourceIndices[index];
      const bi = sourceIndices[index + 1];
      const ci = sourceIndices[index + 2];
      if (ai === undefined || bi === undefined || ci === undefined) continue;

      a.fromBufferAttribute(position, ai);
      b.fromBufferAttribute(position, bi);
      c.fromBufferAttribute(position, ci);
      centroid.copy(a).add(b).add(c).multiplyScalar(1 / 3);
      totalTriangles += 1;

      if (isTriangleInsideScreenOpening(centroid, basis)) {
        removedTriangles += 1;
        continue;
      }

      keptIndices.push(ai, bi, ci);
    }

    geometry.setIndex(keptIndices);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    mesh.userData.screenCut = { removedTriangles, totalTriangles };

    return { removedTriangles, totalTriangles };
  }

  function cutNativeScreenOpening(sceneRoot, corners) {
    const summary = { removedTriangles: 0, totalTriangles: 0 };

    sceneRoot.traverse((child) => {
      if (!child.isMesh) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      const searchableName = `${child.name || ""} ${materials.map((material) => material?.name || "").join(" ")}`;
      if (!/monitor0?2/i.test(searchableName)) return;

      const result = cutScreenOpeningFromMesh(child, corners);
      summary.removedTriangles += result.removedTriangles;
      summary.totalTriangles += result.totalTriangles;
    });

    return summary;
  }

  function createCurvedVideoSurface(corners, texture) {
    const expandedCorners = expandScreenCorners(corners);
    const scaledCorners = scaleScreenCorners(expandedCorners, SCREEN_VIDEO_SCALE);
    const {
      topLeft,
      topRight,
      bottomLeft,
      bottomRight,
      xAxis,
      yAxis,
      normal,
      width,
      height
    } = getScreenBasis(scaledCorners);
    const columns = SCREEN_SURFACE_SEGMENTS.columns;
    const rows = SCREEN_SURFACE_SEGMENTS.rows;
    const positions = [];
    const uvs = [];
    const indices = [];
    const topBow = SCREEN_EDGE_CURVE.top;
    const rightBow = SCREEN_EDGE_CURVE.right;

    for (let row = 0; row <= rows; row += 1) {
      const v = row / rows;
      const leftEdge = new THREE.Vector3().lerpVectors(topLeft, bottomLeft, v);
      const rightEdge = new THREE.Vector3().lerpVectors(topRight, bottomRight, v);

      for (let column = 0; column <= columns; column += 1) {
        const u = column / columns;
        const point = new THREE.Vector3().lerpVectors(leftEdge, rightEdge, u);
        const topCurve = Math.sin(Math.PI * u) * Math.pow(1 - v, 1.65);
        const rightCurve = Math.sin(Math.PI * v) * Math.pow(u, 1.9);

        point.addScaledVector(yAxis, topBow * topCurve);
        point.addScaledVector(xAxis, rightBow * rightCurve);
        point.addScaledVector(normal, SCREEN_PLANE_OFFSET);

        positions.push(point.x, point.y, point.z);
        uvs.push(u, 1 - v);
      }
    }

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const current = row * (columns + 1) + column;
        const next = current + columns + 1;
        indices.push(current, next, current + 1);
        indices.push(current + 1, next, next + 1);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      toneMapped: false,
      transparent: false,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.renderOrder = 4;
    plane.userData.screenAspect = width / Math.max(height, 0.001);
    plane.userData.screenCorners = { topLeft, topRight, bottomLeft, bottomRight };
    plane.userData.screenCurve = SCREEN_EDGE_CURVE;
    return plane;
  }

  function createScreenDebugHelpers(corners, plane) {
    const group = new THREE.Group();
    const points = [
      ["topLeft", 0xff264d],
      ["topRight", 0x1cb0ff],
      ["bottomLeft", 0xffd21c],
      ["bottomRight", 0x4cff55]
    ];

    points.forEach(([key, color]) => {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.008, 12, 12),
        new THREE.MeshBasicMaterial({ color, depthTest: false })
      );
      sphere.position.copy(vectorFromArray(corners[key]));
      group.add(sphere);
    });

    const borderGeometry = new THREE.BufferGeometry().setFromPoints([
      vectorFromArray(corners.topLeft),
      vectorFromArray(corners.topRight),
      vectorFromArray(corners.bottomRight),
      vectorFromArray(corners.bottomLeft),
      vectorFromArray(corners.topLeft)
    ]);
    const border = new THREE.Line(
      borderGeometry,
      new THREE.LineBasicMaterial({ color: 0xff0000, depthTest: false })
    );
    group.add(border);

    group.renderOrder = 10;
    return group;
  }

  function logMeshDiagnostics(sceneRoot) {
    const diagnostics = [];

    sceneRoot.updateWorldMatrix(true, true);
    sceneRoot.traverse((child) => {
      if (!child.isMesh) return;
      const geometry = child.geometry;
      geometry.computeBoundingBox();
      const localBox = geometry.boundingBox;
      const localSize = localBox.getSize(new THREE.Vector3());
      const worldBox = new THREE.Box3().setFromObject(child);
      const worldSize = worldBox.getSize(new THREE.Vector3());
      const materials = Array.isArray(child.material) ? child.material : [child.material];

      diagnostics.push({
        name: child.name || "(unnamed)",
        material: materials.map((material) => material?.name || "(unnamed)").join(", "),
        hasUv: Boolean(geometry.attributes.uv),
        localSize: localSize.toArray().map((value) => Number(value.toFixed(5))).join(", "),
        worldMin: worldBox.min.toArray().map((value) => Number(value.toFixed(5))).join(", "),
        worldMax: worldBox.max.toArray().map((value) => Number(value.toFixed(5))).join(", "),
        worldSize: worldSize.toArray().map((value) => Number(value.toFixed(5))).join(", ")
      });
    });

    if (DEBUG_SCREEN_ALIGNMENT) console.table(diagnostics);
    container.dataset.meshDiagnostics = JSON.stringify(diagnostics);
    return diagnostics;
  }

  const keyLight = new THREE.PointLight(0xfff1c7, 2.7, 6.5);
  keyLight.position.set(-1.45, -0.25, 2.4);
  scene.add(keyLight);

  const cyanRimLight = new THREE.PointLight(0x65fff2, 1.45, 6);
  cyanRimLight.position.set(2.25, 1.1, 2.8);
  scene.add(cyanRimLight);

  const violetRimLight = new THREE.PointLight(0x786dff, 1.05, 6);
  violetRimLight.position.set(-2.2, 1.4, 2.5);
  scene.add(violetRimLight);

  const rimLight = new THREE.PointLight(0x826dff, 0.9, 6);
  rimLight.position.set(2.3, 1.5, 2.7);
  scene.add(rimLight);

  const topLight = new THREE.DirectionalLight(0xfff7db, 1.15);
  topLight.position.set(-0.5, 2.4, 2.8);
  scene.add(topLight);
  scene.add(new THREE.HemisphereLight(0xeef8ff, 0xd8cfaa, 1.35));
  scene.add(new THREE.AmbientLight(0xf7f3df, 0.82));

  const fitModelToFrame = (model) => {
    model.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const modelScale = 1.826 / Math.max(size.y, 0.001);

    model.position.sub(center);
    model.scale.setScalar(modelScale);
    model.position.y -= 0.02;
  };

  const findSelectedComputer = (sceneRoot) => {
    const namedComputer = COMPUTER_NODE_CANDIDATES
      .map((nodeName) => sceneRoot.getObjectByName(nodeName))
      .find(Boolean);
    if (namedComputer) return namedComputer;

    let materialMatchedComputer = null;
    sceneRoot.traverse((child) => {
      if (materialMatchedComputer || !child.isMesh) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      if (materials.some((material) => material?.name === "Monitor02")) {
        materialMatchedComputer = child.parent || child;
      }
    });

    return materialMatchedComputer;
  };

  const loader = new GLTFLoader();
  loader.load(
    MODEL_URL,
    (gltf) => {
      const source = findSelectedComputer(gltf.scene);
      if (!source) {
        container.dataset.modelError = "missing-selected-computer";
        return;
      }

      const model = source.clone(true);
      const maxAnisotropy = renderer.capabilities.getMaxAnisotropy?.() || 1;
      model.traverse((child) => {
        if (!child.isMesh) return;
        child.material = child.material.clone();
        child.material.side = THREE.DoubleSide;
        child.material.roughness = Math.min(child.material.roughness ?? 0.5, 0.62);
        ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap"].forEach((key) => {
          const texture = child.material[key];
          if (!texture) return;
          texture.anisotropy = maxAnisotropy;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.needsUpdate = true;
        });
        child.castShadow = true;
        child.receiveShadow = true;
      });

      fitModelToFrame(model);
      const screenCut = cutNativeScreenOpening(model, MANUAL_SCREEN_CORNERS);
      container.dataset.nativeScreenCut = `${screenCut.removedTriangles}/${screenCut.totalTriangles}`;
      container.dataset.screenMask = "model-frame";
      container.dataset.screenDepthPlacement = "behind-cut-screen";
      container.dataset.screenPlacementStrategy = "cut-native-screen";
      const meshDiagnostics = logMeshDiagnostics(model);
      container.dataset.screenMesh = "manual-corners";

      const screenTextureSource = screenTexture;
      if (videoTexture) orientVideoTextureForManualPlane(videoTexture);
      const screen = createCurvedVideoSurface(MANUAL_SCREEN_CORNERS, screenTextureSource);
      container.dataset.screenSurface = "curved-grid";
      container.dataset.screenCurve = JSON.stringify(SCREEN_EDGE_CURVE);
      container.dataset.screenCurveDirection = "outward";
      container.dataset.screenPlaneOffset = String(SCREEN_PLANE_OFFSET);
      container.dataset.screenVideoScale = String(SCREEN_VIDEO_SCALE);
      container.dataset.screenFrameMaskOverscan = JSON.stringify(SCREEN_FRAME_MASK_OVERSCAN);
      container.dataset.screenSegments = `${SCREEN_SURFACE_SEGMENTS.columns}x${SCREEN_SURFACE_SEGMENTS.rows}`;

      applyStretchUV(screenTexture);
      if (videoTexture) {
        applyStretchUV(videoTexture);
        const swapToVideoTexture = () => {
          if (isVideoTextureReady) return;
          isVideoTextureReady = true;
          screen.material.map = videoTexture;
          screen.material.needsUpdate = true;
          container.dataset.screenTextureSource = "video";
        };

        if (videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          swapToVideoTexture();
        } else {
          videoElement.addEventListener("loadeddata", swapToVideoTexture, { once: true });
        }
      } else {
        container.dataset.screenTextureSource = "canvas";
      }

      model.add(screen);
      if (DEBUG_SCREEN_ALIGNMENT) {
        model.add(createScreenDebugHelpers(MANUAL_SCREEN_CORNERS, screen));
      }

      modelRoot.add(model);
      modelRoot.updateWorldMatrix(true, true);
      container.dataset.modelNode = SELECTED_COMPUTER_NODE;
      container.dataset.modelUrl = MODEL_URL;
      container.dataset.legacyModelUrl = LEGACY_MODEL_URL;
      container.dataset.modelLoaded = "true";
      container.dataset.meshCount = String(meshDiagnostics.length);
    },
    undefined,
    () => {
      container.dataset.modelError = "load-failed";
    }
  );

  const drawScreen = (time) => {
    if (videoTexture && isVideoTextureReady) return;

    const width = screenCanvas.width;
    const height = screenCanvas.height;
    screenContext.fillStyle = "#05080a";
    screenContext.fillRect(0, 0, width, height);

    const gradient = screenContext.createRadialGradient(
      width * 0.58,
      height * 0.48,
      8,
      width * 0.58,
      height * 0.48,
      width * 0.48
    );
    gradient.addColorStop(0, "rgba(255, 255, 220, .96)");
    gradient.addColorStop(0.27, "rgba(105, 238, 255, .58)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    screenContext.fillStyle = gradient;
    screenContext.fillRect(0, 0, width, height);

    screenContext.save();
    screenContext.translate(width * 0.5, height * 0.5);
    screenContext.strokeStyle = "rgba(255, 247, 196, .88)";
    screenContext.lineWidth = 2;
    for (let index = 0; index < 170; index += 1) {
      const angle = index * 0.19 + time * 0.0012;
      const radius = 18 + index * 0.82 + Math.sin(time * 0.002 + index) * 17;
      const x = Math.cos(angle) * radius * 1.22;
      const y = Math.sin(angle * 1.6) * radius * 0.38;
      screenContext.globalAlpha = 0.34 + Math.sin(index + time * 0.004) * 0.24;
      screenContext.beginPath();
      screenContext.moveTo(x, y);
      screenContext.lineTo(x + Math.sin(angle * 2) * 20, y + Math.cos(angle) * 14);
      screenContext.stroke();
    }
    screenContext.restore();

    screenContext.globalAlpha = 0.14;
    screenContext.fillStyle = "#d8ffff";
    for (let y = 0; y < height; y += 8) {
      screenContext.fillRect(0, y, width, 1);
    }
    screenContext.globalAlpha = 1;

    screenTexture.needsUpdate = true;
  };

  const lastRenderSize = { width: 1, height: 1 };
  const resize = () => {
    const rect = container.getBoundingClientRect();
    if (rect.width < 32 || rect.height < 32) return;
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    lastRenderSize.width = width;
    lastRenderSize.height = height;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  window.resizeHeroComputer = resize;

  const shouldRunHeroComputer = () => {
    if (!heroPin) return true;
    const heroExitScrollY = Math.max(0, heroPin.offsetHeight - window.innerHeight);
    return window.scrollY <= heroExitScrollY + 1;
  };

  const scheduleRenderLoop = () => {
    if (renderFrameId !== null || !isHeroComputerActive) return;
    renderFrameId = window.requestAnimationFrame(animate);
  };

  const setHeroComputerActive = (nextActive) => {
    if (isHeroComputerActive === nextActive) {
      if (nextActive) {
        container.dataset.heroComputerPaused = "false";
      } else {
        container.dataset.heroComputerPaused = "true";
      }
      return;
    }

    isHeroComputerActive = nextActive;
    if (nextActive) {
      container.dataset.heroComputerPaused = "false";
    } else {
      container.dataset.heroComputerPaused = "true";
    }

    if (!nextActive) {
      if (videoElement) videoElement.pause();
      if (renderFrameId !== null) {
        window.cancelAnimationFrame(renderFrameId);
        renderFrameId = null;
      }
      return;
    }

    if (videoElement) videoElement.play().catch(() => {});
    resize();
    scheduleRenderLoop();
  };

  const updateHeroComputerActivity = () => {
    setHeroComputerActive(shouldRunHeroComputer());
  };

  const handlePointerMove = (event) => {
    if (!isHeroComputerActive) return;
    const x = event.clientX / Math.max(window.innerWidth, 1) - 0.5;
    const y = event.clientY / Math.max(window.innerHeight, 1) - 0.5;
    targetRotation.y = baseRotation.y + x * 0.12;
    targetRotation.x = baseRotation.x - y * 0.08;
    targetRotation.z = baseRotation.z + x * 0.012;
  };

  const probePixels = () => {
    const gl = renderer.getContext();
    const width = renderer.domElement.width;
    const height = renderer.domElement.height;
    const pixel = new Uint8Array(4);
    let strongest = 0;
    for (let xStep = 1; xStep < 5; xStep += 1) {
      for (let yStep = 1; yStep < 5; yStep += 1) {
        gl.readPixels(
          Math.floor((width * xStep) / 5),
          Math.floor((height * yStep) / 5),
          1,
          1,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          pixel
        );
        strongest = Math.max(strongest, pixel[0] + pixel[1] + pixel[2] + pixel[3]);
      }
    }
    container.dataset.pixelProbe = String(strongest);
    container.dataset.rendered = strongest > 80 ? "true" : "false";
  };

  let frame = 0;
  const animate = (time) => {
    renderFrameId = null;
    if (!isHeroComputerActive) return;

    drawScreen(time);
    modelRoot.rotation.x = THREE.MathUtils.lerp(modelRoot.rotation.x, targetRotation.x, 0.065);
    modelRoot.rotation.y = THREE.MathUtils.lerp(modelRoot.rotation.y, targetRotation.y, 0.065);
    modelRoot.rotation.z = THREE.MathUtils.lerp(modelRoot.rotation.z, targetRotation.z, 0.065);
    renderer.render(scene, camera);
    if (SHOULD_PROBE_PIXELS && (frame === 14 || frame === 42)) probePixels();
    frame += 1;
    scheduleRenderLoop();
  };

  const handleResize = () => {
    resize();
    updateHeroComputerActivity();
  };

  resize();
  updateHeroComputerActivity();
  window.addEventListener("resize", handleResize);
  window.addEventListener("scroll", updateHeroComputerActivity, { passive: true });
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.requestAnimationFrame(updateHeroComputerActivity);
  scheduleRenderLoop();
}
