import { DoubleSide } from 'three';

export default function Room({ width = 6, length = 8, height = 3 }) {
  const floorColor = '#c4a484';
  const wallColor = '#f5f5f4';
  const baseboardColor = '#78716c';

  return (
    <group position={[width / 2, 0, length / 2]}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color={floorColor} roughness={0.8} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, height / 2, -length / 2 + 0.05]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} side={DoubleSide} />
      </mesh>

      {/* Left wall */}
      <mesh
        position={[-width / 2 + 0.05, height / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} side={DoubleSide} />
      </mesh>

      {/* Baseboards */}
      <mesh position={[0, 0.05, -length / 2 + 0.08]}>
        <boxGeometry args={[width, 0.1, 0.02]} />
        <meshStandardMaterial color={baseboardColor} />
      </mesh>
      <mesh position={[-width / 2 + 0.08, 0.05, 0]}>
        <boxGeometry args={[0.02, 0.1, length]} />
        <meshStandardMaterial color={baseboardColor} />
      </mesh>

      {/* Rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0.5]}>
        <planeGeometry args={[width * 0.5, length * 0.4]} />
        <meshStandardMaterial color="#8b7355" />
      </mesh>
    </group>
  );
}
