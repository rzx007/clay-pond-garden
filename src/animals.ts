import * as THREE from 'three';

/** All animation times are in seconds. No textures or external assets are used. */
export function addAnimals(scene: THREE.Scene): { update(time: number): void } {
  const WATER = -0.025;
  const root = new THREE.Group();
  root.name = 'pond-animals-and-lilies';
  scene.add(root);

  const material = (color: THREE.ColorRepresentation) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0 });
  const cream = material('#fff6df');
  const white = material('#fffaf0');
  const brown = material('#795343');
  const wingMaterial = material('#a69a87');
  const orange = material('#edaa58');
  const eyeMaterial = material('#302b28');
  const pink = material('#f7dfe5');
  const leafMaterial = material('#669746');
  leafMaterial.side = THREE.DoubleSide;
  const veinMaterial = material('#83a65c');
  const sphere = new THREE.SphereGeometry(1, 24, 16);

  function ellipsoid(
    parent: THREE.Object3D, mat: THREE.Material,
    position: [number, number, number], scale: [number, number, number],
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(sphere, mat);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    parent.add(mesh);
    return mesh;
  }

  function lineTube(parent: THREE.Object3D, points: THREE.Vector3[], radius: number, mat: THREE.Material): void {
    const curve = new THREE.CatmullRomCurve3(points);
    parent.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, radius, 5, false), mat));
  }

  function fin(parent: THREE.Object3D, points: number[][], mat: THREE.Material): THREE.Mesh {
    const positions: number[] = [];
    for (let i = 1; i < points.length - 1; i++) {
      positions.push(...points[0], ...points[i], ...points[i + 1]);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, mat);
    parent.add(mesh);
    return mesh;
  }

  // Fish face local +X. A rounded ring profile produces a continuous tapered body.
  function fishBody(colors: string[], koi: boolean): THREE.Mesh {
    const profile = [
      [-0.215, 0.016, 0.018], [-0.16, 0.037, 0.047],
      [-0.08, 0.057, 0.078], [0.035, 0.063, 0.086],
      [0.13, 0.046, 0.065], [0.195, 0.025, 0.036], [0.215, 0.003, 0.004],
    ];
    const positions: number[] = [];
    const vertexColors: number[] = [];
    const indices: number[] = [];
    const segments = 32;
    for (let r = 0; r < profile.length; r++) {
      const [x, height, width] = profile[r];
      for (let s = 0; s <= segments; s++) {
        const angle = (s / segments) * Math.PI * 2;
        positions.push(x, Math.cos(angle) * height, Math.sin(angle) * width);
        const patch = koi
          ? ((r === 2 && s < 12) || (r === 4 && s > 20) ? 1 : (r === 3 && s > 4 && s < 12 ? 2 : 0))
          : 0;
        const color = new THREE.Color(colors[patch]);
        if (Math.cos(angle) < -0.2) color.lerp(new THREE.Color('#fff4df'), 0.42);
        vertexColors.push(color.r, color.g, color.b);
        if (r < profile.length - 1 && s < segments) {
          const a = r * (segments + 1) + s;
          const b = a + segments + 1;
          indices.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
    }
    // Close both ends; the tiny front cap reads as a soft rounded snout.
    for (const r of [0, profile.length - 1]) {
      const center = positions.length / 3;
      positions.push(profile[r][0], 0, 0);
      const color = new THREE.Color(colors[0]);
      vertexColors.push(color.r, color.g, color.b);
      for (let s = 0; s < segments; s++) {
        const a = r * (segments + 1) + s;
        if (r === 0) indices.push(center, a + 1, a);
        else indices.push(center, a, a + 1);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }));
  }

  const fishSpecs = [
    { x: 0, z: 0.35, scale: 1, phase: 0.5, speed: 0.12, colors: ['#e5af48', '#e5af48', '#e5af48'] },
    { x: 1.65, z: -0.1, scale: 1.08, phase: 2.5, speed: 0.095, colors: ['#f9efdc', '#e77736', '#41413d'] },
    { x: -0.5, z: -0.8, scale: 0.78, phase: 4.2, speed: 0.14, colors: ['#eee6cf', '#eee6cf', '#eee6cf'] },
  ];
  const fishes = fishSpecs.map((spec, index) => {
    const group = new THREE.Group();
    group.name = ['gold-fish', 'orange-white-dark-koi', 'small-pale-fish'][index];
    group.scale.setScalar(spec.scale);
    root.add(group);
    group.add(fishBody(spec.colors, index === 1));
    const finMaterial = material(index === 0 ? '#f0d9a0' : '#eee3cd');
    finMaterial.side = THREE.DoubleSide;
    const tail = new THREE.Group();
    tail.position.x = -0.205;
    group.add(tail);
    fin(tail, [[0.015, 0, 0], [-0.145, 0.008, 0.108], [-0.115, 0.004, 0], [-0.145, 0.008, -0.108]], finMaterial);
    for (const side of [-1, 1]) {
      fin(group, [[0.07, -0.01, side * 0.05], [-0.055, -0.022, side * 0.145], [-0.085, -0.019, side * 0.065]], finMaterial);
      fin(group, [[-0.09, -0.018, side * 0.035], [-0.17, -0.025, side * 0.085], [-0.16, -0.025, side * 0.025]], finMaterial);
      ellipsoid(group, eyeMaterial, [0.163, 0.027, side * 0.039], [0.008, 0.008, 0.006]);
    }
    fin(group, [[0.06, 0.055, 0], [-0.08, 0.095, 0], [-0.14, 0.035, 0]], finMaterial);
    group.traverse(object => { object.renderOrder = 1; });
    return { group, tail, spec };
  });

  // The duck's bill points toward negative X (screen left for the given camera).
  const duck = new THREE.Group();
  duck.name = 'white-duck';
  duck.position.set(-1.1, WATER, 1.3);
  root.add(duck);
  ellipsoid(duck, white, [0.015, 0.072, 0], [0.265, 0.145, 0.165]);
  const breast = ellipsoid(duck, cream, [-0.15, 0.115, 0], [0.14, 0.14, 0.137]);
  breast.rotation.z = -0.2;
  const neck = ellipsoid(duck, cream, [-0.205, 0.245, 0], [0.071, 0.15, 0.074]);
  neck.rotation.z = -0.23;
  ellipsoid(duck, brown, [-0.252, 0.365, 0], [0.108, 0.099, 0.09]);
  ellipsoid(duck, orange, [-0.376, 0.343, 0], [0.075, 0.025, 0.052]);
  for (const side of [-1, 1]) {
    const wing = ellipsoid(duck, wingMaterial, [0.055, 0.12, side * 0.127], [0.187, 0.074, 0.052]);
    wing.rotation.z = -0.16;
    ellipsoid(duck, eyeMaterial, [-0.288, 0.388, side * 0.079], [0.012, 0.013, 0.007]);
    ellipsoid(duck, white, [-0.292, 0.392, side * 0.085], [0.0035, 0.0035, 0.002]);
    for (let i = 0; i < 3; i++) {
      const feather = ellipsoid(duck, wingMaterial, [0.13 + i * 0.029, 0.115 - i * 0.009, side * 0.151], [0.09, 0.025, 0.019]);
      feather.rotation.z = 0.12 + i * 0.08;
    }
  }
  const duckTail = ellipsoid(duck, cream, [0.282, 0.13, 0], [0.088, 0.052, 0.085]);
  duckTail.rotation.z = 0.42;

  const rippleMaterial = new THREE.MeshBasicMaterial({
    color: '#e9efdc', transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide,
  });
  const ripples = Array.from({ length: 3 }, (_, i) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.37 + i * 0.13, 0.376 + i * 0.13, 80), rippleMaterial.clone());
    ring.renderOrder = 3;
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(-1.06, WATER + 0.005 + i * 0.001, 1.3);
    root.add(ring);
    return ring;
  });

  function flower(parent: THREE.Object3D, bud: boolean): void {
    const blossom = new THREE.Group();
    blossom.position.set(-0.08, 0.015, 0.035);
    parent.add(blossom);
    ellipsoid(blossom, leafMaterial, [0, 0.045, 0], [0.035, 0.065, 0.035]);
    if (bud) {
      for (let i = 0; i < 5; i++) {
        const angle = i * Math.PI * 2 / 5;
        const petal = ellipsoid(blossom, i % 2 ? white : pink,
          [Math.cos(angle) * 0.022, 0.115, Math.sin(angle) * 0.022], [0.029, 0.077, 0.029]);
        petal.rotation.z = -Math.cos(angle) * 0.12;
        petal.rotation.x = Math.sin(angle) * 0.12;
      }
      return;
    }
    for (let layer = 0; layer < 2; layer++) {
      for (let i = 0; i < 8; i++) {
        const angle = (i + layer * 0.5) * Math.PI / 4;
        const petal = ellipsoid(blossom, layer ? white : pink,
          [Math.cos(angle) * (0.065 - layer * 0.022), 0.063 + layer * 0.028, Math.sin(angle) * (0.065 - layer * 0.022)],
          [0.078 - layer * 0.018, 0.018, 0.032]);
        petal.rotation.y = -angle;
        petal.rotation.z = 0.2 + layer * 0.25;
      }
    }
    ellipsoid(blossom, material('#efcf83'), [0, 0.105, 0], [0.033, 0.022, 0.033]);
  }

  const leaves = [
    { x: -2.8, z: -0.1, radius: 0.46, rotation: 0.45 },
    { x: -2.2, z: 0.55, radius: 0.39, rotation: -0.5 },
    { x: 2.8, z: -0.65, radius: 0.48, rotation: 2.1 },
    { x: 2.75, z: 0.45, radius: 0.41, rotation: 1.2 },
  ];
  leaves.forEach((spec, index) => {
    const leaf = new THREE.Group();
    leaf.name = `notched-lily-pad-${index + 1}`;
    leaf.position.set(spec.x, WATER + 0.009, spec.z);
    leaf.rotation.y = spec.rotation;
    root.add(leaf);
    const shape = new THREE.Shape();
    const gap = 0.2;
    shape.moveTo(0, 0);
    shape.lineTo(Math.cos(gap) * spec.radius, Math.sin(gap) * spec.radius);
    shape.absarc(0, 0, spec.radius, gap, Math.PI * 2 - gap, false);
    shape.lineTo(0, 0);
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.009, bevelEnabled: false, curveSegments: 48 });
    geometry.rotateX(-Math.PI / 2);
    leaf.add(new THREE.Mesh(geometry, leafMaterial));
    for (let i = 0; i < 9; i++) {
      const angle = 0.36 + i * (Math.PI * 2 - 0.72) / 8;
      const end = new THREE.Vector3(Math.cos(angle) * spec.radius * 0.9, 0.011, -Math.sin(angle) * spec.radius * 0.9);
      lineTube(leaf, [new THREE.Vector3(0, 0.012, 0), end.clone().multiplyScalar(0.5).setY(0.014), end], 0.002, veinMaterial);
    }
    if (index === 0) flower(leaf, false);
    if (index === 2) flower(leaf, true);
  });

  const petals = [
    [-2.35, -0.43], [-1.95, 0.08], [-2.6, 0.85], [2.24, -0.87], [2.05, 0.55], [0.7, 1.55],
  ].map(([x, z], i) => {
    const mesh = ellipsoid(root, i % 2 ? white : pink, [x, WATER + 0.006, z], [0.044, 0.008, 0.022]);
    mesh.rotation.y = i * 1.7;
    return { mesh, x, z, phase: i * 1.7 };
  });

  function update(time: number): void {
    const t = Number.isFinite(time) ? time : 0;
    fishes.forEach(({ group, tail, spec }) => {
      const angle = t * spec.speed + spec.phase;
      // Small closed orbits start at the requested coordinates and stay well inside the banks.
      group.position.set(
        spec.x + 0.65 * (Math.cos(angle) - Math.cos(spec.phase)),
        -0.15 + 0.003 * Math.sin(t * 0.55 + spec.phase),
        spec.z + 0.34 * (Math.sin(angle) - Math.sin(spec.phase)),
      );
      const dx = -0.65 * Math.sin(angle);
      const dz = 0.34 * Math.cos(angle);
      group.rotation.y = Math.atan2(-dz, dx);
      tail.rotation.y = 0.17 * Math.sin(t * 2.3 + spec.phase);
    });
    // A quiet oval in the open front water, starting at the reference position.
    // Local forward is -X; derive heading from the analytic path tangent.
    const swim = t * 0.10;
    const dx = -0.35 * Math.cos(swim);
    const dz = -0.35 * Math.sin(swim);
    duck.position.set(-1.1 - 0.35 * Math.sin(swim), WATER + 0.003 * Math.sin(t * 0.9), 0.95 + 0.35 * Math.cos(swim));
    duck.rotation.y = Math.atan2(dz, -dx);
    duck.rotation.z = 0.008 * Math.sin(t * 0.7);
    ripples.forEach((ring, i) => {
      // Slightly trailing rings follow the same route without frame-rate drift.
      const trail = swim - 0.025 * (i + 1);
      ring.position.set(-1.1 - 0.35 * Math.sin(trail), WATER + 0.005 + i * 0.001, 0.95 + 0.35 * Math.cos(trail));
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.65 - i * 1.2);
      ring.scale.set(1.16 + pulse * 0.06, 0.78 + pulse * 0.04, 1);
      ring.material.opacity = 0.1 + pulse * 0.09;
    });
    petals.forEach(({ mesh, x, z, phase }) => {
      mesh.position.x = x + 0.025 * Math.sin(t * 0.17 + phase);
      mesh.position.z = z + 0.018 * Math.sin(t * 0.13 + phase);
      mesh.rotation.y = phase + 0.12 * Math.sin(t * 0.2 + phase);
    });
  }
  update(0);
  return { update };
}
