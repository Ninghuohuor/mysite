import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const MODEL_URL = "assets/principles/post_it_notes.glb";
const copyBlocks = Array.from(document.querySelectorAll("[data-principles-postit-copy]"));

if (copyBlocks.length) {
  const loader = new GLTFLoader();

  loader.load(MODEL_URL, (gltf) => {
    const sourceNotes = collectNoteGroups(gltf.scene);
    if (!sourceNotes.length) return;

    copyBlocks.forEach((copyBlock, index) => {
      mountPostitBackground(copyBlock, sourceNotes[index % sourceNotes.length], index);
    });
  });
}

function collectNoteGroups(root) {
  root.updateMatrixWorld(true);
  const sceneRoot = root.getObjectByName("GLTF_SceneRootNode") || root;
  const directNotes = sceneRoot.children.filter((child) => {
    let hasMesh = false;
    child.traverse((descendant) => {
      if (descendant.isMesh) hasMesh = true;
    });
    return hasMesh;
  });

  if (directNotes.length) return directNotes;

  const meshes = [];
  root.traverse((child) => {
    if (child.isMesh) meshes.push(child);
  });
  return meshes;
}

function mountPostitBackground(copyBlock, sourceNote, index) {
  const holder = document.createElement("div");
  holder.className = "principles-postit-bg";
  holder.dataset.principlesPostitBg = "true";
  holder.setAttribute("aria-hidden", "true");

  const canvas = document.createElement("canvas");
  holder.appendChild(canvas);
  copyBlock.prepend(holder);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
    preserveDrawingBuffer: true
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 20);
  camera.position.set(0, 1.65, 1.35);
  camera.lookAt(0, 0, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 1.55);
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-1.8, 2.7, 2.3);
  const fill = new THREE.DirectionalLight(0xfff3b0, 0.72);
  fill.position.set(2.4, 1.3, -1.8);
  scene.add(ambient, key, fill);

  const model = sourceNote.clone(true);
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = false;
    child.receiveShadow = false;
    if (child.material) {
      child.material = child.material.clone();
      child.material.transparent = true;
      child.material.opacity = 0.9;
      child.material.roughness = Math.min(1, (child.material.roughness || 0.74) + 0.12);
      child.material.metalness = 0;
    }
  });

  scene.add(model);
  normalizeModel(model);
  model.rotation.x += THREE.MathUtils.degToRad(-4);

  const render = () => {
    const rect = holder.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width, height, false);
    const aspect = width / height;
    camera.left = -1.05 * aspect;
    camera.right = 1.05 * aspect;
    camera.top = 1.05;
    camera.bottom = -1.05;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };

  render();

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(holder);
  } else {
    window.addEventListener("resize", render, { passive: true });
  }
}

function normalizeModel(model) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  model.position.sub(center);

  const footprint = Math.max(size.x, size.z, 0.001);
  model.scale.setScalar(1.86 / footprint);
}
