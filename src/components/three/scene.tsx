"use client";

import * as React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";
import type { ViewerObject } from "./viewer";

/**
 * Simplified, mobile-friendly 3D room representation. A real reconstruction
 * (gaussian splat / mesh) would replace <RoomShell/> with the actual asset;
 * this procedural room renders in any WebGL context and is labelled as
 * simulated when no real asset exists.
 */
function ObjectMarker({ object, onSelect }: { object: ViewerObject; onSelect: (o: ViewerObject) => void }) {
  const [hovered, setHovered] = React.useState(false);
  const x = object.x !== undefined ? object.x : (Math.abs(hash(object.id) % 100) / 100) * 0.6 - 0.3;
  const z = object.z !== undefined ? object.z : (Math.abs(hash(object.id + "z") % 100) / 100) * 0.6 - 0.3;

  return (
    <mesh
      position={[x, 1.1, z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(object);
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.16, 16, 16]} />
      <meshStandardMaterial
        color={hovered ? "#E7B77A" : "#9BCBFF"}
        emissive="#9BCBFF"
        emissiveIntensity={hovered ? 0.9 : 0.35}
        roughness={0.3}
      />
      {hovered && (
        <Line points={[[0, 0, 0], [0, 1.6, 0]]} color="#E7B77A" lineWidth={1} />
      )}
    </mesh>
  );
}

function RoomShell({ width, length, height }: { width: number; length: number; height: number }) {
  const w = width / 2;
  const l = length / 2;
  const h = height;

  const wallMat = <meshStandardMaterial color="#171C21" roughness={0.95} metalness={0.05} />;
  const floorMat = <meshStandardMaterial color="#10141a" roughness={0.9} />;

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        {floorMat}
      </mesh>
      {/* Walls */}
      <mesh position={[0, h / 2, -l]}>{wallMat}<boxGeometry args={[width, h, 0.12]} /></mesh>
      <mesh position={[0, h / 2, l]}>{wallMat}<boxGeometry args={[width, h, 0.12]} /></mesh>
      <mesh position={[-w, h / 2, 0]}>{wallMat}<boxGeometry args={[0.12, h, length]} /></mesh>
      <mesh position={[w, h / 2, 0]}>{wallMat}<boxGeometry args={[0.12, h, length]} /></mesh>
      {/* Ceiling (subtle) */}
      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color="#0d1116" transparent opacity={0.85} />
      </mesh>
      {/* Warm interior light */}
      <pointLight position={[0, h - 0.4, 0]} intensity={1.1} color="#E7B77A" distance={12} decay={2} />
      <ambientLight intensity={0.35} color="#9BCBFF" />
    </group>
  );
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export default function Scene({
  width,
  length,
  height,
  objects,
  onSelect,
  onError
}: {
  width: number;
  length: number;
  height: number;
  objects: ViewerObject[];
  onSelect?: (o: ViewerObject) => void;
  onError?: () => void;
}) {
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    // no-op keeps this component mounted; animation is handled by OrbitControls
  }, []);

  return (
    <Canvas
      camera={{ position: [4, 3.4, 5.4], fov: 42 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "default", failIfMajorPerformanceCaveat: false }}
      onCreated={(state) => {
        state.gl.setClearColor("#0b0e11");
        state.gl.domElement.addEventListener("webglcontextlost", () => onError?.());
      }}
    >
      <RoomShell width={Math.max(width, 3)} length={Math.max(length, 3)} height={Math.max(height, 2.2)} />
      {objects.map((o) => (
        <ObjectMarker key={o.id} object={o} onSelect={(obj) => onSelect?.(obj)} />
      ))}
      <OrbitControls
        enablePan
        enableZoom
        minDistance={2.5}
        maxDistance={16}
        autoRotate={!reduceMotion}
        autoRotateSpeed={0.7}
        maxPolarAngle={Math.PI / 2.05}
      />
      <fog attach="fog" args={["#090b0d", 10, 24]} />
    </Canvas>
  );
}
