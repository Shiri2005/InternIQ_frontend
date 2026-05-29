import Galaxy from "./Galaxy";
import "./Galaxy.css";

export default function GalaxyLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950">
      <div className="galaxy-backdrop-layer fixed inset-0 z-0 min-h-0">
        <Galaxy
          mouseRepulsion
          mouseInteraction
          density={1}
          glowIntensity={0.28}
          saturation={0}
          hueShift={140}
          twinkleIntensity={0.28}
          rotationSpeed={0.08}
          repulsionStrength={2}
          autoCenterRepulsion={0}
          starSpeed={0.45}
          speed={1}
          transparent={false}
          className="h-full w-full min-h-0"
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
