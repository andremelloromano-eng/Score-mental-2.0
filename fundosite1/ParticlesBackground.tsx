"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const PARTICLE_COUNT = 140;
const COLORS = [
  "rgba(148, 163, 184, 0.55)",
  "rgba(100, 116, 139, 0.5)",
  "rgba(96, 165, 250, 0.4)",
  "rgba(148, 163, 184, 0.45)",
  "rgba(71, 85, 105, 0.6)",
];

const TRAJECTORY_A = {
  x: [0, 28, 18, -24, -32, -18, 22, 30, 0],
  y: [0, -22, 18, 28, -12, -26, -18, 12, 0],
  opacity: [0.9, 1, 0.85, 0.9, 0.8, 1, 0.9, 0.95, 0.9],
};
const TRAJECTORY_B = {
  x: [0, -26, 20, 30, -20, 0],
  y: [0, 20, 30, -20, -28, 0],
  opacity: [0.9, 0.85, 1, 0.8, 0.95, 0.9],
};

type Particle = {
  id: number;
  left: number;
  top: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  trajectory: "A" | "B";
};

function getInitialParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    left: (i * 13 + 7) % 100,
    top: (i * 17 + 11) % 100,
    size: 4 + (i % 5) * 0.8,
    color: COLORS[i % COLORS.length],
    duration: 10 + (i % 10),
    delay: (i % 24) * 0.2,
    trajectory: i % 2 === 0 ? "A" : "B",
  }));
}

export default function ParticlesBackground() {
  const [particles, setParticles] = useState<Particle[]>(getInitialParticles);

  useEffect(() => {
    setParticles(
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 4 + Math.random() * 4,
        color: COLORS[i % COLORS.length],
        duration: 10 + Math.random() * 14,
        delay: Math.random() * 5,
        trajectory: Math.random() > 0.5 ? "A" : "B",
      }))
    );
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
    >
      {particles.map((p) => {
        const traj = p.trajectory === "A" ? TRAJECTORY_A : TRAJECTORY_B;
        return (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
            }}
            animate={{
              x: traj.x,
              y: traj.y,
              opacity: traj.opacity,
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
            }}
          />
        );
      })}
    </div>
  );
}
