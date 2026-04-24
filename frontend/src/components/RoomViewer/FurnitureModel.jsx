import { useRef, useState, useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

// Fallback box geometry for furniture without 3D models
function FallbackBox({ category, name, selected, onClick }) {
  const meshRef = useRef();

  const dimensions = useMemo(() => {
    switch (category?.toLowerCase()) {
      case 'seating':
      case 'sofa':
      case 'chair':
        return [1.5, 0.8, 1];
      case 'table':
      case 'desk':
        return [1.2, 0.75, 0.6];
      case 'storage':
      case 'cabinet':
      case 'shelf':
        return [1, 1.5, 0.4];
      case 'bed':
        return [2, 0.5, 1.8];
      case 'lighting':
      case 'lamp':
        return [0.3, 1.2, 0.3];
      case 'decor':
        return [0.4, 0.4, 0.4];
      default:
        return [1, 1, 1];
    }
  }, [category]);

  const color = useMemo(() => {
    switch (category?.toLowerCase()) {
      case 'seating':
      case 'sofa':
      case 'chair':
        return '#6b7280';
      case 'table':
      case 'desk':
        return '#92400e';
      case 'storage':
      case 'cabinet':
        return '#78716c';
      case 'bed':
        return '#f5f5f4';
      case 'lighting':
        return '#fbbf24';
      case 'decor':
        return '#10b981';
      default:
        return '#9ca3af';
    }
  }, [category]);

  return (
    <group onClick={onClick}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        position={[0, dimensions[1] / 2, 0]}
      >
        <boxGeometry args={dimensions} />
        <meshStandardMaterial
          color={selected ? '#3b82f6' : color}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      {/* Selection outline */}
      {selected && (
        <mesh position={[0, dimensions[1] / 2, 0]}>
          <boxGeometry
            args={[
              dimensions[0] + 0.05,
              dimensions[1] + 0.05,
              dimensions[2] + 0.05,
            ]}
          />
          <meshBasicMaterial color="#3b82f6" wireframe />
        </mesh>
      )}
      {/* Label */}
      <Html position={[0, dimensions[1] + 0.3, 0]} center>
        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {name || 'Furniture'}
        </div>
      </Html>
    </group>
  );
}

// GLTF Model loader
function GLTFModel({ url, selected, onClick }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef();

  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (selected) {
          child.material = child.material.clone();
          child.material.emissive = new THREE.Color(0x3b82f6);
          child.material.emissiveIntensity = 0.2;
        }
      }
    });
  }, [clonedScene, selected]);

  return (
    <group ref={groupRef} onClick={onClick}>
      <primitive object={clonedScene} />
    </group>
  );
}

export default function FurnitureModel({
  id,
  modelUrl,
  name,
  category,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  selected = false,
  onSelect,
  onPositionChange,
  mode = 'view',
  roomBounds,
}) {
  const groupRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const { camera, raycaster, gl } = useThree();

  const handleClick = (e) => {
    e.stopPropagation();
    if (onSelect) onSelect(id);
  };

  // Handle dragging in move mode
  useEffect(() => {
    if (mode !== 'move' || !selected) return;

    const handleMouseDown = (e) => {
      if (selected) {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseMove = (e) => {
      if (!isDragging || !selected) return;

      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      raycaster.setFromCamera({ x, y }, camera);

      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersection);

      if (intersection) {
        const newX = Math.max(0.5, Math.min(roomBounds.width - 0.5, intersection.x));
        const newZ = Math.max(
          0.5,
          Math.min(roomBounds.length - 0.5, intersection.z)
        );
        onPositionChange(id, [newX, 0, newZ]);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    mode,
    selected,
    isDragging,
    camera,
    raycaster,
    gl,
    id,
    onPositionChange,
    roomBounds,
  ]);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {modelUrl ? (
        <GLTFModel url={modelUrl} selected={selected} onClick={handleClick} />
      ) : (
        <FallbackBox
          category={category}
          name={name}
          selected={selected}
          onClick={handleClick}
        />
      )}
    </group>
  );
}
