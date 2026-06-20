"use client";

import { Suspense, useRef, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

function Scene() {
  const { scene } = useGLTF("/images/PRODUCT-SITE.glb");
  const { scene: camScene } = useGLTF("/images/product2.glb");
  const modelRef  = useRef<THREE.Group>(null);
  const pivotRef  = useRef<THREE.Group>(null);
  const { scene: threeScene, camera } = useThree();
  const scrollRef   = useRef(0);
  const currentRotRef = useRef(0);
  const didSetupRef = useRef(false);

  useEffect(() => {
    threeScene.background = new THREE.Color(0x080810);
    threeScene.fog = null;
    return () => { threeScene.fog = null; threeScene.background = null; };
  }, [threeScene]);

  useEffect(() => {
    didSetupRef.current = false;
  }, [scene, camScene, camera]);

  useFrame(() => {
    if (didSetupRef.current) return;
    if (!modelRef.current || !pivotRef.current) return;

    didSetupRef.current = true;

    const mountainMesh = scene.getObjectByName("Mountain");
    const box = mountainMesh
      ? new THREE.Box3().setFromObject(mountainMesh)
      : new THREE.Box3().setFromObject(modelRef.current);
    const size = new THREE.Vector3(), center = new THREE.Vector3();
    box.getSize(size); box.getCenter(center);

    const fov = 60 * (Math.PI / 180);
    const camZ = 0.09;
    const visibleHeight = 2 * Math.tan(fov / 2) * camZ;
    const scale = (visibleHeight * 4.5) / size.y;

    modelRef.current.scale.set(scale, scale, -scale);
    modelRef.current.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    modelRef.current.rotation.set(0, 0, Math.PI / 4);
    modelRef.current.updateMatrixWorld(true);

    const spinPoint = scene.getObjectByName("secretfix");
    let pivotPos = new THREE.Vector3(0, 0, 0);
    if (spinPoint) {
      spinPoint.getWorldPosition(pivotPos);
      pivotRef.current.position.copy(pivotPos);
      modelRef.current.position.sub(pivotPos);
    }

    const bPos = new THREE.Vector3(-2.3868, 0.048488, -0.91095).multiplyScalar(scale);
    camera.position.copy(bPos);
    const euler = new THREE.Euler(
      THREE.MathUtils.degToRad(73.92 - 90),
      THREE.MathUtils.degToRad(-108.95),
      THREE.MathUtils.degToRad(0),
      "YXZ"
    );
    camera.quaternion.setFromEuler(euler);
  });

  useEffect(() => {
    const onScroll = () => {
      scrollRef.current = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useFrame((_, delta) => {
    if (!pivotRef.current) return;
    const target = scrollRef.current / 1200 * Math.PI * 2;
    currentRotRef.current = THREE.MathUtils.lerp(currentRotRef.current, target, Math.min(delta * 4, 1));
    pivotRef.current.rotation.z = currentRotRef.current;
  });

  return (
    <group ref={pivotRef}>
      <primitive ref={modelRef} object={scene} />
    </group>
  );
}

export function Mountain3D() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <Canvas
        style={{ width: "100%", height: "100%", pointerEvents: "none" }}
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [0, 4, 40], fov: 32 }}
      >
        {/* نور محیطی */}
        <ambientLight intensity={2.0} color="#ffffff" />

        {/* Key light — سفید گرم از بالا-جلو-راست */}
        <directionalLight position={[4, 6, 3]} intensity={5.0} color="#fff5e0" />

        {/* Fill light — آبی سرد از چپ */}
        <directionalLight position={[-5, 2, 2]} intensity={3.0} color="#a0c4ff" />

        {/* Rim light — از پشت */}
        <directionalLight position={[-2, -1, -6]} intensity={3.0} color="#6ee7f7" />

        {/* نور زمین */}
        <pointLight position={[0, -4, 2]} intensity={3.0} color="#ff9f43" distance={20} />

        {/* نور جلو — مستقیم روی محصول */}
        <pointLight position={[0, 0, 8]} intensity={4.0} color="#ffffff" distance={20} />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/images/PRODUCT-SITE.glb");
useGLTF.preload("/images/product2.glb");
