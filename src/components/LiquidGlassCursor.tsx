import { Capsule, MeshTransmissionMaterial, Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useSnapshot } from "valtio";
import { state } from "../store";
import { Group } from "three";

export default function LiquidGlassCursor() {
  const cursorRef = useRef<Group>(null);
  const [clicked, setClicked] = useState(false);
  const { hovered, reflectivity, isDragging } = useSnapshot(state);

  useFrame((state, delta) => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    cursor.position.set(
      state.pointer.x * (state.viewport.width / 2),
      state.pointer.y * (state.viewport.height / 2),
      0.1
    );

    // Add subtle rotation
    cursor.rotation.z += delta * (clicked ? 2 : 0.5);
  });

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    if (clicked || hovered) {
      if (isDragging) {
        gsap.to(cursor.scale, {
          x: 1,
          y: 1,
          z: 0.1,
          duration: 1.5,
          ease: "elastic(1, 0.3)",
        });
      } else {
        gsap.to(cursor.scale, {
          x: 1.7,
          y: 1.7,
          z: 0.2,
          duration: 1.5,
          ease: "elastic(1, 0.3)",
        });
      }
    } else {
      gsap.to(cursor.scale, {
        x: 1,
        y: 1,
        z: 0.75,
        duration: 1.5,
        ease: "elastic(1, 0.3)",
      });
    }
    document.body.style.cursor = "none";
  }, [clicked, hovered, isDragging]);

  useEffect(() => {
    const handlePointerDown = () => setClicked(true);
    const handlePointerUp = () => setClicked(false);

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const material = useMemo(() => {
    return (
      <MeshTransmissionMaterial
        color="white"
        metalness={0}
        roughness={0.01}
        ior={1.8}
        thickness={reflectivity}
        reflectivity={reflectivity}
        chromaticAberration={0.1}
        clearcoat={0.4}
        resolution={1024}
        clearcoatRoughness={0.05}
        iridescence={0.9}
        iridescenceIOR={0.1}
        iridescenceThicknessRange={[0, 140]}
        samples={4}
        transmission={1}
        distortion={0.5}
        distortionScale={0.5}
        temporalDistortion={0.1}
      />
    );
  }, [reflectivity]);

  return (
    <group ref={cursorRef}>
      <Capsule
        scale={[1, 1, 1]}
        args={isDragging ? [0.08, 0.1, 64, 64] : [0.1, 0.3, 64, 64]}
        position={[0, 0, 0.1]}
        rotation={[0, 0, -Math.PI / 2]}
        visible={clicked || hovered || isDragging}
      >
        {material}
      </Capsule>
      <Sphere
        scale={[0.15, 0.15, 0.15]}
        position={[0, 0, 0]}
        visible={!clicked && !hovered && !isDragging}
      >
        {material}
      </Sphere>
    </group>
  );
}