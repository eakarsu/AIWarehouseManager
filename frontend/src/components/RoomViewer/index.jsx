import { useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Html } from '@react-three/drei';
import Room from './Room';
import FurnitureModel from './FurnitureModel';
import { Move, RotateCw, Trash2, Save, Eye, Image } from 'lucide-react';

// Component to show an AI-generated image on the back wall
function WallImage({ imageUrl, roomWidth, roomHeight }) {
  if (!imageUrl) return null;

  const posX = roomWidth / 2;
  const posY = roomHeight * 0.55;
  const posZ = 0.15;

  return (
    <Html
      position={[posX, posY, posZ]}
      transform
      occlude={false}
      style={{
        pointerEvents: 'none',
        width: '400px',
        height: '280px',
      }}
    >
      <div
        style={{
          background: '#1a1a1a',
          padding: '12px',
          borderRadius: '4px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}
      >
        <img
          src={imageUrl}
          alt="AI Generated Design"
          style={{
            width: '100%',
            height: '250px',
            objectFit: 'cover',
            display: 'block',
            borderRadius: '2px',
          }}
          crossOrigin="anonymous"
        />
      </div>
    </Html>
  );
}

export default function RoomViewer({
  roomWidth = 6,
  roomLength = 8,
  roomHeight = 3,
  furniture = [],
  onFurnitureUpdate,
  onSave,
  readOnly = false,
  imageUrl = null,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState('view');
  const [localFurniture, setLocalFurniture] = useState(
    furniture.map((f, i) => ({
      ...f,
      id: f.id || `furniture-${i}`,
      position: f.position || [0, 0, 0],
      rotation: f.rotation || [0, 0, 0],
      scale: f.scale || [1, 1, 1],
    }))
  );

  const handleSelect = useCallback(
    (id) => {
      if (mode !== 'view') {
        setSelectedId(id === selectedId ? null : id);
      }
    },
    [mode, selectedId]
  );

  const handlePositionChange = useCallback((id, newPosition) => {
    setLocalFurniture((prev) =>
      prev.map((f) => (f.id === id ? { ...f, position: newPosition } : f))
    );
  }, []);

  const handleDelete = useCallback(() => {
    if (selectedId) {
      setLocalFurniture((prev) => prev.filter((f) => f.id !== selectedId));
      setSelectedId(null);
    }
  }, [selectedId]);

  const handleSave = useCallback(() => {
    if (onSave) onSave(localFurniture);
    if (onFurnitureUpdate) onFurnitureUpdate(localFurniture);
  }, [localFurniture, onSave, onFurnitureUpdate]);

  const rotateSelected = useCallback(() => {
    if (selectedId) {
      setLocalFurniture((prev) =>
        prev.map((f) => {
          if (f.id === selectedId) {
            const currentY = f.rotation[1] || 0;
            return {
              ...f,
              rotation: [f.rotation[0], currentY + Math.PI / 4, f.rotation[2]],
            };
          }
          return f;
        })
      );
    }
  }, [selectedId]);

  return (
    <div className="relative w-full h-[500px] bg-gray-900 rounded-lg overflow-hidden">
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={[roomWidth, roomHeight * 1.5, roomLength * 1.2]}
        />
        <OrbitControls
          enablePan={mode === 'view'}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={2}
          maxDistance={20}
        />

        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
        <pointLight
          position={[roomWidth / 2, roomHeight - 0.5, roomLength / 2]}
          intensity={0.5}
        />

        <Suspense fallback={null}>
          <Environment preset="apartment" />
        </Suspense>

        <Room width={roomWidth} length={roomLength} height={roomHeight} />

        {imageUrl && (
          <WallImage
            imageUrl={imageUrl}
            roomWidth={roomWidth}
            roomHeight={roomHeight}
          />
        )}

        <Suspense fallback={null}>
          {localFurniture.map((item) => (
            <FurnitureModel
              key={item.id}
              id={item.id}
              modelUrl={item.modelUrl}
              name={item.name}
              category={item.category}
              position={item.position}
              rotation={item.rotation}
              scale={item.scale}
              selected={selectedId === item.id}
              onSelect={handleSelect}
              onPositionChange={handlePositionChange}
              mode={mode}
              roomBounds={{ width: roomWidth, length: roomLength }}
            />
          ))}
        </Suspense>
      </Canvas>

      {/* Toolbar */}
      {!readOnly && (
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <button
            onClick={() => setMode('view')}
            className={`p-2 rounded-lg shadow-lg transition-colors ${
              mode === 'view'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            title="View mode"
          >
            <Eye size={20} />
          </button>
          <button
            onClick={() => setMode('move')}
            className={`p-2 rounded-lg shadow-lg transition-colors ${
              mode === 'move'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            title="Move furniture"
          >
            <Move size={20} />
          </button>
          <button
            onClick={rotateSelected}
            disabled={!selectedId}
            className={`p-2 rounded-lg bg-white text-gray-700 shadow-lg transition-colors hover:bg-gray-100 ${
              !selectedId ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Rotate selected"
          >
            <RotateCw size={20} />
          </button>
          <button
            onClick={handleDelete}
            disabled={!selectedId}
            className={`p-2 rounded-lg bg-white text-red-600 shadow-lg transition-colors hover:bg-red-50 ${
              !selectedId ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Delete selected"
          >
            <Trash2 size={20} />
          </button>
        </div>
      )}

      {/* Save button */}
      {!readOnly && (
        <div className="absolute top-4 right-4">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-colors"
          >
            <Save size={18} />
            Save
          </button>
        </div>
      )}

      {/* Status and Image Preview */}
      <div className="absolute bottom-4 right-4 flex items-end gap-3">
        {imageUrl && (
          <div className="bg-black/70 p-2 rounded-lg">
            <p className="text-white text-xs mb-1">AI Generated:</p>
            <img
              src={imageUrl}
              alt="Preview"
              className="w-24 h-16 object-cover rounded"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
          {imageUrl ? (
            <>
              <Image size={14} />
              Image on wall
            </>
          ) : (
            'No image - click Generate'
          )}
        </div>
      </div>
    </div>
  );
}
