import * as THREE from './three.module.js';

const addAmbientLight = () => {
  const color = 0xFFFFFF,
    intensity = 0.6,
    ambientLight = new THREE.AmbientLight(color, intensity);

  return ambientLight;
}

const addDirectionalLight = () => {
  const color = 0xFFFFFF,
    intensity = 0.2,
    directionalLight = new THREE.DirectionalLight(color, intensity);

  return directionalLight;
}
export const resizeRendererToDisplaySize = (renderer) => {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }

  return needResize;
}

export const addCamera = () => {
  const fov = 75,
    aspect = 2,
    near = 0.1,
    far = 100,
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 2;
  camera.position.y = 3;

  return camera;
}

export const addScene = () => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#DDF7FB');
  scene.add(addAmbientLight());
  scene.add(addDirectionalLight());

  return scene;
}

export const buildSurfaceMesh = (geometry) => {
  const material = new THREE.MeshPhongMaterial({ color: 0x88FF88, flatShading: true, side: THREE.DoubleSide, wireframe: false });
  const surface = new THREE.Mesh(geometry, material);

  return surface;
}