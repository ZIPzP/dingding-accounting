/**
 * 首页 Hero 3D 场景（WebGL / Three.js）
 * 悬浮 3D 水晶核心 + 环绕光环 + 粒子星云，鼠标视差，4K 级渲染精度
 * 仅桌面端渲染（移动端回退极光），离屏自动暂停
 */
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Hero3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (window.innerWidth < 900) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let raf = 0;
    let running = true;
    let mouseX = 0;
    let mouseY = 0;

    try {
      /* 渲染器:4K 级精度 + 抗锯齿 */
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x060810, 0.028);

      const camera = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.1, 100);
      camera.position.set(0, 0.6, 9);

      /* 灯光 */
      scene.add(new THREE.AmbientLight(0x334155, 1.6));
      const cyanLight = new THREE.PointLight(0x22d3ee, 30, 30);
      cyanLight.position.set(4, 3, 4);
      scene.add(cyanLight);
      const pinkLight = new THREE.PointLight(0x8b5cf6, 24, 30);
      pinkLight.position.set(-4, -2, 3);
      scene.add(pinkLight);

      /* 核心:发光水晶(二十面体) */
      const coreGroup = new THREE.Group();
      const coreGeo = new THREE.IcosahedronGeometry(1.05, 0);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x22d3ee,
        roughness: 0.15,
        metalness: 0.55,
        emissive: 0x0e7490,
        emissiveIntensity: 0.9,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      coreGroup.add(core);

      /* 水晶线框外壳 */
      const shellGeo = new THREE.IcosahedronGeometry(1.55, 1);
      const shell = new THREE.Mesh(
        shellGeo,
        new THREE.MeshBasicMaterial({ color: 0x67e8f9, wireframe: true, transparent: true, opacity: 0.28 })
      );
      shell.scale.setScalar(1.12);
      coreGroup.add(shell);

      /* 环绕光环 x2 */
      const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(2.5, 0.035, 12, 96),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.65 })
      );
      ring1.rotation.x = Math.PI / 2.35;
      coreGroup.add(ring1);

      const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(3.05, 0.022, 12, 96),
        new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.5 })
      );
      ring2.rotation.x = Math.PI / 1.8;
      ring2.rotation.y = 0.5;
      coreGroup.add(ring2);

      /* 环绕小卫星 */
      const orbiters: THREE.Mesh[] = [];
      for (let i = 0; i < 5; i++) {
        const orb = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.13, 0),
          new THREE.MeshStandardMaterial({
            color: i % 2 ? 0x67e8f9 : 0xc4b5fd,
            roughness: 0.3,
            metalness: 0.4,
            emissive: i % 2 ? 0x0891b2 : 0x6d28d9,
            emissiveIntensity: 0.8,
          })
        );
        coreGroup.add(orb);
        orbiters.push(orb);
      }

      scene.add(coreGroup);

      /* 粒子星云 */
      const PARTICLE_COUNT = 420;
      const positions = new Float32Array(PARTICLE_COUNT * 3);
      const colors = new Float32Array(PARTICLE_COUNT * 3);
      const colorA = new THREE.Color(0x22d3ee);
      const colorB = new THREE.Color(0xa78bfa);
      const colorC = new THREE.Color(0xffffff);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const r = 3.2 + Math.random() * 7;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.62;
        positions[i * 3 + 2] = r * Math.cos(phi) - 1;
        const c = [colorA, colorB, colorC][i % 3];
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }
      const particlesGeo = new THREE.BufferGeometry();
      particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const particles = new THREE.Points(
        particlesGeo,
        new THREE.PointsMaterial({ size: 0.045, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false })
      );
      scene.add(particles);

      /* 鼠标视差 */
      const onMouse = (e: MouseEvent) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = (e.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener('mousemove', onMouse, { passive: true });

      /* 离屏暂停 */
      const io = new IntersectionObserver((entries) => {
        const visible = entries[0]?.isIntersecting ?? true;
        if (visible && !running) {
          running = true;
          raf = requestAnimationFrame(loop);
        } else if (!visible) {
          running = false;
        }
      });
      io.observe(mount);

      const resize = () => {
        if (!renderer || !mount) return;
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        camera.aspect = mount.clientWidth / mount.clientHeight;
        camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', resize);

      let lastT = performance.now();
      function loop(now: number) {
        if (!running || !renderer) return;
        const dt = Math.min((now - lastT) / 1000, 0.05);
        lastT = now;
        const t = now / 1000;

        core.rotation.y += dt * 0.35;
        core.rotation.x += dt * 0.18;
        shell.rotation.y -= dt * 0.22;
        shell.rotation.z += dt * 0.12;
        ring1.rotation.z += dt * 0.45;
        ring2.rotation.z -= dt * 0.3;
        orbiters.forEach((orb, i) => {
          const a = t * (0.7 + i * 0.12) + i * 1.3;
          orb.position.set(Math.cos(a) * 2.5, Math.sin(a * 1.4) * 1.15, Math.sin(a) * 2.5);
        });
        particles.rotation.y += dt * 0.03;
        coreGroup.position.y = Math.sin(t * 1.1) * 0.16;

        /* 相机视差跟随 */
        camera.position.x += (mouseX * 0.9 - camera.position.x) * 0.05;
        camera.position.y += (-mouseY * 0.55 + 0.6 - camera.position.y) * 0.05;
        camera.lookAt(0, coreGroup.position.y * 0.4, 0);

        renderer.render(scene, camera);
        raf = requestAnimationFrame(loop);
      }

      raf = requestAnimationFrame(loop);

      return () => {
        running = false;
        cancelAnimationFrame(raf);
        window.removeEventListener('mousemove', onMouse);
        window.removeEventListener('resize', resize);
        io.disconnect();
        renderer?.dispose();
        if (renderer?.domElement.parentElement === mount) {
          mount.removeChild(renderer.domElement);
        }
        coreGeo.dispose();
        shellGeo.dispose();
        particlesGeo.dispose();
      };
    } catch (e) {
      console.warn('3D 场景初始化失败,回退到极光背景:', e);
      return undefined;
    }
  }, []);

  return <div className="hero3d" ref={mountRef} aria-hidden />;
};

export default Hero3D;
