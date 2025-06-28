import { Canvas } from "@react-three/fiber";
import LiquidGlassCursor from "./LiquidGlassCursor";

export default function ThreeScene() {
  return (
    <Canvas
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      <LiquidGlassCursor />
    </Canvas>
  );
} 