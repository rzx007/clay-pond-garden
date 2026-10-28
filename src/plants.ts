import * as THREE from 'three';

/** Clay garden planting. Time passed to update is in seconds. */
export function addPlants(scene: THREE.Scene): { update(time: number): void } {
  const groundY = 0.045;
  const root = new THREE.Group();
  root.name = 'clay-garden-plants';
  scene.add(root);

  // Local deterministic randomness leaves the rest of the scene unaffected.
  let seed = 73129;
  const random = (): number => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const range = (lo: number, hi: number): number => lo + random() * (hi - lo);
  const tau = Math.PI * 2;
  const clay = (color: THREE.ColorRepresentation): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.94, metalness: 0 });
  const sphere = new THREE.SphereGeometry(1, 32, 24);
  const trunkMaterial = clay('#755240');
  const branchGeometry = new THREE.CylinderGeometry(0.72, 1, 1, 14);
  const dummy = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);

  const pondPoint = (a: number): THREE.Vector2 => new THREE.Vector2(
    4.15 * Math.cos(a) * (1 + 0.045 * Math.sin(3 * a) + 0.035 * Math.cos(5 * a)),
    2.45 * Math.sin(a) * (1 + 0.07 * Math.cos(3 * a)),
  );
  const shoreline = Array.from({ length: 256 }, (_, i) => pondPoint(i * tau / 256));

  // Polygon containment plus a distance buffer works even where the radial
  // contour is indented; an ellipse test would plant grass in those coves.
  function dryLand(x: number, z: number, clearance: number): boolean {
    let inside = false;
    let nearestSquared = Infinity;
    for (let i = 0, j = shoreline.length - 1; i < shoreline.length; j = i++) {
      const a = shoreline[j];
      const b = shoreline[i];
      if ((a.y > z) !== (b.y > z) && x < (b.x - a.x) * (z - a.y) / (b.y - a.y) + a.x) {
        inside = !inside;
      }
      const dx = b.x - a.x;
      const dz = b.y - a.y;
      const t = THREE.MathUtils.clamp(((x - a.x) * dx + (z - a.y) * dz) / (dx * dx + dz * dz), 0, 1);
      nearestSquared = Math.min(nearestSquared, (x - a.x - dx * t) ** 2 + (z - a.y - dz * t) ** 2);
    }
    return !inside && nearestSquared > clearance * clearance;
  }

  // Keep the lower-right bridge landing and its approach visually open.
  const bridgeClear = (x: number, z: number): boolean =>
    ((x - 2.95) / 1.0) ** 2 + ((z - 1.95) / 0.85) ** 2 > 1 &&
    !(x > 3.0 && x < 4.7 && z > 1.45 && z < 2.55) && !(z > 2.5 && Math.abs(x - (3.9 + (z - 2.6) * 0.4)) < 0.32);
  const lawnEdge = (x: number, z: number): number => Math.max(
    Math.abs(x) / (5.94 + 0.13 * Math.sin(z * 2.3) + 0.07 * Math.cos(z * 4.7)),
    Math.abs(z) / (3.94 + 0.12 * Math.sin(x * 1.8) + 0.06 * Math.cos(x * 3.2)),
  );

  function branch(from: THREE.Vector3, to: THREE.Vector3, radius: number): void {
    const delta = to.clone().sub(from);
    const mesh = new THREE.Mesh(branchGeometry, trunkMaterial);
    mesh.position.copy(from).add(to).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(up, delta.clone().normalize());
    mesh.scale.set(radius, delta.length(), radius);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
  }

  function tree(x: number, z: number, height: number, width: number, colors: string[], bush = false): void {
    const palette = colors.map(clay);
    const crownY = groundY + height * (bush ? 0.48 : 0.71);
    const trunkTop = new THREE.Vector3(x + width * 0.045, crownY, z);
    branch(new THREE.Vector3(x, groundY, z), trunkTop, width * (bush ? 0.085 : 0.13));
    const lobes = bush ? 9 : 12;
    for (let i = 0; i < lobes; i++) {
      const a = i * 2.399963 + range(-0.3, 0.3);
      const central = i >= lobes - 3;
      const radial = central ? range(0.03, 0.20) : range(0.34, 0.56);
      const px = x + Math.cos(a) * width * radial;
      const pz = z + Math.sin(a) * width * radial * 0.8;
      const py = crownY + (central ? height * range(0.08, 0.17) : height * range(-0.12, 0.07));
      const size = width * range(0.36, 0.52);
      const crown = new THREE.Mesh(sphere, palette[i % palette.length]);
      crown.position.set(px, py, pz);
      crown.scale.set(size * range(0.94, 1.15), size * (bush ? 0.72 : range(0.85, 1.14)), size * range(0.85, 1.05));
      crown.rotation.set(range(-0.2, 0.2), a, range(-0.18, 0.18));
      crown.castShadow = true;
      crown.receiveShadow = true;
      root.add(crown);
      if (!central && i % 2 === 0) {
        branch(new THREE.Vector3(x, groundY + height * 0.36, z), new THREE.Vector3(px, py, pz), width * 0.045);
      }
    }
  }

  // Negative Z is the far (upper screen) bank.
  tree(-4.5, -2.95, 1.65, 0.67, ['#63a537', '#70ad40', '#609e35', '#78b347']);
  tree(-3.45, -3.15, 1.05, 0.42, ['#568747', '#68944e', '#477c42']);
  tree(-5, 2.8, 0.95, 0.73, ['#589736', '#63a537', '#70ac42']);
  tree(4.65, -3.1, 1.40, 0.62, ['#df91a8', '#edabc0', '#e69cb4', '#f1b8c7']);
  tree(5, 2.9, 0.75, 0.57, ['#91b968', '#a4c77a', '#7faa58'], true);

  interface Instance {
    x: number; y: number; z: number;
    sx: number; sy: number; sz: number;
    yaw: number; lean: number; phase: number; color: THREE.Color;
  }
  const blades: Instance[] = [];
  const stalks: Instance[] = [];
  const heads: Instance[] = [];
  const petals: Instance[] = [];
  const grassColors = ['#648c48', '#799c51', '#88aa5c', '#567b40', '#99b86b'].map(c => new THREE.Color(c));
  const reedColors = ['#527842', '#668749', '#7b9852'].map(c => new THREE.Color(c));
  const instance = (x: number, z: number, sx: number, sy: number, sz: number, color: THREE.Color, y = groundY): Instance => ({
    x, y, z, sx, sy, sz, yaw: range(0, tau), lean: range(-0.16, 0.16), phase: range(0, tau), color,
  });

  function tuft(x: number, z: number, tall: boolean, small = false): void {
    const count = tall ? 5 : (small ? 2 : 3);
    for (let i = 0; i < count; i++) {
      const px = x + range(-0.055, 0.055);
      const pz = z + range(-0.055, 0.055);
      if (!dryLand(px, pz, tall ? 0.13 : 0.065) || !bridgeClear(px, pz)) continue;
      const h = tall ? range(0.26, 0.57) : range(0.085, small ? 0.15 : 0.24);
      const palette = tall ? reedColors : grassColors;
      blades.push(instance(px, pz, tall ? range(0.027, 0.045) : range(0.02, 0.035), h, 0.012, palette[Math.floor(random() * palette.length)]));
    }
  }

  // A sparse lawn, with an irregular fading fringe rather than a hard border.
  for (let i = 0; i < 1050; i++) {
    const x = range(-6.15, 6.15);
    const z = range(-4.15, 4.15);
    const edge = lawnEdge(x, z);
    if (edge > 1.035 || (edge > 0.93 && random() > (1.035 - edge) / 0.105)) continue;
    if (!dryLand(x, z, 0.16) || !bridgeClear(x, z)) continue;
    tuft(x, z, false, edge > 0.96);
    if (edge < 0.94 && random() < 0.09) {
      const h = range(0.11, 0.2);
      stalks.push(instance(x, z, 0.009, h, 0.009, grassColors[0]));
      const flowerColor = new THREE.Color(random() < 0.55 ? '#f6d66c' : '#fff4da');
      const r = range(0.025, 0.043);
      petals.push(instance(x, z, r, r * 0.65, r, flowerColor, groundY + h));
    }
  }

  // Sample the SAME pond contour, displacing out along its local normal.
  // Modulated acceptance gives clumps and quiet gaps rather than a hedge.
  for (let i = 0; i < 310; i++) {
    const a = i / 310 * tau + range(-0.014, 0.014);
    const density = 0.46 + 0.26 * Math.sin(a * 5 + 1.2) + 0.17 * Math.cos(a * 9);
    if (random() > density) continue;
    const p = pondPoint(a);
    const before = pondPoint(a - 0.003);
    const after = pondPoint(a + 0.003);
    const normal = new THREE.Vector2(after.y - before.y, before.x - after.x).normalize();
    const offset = range(0.19, 0.42);
    const x = p.x + normal.x * offset;
    const z = p.y + normal.y * offset;
    if (!dryLand(x, z, 0.15) || !bridgeClear(x, z)) continue;
    tuft(x, z, true);
    if (random() < 0.34) {
      const h = range(0.53, 0.91);
      const stalk = instance(x, z, 0.013, h, 0.013, reedColors[0]);
      // Keep cattails upright so their separately instanced heads meet stems.
      stalk.lean = 0;
      stalks.push(stalk);
      const head = instance(x, z, range(0.033, 0.043), range(0.13, 0.21), 0.037,
        new THREE.Color(random() < 0.5 ? '#78523a' : '#65472f'), groundY + h - 0.025);
      head.lean = 0;
      heads.push(head);
    }
  }

  // Rounded, gently bent tapered leaves: smooth-shaded, not flat low-poly cards.
  const bladeGeometry = new THREE.CylinderGeometry(0.025, 0.5, 1, 7, 5);
  bladeGeometry.translate(0, 0.5, 0);
  const positions = bladeGeometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    positions.setX(i, positions.getX(i) + 1.25 * y * y);
  }
  bladeGeometry.computeVertexNormals();
  const stemGeometry = new THREE.CylinderGeometry(0.7, 1, 1, 8);
  stemGeometry.translate(0, 0.5, 0);
  const headGeometry = new THREE.CapsuleGeometry(1, 3, 5, 10);
  headGeometry.scale(1, 0.2, 1);
  headGeometry.translate(0, 0.5, 0);
  const flowerGeometry = new THREE.SphereGeometry(1, 10, 8);
  const instanceMaterial = clay('#ffffff');

  function setMatrix(mesh: THREE.InstancedMesh, data: Instance, i: number, sway: number): void {
    dummy.position.set(data.x, data.y, data.z);
    dummy.rotation.set(sway * 0.45, data.yaw, data.lean + sway);
    dummy.scale.set(data.sx, data.sy, data.sz);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  function batch(name: string, geometry: THREE.BufferGeometry, data: Instance[], animated = false): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(geometry, instanceMaterial, data.length);
    mesh.name = name;
    if (animated) mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    data.forEach((entry, i) => {
      setMatrix(mesh, entry, i, 0);
      mesh.setColorAt(i, entry.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    // Allow for the small animated tip movement when frustum culling.
    if (mesh.boundingSphere) mesh.boundingSphere.radius += 0.15;
    root.add(mesh);
    return mesh;
  }
  const grass = batch('instanced-grass-and-shore-leaves', bladeGeometry, blades, true);
  batch('instanced-flower-and-cattail-stems', stemGeometry, stalks);
  batch('instanced-cattail-heads', headGeometry, heads);
  batch('instanced-yellow-and-white-flowers', flowerGeometry, petals);

  return {
    update(time: number): void {
      if (!Number.isFinite(time)) return;
      for (let i = 0; i < blades.length; i++) {
        const leaf = blades[i];
        const sway = 0.065 * Math.sin(time * 1.45 + leaf.phase + leaf.x * 0.4)
          + 0.022 * Math.sin(time * 2.2 + leaf.z * 0.7);
        setMatrix(grass, leaf, i, sway);
      }
      grass.instanceMatrix.needsUpdate = true;
    },
  };
}
