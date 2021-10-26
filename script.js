import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { resizeRendererToDisplaySize, addCamera, addScene, buildSurfaceMesh } from './helpers.js';

/**
 * Метод для рисования на карте высот
 */
const drawOnEditor = (mouseEvent) => {
  if (isMouseDown) {
    editorCtx.fillStyle = '#10101005'
    editorCtx.beginPath();
    editorCtx.arc(mouseEvent.clientX, mouseEvent.clientY, penRadius, 0, 2 * Math.PI);
    editorCtx.closePath();
    editorCtx.fill();
    redrawSurface(axisLength);
  }
}

/**
 * @typedef {Object} Vertex
 * @property {[number, number, number]} pos - координаты позиции [X, Y, Z]
 * @property {[number, number, number]} norm - координаты нормали [X, Y, Z]
 * @property {[number, number]} uv - UV координаты [U, V]
 */

/**
 * Метод для создания вершин меша поверхности
 * @returns {[Vertex[], number]} Возвращает массив вершин и длину подмассива, если представить массив вершин как матрицу. 
 * Пояснение: функция возвращает развёрнутый массив, однако в будущем, 
 * при сборке топологии это будет квадрат axisLength вершин высоту и axisLength вершин в длину
 */
const createVertices = () => {
  let axisLength = 0;
  const result = [];

  for (let iZ = 2; iZ >= -2; iZ = parseFloat((iZ - 0.01).toFixed(2))) {
    axisLength++;
    for (let iX = -2; iX <= 2; iX = parseFloat((iX + 0.01).toFixed(2))) {
      result.push({ pos: [iX, 0, -iZ], norm: [0, 1, 0], uv: [0, 0], })
    }
  }
  return [result, axisLength];
}

/**
 * Рассчитывает индексы вершин для полигонов исходя из длины axisLength 
 * @param {number} axisLength - длина подмассива, если представить массив вершин как матрицу 
 * @returns Возвращает индексы вершин для правильной топологии плоскости
 */
const buildSurfaceTopology = (axisLength) => {
  const res = [];

  for (let hy = 0; hy < axisLength - 1; hy++) {
    for (let hx = 0; hx < axisLength - 1; hx++) {
      res.push(
        (hy * axisLength) + hx,
        (hy * axisLength) + hx + 1,
        ((hy + 1) * axisLength) + hx,
      );
      res.push(
        (hy * axisLength) + hx + 1,
        ((hy + 1) * axisLength) + hx,
        ((hy + 1) * axisLength) + hx + 1
      );
    }
  }

  return res;
}

/**
 * Собирает типизированный массив координат
 * @param {Vertex[]} vertices массив вершин 
 */
const buildPositions = (vertices) => {
  const positionNumComponents = 3;
  const positions = new Float32Array(vertices.length * positionNumComponents);
  let positionIndex = 0;
  for (const vertex of vertices) {
    positions.set(vertex.pos, positionIndex);
    positionIndex += positionNumComponents;
  }

  return positions;
}

/**
 * Собирает типизированный массив нормалей
 * @param {Vertex[]} vertices массив вершин 
 */
const buildNormals = (vertices) => {
  const normalNumComponents = 3;
  const normals = new Float32Array(vertices.length * normalNumComponents);
  let normalIndex = 0;
  for (const vertex of vertices) {
    normals.set(vertex.norm, normalIndex);
    normalIndex += normalNumComponents;
  }

  return normals;
}

/**
 * Собирает типизированный массив UV координат
 * @param {Vertex[]} vertices массив вершин 
 */
const buildUVS = (vertices) => {
  const uvNumComponents = 2;
  const uvs = new Float32Array(vertices.length * uvNumComponents);
  let uvIndex = 0;
  for (const vertex of vertices) {
    uvs.set(vertex.uv, uvIndex);
    uvIndex += uvNumComponents;
  }

  return uvs;
}

/**
 * Собирает геометрию для меша
 * @param {Vertex[]} vertices массив вершин 
 * @returns возвращает геометрию и буфер вершин, который в последующем будем обновлять
 */
const buildGeometry = (vertices) => {
  positions = buildPositions(vertices);
  normals = buildNormals(vertices);
  uvs = buildUVS(vertices);

  const uvNumComponents = 2;
  const normalNumComponents = 3;
  const positionNumComponents = 3;

  const geometry = new THREE.BufferGeometry();
  const positionAttribute = new THREE.BufferAttribute(positions, positionNumComponents);

  positionAttribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute(
    'position',
    positionAttribute);
  geometry.setAttribute(
    'normal',
    new THREE.BufferAttribute(normals, normalNumComponents));
  geometry.setAttribute(
    'uv',
    new THREE.BufferAttribute(uvs, uvNumComponents));

  geometry.setIndex(buildSurfaceTopology(axisLength));

  return [geometry, positionAttribute];
}

/**
 * Преорбазует данные канваса в матрицу состоящую только из альфа-канала
 * @param {number} axisLength - длина подмассива, если представить массив вершин как матрицу
 * @returns 
 */

const buildCanvasDataAsMatrix = (axisLength) => {
  const data = editorCtx.getImageData(0, 0, axisLength, axisLength).data;
  const matrix = [];
  
  for(let hy = 0; hy < axisLength; hy++){
    for(let i = 3 + (axisLength * hy * 4); i < (axisLength * 4) + (axisLength * 4 * hy); i += 4) {
      if(!matrix[hy]) matrix[hy] = [];
      matrix[hy].push(data[i]);
    }
  }

  return matrix;
}

/**
 * Меняет высоту вершин поверхности в зависимости от карты высот, в качестве параметра высоты использует из RGBA значения пикселя альфа-канал 
 * @param {number} axisLength - длина подмассива, если представить массив вершин как матрицу 
 */
const redrawSurface = (axisLength) => {
  const matrix = buildCanvasDataAsMatrix(axisLength);
  const flatMatrix = matrix.flat(1);


  for (let i = 1, n = 0; i < positions.length; n++, i += 3) {
    positions[i] = flatMatrix[n] / 255;
  }
  positionAttribute.needsUpdate = true;
  buildCanvasDataAsMatrix(axisLength)
}

let positions, normals, uvs;

const canvas = document.querySelector('#three_canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
const camera = addCamera();
const scene = addScene();
const [vertices, axisLength] = createVertices();
const [geometry, positionAttribute] = buildGeometry(vertices);
const controls = new OrbitControls(camera, renderer.domElement);
const surface = buildSurfaceMesh(geometry);
scene.add(surface);

let isMouseDown = false;
let penRadius = 25;
const editor = document.getElementById('height_map');
const editorCtx = editor.getContext('2d');
editor.width = axisLength;
editor.height = axisLength;

function render(time) {
  // time *= 0.001;
  controls.update();

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

controls.update();
requestAnimationFrame(render);

editor.addEventListener('mousedown', () => isMouseDown = true);
editor.addEventListener('mouseup', () => isMouseDown = false);
editor.addEventListener('mousemove', event => drawOnEditor(event));
editor.addEventListener('wheel', event => { penRadius += event.deltaY * -0.01; console.log(penRadius) });


