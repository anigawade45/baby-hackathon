// Pip 3D: High-polish WebGL / Three.js character viewer for Tier 3.
// Perfectly proportionate, centered, soft studio lighting, rich depth,
// interactive 360° rotation, zoom, stardust aura, and 3D squash & stretch boop.

import { clamp } from './util.js';
import { sfx } from './audio.js';

let THREE = null;

async function loadThree() {
  if (THREE) return THREE;
  const CDNS = [
    'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.js',
    'https://unpkg.com/three@0.160.0/build/three.module.js',
  ];
  for (const url of CDNS) {
    try {
      const mod = await import(url);
      if (mod && mod.Scene) {
        THREE = mod;
        return THREE;
      }
    } catch (e) {
      console.warn(`[pip3d] Failed loading from ${url}, trying next...`);
    }
  }
  throw new Error('Could not load Three.js from available CDNs');
}

export class Pip3DViewer {
  constructor({ container, canvas, loadingEl, resetBtn, onBoop, getMood }) {
    this.container = container;
    this.canvas = canvas;
    this.loadingEl = loadingEl;
    this.resetBtn = resetBtn;
    this.onBoop = onBoop;
    this.getMood = getMood || (() => 'night');

    this.initialized = false;
    this.loading = false;
    this.active = false;
    this.animId = null;

    // View state - calibrated for perfect centering and prominence
    this.targetRotY = 0;
    this.targetRotX = 0;
    this.currentRotY = 0;
    this.currentRotX = 0;
    this.targetZoom = 4.8;
    this.currentZoom = 4.8;

    // Interaction state
    this.isDragging = false;
    this.pointerStart = { x: 0, y: 0 };
    this.lastPinchDist = 0;
    this.boopBounce = 0;

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resetView();
        sfx.boop();
      });
    }
  }

  async init() {
    if (this.initialized || this.loading) return;
    this.loading = true;

    try {
      await loadThree();
      this.setupScene();
      this.buildPip();
      this.bindEvents();
      this.initialized = true;
      this.loading = false;
      this.updateMood(this.getMood());
      this.onResize();
      if (this.loadingEl) this.loadingEl.classList.add('done');
      this.start();
    } catch (err) {
      this.loading = false;
      if (this.loadingEl) this.loadingEl.classList.add('done');
      console.error('[pip3d] WebGL init error:', err);
      throw err;
    }
  }

  setupScene() {
    const w = this.canvas.clientWidth || 310;
    const h = this.canvas.clientHeight || 356;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 50);
    this.camera.position.set(0, 0.2, this.currentZoom);
    this.camera.lookAt(0, 0.12, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // Studio Three-Point Lighting for rich depth
    this.ambientLight = new THREE.AmbientLight(0xf2e8ff, 1.4);
    this.scene.add(this.ambientLight);

    // Warm Key Light (top right front)
    this.keyLight = new THREE.DirectionalLight(0xfff6e8, 2.4);
    this.keyLight.position.set(3, 4.5, 4);
    this.scene.add(this.keyLight);

    // Soft Pink Fill Light (left front)
    this.fillLight = new THREE.DirectionalLight(0xffe2ec, 1.2);
    this.fillLight.position.set(-3.5, 1, 3);
    this.scene.add(this.fillLight);

    // Dreamy Rim Light (back top)
    this.rimLight = new THREE.DirectionalLight(0xc7b8ff, 2.0);
    this.rimLight.position.set(0, 3, -4);
    this.scene.add(this.rimLight);

    // Cozy golden eye-glow point lights
    this.eyeLight = new THREE.PointLight(0xffe7a3, 2.2, 2.5);
    this.eyeLight.position.set(0, 0.45, 1.2);
    this.scene.add(this.eyeLight);
  }

  buildPip() {
    this.root = new THREE.Group();
    // Center the whole character group vertically
    this.root.position.set(0, -0.05, 0);
    this.scene.add(this.root);

    this.floatGroup = new THREE.Group();
    this.root.add(this.floatGroup);

    // 1. FLUFFY CLOUD CRADLE
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0.02,
    });
    const cloudGroup = new THREE.Group();
    cloudGroup.position.set(0, -0.92, 0);

    const puffs = [
      { r: 0.58, x: 0, y: 0, z: 0, sx: 1.6, sy: 0.72, sz: 1.35 },
      { r: 0.42, x: -0.58, y: 0.04, z: 0.12, sx: 1.15, sy: 0.75, sz: 1.1 },
      { r: 0.45, x: 0.62, y: 0.06, z: -0.05, sx: 1.15, sy: 0.8, sz: 1.1 },
      { r: 0.35, x: -0.28, y: 0.14, z: 0.35, sx: 1.1, sy: 0.8, sz: 1 },
      { r: 0.38, x: 0.32, y: 0.12, z: 0.32, sx: 1.1, sy: 0.8, sz: 1 },
      { r: 0.36, x: 0, y: 0.1, z: -0.38, sx: 1.3, sy: 0.75, sz: 1 },
    ];

    puffs.forEach((p) => {
      const geo = new THREE.SphereGeometry(p.r, 22, 18);
      geo.scale(p.sx, p.sy, p.sz);
      const mesh = new THREE.Mesh(geo, cloudMat);
      mesh.position.set(p.x, p.y, p.z);
      cloudGroup.add(mesh);
    });
    this.floatGroup.add(cloudGroup);

    // 2. BABY BODY (Pastel Onesie)
    const onesieMat = new THREE.MeshStandardMaterial({
      color: 0xfdf3e3,
      roughness: 0.65,
      metalness: 0.02,
    });
    const bodyGeo = new THREE.SphereGeometry(0.68, 26, 22);
    bodyGeo.scale(1.08, 1.05, 0.98);
    const bodyMesh = new THREE.Mesh(bodyGeo, onesieMat);
    bodyMesh.position.set(0, -0.25, 0);
    this.floatGroup.add(bodyMesh);

    // Lavender Booties
    const bootieMat = new THREE.MeshStandardMaterial({ color: 0xd9c6f2, roughness: 0.7 });
    [-0.3, 0.3].forEach((x) => {
      const footGeo = new THREE.SphereGeometry(0.22, 18, 14);
      footGeo.scale(1.1, 0.75, 1.35);
      const foot = new THREE.Mesh(footGeo, bootieMat);
      foot.position.set(x, -0.75, 0.32);
      this.floatGroup.add(foot);
    });

    // Onesie details (Pastel Pink Buttons)
    const pinkMat = new THREE.MeshStandardMaterial({ color: 0xffadc4, roughness: 0.5 });
    const buttonGeo = new THREE.SphereGeometry(0.05, 14, 10);
    [-0.1, -0.28, -0.46].forEach((y) => {
      const b = new THREE.Mesh(buttonGeo, pinkMat);
      b.position.set(0, y, 0.65);
      this.floatGroup.add(b);
    });

    // Resting Arm (Left)
    const armMat = new THREE.MeshStandardMaterial({ color: 0xfdf3e3, roughness: 0.65 });
    const armLGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.52, 16);
    armLGeo.rotateZ(0.55);
    const armL = new THREE.Mesh(armLGeo, armMat);
    armL.position.set(-0.58, -0.28, 0.08);
    this.floatGroup.add(armL);

    // Hand left
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfffefa, roughness: 0.55 });
    const handLGeo = new THREE.SphereGeometry(0.12, 16, 12);
    const handL = new THREE.Mesh(handLGeo, skinMat);
    handL.position.set(-0.76, -0.44, 0.18);
    this.floatGroup.add(handL);

    // Waving Arm (Right)
    this.armRGroup = new THREE.Group();
    this.armRGroup.position.set(0.52, -0.18, 0);

    const armRGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.52, 16);
    armRGeo.rotateZ(-0.85);
    const armR = new THREE.Mesh(armRGeo, armMat);
    armR.position.set(0.22, 0.15, 0.1);
    this.armRGroup.add(armR);

    const handRGeo = new THREE.SphereGeometry(0.12, 16, 12);
    const handR = new THREE.Mesh(handRGeo, skinMat);
    handR.position.set(0.42, 0.32, 0.2);
    this.armRGroup.add(handR);
    this.floatGroup.add(this.armRGroup);

    // 3. SKULL HEAD GROUP
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.5, 0);

    // Smooth baby skull head
    const skullMat = new THREE.MeshStandardMaterial({
      color: 0xfffefa,
      roughness: 0.5,
      metalness: 0.02,
    });
    const skullGeo = new THREE.SphereGeometry(0.78, 36, 30);
    skullGeo.scale(1.06, 0.98, 0.96);
    const skullMesh = new THREE.Mesh(skullGeo, skullMat);
    this.headGroup.add(skullMesh);

    // Soft eye sockets (recessed dark plum)
    const socketMat = new THREE.MeshStandardMaterial({
      color: 0x322232,
      roughness: 0.8,
    });
    [-0.31, 0.31].forEach((x, idx) => {
      const sockGeo = new THREE.SphereGeometry(0.25, 22, 18);
      sockGeo.scale(1.05, 1.15, 0.45);
      const sock = new THREE.Mesh(sockGeo, socketMat);
      sock.position.set(x, 0.04, 0.68);
      sock.rotation.z = idx === 0 ? 0.08 : -0.08;
      this.headGroup.add(sock);

      // Cozy glowing starlight pupils!
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0xffe7a3 });
      const pupilGeo = new THREE.SphereGeometry(0.08, 16, 12);
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(x + (idx === 0 ? 0.02 : -0.02), 0.04, 0.8);
      this.headGroup.add(pupil);
    });

    // Rosy blushing cheeks
    const blushMat = new THREE.MeshBasicMaterial({
      color: 0xffb3c7,
      transparent: true,
      opacity: 0.65,
    });
    [-0.52, 0.52].forEach((x) => {
      const blushGeo = new THREE.SphereGeometry(0.16, 18, 12);
      blushGeo.scale(1.25, 0.7, 0.25);
      const blush = new THREE.Mesh(blushGeo, blushMat);
      blush.position.set(x, -0.2, 0.66);
      this.headGroup.add(blush);
    });

    // Tiny crooked baby smile
    const smileCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.16, -0.28, 0.76),
      new THREE.Vector3(0.02, -0.37, 0.78),
      new THREE.Vector3(0.2, -0.26, 0.76)
    );
    const smileGeo = new THREE.TubeGeometry(smileCurve, 16, 0.026, 8, false);
    const smileMat = new THREE.MeshBasicMaterial({ color: 0x4a3540 });
    const smileMesh = new THREE.Mesh(smileGeo, smileMat);
    this.headGroup.add(smileMesh);

    // 4. BEDTIME NIGHTCAP
    const capMat = new THREE.MeshStandardMaterial({
      color: 0xfff6e4,
      roughness: 0.7,
      metalness: 0.02,
    });
    const capGroup = new THREE.Group();

    // Nightcap brim ring
    const brimGeo = new THREE.TorusGeometry(0.78, 0.11, 18, 36);
    brimGeo.rotateX(Math.PI / 2);
    brimGeo.scale(1.05, 1, 0.82);
    const brim = new THREE.Mesh(brimGeo, capMat);
    brim.position.set(0, 0.34, 0.04);
    brim.rotation.x = -0.3;
    capGroup.add(brim);

    // Drooping nightcap cone
    const capCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0.4, 0),
      new THREE.Vector3(-0.35, 1.15, -0.12),
      new THREE.Vector3(-1.05, 1.05, 0.1),
      new THREE.Vector3(-1.15, 0.32, 0.22)
    );
    const capGeo = new THREE.TubeGeometry(capCurve, 28, 0.48, 18, false);
    const capBody = new THREE.Mesh(capGeo, capMat);
    capGroup.add(capBody);

    // Golden 3D Stars on Nightcap
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd98a,
      roughness: 0.35,
      metalness: 0.2,
      emissive: 0xffb844,
      emissiveIntensity: 0.25,
    });
    const starCoords = [
      { x: -0.22, y: 0.98, z: 0.22, s: 0.1 },
      { x: -0.65, y: 1.02, z: 0.16, s: 0.12 },
      { x: 0.25, y: 0.65, z: 0.38, s: 0.09 },
      { x: -0.08, y: 0.78, z: 0.5, s: 0.11 },
    ];
    starCoords.forEach((st) => {
      const starGeo = new THREE.OctahedronGeometry(st.s, 0);
      starGeo.scale(1, 1, 0.4);
      const star = new THREE.Mesh(starGeo, goldMat);
      star.position.set(st.x, st.y, st.z);
      star.rotation.z = 0.4;
      capGroup.add(star);
    });

    // Little Pink Ribbon Bow
    const bowMesh = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.04, 14, 18), pinkMat);
    bowMesh.position.set(-0.5, 0.52, 0.6);
    bowMesh.rotation.set(0.4, -0.3, 0.8);
    capGroup.add(bowMesh);

    // Fluffy Pom-Pom on nightcap tip
    this.pompom = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 18, 14),
      new THREE.MeshStandardMaterial({ color: 0xf7edd8, roughness: 0.85 })
    );
    this.pompom.position.set(-1.15, 0.28, 0.25);
    capGroup.add(this.pompom);

    this.headGroup.add(capGroup);
    this.floatGroup.add(this.headGroup);

    // 5. DREAM STARDUST PARTICLES (Orbiting Pip)
    const particleCount = 36;
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const c1 = new THREE.Color(0xffd98a);
    const c2 = new THREE.Color(0xffb3c7);
    const c3 = new THREE.Color(0xa8f0d8);

    for (let i = 0; i < particleCount; i++) {
      const r = 1.3 + Math.random() * 1.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.8;
      pos[i * 3] = r * Math.cos(theta) * Math.cos(phi);
      pos[i * 3 + 1] = r * Math.sin(phi) + 0.2;
      pos[i * 3 + 2] = r * Math.sin(theta) * Math.cos(phi);

      const pickC = Math.random() < 0.6 ? c1 : Math.random() < 0.5 ? c2 : c3;
      colors[i * 3] = pickC.r;
      colors[i * 3 + 1] = pickC.g;
      colors[i * 3 + 2] = pickC.b;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.11,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    this.stardust = new THREE.Points(pGeo, pMat);
    this.root.add(this.stardust);
  }

  bindEvents() {
    const el = this.canvas;

    const onDown = (e) => {
      this.isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      this.pointerStart = { x: clientX, y: clientY };
      this.dragMoved = 0;
    };

    const onMove = (e) => {
      if (!this.isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = clientX - this.pointerStart.x;
      const dy = clientY - this.pointerStart.y;
      this.dragMoved += Math.hypot(dx, dy);

      this.targetRotY += dx * 0.009;
      this.targetRotX = clamp(this.targetRotX + dy * 0.007, -0.5, 0.5);

      this.pointerStart = { x: clientX, y: clientY };
    };

    const onUp = () => {
      if (this.isDragging && this.dragMoved < 6) {
        this.boop();
      }
      this.isDragging = false;
    };

    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) onDown(e);
      else if (e.touches.length === 2) {
        this.lastPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length === 1) {
        onMove(e);
      } else if (e.touches && e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = (dist - this.lastPinchDist) * 0.01;
        this.targetZoom = clamp(this.targetZoom - delta, 3.8, 7.0);
        this.lastPinchDist = dist;
      }
    }, { passive: true });

    window.addEventListener('touchend', onUp);

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.targetZoom = clamp(this.targetZoom + e.deltaY * 0.004, 3.8, 7.0);
    }, { passive: false });

    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    if (!this.renderer || !this.camera || !this.canvas) return;
    const w = this.canvas.clientWidth || 310;
    const h = this.canvas.clientHeight || 356;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  resetView() {
    this.targetRotY = 0;
    this.targetRotX = 0;
    this.targetZoom = 4.8;
    this.boop();
  }

  boop() {
    this.boopBounce = 1.0;
    if (this.onBoop) this.onBoop();
  }

  updateMood(mood) {
    if (!this.ambientLight || !this.keyLight || !this.rimLight) return;
    if (mood === 'day') {
      this.ambientLight.color.setHex(0xfff1e2);
      this.ambientLight.intensity = 1.6;
      this.keyLight.color.setHex(0xffedd4);
      this.keyLight.intensity = 2.4;
      this.rimLight.color.setHex(0xe8d9ff);
    } else {
      this.ambientLight.color.setHex(0xded4f8);
      this.ambientLight.intensity = 1.4;
      this.keyLight.color.setHex(0xfff6e8);
      this.keyLight.intensity = 2.2;
      this.rimLight.color.setHex(0xc7b8ff);
    }
  }

  start() {
    if (this.active) return;
    this.active = true;
    let lastTime = performance.now();

    const loop = (t) => {
      if (!this.active) return;
      const dt = Math.min((t - lastTime) / 1000, 0.1);
      lastTime = t;

      this.update(t * 0.001, dt);
      this.renderer.render(this.scene, this.camera);
      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  stop() {
    this.active = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  update(sec, dt) {
    // Smooth camera & rotation easing
    this.currentRotY += (this.targetRotY - this.currentRotY) * 0.1;
    this.currentRotX += (this.targetRotX - this.currentRotX) * 0.1;
    this.currentZoom += (this.targetZoom - this.currentZoom) * 0.1;

    this.root.rotation.y = this.currentRotY;
    this.root.rotation.x = this.currentRotX;
    this.camera.position.z = this.currentZoom;

    // Gentle breathing float
    const floatY = Math.sin(sec * 2.2) * 0.05;
    this.floatGroup.position.y = floatY;

    // Head subtle organic sway
    if (this.headGroup) {
      this.headGroup.rotation.z = Math.sin(sec * 1.5) * 0.03;
    }

    // Boop squash & stretch bounce
    if (this.boopBounce > 0.01) {
      const s = 1 + Math.sin(this.boopBounce * Math.PI) * 0.22;
      const sy = 1 - Math.sin(this.boopBounce * Math.PI) * 0.16;
      this.floatGroup.scale.set(s, sy, s);
      this.boopBounce = Math.max(0, this.boopBounce - dt * 2.8);
    } else {
      this.floatGroup.scale.set(1, 1, 1);
    }

    // Gentle waving arm
    if (this.armRGroup) {
      this.armRGroup.rotation.z = Math.sin(sec * 3.5) * 0.2;
    }

    // Pom-pom secondary jiggle
    if (this.pompom) {
      this.pompom.position.y = 0.28 + Math.sin(sec * 4) * 0.025 + Math.sin(this.boopBounce * 8) * 0.08;
    }

    // Orbiting stardust rotation
    if (this.stardust) {
      this.stardust.rotation.y = sec * 0.22;
      this.stardust.rotation.x = Math.sin(sec * 0.5) * 0.08;
    }
  }
}
