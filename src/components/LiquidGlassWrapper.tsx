import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, Preload } from "@react-three/drei";
import LiquidGlass from "./LiquidGlass";
import LiquidGlassCursor from "./LiquidGlassCursor";

export default function LiquidGlassWrapper() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <color attach="background" args={['#000']} />
        <fogExp2 attach="fog" args={['#000', 0.05]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight
          position={[0, 5, 0]}
          intensity={0.8}
          angle={0.7}
          penumbra={1}
          castShadow
        />
        <LiquidGlass />
        <LiquidGlassCursor />
        <Environment preset="city" />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
        <Preload all />
      </Canvas>
    </div>
  );
}