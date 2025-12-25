import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";

// Individual Particle
const Particle = ({ position, color }) => {
  const mesh = useRef();

  // Animate the particles to bob up and down/rotate
  useFrame((state) => {
    mesh.current.position.y +=
      Math.sin(state.clock.getElapsedTime() + position[0]) * 0.002;
    mesh.current.rotation.x += 0.01;
  });

  return (
    <Sphere ref={mesh} position={position} args={[0.1, 16, 16]}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        roughness={0.5}
      />
    </Sphere>
  );
};

const FarmBackground = () => {
  // Generate random positions for particles
  const particles = Array.from({ length: 40 }).map((_, i) => ({
    position: [
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 10 - 2,
    ],
    color: i % 2 === 0 ? "#4ade80" : "#fbbf24", // Green (Crops) and Gold (Sun/Wheat)
  }));

  return (
    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-green-900 to-slate-900">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        {particles.map((p, i) => (
          <Particle key={i} position={p.position} color={p.color} />
        ))}
      </Canvas>
    </div>
  );
};

export default FarmBackground;
