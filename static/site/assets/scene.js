/* Cleargrin Dental Clinic — hero 3D scene (Three.js).
   A small studio of stylised teeth: soft key light, mint rim light and a
   gentle idle rotation. Falls back to a flat SVG if WebGL or the module
   import is unavailable. */

import * as THREE from 'three';

const stage = document.getElementById('stage');
const canvas = document.getElementById('tooth-canvas');

if (stage && canvas) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (error) {
    stage.classList.add('is-fallback');
  }

  if (renderer) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.35, 4.7);
    camera.lookAt(0, 0.05, 0);

    // Soft studio lighting; the mint rim keeps the teeth from feeling flat.
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9fd8c6, 1.5));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(2.6, 4, 3.4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x8fd3c0, 1.7);
    rimLight.position.set(-3.2, 1.4, -2.6);
    scene.add(rimLight);

    const bounce = new THREE.PointLight(0xffffff, 6, 12, 2);
    bounce.position.set(-1.4, -1.6, 2.6);
    scene.add(bounce);

    // A generated room environment gives the enamel its soft reflections.
    try {
      const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch (error) {
      /* Directional lighting alone still renders the teeth. */
    }

    const group = new THREE.Group();
    scene.add(group);

    const toothMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0,
      clearcoat: 0.9,
      clearcoatRoughness: 0.22,
      sheen: 0.6,
      sheenColor: new THREE.Color(0xd4e9e2),
      envMapIntensity: 0.7,
    });

    const toothGeometry = (() => {
      const profile = [
        [0.0, 0.0], [0.07, 0.03], [0.13, 0.1], [0.18, 0.2],
        [0.215, 0.32], [0.235, 0.42], [0.28, 0.52], [0.34, 0.62],
        [0.375, 0.72], [0.385, 0.8], [0.36, 0.88], [0.29, 0.94],
        [0.17, 0.985], [0.0, 1.0],
      ].map(([x, y]) => new THREE.Vector2(x, y));

      const points = new THREE.SplineCurve(profile).getPoints(80);
      const geometry = new THREE.LatheGeometry(points, 96);
      geometry.translate(0, -0.5, 0);
      geometry.computeVertexNormals();
      return geometry;
    })();

    const layout = [
      { x: -0.74, y: -0.08, z: -0.16, scale: 0.85, tilt: 0.17, spin: 0.55 },
      { x: 0, y: 0.07, z: 0.08, scale: 1.03, tilt: 0, spin: 0 },
      { x: 0.74, y: -0.08, z: -0.16, scale: 0.85, tilt: -0.17, spin: -0.55 },
    ];

    layout.forEach(({ x, y, z, scale, tilt, spin }) => {
      const tooth = new THREE.Mesh(toothGeometry, toothMaterial);
      tooth.position.set(x, y, z);
      tooth.rotation.set(0.06, spin, tilt);
      tooth.scale.set(scale * 1.55, scale * 1.5, scale * 1.55);
      group.add(tooth);
    });

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.45, 0.011, 12, 180),
      new THREE.MeshBasicMaterial({ color: 0x2f6e5f, transparent: true, opacity: 0.32 })
    );
    halo.position.z = -1.3;
    scene.add(halo);

    const sparkles = [0, 1, 2, 3].map((index) => {
      const sparkle = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 })
      );
      sparkle.position.set(-1.1 + index * 0.75, 0.85 - (index % 2) * 1.6, 0.5);
      scene.add(sparkle);
      return sparkle;
    });

    // ── Pointer: parallax + drag to rotate ───────────────────
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let dragging = false;
    let dragVelocity = 0;
    let draggedAt = -10;
    let lastPointerX = 0;

    const onPointerDown = (event) => {
      dragging = true;
      lastPointerX = event.clientX;
      canvas.setPointerCapture?.(event.pointerId);
    };
    const onPointerMove = (event) => {
      const rect = stage.getBoundingClientRect();
      pointer.targetX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.targetY = ((event.clientY - rect.top) / rect.height) * 2 - 1;

      if (dragging) {
        dragVelocity += (event.clientX - lastPointerX) * 0.0006;
        lastPointerX = event.clientX;
        draggedAt = performance.now() / 1000;
      }
    };
    const onPointerUp = () => {
      dragging = false;
      draggedAt = performance.now() / 1000;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    stage.addEventListener('pointerleave', () => {
      pointer.targetX = 0;
      pointer.targetY = 0;
    });

    // ── Sizing ───────────────────────────────────────────────
    const resize = () => {
      const { clientWidth, clientHeight } = stage.querySelector('.stage__inner');
      if (!clientWidth || !clientHeight) return;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };
    resize();
    if ('ResizeObserver' in window) {
      new ResizeObserver(resize).observe(stage.querySelector('.stage__inner'));
    } else {
      window.addEventListener('resize', resize);
    }

    // ── Render loop ──────────────────────────────────────────
    const clock = new THREE.Clock();
    let manual = 0;
    let visible = true;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.01 })
        .observe(stage);
    }

    let announced = false;

    renderer.setAnimationLoop(() => {
      const delta = Math.min(clock.getDelta(), 0.05);
      const time = clock.getElapsedTime();

      if (!visible || document.hidden) return;

      manual += dragVelocity;
      dragVelocity *= 0.93;

      pointer.x += (pointer.targetX - pointer.x) * 0.06;
      pointer.y += (pointer.targetY - pointer.y) * 0.06;

      const idle = reduceMotion || dragging || time - draggedAt < 3.5 ? 0 : delta * 0.32;
      group.rotation.y += idle + manual;
      group.position.y = reduceMotion ? 0 : Math.sin(time * 0.7) * 0.055;
      group.rotation.x = pointer.y * -0.1;
      group.rotation.z = pointer.x * 0.04;

      halo.rotation.z = time * 0.12;
      halo.material.opacity = 0.26 + Math.sin(time * 0.9) * 0.06;

      sparkles.forEach((sparkle, index) => {
        sparkle.position.y += Math.sin(time * 0.9 + index * 1.7) * 0.0012;
        sparkle.material.opacity = 0.5 + Math.sin(time * 1.3 + index) * 0.25;
      });

      renderer.render(scene, camera);

      if (!announced) {
        announced = true;
        stage.classList.remove('is-fallback');
        stage.classList.add('is-ready');
      }
    });
  }
}
