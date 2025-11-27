
import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { ColorOption, DoorConfiguration, DoorOption, DoorTypeId, ColorId, BackStyleId, CupboardTypeId } from '../types';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const SCALE = 1.0; 

// FIX: Added isTypeII helper function to resolve reference error.
const isTypeII = (doorType: DoorTypeId) => doorType === 'type-ii' || doorType.startsWith('type-ii-stove-');

// Texture Caching
const textureCache = new Map<string, THREE.Texture>();
const loadTexture = (url: string): THREE.Texture | null => {
  if (!url || typeof url !== 'string') {
    return null;
  }
  if (textureCache.has(url)) {
    return textureCache.get(url)!;
  }

  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');
  const cleanUrl = url.replace(/^https?:\/\//, '');
  const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&output=jpg&q=90`;
  
  const texture = loader.load(proxyUrl, undefined, undefined, (err) => {
      console.warn('Failed to load texture:', url, err);
      textureCache.delete(url); // Remove from cache on error to allow retry
  });
  
  texture.colorSpace = THREE.SRGBColorSpace;
  
  textureCache.set(url, texture);
  return texture;
};

// Loading indicator component
const LoadingIndicator: React.FC = () => (
    <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20 animate-fade-in">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-800"></div>
    </div>
);


interface DoorPreviewProps {
  config: DoorConfiguration;
  colors: ColorOption[];
  doorTypes: DoorOption<DoorTypeId>[];
  frameTypes: any;
  glassStyles: any;
  customModelUrl?: string;
  modelLibrary?: Record<string, { url: string; type: 'glb' | 'fbx' }>;
}

const DoorPreview: React.FC<DoorPreviewProps> = ({ config, colors, doorTypes, customModelUrl, modelLibrary }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  
  const groupRef = useRef<THREE.Group | null>(null);
  const prevGroupRef = useRef<THREE.Group | null>(null); 
  const extrasGroupRef = useRef<THREE.Group | null>(null);
  const labelsGroupRef = useRef<THREE.Group | null>(null);
  const axesGroupRef = useRef<THREE.Group | null>(null); 
  const highlightMeshRef = useRef<THREE.Mesh | null>(null);
  const floorMeshRef = useRef<THREE.Mesh | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importedModelRef = useRef<THREE.Group | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);
  
  const animationRef = useRef<number>(0);
  const transitionFrameRef = useRef<number>(0); 
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const prevConfigRef = useRef<DoorConfiguration | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [sceneOption, setSceneOption] = useState<'none' | 'dining2'>('none');
  const [showPartLabels, setShowPartLabels] = useState(false);
  const [floorOption, setFloorOption] = useState<'none' | 'oak' | 'tile' | 'stone' | 'herringbone' | 'tile-black'>('oak');

  const [hoveredPartIndex, setHoveredPartIndex] = useState<number | null>(null);
  const [selectedPartIndex, setSelectedPartIndex] = useState<number | null>(null);
  const [partOverrides, setPartOverrides] = useState<Record<number, ColorId>>({});
  
  const [showTransformControls, setShowTransformControls] = useState(false);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [modelBrightness, setModelBrightness] = useState(1.0);
  const originalModelColorsRef = useRef<WeakMap<THREE.Mesh, THREE.Color>>(new WeakMap());

  // Throttle refs
  const lastRaycastTimeRef = useRef<number>(0);
  const lastHoverUpdateRef = useRef<number>(0);

  const visualConfigStr = useMemo(() => {
    const { doorType, color, counterColor, handle, glassStyle, lock, divider, width, height, sinkPosition, frameType, backStyle, sinkBaseType, typeIIStyle, rangeHood, faucet, cupboardType, cupboardWidth, cupboardDepth, cupboardLayout, confirmedCupboard } = config;
    return JSON.stringify({ doorType, color, counterColor, handle, glassStyle, lock, divider, width, height, sinkPosition, frameType, backStyle, sinkBaseType, typeIIStyle, rangeHood, faucet, cupboardType, cupboardWidth, cupboardDepth, cupboardLayout, confirmedCupboard });
  }, [config]);

  const getOptionName = <T extends string>(options: DoorOption<T>[], id: T): string => {
    const found = options.find(o => o.id === id);
    return found ? found.name : '不明';
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sceneRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const contents = event.target?.result;
        if (contents && typeof contents !== 'string') {
            const loader = new GLTFLoader();
            loader.parse(contents, '', (gltf) => {
                const scene = sceneRef.current;
                if (importedModelRef.current) {
                    if (transformControlsRef.current) transformControlsRef.current.detach();
                    scene?.remove(importedModelRef.current);
                    importedModelRef.current.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            child.geometry?.dispose();
                            if (Array.isArray(child.material)) {
                                child.material.forEach(m => m.dispose());
                            } else {
                                child.material?.dispose();
                            }
                        }
                    });
                }
                
                const model = gltf.scene;
                
                // Reset brightness and clear old color data
                setModelBrightness(1.0);
                originalModelColorsRef.current = new WeakMap();

                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 1.0 / maxDim; 
                
                model.scale.set(scale, scale, scale);
                model.position.sub(center.multiplyScalar(scale));
                
                model.position.x = 2.0; 
                
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        // Store original color
                        if (child.material instanceof THREE.MeshStandardMaterial) {
                            originalModelColorsRef.current.set(child, child.material.color.clone());
                        }
                    }
                });

                scene?.add(model);
                importedModelRef.current = model;
                setShowTransformControls(true); // Automatically enable controls for new model
            }, (error) => {
                console.error('Error parsing GLB file', error);
                alert('GLBファイルの読み込みに失敗しました。');
            });
        }
    };
    if (e.target) {
        e.target.value = '';
    }
  };


  const baseMaterials = useMemo(() => {
      const texDishwasher = loadTexture('http://25663cc9bda9549d.main.jp/aistudio/linekitchen/T000672.jpg');
      const texIHTop = loadTexture('http://25663cc9bda9549d.main.jp/aistudio/linekitchen/T00066f.jpg');
      const texIHPanel = loadTexture('http://25663cc9bda9549d.main.jp/aistudio/linekitchen/T0006c3.jpg');
      const texSink = loadTexture('http://25663cc9bda9549d.main.jp/aistudio/linekitchen/T000670.jpg');

      return {
          cabinet: new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.1, side: THREE.DoubleSide }),
          worktop: new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.2, metalness: 0.1, side: THREE.DoubleSide }),
          sink: new THREE.MeshStandardMaterial({ map: texSink, color: 0xffffff, roughness: 0.2, metalness: 0.8, side: THREE.DoubleSide }),
          faucet: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 1.0, side: THREE.DoubleSide }),
          stoveBase: new THREE.MeshStandardMaterial({ map: texIHTop, color: 0xffffff, roughness: 0.1, metalness: 0.1, side: THREE.DoubleSide }), 
          stovePanel: new THREE.MeshStandardMaterial({ map: texIHPanel, color: 0xffffff, roughness: 0.3, metalness: 0.1, side: THREE.DoubleSide }),
          stoveSide: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.5, side: THREE.DoubleSide }), 
          stoveBurner: new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, metalness: 0.2, side: THREE.DoubleSide }),
          dishwasher: new THREE.MeshStandardMaterial({ map: texDishwasher, color: 0xffffff, roughness: 0.3, metalness: 0.1, side: THREE.DoubleSide }),
          hood: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.4, side: THREE.DoubleSide }),
          handle: new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.3, metalness: 0.8, side: THREE.DoubleSide }),
          line: new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, side: THREE.DoubleSide }), 
          rail: new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.3, metalness: 0.1, side: THREE.DoubleSide }),
          wall: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, side: THREE.DoubleSide, transparent: true, opacity: 0.2 }),
          glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, opacity: 1, metalness: 0, roughness: 0, ior: 1.5, thickness: 0.01, transparent: true, side: THREE.DoubleSide }),
          bracket: new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.2, metalness: 0.8, side: THREE.DoubleSide }),
          
          chairWood: new THREE.MeshStandardMaterial({ color: 0xD9CBB0, roughness: 0.6, metalness: 0.0 }), // Ash/Oak-like
          chairSeat: new THREE.MeshStandardMaterial({ color: 0xE0D6C2, roughness: 1.0, metalness: 0.0, bumpScale: 0.01 }), // Paper cord
          
          translucentFurniture: new THREE.MeshStandardMaterial({ 
            color: 0xECEAE6, roughness: 0.2, metalness: 0.0,
          }),
          pendantLight: new THREE.MeshStandardMaterial({ 
            color: 0x111111, roughness: 0.3, metalness: 0.2,
            emissive: 0xffffee, emissiveIntensity: 0.5
          }),
      };
  }, []);

  useEffect(() => {
    if (!floorMeshRef.current) return;
    setIsLoading(true);

    const material = floorMeshRef.current.material as THREE.MeshStandardMaterial;

    // Dispose of the old texture if it exists
    if (material.map) {
      material.map.dispose();
      material.map = null; // Ensure map is cleared
    }
    
    let url = '';
    let tintColor = 0xffffff; // Default to no tint

    switch (floorOption) {
        case 'oak': 
            url = 'http://25663cc9bda9549d.main.jp/aistudio/linekitchen/floortexture/oakfloor.jpg'; 
            tintColor = 0x777777; // Apply a gray tint to darken
            break;
        case 'tile': 
            url = 'http://25663cc9bda9549d.main.jp/aistudio/linekitchen/floortexture/tile.jpg'; 
            tintColor = 0x888888;
            break;
        case 'stone': 
            url = 'http://25663cc9bda9549d.main.jp/aistudio/linekitchen/floortexture/stone.jpg'; 
            tintColor = 0x555555;
            break;
        case 'herringbone': 
            url = 'http://25663cc9bda9549d.main.jp/aistudio/linekitchen/floortexture/herinborn.jpg'; 
            tintColor = 0x999999; // Apply a gray tint to darken
            break;
        case 'tile-black': 
            url = 'http://25663cc9bda9549d.main.jp/aistudio/linekitchen/floortexture/tileblack.jpg';
            tintColor = 0x666666; // Darken the texture
            break;
        case 'none':
        default:
            // No URL, tint is already white
            break;
    }
    
    material.color.set(tintColor); // Set the color tint

    if (url) {
       const tex = loadTexture(url);
       if (tex) {
           tex.wrapS = THREE.RepeatWrapping;
           tex.wrapT = THREE.RepeatWrapping;
           
           if (floorOption === 'tile') {
               tex.repeat.set(8.25, 8.25);
           } else if (floorOption === 'tile-black' || floorOption === 'oak') {
               tex.repeat.set(12.5, 12.5); // Make texture 2x larger
           } else {
               tex.repeat.set(25, 25);
           }
           material.map = tex;
       }
    }
    
    material.needsUpdate = true;
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);

  }, [floorOption]);

  const createStoveMesh = (materials: any) => {
      const stoveGroup = new THREE.Group();
      const stoveW = 0.60; const stoveD = 0.50; const stoveH = 0.015; 
      const plateMats = [
          materials.stoveSide, materials.stoveSide, materials.stoveBase, 
          materials.stoveSide, materials.stoveSide, materials.stoveSide
      ];
      const plate = new THREE.Mesh(new THREE.BoxGeometry(stoveW, stoveH, stoveD), plateMats);
      stoveGroup.add(plate);
      return stoveGroup;
  };

  const createBeveledPanelGeometry = (width: number, height: number, thickness: number, shouldScale: boolean = false) => {
      const shape = new THREE.Shape();
      const flatTop = 0.005;
      const slopeRun = thickness - flatTop; const slopeDrop = slopeRun;
      shape.moveTo(0, 0); shape.lineTo(0, height); shape.lineTo(flatTop, height);
      shape.lineTo(thickness, height - slopeDrop); shape.lineTo(thickness, 0); shape.lineTo(0, 0);
      const extrudeSettings = { steps: 1, depth: width, bevelEnabled: false, };
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometry.translate(-thickness / 2, -height / 2, -width / 2);
      geometry.rotateY(-Math.PI / 2);
      const posAttribute = geometry.attributes.position;
      const uvAttribute = geometry.attributes.uv;
      const count = posAttribute.count;
      const scale = 4.0;
      for (let i = 0; i < count; i++) {
          const x = posAttribute.getX(i); const y = posAttribute.getY(i);
          if (shouldScale) {
              uvAttribute.setXY(i, (x + width / 2) * scale, (y + height / 2) * scale);
          } else {
              uvAttribute.setXY(i, (x + width / 2) / width, (y + height / 2) / height);
          }
      }
      geometry.computeVertexNormals();
      return geometry;
  };

  const createKitchenGroup = (currentConfig: DoorConfiguration): THREE.Group => {
      const group = new THREE.Group();
      group.position.y = 0.001;
      const materials = {
          ...baseMaterials,
          cabinet: baseMaterials.cabinet.clone(), worktop: baseMaterials.worktop.clone(), handle: baseMaterials.handle.clone(),
          sink: baseMaterials.sink.clone(), faucet: baseMaterials.faucet.clone(), stoveBase: baseMaterials.stoveBase.clone(),
          stovePanel: baseMaterials.stovePanel.clone(), stoveSide: baseMaterials.stoveSide.clone(), stoveBurner: baseMaterials.stoveBurner.clone(),
          dishwasher: baseMaterials.dishwasher.clone(), hood: baseMaterials.hood.clone(), line: baseMaterials.line.clone(),
          rail: baseMaterials.rail.clone(),
          wall: baseMaterials.wall.clone(), bracket: baseMaterials.bracket.clone(),
      };
      
      const rangeHoodId = currentConfig.rangeHood;
      if (rangeHoodId.endsWith('-si')) {
          materials.hood.color.set(0xcccccc); // Silver
          materials.hood.metalness = 0.8;
          materials.hood.roughness = 0.2;
      } else if (rangeHoodId.endsWith('-bk')) {
          materials.hood.color.set(0x222222); // Black
          materials.hood.metalness = 0.4;
          materials.hood.roughness = 0.5;
      } else if (rangeHoodId.endsWith('-w')) {
          materials.hood.color.set(0xf0f0f0); // White
          materials.hood.metalness = 0.1;
          materials.hood.roughness = 0.6;
      }

      const faucetId = currentConfig.faucet;
      if (faucetId === 'sanei-k8781jv-djp' || faucetId === 'takagi-ls106bn') {
          // Black
          materials.faucet.color.set(0x222222);
          materials.faucet.roughness = 0.5;
          materials.faucet.metalness = 0.4;
      } else if (faucetId === 'grohe-32321gn2j') {
          // Gold/Brass
          materials.faucet.color.set(0xDAA520);
          materials.faucet.roughness = 0.3;
          materials.faucet.metalness = 0.9;
      } else {
          // Default Chrome/Silver
          materials.faucet.color.set(0xffffff);
          materials.faucet.roughness = 0.1;
          materials.faucet.metalness = 1.0;
      }

      const showHood = currentConfig.rangeHood !== 'no-hood';

      let repeatPerMeter = 1.0;
      const counterColor = colors.find(c => c.id === currentConfig.counterColor);
      if (counterColor) {
        if (counterColor.id === 'quartz-stone') {
          repeatPerMeter = 1.0 / 0.3; // 30% scale
        } else if (counterColor.textureUrl && counterColor.id !== 'stainless') {
          repeatPerMeter = 1.0 / 0.5; // Unified 50% scale for others
        }
      }

      const colorInfo = colors.find(c => c.id === currentConfig.color);
      const counterColorInfo = colors.find(c => c.id === currentConfig.counterColor);

      const exclusionList: ColorId[] = ['stainless', 'quartz-stone', 'natural-white', 'dark-beige', 'dark-gray'];
      const shouldScaleCabinet = colorInfo?.textureUrl && !exclusionList.includes(currentConfig.color);
      const cabinetRepeatFactor = 4.0;

      if (colorInfo) {
          const rawTexture = colorInfo.textureUrl ? loadTexture(colorInfo.textureUrl) : null;
          if (rawTexture) {
              const texture = rawTexture.clone();
              texture.colorSpace = THREE.SRGBColorSpace; 
              texture.wrapS = THREE.RepeatWrapping;
              texture.wrapT = THREE.RepeatWrapping;
              
              if(shouldScaleCabinet) {
                  texture.repeat.set(1, 1);
              } else {
                  texture.repeat.set(4, 4);
              }
              
              materials.cabinet.map = texture;
              materials.cabinet.color.set(0xffffff);
          } else {
              materials.cabinet.map = null; materials.cabinet.color.set(colorInfo.hex);
          }
          if (colorInfo.category === 'wood') { materials.cabinet.roughness = 0.7; materials.cabinet.metalness = 0.0; }
          else if (colorInfo.category === 'stone') { materials.cabinet.roughness = 0.5; materials.cabinet.metalness = 0.1; }
          else if (colorInfo.category === 'metal') { materials.cabinet.roughness = 0.2; materials.cabinet.metalness = 0.8; }
          else { materials.cabinet.roughness = 0.4; materials.cabinet.metalness = 0.1; }
      }

      if (counterColorInfo) {
          const rawTex = counterColorInfo.textureUrl ? loadTexture(counterColorInfo.textureUrl) : null;
          if (rawTex && counterColorInfo.id !== 'stainless') {
              const tex = rawTex.clone();
              tex.colorSpace = THREE.SRGBColorSpace;
              tex.wrapS = THREE.RepeatWrapping;
              tex.wrapT = THREE.RepeatWrapping;
              // For counter, we rely on UV mapping in geometry, so let's set repeat to 1,1
              tex.repeat.set(1, 1);
              materials.worktop.map = tex; materials.worktop.color.set(0xffffff);
          } else {
              materials.worktop.map = null; materials.worktop.color.set(counterColorInfo.hex);
          }
          if (counterColorInfo.category === 'wood') { materials.worktop.roughness = 0.7; materials.worktop.metalness = 0.0; }
          else if (counterColorInfo.category === 'metal' || counterColorInfo.id === 'stainless') { materials.worktop.roughness = 0.2; materials.worktop.metalness = 0.8; }
          else if (counterColorInfo.category === 'stone') { materials.worktop.roughness = 0.4; materials.worktop.metalness = 0.0; }
          else { materials.worktop.roughness = 0.2; materials.worktop.metalness = 0.1; }
      }

      materials.handle.color.set(currentConfig.handle === 'black' ? 0x1a1a1a : (currentConfig.handle === 'white' ? 0xffffff : 0xA0A0A0));

      const scaleBoxUvs = (geo: THREE.BoxGeometry, scale: number) => {
        const uvs = geo.getAttribute('uv');
        const w = geo.parameters.width;
        const h = geo.parameters.height;
        const d = geo.parameters.depth;
        
        // Right (+x), Left (-x)
        for (let i = 0; i < 8; i++) { uvs.setXY(i, uvs.getX(i) * d * scale, uvs.getY(i) * h * scale); }
        // Top (+y), Bottom (-y)
        for (let i = 8; i < 16; i++) { uvs.setXY(i, uvs.getX(i) * w * scale, uvs.getY(i) * d * scale); }
        // Front (+z), Back (-z)
        for (let i = 16; i < 24; i++) { uvs.setXY(i, uvs.getX(i) * w * scale, uvs.getY(i) * h * scale); }
        
        uvs.needsUpdate = true;
      };

      const createCabinetMesh = (w: number, h: number, d: number, mat: THREE.Material) => {
          const geo = new THREE.BoxGeometry(w, h, d);
          if (shouldScaleCabinet && mat === materials.cabinet) {
              scaleBoxUvs(geo, cabinetRepeatFactor);
          }
          return new THREE.Mesh(geo, mat);
      };
      
      const createSideWall = (kitchenWidthCm: number, kitchenDepthCm: number, kitchenZ: number = 0) => {
        const wallH = 2.4;
        const wallThick = 0.1;
        const kitchenWidth = kitchenWidthCm * 0.01;
        const kitchenDepth = kitchenDepthCm * 0.01;
        const wallDepth = kitchenDepth + 0.1;
    
        const wallGeo = new THREE.BoxGeometry(wallThick, wallH, wallDepth);
        // Use the transparent wall material
        const wall = new THREE.Mesh(wallGeo, materials.wall.clone()); 
        wall.userData.isWall = true;
        wall.castShadow = true;
        wall.receiveShadow = true;
    
        const wallX = kitchenWidth / 2 + (wallThick / 2) + 0.005; // 5mm gap
        wall.position.set(wallX, wallH / 2, kitchenZ);
        return wall;
      };

      const createUVMappedBox = (w: number, h: number, d: number, material: THREE.Material) => {
          const geo = new THREE.BoxGeometry(w, h, d);
          const uvs = geo.getAttribute('uv');
          const positions = geo.getAttribute('position');
          for (let i = 0; i < uvs.count; i++) {
               // Apply to top face (y approx h/2)
               if (Math.abs(positions.getY(i) - h/2) < 0.001) {
                    const worldX = positions.getX(i);
                    const worldZ = positions.getZ(i);
                    uvs.setXY(i, worldX * repeatPerMeter, worldZ * repeatPerMeter);
               }
          }
          uvs.needsUpdate = true;
          return new THREE.Mesh(geo, material);
      };

      const createCupboardBlock = (type: CupboardTypeId, widthCm: number, depthCm: number) => {
          const group = new THREE.Group();
          if (type === 'none') return group;

          const w = widthCm * 0.01;
          const d = (type === 'mix' ? 45 : depthCm) * 0.01;
          const baseH = currentConfig.height * 0.01;
          const tallH = 2.05; 
          const topT = 0.02;
          const doorThick = 0.02;
          
          const createUnit = (uw: number, uh: number, ud: number, y: number, unitType: 'base' | 'wall' | 'tall') => {
             const uGroup = new THREE.Group();
             uGroup.position.set(0, y, 0);

             const panelThick = 0.02;
             const leftPanel = createCabinetMesh(panelThick, uh, ud, materials.cabinet);
             leftPanel.position.set(-uw/2 + panelThick/2, 0, 0);
             leftPanel.receiveShadow = true; uGroup.add(leftPanel);
             
             const rightPanel = createCabinetMesh(panelThick, uh, ud, materials.cabinet);
             rightPanel.position.set(uw/2 - panelThick/2, 0, 0);
             rightPanel.receiveShadow = true; uGroup.add(rightPanel);
             
             if (unitType !== 'wall' && unitType !== 'tall') {
                 const backPanelThick = 0.005;
                 const backPanel = createCabinetMesh(uw, uh, backPanelThick, materials.cabinet);
                 backPanel.position.set(0, 0, -ud/2 + backPanelThick/2 - 0.001);
                 backPanel.receiveShadow = true;
                 uGroup.add(backPanel);
             }

             const innerW = uw - (panelThick * 2);
             const startX = -uw/2 + panelThick;
             const bottomY = -uh/2;
             
             if (unitType === 'base') {
                 const toeKickH = 0.10;
                 const workingH = uh - toeKickH;
                 const topRailH = 0.02; 
                 const midRailH = 0.02; 
                 const remainingH = workingH - topRailH - midRailH;
                 
                 const topDrawerH = remainingH * 0.3;
                 const botDrawerH = remainingH * 0.7;
                 
                 const kickD = ud - 0.05;
                 const kickMesh = new THREE.Mesh(new THREE.BoxGeometry(innerW, toeKickH, kickD), new THREE.MeshStandardMaterial({color: 0x111111}));
                 kickMesh.position.set(0, bottomY + toeKickH/2, -0.025);
                 uGroup.add(kickMesh);
                 
                 let currentY = bottomY + toeKickH;
                 
                 const numModules = Math.max(1, Math.round(innerW / 0.8));
                 const moduleW = innerW / numModules;
                 
                 for(let m=0; m<numModules; m++) {
                     const modX = startX + moduleW/2 + (moduleW * m);
                     const gapX = 0.007; 
                     const dW = moduleW - gapX;
                     
                     const botPanel = createCabinetMesh(dW, botDrawerH, doorThick, materials.cabinet);
                     botPanel.position.set(modX, currentY + botDrawerH/2, ud/2 - doorThick/2);
                     botPanel.castShadow = true; botPanel.receiveShadow = true;
                     uGroup.add(botPanel);
                     
                     const topPanelY = currentY + botDrawerH + midRailH;
                     const topPanel = createCabinetMesh(dW, topDrawerH, doorThick, materials.cabinet);
                     topPanel.position.set(modX, topPanelY + topDrawerH/2, ud/2 - doorThick/2);
                     topPanel.castShadow = true; topPanel.receiveShadow = true;
                     uGroup.add(topPanel);
                 }
                 
                 const railD = ud - 0.02;
                 const mRailY = currentY + botDrawerH;
                 const mRail = new THREE.Mesh(new THREE.BoxGeometry(innerW, midRailH, railD), materials.rail);
                 mRail.position.set(0, mRailY + midRailH/2, 0);
                 uGroup.add(mRail);
                 
                 const tRailY = currentY + botDrawerH + midRailH + topDrawerH;
                 const tRail = new THREE.Mesh(new THREE.BoxGeometry(innerW, topRailH, railD), materials.rail);
                 tRail.position.set(0, tRailY + topRailH/2, 0);
                 uGroup.add(tRail);

             } else if (unitType === 'wall') {
                 const numModules = Math.max(1, Math.round(innerW / 0.6));
                 const moduleW = innerW / numModules;
                 const dH = uh - 0.002;
                 
                 for(let m=0; m<numModules; m++) {
                     const modX = startX + moduleW/2 + (moduleW * m);
                     const gapX = 0.007;
                     const dW = moduleW - gapX;
                     
                     const door = createCabinetMesh(dW, dH, doorThick, materials.cabinet);
                     door.position.set(modX, 0, ud/2 - doorThick/2);
                     door.castShadow = true; door.receiveShadow = true;
                     uGroup.add(door);
                 }
                 const body = createCabinetMesh(innerW, uh, ud-doorThick, materials.cabinet);
                 body.position.set(0, 0, -doorThick/2);
                 uGroup.add(body);

             } else if (unitType === 'tall') {
                 const toeKickH = 0.10;
                 const channelH = 0.02; 
                 
                 const lowerDoorH = (baseH - 0.02) - toeKickH - channelH;
                 const upperDoorH = (uh - toeKickH) - lowerDoorH - channelH;
                 
                 const kickD = ud - 0.05;
                 const kickMesh = new THREE.Mesh(new THREE.BoxGeometry(innerW, toeKickH, kickD), new THREE.MeshStandardMaterial({color: 0x111111}));
                 kickMesh.position.set(0, bottomY + toeKickH/2, -0.025);
                 uGroup.add(kickMesh);
                 
                 const currentY = bottomY + toeKickH;
                 const numModules = Math.max(1, Math.round(innerW / 0.6));
                 const moduleW = innerW / numModules;
                 
                 for(let m=0; m<numModules; m++) {
                     const modX = startX + moduleW/2 + (moduleW * m);
                     const gapX = 0.007;
                     const dW = moduleW - gapX;
                     
                     const ld = createCabinetMesh(dW, lowerDoorH, doorThick, materials.cabinet);
                     ld.position.set(modX, currentY + lowerDoorH/2, ud/2 - doorThick/2);
                     ld.castShadow = true; ld.receiveShadow = true;
                     uGroup.add(ld);
                     
                     const udY = currentY + lowerDoorH + channelH;
                     const udMesh = createCabinetMesh(dW, upperDoorH, doorThick, materials.cabinet);
                     udMesh.position.set(modX, udY + upperDoorH/2, ud/2 - doorThick/2);
                     udMesh.castShadow = true; udMesh.receiveShadow = true;
                     uGroup.add(udMesh);
                 }
                 
                 const chY = currentY + lowerDoorH;
                 const ch = new THREE.Mesh(new THREE.BoxGeometry(innerW, channelH, ud - 0.02), materials.rail);
                 ch.position.set(0, chY + channelH/2, 0);
                 uGroup.add(ch);

                 const body = createCabinetMesh(innerW, uh, ud - doorThick, materials.cabinet);
                 body.position.set(0, 0, -doorThick/2);
                 body.receiveShadow = true;
                 uGroup.add(body);
             }
             
             return uGroup;
          };

          if (type === 'floor') {
              const unitH = baseH - topT;
              const unit = createUnit(w, unitH, d, (unitH)/2, 'base');
              group.add(unit);
              const top = createUVMappedBox(w, topT, d, materials.worktop);
              top.position.y = unitH + topT/2; top.receiveShadow = true;
              group.add(top);

          } else if (type === 'separate') {
              const unitH = baseH - topT;
              const base = createUnit(w, unitH, d, (unitH)/2, 'base');
              group.add(base);
              const top = createUVMappedBox(w, topT, d, materials.worktop);
              top.position.y = unitH + topT/2; top.receiveShadow = true;
              group.add(top);
              
              const upperH = 0.7;
              const upperY = tallH - upperH/2;
              const upperD = 0.35;
              group.add(createUnit(w, upperH, upperD, upperY, 'wall'));

          } else if (type === 'tall') {
              group.add(createUnit(w, tallH, d, tallH/2, 'tall'));

          } else if (type === 'mix') {
              const tallW = 0.90;
              const sepW = w - tallW;
              const isFlipped = currentConfig.cupboardLayout === 'right';
              
              if (sepW > 0) {
                  const tallX = isFlipped ? (-w/2 + tallW/2) : (w/2 - tallW/2);
                  const sepX = isFlipped ? (w/2 - sepW/2) : (-w/2 + sepW/2);

                  const tallPart = createUnit(tallW, tallH, d, tallH/2, 'tall');
                  tallPart.position.x = tallX;
                  group.add(tallPart);

                  const sepGroup = new THREE.Group();
                  sepGroup.position.x = sepX;
                  
                  const unitH = baseH - topT;
                  const base = createUnit(sepW, unitH, d, (unitH)/2, 'base');
                  sepGroup.add(base);
                  const top = createUVMappedBox(sepW, topT, d, materials.worktop);
                  top.position.y = unitH + topT/2; top.receiveShadow = true;
                  sepGroup.add(top);

                  const upperH = 0.7;
                  const upperY = tallH - upperH/2;
                  sepGroup.add(createUnit(sepW, upperH, d, upperY, 'wall'));
                  
                  group.add(sepGroup);
              } else {
                   group.add(createUnit(w, tallH, d, tallH/2, 'tall'));
              }
          }
          
          const wallH = 2.4;
          const wallW = 4.0; 
          const wallThick = 0.1;
          const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(wallW, wallH, wallThick), materials.wall);
          wallMesh.userData.isWall = true;
          wallMesh.position.set(0, wallH/2, -d/2 - wallThick/2 - 0.05); 
          group.add(wallMesh);

          return group;
      };

      const createCabinetBlock = (
          widthCm: number, 
          depthCm: number, 
          heightCm: number, 
          hasSink: boolean, 
          hasStove: boolean, 
          hasHood: boolean, 
          hoodType: 'center' | 'side' = 'center', 
          doubleSidePanel: boolean = false, 
          extraOverhang: number = 0, 
          forceBackPanel: boolean = false,
          backStyle: BackStyleId | 'none' = 'none', 
          forceLeftPanel: boolean = false,
          leftPanelMaterial: 'worktop' | 'cabinet' = 'worktop',
          rightPanelMaterial: 'worktop' | 'cabinet' = 'worktop',
          sidePanelDepthReduction: number = 0,
          fullWidthKickStrip: boolean = false,
          casingZOffset: number = 0,
          hideSinkSides: boolean = false,
          wallSide: 'none' | 'left' | 'right' = 'none'
      ) => {
          const w = widthCm * 0.01; const d = depthCm * 0.01; const topH = 0.02; const revealH = 0.02; const floatH = 0.10;
          const totalH = heightCm * 0.01; const h = Math.max(0.01, totalH - topH - revealH - floatH); 
          const hasWaterfall = hasSink || forceLeftPanel;
          const hasRightPanel = doubleSidePanel; const panelThick = 0.02; 
          
          const isTypeIIBlock = currentConfig.doorType === 'type-ii' || currentConfig.doorType.startsWith('type-ii-stove-');
          const useNewLayout = !isTypeIIBlock && ['peninsula', 'island', 'type-i'].includes(currentConfig.doorType);
          
          const stoveInternalXOffset = useNewLayout ? 0.10 : 0;
          
          const isTypeI = currentConfig.doorType === 'type-i';
          const typeITopOffset = isTypeI ? 0.013 : 0;  
          const typeIBotOffset = isTypeI ? -0.02 : 0;

          const isIsland = depthCm > 70;
          const isCounterStyle = backStyle === 'counter';
          const isStorageStyle = backStyle === 'storage';
          const hasBackStorage = isStorageStyle;
          const isIslandStyle = isIsland || isCounterStyle || isStorageStyle;
          
          const isSinkBaseOpen = hasSink && currentConfig.sinkBaseType === 'open';
          
          const backPanelThick = 0.02; 
          
          let bodyDepth = d;
          let bodyZOffset = 0;
          const standardBodyDepth = 0.65;

          if (isCounterStyle) {
              bodyDepth = standardBodyDepth;
              bodyZOffset = (d / 2) - (bodyDepth / 2);
          } else if (isIslandStyle) {
              bodyDepth = d - backPanelThick;
              bodyZOffset = backPanelThick / 2;
          }
          
          const blockGroup = new THREE.Group();
          
          let sinkUnitW = 0.90; let stoveUnitW = 0.75; let dishwasherW = 0.45;
          const availableW = w - (hasWaterfall ? panelThick : 0) - (hasRightPanel ? panelThick : 0);
          let hasDishwasher = false; let middleStorageW = 0; 
          
          if (useNewLayout) {
              if (hasSink && availableW > dishwasherW + 1.0) {
                  hasDishwasher = true;
                  const remaining = availableW - dishwasherW;
                  sinkUnitW = remaining / 2;
                  stoveUnitW = remaining / 2;
                  middleStorageW = 0;
              } else if (hasSink) {
                   sinkUnitW = availableW / 2;
                   stoveUnitW = availableW / 2;
                   middleStorageW = 0;
              }
          } else {
              const isStoveOnly = hasStove && !hasSink;
              let minRequired = isStoveOnly ? stoveUnitW : sinkUnitW + (hasStove ? stoveUnitW : 0);
              if (hasSink && availableW >= minRequired + dishwasherW) { hasDishwasher = true; middleStorageW = availableW - minRequired - dishwasherW; }
              else { middleStorageW = availableW - minRequired; }
              if (middleStorageW < 0) middleStorageW = 0;
          }

          const startX = -w/2 + (hasWaterfall ? panelThick : 0); let sinkZoneX = 0, dishwasherZoneX = 0, middleZoneX = 0, stoveZoneX = 0;
          
          const isStoveOnly = hasStove && !hasSink;
          
          if (isStoveOnly) { stoveZoneX = startX + stoveUnitW/2; middleZoneX = startX + stoveUnitW + middleStorageW/2; }
          else { sinkZoneX = startX + sinkUnitW/2; dishwasherZoneX = startX + sinkUnitW + dishwasherW/2;
              middleZoneX = startX + sinkUnitW + (hasDishwasher ? dishwasherW : 0) + middleStorageW/2;
              stoveZoneX = startX + sinkUnitW + (hasDishwasher ? dishwasherW : 0) + middleStorageW + stoveUnitW/2; }
          
          const extension = isIslandStyle ? 0.049 : 0;
          const accessoryZ = (d > 0.7 ? (d/2 - 0.325) : 0) + casingZOffset; const GAP = 0.005;
          
          const createZoneMesh = (x: number, width: number, type: 'sink' | 'dishwasher' | 'storage' | 'stove') => {
             const zoneGroup = new THREE.Group(); zoneGroup.position.set(x, floatH, bodyZOffset + casingZOffset);
             const localD = bodyDepth; const displayW = Math.max(0.01, width - GAP);
             
             const railW = displayW - 0.002;
             
             if (isTypeI) {
                 if (!(type === 'sink' && currentConfig.sinkBaseType === 'open')) {
                    const backSheetH = h;
                    const backSheet = new THREE.Mesh(new THREE.BoxGeometry(displayW, backSheetH, 0.002), materials.rail);
                    backSheet.position.set(0, h/2, localD/2 - 0.03);
                    zoneGroup.add(backSheet);
                 }
             }

             if (type === 'sink') {
                 const apronRatio = 0.25; 
                 const apronH = (h * apronRatio) + extension; 
                 const heightReduction = isIslandStyle ? 0.04 : 0;
                 const finalApronH = apronH - heightReduction;
                 const apronY = (h + extension) - apronH/2 - heightReduction/2;
                 
                 const doorH = h - (h * apronRatio) - GAP;
                 const doorReduction = isIslandStyle ? 0.02 : 0;
                 const finalDoorH = doorH - doorReduction;
                 const doorYAligned = finalDoorH / 2;
                 
                 const mat = materials.cabinet; const thick = 0.02;
                 const apron = createCabinetMesh(displayW, Math.max(0.001, finalApronH), thick, mat);
                 apron.position.set(0, apronY + typeITopOffset, localD/2 - thick/2); apron.receiveShadow = true; zoneGroup.add(apron);

                 const sideH = currentConfig.sinkBaseType === 'open' ? h + floatH : h;
                 const sideY = currentConfig.sinkBaseType === 'open' ? (h + floatH)/2 - floatH : h/2;
                 
                 if (!hideSinkSides) {
                     const left = createCabinetMesh(thick, Math.max(0.001, sideH), Math.max(0.001, localD - thick*2), mat);
                     left.position.set(-displayW/2 + thick/2, sideY, 0); zoneGroup.add(left);
                     const right = createCabinetMesh(thick, Math.max(0.001, sideH), Math.max(0.001, localD - thick*2), mat);
                     right.position.set(displayW/2 - thick/2, sideY, 0); zoneGroup.add(right);
                     
                     const back = createCabinetMesh(displayW, Math.max(0.001, h), thick, mat);
                     back.position.set(0, h/2, -localD/2 + thick/2 + 0.005); zoneGroup.add(back);
                 }
                 
                 if (currentConfig.sinkBaseType === 'open') {
                    const hangerGroup = new THREE.Group();
                    const hangerMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, metalness: 0.1 });

                    const barLength = 0.30;
                    const barRadius = 0.008;

                    const barGeo = new THREE.CylinderGeometry(barRadius, barRadius, barLength, 12);
                    const barMesh = new THREE.Mesh(barGeo, hangerMaterial);
                    barMesh.rotation.z = Math.PI / 2;
                    barMesh.castShadow = true;
                    barMesh.receiveShadow = true;

                    const supportLength = 0.04;
                    const supportGeo = new THREE.CylinderGeometry(barRadius, barRadius, supportLength, 12);

                    const support1 = new THREE.Mesh(supportGeo, hangerMaterial);
                    support1.position.set(-barLength / 2 + barRadius * 2, 0, -supportLength / 2);
                    support1.castShadow = true;
                    support1.receiveShadow = true;

                    const support2 = new THREE.Mesh(supportGeo, hangerMaterial);
                    support2.position.set(barLength / 2 - barRadius * 2, 0, -supportLength / 2);
                    support2.castShadow = true;
                    support2.receiveShadow = true;
                    
                    hangerGroup.add(barMesh, support1, support2);

                    const counterBottomY = h + revealH; 
                    hangerGroup.position.y = counterBottomY - 0.05; 
                    hangerGroup.position.z = localD / 2; 
                    
                    zoneGroup.add(hangerGroup);
                 } else { 
                    const bottom = createCabinetMesh(displayW, thick, Math.max(0.001, localD - thick*2), mat);
                    bottom.position.set(0, thick/2, 0); zoneGroup.add(bottom);
                    
                    const door = createCabinetMesh(displayW, Math.max(0.001, finalDoorH), thick, mat);
                    door.position.set(0, doorYAligned + typeIBotOffset, localD/2 - thick/2); door.receiveShadow = true; door.castShadow = true; zoneGroup.add(door);
                    
                    if (!isIslandStyle) {
                        const filler = new THREE.Mesh(new THREE.BoxGeometry(railW, GAP, thick), materials.rail);
                        filler.position.set(0, doorH + GAP/2, localD/2 - thick/2 - 0.02); zoneGroup.add(filler);
                    }
                 }

             } else if (type === 'dishwasher') {
                let panelH = 0.02 + extension;
                if (isTypeI) {
                    panelH += 0.03;
                }
                const doorH = h - (panelH - extension);
                const doorReduction = isIslandStyle ? 0.04 : 0;
                const dwDoorExtension = isTypeI ? 0.03 : 0;
                const finalDoorH = doorH - doorReduction + dwDoorExtension;
                const doorY = finalDoorH / 2;
                const thick = 0.02;

                if (isSinkBaseOpen) {
                    const mat = materials.cabinet;
                    const sideH = h + floatH; // Full height from floor
                    const sideY = sideH / 2 - floatH;
                    const sidePanel = createCabinetMesh(thick, sideH, localD, mat);
                    sidePanel.position.set(-displayW / 2 + thick / 2, sideY, 0);
                    zoneGroup.add(sidePanel);
                }
            
                const doorMesh = createCabinetMesh(displayW, Math.max(0.001, finalDoorH), thick, materials.cabinet);
                doorMesh.position.set(0, doorY + typeIBotOffset, localD / 2 - thick / 2);
                doorMesh.castShadow = true;
                doorMesh.receiveShadow = true;
                zoneGroup.add(doorMesh);
            
                const panelMats = [materials.cabinet, materials.cabinet, materials.cabinet, materials.cabinet, materials.dishwasher, materials.cabinet];
                const panelYOffset = isIslandStyle ? -0.04 : 0;

                const panelGeo = new THREE.BoxGeometry(displayW, Math.max(0.001, panelH), thick);
                if(shouldScaleCabinet) {
                    const scale = cabinetRepeatFactor;
                    const uvs = panelGeo.getAttribute('uv');
                    const [w, h, d] = [displayW, Math.max(0.001, panelH), thick];
                    
                    for (let i = 0; i < 4; i++) { uvs.setXY(i, uvs.getX(i) * d * scale, uvs.getY(i) * h * scale); }
                    for (let i = 4; i < 8; i++) { uvs.setXY(i, uvs.getX(i) * d * scale, uvs.getY(i) * h * scale); }
                    for (let i = 8; i < 12; i++) { uvs.setXY(i, uvs.getX(i) * w * scale, uvs.getY(i) * d * scale); }
                    for (let i = 12; i < 16; i++) { uvs.setXY(i, uvs.getX(i) * w * scale, uvs.getY(i) * d * scale); }
                    for (let i = 20; i < 24; i++) { uvs.setXY(i, uvs.getX(i) * w * scale, uvs.getY(i) * h * scale); }
                    uvs.needsUpdate = true;
                }
                const panelMesh = new THREE.Mesh(panelGeo, panelMats);
            
                panelMesh.position.set(0, doorH + panelH / 2 + panelYOffset + typeITopOffset - 0.001, localD / 2 - thick / 2);
                panelMesh.castShadow = true;
                panelMesh.receiveShadow = true;
                zoneGroup.add(panelMesh);
             } else {
                 const totalH = h - 2 * GAP; const topH_ = (totalH * 0.20) + extension;
                 const midH_ = totalH * 0.40; const botH_ = totalH * 0.40;
                 
                 const createDrawer = (dH: number, originalYPos: number, depthReduction: number = 0, heightRed: number = 0, yOffset: number = 0) => {
                     const drawDepth = localD - depthReduction;
                     const zOffset = depthReduction / 2; 
                     
                     const finalH = dH - heightRed;
                     const bottomY = originalYPos - dH/2;
                     const newY = bottomY + finalH/2;

                     const m = createCabinetMesh(displayW, Math.max(0.001, finalH), Math.max(0.001, drawDepth), materials.cabinet);
                     m.position.set(0, newY + yOffset, zOffset); m.castShadow = true; m.receiveShadow = true; zoneGroup.add(m);
                 };

                 const createFiller = (yPos: number) => {
                     if (isIslandStyle && yPos > h * 0.8) return; 
                     let zPos = -0.025;
                     let fDepth = localD - 0.05;
                     
                     if ((isTypeIIBlock) && !hasSink) {
                        fDepth = localD - 0.20; 
                        zPos = 0.05; 
                     }

                     const f = new THREE.Mesh(new THREE.BoxGeometry(railW, GAP, fDepth), materials.rail);
                     f.position.set(0, yPos, zPos); zoneGroup.add(f);
                 }
                 
                 if (type === 'stove' && useNewLayout) {
                     const bottomDrawerH = midH_ + botH_ + GAP; 
                     
                     createDrawer(bottomDrawerH, bottomDrawerH / 2, 0, isIslandStyle ? 0.02 : 0, typeIBotOffset);
                     
                     createFiller(bottomDrawerH + GAP/2);
                     
                     const topDrawerYOffset = 0;
                     const topYStart = bottomDrawerH + GAP;
                     const depthReduction = isTypeI ? 0.01 : 0;
                     createDrawer(topH_, topYStart + topH_/2 + topDrawerYOffset, (isIslandStyle ? 0.03 : 0) + depthReduction, isIslandStyle ? 0.04 : 0, typeITopOffset);

                 } else {
                     createDrawer(botH_, botH_/2, 0, isIslandStyle ? 0.02 : 0, typeIBotOffset); 
                     createFiller(botH_ + GAP/2);
                     
                     createDrawer(midH_, botH_ + GAP + midH_/2, 0, isIslandStyle ? 0.02 : 0, typeIBotOffset); 
                     if (!isIslandStyle) createFiller(botH_ + GAP + midH_ + GAP/2);
                     
                     const topDrawerYOffset = 0;
                     createDrawer(topH_, botH_ + GAP + midH_ + GAP + topH_/2 + topDrawerYOffset, isIslandStyle ? 0.03 : 0, isIslandStyle ? 0.04 : 0, typeITopOffset);
                 }

                 
                 if (type === 'stove') {
                    const cpW = 0.56; const cpH = 0.14; const cpD = 0.005;
                    const cpMats = [materials.stoveSide, materials.stoveSide, materials.stoveSide, materials.stoveSide, materials.stovePanel, materials.stoveSide];
                    const cpMesh = new THREE.Mesh(new THREE.BoxGeometry(cpW, cpH, cpD), cpMats);
                    
                    let topDrawerY;
                    if (useNewLayout) {
                         const bottomDrawerH = midH_ + botH_ + GAP;
                         topDrawerY = bottomDrawerH + GAP + topH_/2;
                    } else {
                         topDrawerY = botH_ + GAP + midH_ + GAP + topH_/2;
                    }
                    
                    const isIslandOrPeninsula = currentConfig.doorType === 'island' || currentConfig.doorType === 'peninsula';
                    const cpYOffset = isIslandOrPeninsula ? -0.02 : 0;

                    cpMesh.position.set(stoveInternalXOffset, topDrawerY + cpYOffset + typeITopOffset, localD/2 + cpD/2); 
                    cpMesh.receiveShadow = true; 
                    zoneGroup.add(cpMesh);
                 }
             }
             const rY = h + revealH/2; 
             if (type === 'sink') {
                 const stripD = 0.05;
                 if (!isIslandStyle) { 
                     const fMesh = new THREE.Mesh(new THREE.BoxGeometry(railW, revealH, stripD), materials.rail);
                     fMesh.position.set(0, rY, localD/2 - 0.01 - stripD/2); zoneGroup.add(fMesh);
                     const bMesh = new THREE.Mesh(new THREE.BoxGeometry(displayW - 0.002, revealH, stripD), materials.rail);
                     bMesh.position.set(0, rY, -localD/2 + 0.01 + stripD/2); zoneGroup.add(bMesh);
                 }
             } else {
                 if (!isIslandStyle) {
                    const rD = localD - 0.02;
                    const rMesh = new THREE.Mesh(new THREE.BoxGeometry(railW, revealH, rD), materials.rail);
                    rMesh.position.set(0, rY, 0); zoneGroup.add(rMesh);
                 }
             }
             return zoneGroup;
          };

          if (hasSink) blockGroup.add(createZoneMesh(sinkZoneX, sinkUnitW, 'sink'));
          if (hasDishwasher) blockGroup.add(createZoneMesh(dishwasherZoneX, dishwasherW, 'dishwasher'));
          if (middleStorageW > 0.01) blockGroup.add(createZoneMesh(middleZoneX, middleStorageW, 'storage'));
          if (hasStove) blockGroup.add(createZoneMesh(stoveZoneX, stoveUnitW, 'stove'));
          
          const overhangFront = 0.00; 
          const flushOffsetZ = (overhangFront - extraOverhang) / 2;
          
          let leftMat = leftPanelMaterial === 'cabinet' ? materials.cabinet : materials.worktop;
          let rightMat = rightPanelMaterial === 'cabinet' ? materials.cabinet : materials.worktop;

          if (currentConfig.counterColor === 'quartz-stone' && materials.worktop.map) {
              const quartzSideMaterial = materials.worktop.clone();
              const newMap = materials.worktop.map.clone();
              newMap.needsUpdate = true;
              newMap.repeat.set(2, 2); // 50% smaller texture -> 2x repeat
              quartzSideMaterial.map = newMap;
              
              if(leftPanelMaterial === 'worktop') leftMat = quartzSideMaterial;
              if (rightPanelMaterial === 'worktop') rightMat = quartzSideMaterial;
          }

          if (hasWaterfall) { // Left panel
              const sideH = floatH + h + revealH;
              const sideD = (wallSide === 'left') ? bodyDepth : d;
              const sideZ = (wallSide === 'left') ? bodyZOffset : 0;
              const sideMesh = createCabinetMesh(panelThick, sideH, sideD, leftMat);
              sideMesh.position.set(-w / 2 + panelThick / 2, sideH / 2, sideZ);
              sideMesh.receiveShadow = true; sideMesh.castShadow = true; blockGroup.add(sideMesh);
          }
          if (hasRightPanel) { // Right panel
              const sideH = floatH + h + revealH;
              const sideD = (wallSide === 'right') ? bodyDepth : d;
              const sideZ = (wallSide === 'right') ? bodyZOffset : 0;
              const sideMesh = createCabinetMesh(panelThick, sideH, sideD, rightMat);
              sideMesh.position.set(w / 2 - panelThick / 2, sideH / 2, sideZ);
              sideMesh.receiveShadow = true; sideMesh.castShadow = true; blockGroup.add(sideMesh);
          }

          if (forceBackPanel || isCounterStyle) {
              const bPanelH = floatH + h + revealH; const bPanelThick = 0.003; const bPanelW = availableW - 0.002;
              const bPanel = createCabinetMesh(bPanelW, bPanelH, bPanelThick, materials.cabinet);
              
              let backFaceZ = 0;
              if (forceBackPanel) {
                   backFaceZ = bodyZOffset - bodyDepth/2 - 0.001 + casingZOffset;
              } else if (isCounterStyle) {
                   backFaceZ = bodyZOffset - bodyDepth/2 + casingZOffset;
              }

              bPanel.position.set(startX + availableW/2, bPanelH / 2, backFaceZ - bPanelThick/2);
              bPanel.receiveShadow = true; blockGroup.add(bPanel);
          }

          if ((hasBackStorage || isCounterStyle) && !forceBackPanel) {
              const fPanelTopY = totalH - topH;
              const fPanelH = fPanelTopY - 0.10;
              const fPanelY = 0.10 + fPanelH / 2;
              const frontFaceZ = bodyZOffset + bodyDepth/2;
              const fPanelZ = frontFaceZ - 0.02 + casingZOffset;

              const railSegments: {x: number, w: number}[] = [];
              
              if (isTypeI) {
                   railSegments.push({ x: startX + availableW / 2, w: availableW });
              } else if (isStoveOnly) {
                  railSegments.push({ x: stoveZoneX, w: stoveUnitW });
              } else {
                  if (hasSink) {
                      if (!isSinkBaseOpen) {
                          railSegments.push({ x: sinkZoneX, w: sinkUnitW });
                      }
                  }
                  if (hasDishwasher) {
                      railSegments.push({ x: dishwasherZoneX, w: dishwasherW });
                  }
                  if (middleStorageW > 0.01) {
                      railSegments.push({ x: middleZoneX, w: middleStorageW });
                  }
                  if (hasStove) {
                      railSegments.push({ x: stoveZoneX, w: stoveUnitW });
                  }
              }

              railSegments.forEach(seg => {
                   const segMesh = new THREE.Mesh(
                       new THREE.BoxGeometry(seg.w, fPanelH, 0.001),
                       materials.rail
                   );
                   segMesh.position.set(seg.x, fPanelY, fPanelZ);
                   blockGroup.add(segMesh);
              });
          }

          if (hasBackStorage && !forceBackPanel) {
               const backPanelW = (w - (hasWaterfall ? panelThick : 0) - (hasRightPanel ? panelThick : 0));
               const startXBack = -w/2 + (hasWaterfall ? panelThick : 0);
               const topGap = 0.04;
               const heightReduction = 0.01;
               const backPanelH = h - topGap + extension - heightReduction; 
               const backPanelY = floatH + backPanelH / 2;
               
               // Use 4 panels for Type II (184cm), 6 for larger islands
               const numPanels = isTypeIIBlock ? 4 : 6; 
               const segW = backPanelW / numPanels;
               
               for (let i = 0; i < numPanels; i++) {
                   const newPanelThick = 0.006; // Shrink to 6mm
                   const newZPos = -d / 2 + newPanelThick / 2 + casingZOffset + 0.002; // Adjust Z position
                   const pMesh = new THREE.Mesh(createBeveledPanelGeometry(segW - 0.003, backPanelH, newPanelThick, shouldScaleCabinet), materials.cabinet);
                   pMesh.position.set(startXBack + segW * i + segW / 2, backPanelY, newZPos);
                   pMesh.castShadow = true; pMesh.receiveShadow = true; blockGroup.add(pMesh);

                   const blackPanelTopY = totalH - topH; 
                   const blackPanelBottomY = 0.00; 
                   const blackPanelH = blackPanelTopY - blackPanelBottomY;
                   const blackPanelYCenter = (blackPanelTopY + blackPanelBottomY) / 2;
                   
                   const bPanel = new THREE.Mesh(new THREE.BoxGeometry(segW, blackPanelH, 0.001), materials.rail);
                   bPanel.position.set(startXBack + segW * i + segW / 2, blackPanelYCenter, -d / 2 + backPanelThick + 0.0005 + casingZOffset - 0.008); // Push back to avoid flicker
                   blockGroup.add(bPanel);
               }
          }

          const topY = floatH + h + revealH + topH/2; const topW = w; 
          const topD = d + overhangFront + extraOverhang; 
          const topCenterZ = flushOffsetZ + casingZOffset;

          if (!hasSink) {
              const geo = new THREE.BoxGeometry(topW, topH, topD);
              const uvs = geo.getAttribute('uv');
              const positions = geo.getAttribute('position');
              for (let i = 0; i < uvs.count; i++) {
                  if (Math.abs(positions.getY(i) - topH / 2) < 0.001) {
                      const worldX = positions.getX(i);
                      const worldZ = positions.getZ(i);
                      uvs.setXY(i, worldX * repeatPerMeter, worldZ * repeatPerMeter);
                  }
              }
              uvs.needsUpdate = true;
              const topMesh = new THREE.Mesh(geo, materials.worktop);
              topMesh.position.set(0, topY, topCenterZ); topMesh.receiveShadow = true; blockGroup.add(topMesh);
          } else {
              const sinkW = 0.76; const sinkD = 0.48; const sinkRealCenter = sinkZoneX; const sinkZ = accessoryZ;
              const createTopPiece = (pieceW: number, pieceD: number, x: number, z: number) => {
                 if (pieceW < 0.001 || pieceD < 0.001) return;
                 const geo = new THREE.BoxGeometry(pieceW, topH, pieceD);

                 const uvs = geo.getAttribute('uv');
                 const positions = geo.getAttribute('position');

                 for (let i = 0; i < uvs.count; i++) {
                    if (Math.abs(positions.getY(i) - topH / 2) < 0.001) {
                      const worldX = x + positions.getX(i);
                      const worldZ = z + positions.getZ(i);
                      uvs.setXY(i, worldX * repeatPerMeter, worldZ * repeatPerMeter);
                    }
                 }
                 uvs.needsUpdate = true;
                 
                 const m = new THREE.Mesh(geo, materials.worktop);
                 m.position.set(x, topY, z); m.receiveShadow = true; blockGroup.add(m);
              };
              const minX = -topW / 2; const maxX = topW / 2; const minZ = topCenterZ - topD / 2; const maxZ = topCenterZ + topD / 2;
              const sinkMinX = sinkRealCenter - sinkW / 2; const sinkMaxX = sinkRealCenter + sinkW / 2;
              const sinkMinZ = sinkZ - sinkD / 2; const sinkMaxZ = sinkZ - sinkD / 2 + sinkD;
              if (sinkMinX > minX) { createTopPiece(sinkMinX - minX, maxZ - minZ, minX + (sinkMinX - minX)/2, minZ + (maxZ - minZ)/2); }
              if (sinkMaxX < maxX) { createTopPiece(maxX - sinkMaxX, maxZ - minZ, sinkMaxX + (maxX - sinkMaxX)/2, minZ + (maxZ - minZ)/2); }
              const sharedW = Math.min(sinkMaxX, maxX) - Math.max(sinkMinX, minX);
              if (maxZ > sinkMaxZ && sharedW > 0) { createTopPiece(sharedW, maxZ - sinkMaxZ, (Math.max(sinkMinX, minX) + Math.min(sinkMaxX, maxX))/2, sinkMaxZ + (maxZ - sinkMaxZ)/2); }
              if (minZ < sinkMinZ && sharedW > 0) { createTopPiece(sharedW, sinkMinZ - minZ, (Math.max(sinkMinX, minX) + Math.min(sinkMaxX, maxX))/2, minZ + (sinkMinZ - minZ)/2); }
              const sinkDepth = 0.18; const basinGroup = new THREE.Group(); basinGroup.position.set(sinkRealCenter, topY + topH/2 - 0.0001, sinkZ);
              const bottomInfo = new THREE.Mesh(new THREE.BoxGeometry(sinkW, 0.01, sinkD), materials.sink); bottomInfo.position.y = -sinkDepth; basinGroup.add(bottomInfo);
              const sideThick = 0.01; const sideGeoFB = new THREE.BoxGeometry(sinkW, sinkDepth, sideThick); const sideGeoLR = new THREE.BoxGeometry(sideThick, sinkDepth, sinkD);
              const backSide = new THREE.Mesh(sideGeoFB, materials.sink); backSide.position.set(0, -sinkDepth/2, -sinkD/2 + sideThick/2); basinGroup.add(backSide);
              const frontSide = new THREE.Mesh(sideGeoFB, materials.sink); frontSide.position.set(0, -sinkDepth/2, sinkD/2 - sideThick/2); basinGroup.add(frontSide);
              const leftSide = new THREE.Mesh(sideGeoLR, materials.sink); leftSide.position.set(-sinkW/2 + sideThick/2, -sinkDepth/2, 0); basinGroup.add(leftSide);
              const rightSide = new THREE.Mesh(sideGeoLR, materials.sink); rightSide.position.set(sinkW/2 - sideThick/2, -sinkDepth/2, 0); basinGroup.add(rightSide);
              blockGroup.add(basinGroup);
              const faucetGroup = new THREE.Group(); faucetGroup.position.set(sinkRealCenter, topY + topH/2, sinkZ - sinkD/2 - 0.07 + 0.04); 
              const fBase = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.04), materials.faucet); fBase.position.y = 0.02; faucetGroup.add(fBase);
              const points = [new THREE.Vector3(0, 0.02, 0), new THREE.Vector3(0, 0.15, 0)];
              for (let i = 1; i <= 16; i++) { points.push(new THREE.Vector3(0, 0.15 + 0.10 * Math.sin((i/16)*Math.PI), 0.10 - 0.10 * Math.cos((i/16)*Math.PI))); }
              const faucetMesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 40, 0.012, 16, false), materials.faucet); faucetGroup.add(faucetMesh);
              const handleJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.04), materials.faucet);
              handleJoint.rotation.z = Math.PI / 2; handleJoint.position.set(0.03, 0.05, 0); faucetGroup.add(handleJoint);
              const lever = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.08, 0.025), materials.faucet);
              lever.position.set(0.055, 0.06, 0); lever.rotation.x = 0.2; faucetGroup.add(lever); blockGroup.add(faucetGroup);
          }
          if (hasStove) {
              const stoveGroup = createStoveMesh(materials); 
              const stoveZOffset = (currentConfig.doorType === 'island') ? 0.08 : 0.06;
              
              stoveGroup.position.set(stoveZoneX + stoveInternalXOffset, topY + topH/2, accessoryZ + stoveZOffset); 
              blockGroup.add(stoveGroup);
              
              if (currentConfig.divider === 'glass-70') {
                 const divW = 0.70; const divH = 0.30; const divD = 0.008; const dividerGroup = new THREE.Group();
                 const glassMesh = new THREE.Mesh(new THREE.BoxGeometry(divW, divH, divD), materials.glass);
                 glassMesh.position.y = divH / 2; glassMesh.castShadow = true; dividerGroup.add(glassMesh);
                 const brackSize = 0.04; const bracketGeo = new THREE.BoxGeometry(brackSize, brackSize, brackSize + divD);
                 const leftBracket = new THREE.Mesh(bracketGeo, materials.bracket); leftBracket.position.set(-divW/2 + brackSize/2, brackSize/2, 0); dividerGroup.add(leftBracket);
                 const rightBracket = new THREE.Mesh(bracketGeo, materials.bracket); rightBracket.position.set(divW/2 - brackSize/2, brackSize/2, 0); dividerGroup.add(rightBracket);
                 
                 dividerGroup.position.set(stoveZoneX + stoveInternalXOffset, topY + topH/2, accessoryZ - 0.30); 
                 blockGroup.add(dividerGroup);
              }
          }
          if (hasHood) {
              const hoodGroup = new THREE.Group();
              if (hoodType === 'side') {
                   const hoodW = 0.70; const hoodD = 0.65; const bottomY = 1.65;
                   const plate = new THREE.Mesh(new THREE.BoxGeometry(hoodW, 0.035, hoodD), materials.hood);
                   plate.position.set(0, bottomY + 0.035/2, 0); plate.castShadow = true; plate.receiveShadow = true; hoodGroup.add(plate);
                   const duct = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.50, 0.32), materials.hood);
                   duct.position.set((hoodW/2) - (0.35/2), bottomY + 0.035 + 0.50/2, 0);
                   duct.castShadow = true; hoodGroup.add(duct);
                   hoodGroup.position.set(stoveZoneX, 0, accessoryZ);
                   duct.position.x = (hoodW/2) - (0.35/2); 
              } else if (currentConfig.doorType === 'island') {
                   const hoodW = 0.90; const hoodD = 0.65; const bottomY = 1.65;
                   const plate = new THREE.Mesh(new THREE.BoxGeometry(hoodW, 0.035, hoodD), materials.hood);
                   plate.position.set(0, bottomY + 0.035/2, 0); plate.castShadow = true; plate.receiveShadow = true; hoodGroup.add(plate);
                   const duct = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.50, 0.32), materials.hood);
                   duct.position.set(0, bottomY + 0.035 + 0.50/2, 0); 
                   duct.castShadow = true; hoodGroup.add(duct);
                   hoodGroup.position.set(stoveZoneX, 0, accessoryZ);
              } else {
                  const hoodW = 0.90;
                  const totalH = 0.70;
                  const lowerH = 0.05;
                  const upperH = totalH - lowerH;
                  const lowerD = 0.60;
                  const upperD = 0.375;
                  const hoodBottomGap = 0.80;
                  
                  const counterY = floatH + h + revealH + topH;
                  const hoodBottomY = counterY + hoodBottomGap;
                  
                  const backZ = -0.325; 

                  const lowerMesh = new THREE.Mesh(new THREE.BoxGeometry(hoodW, lowerH, lowerD), materials.hood);
                  lowerMesh.position.set(0, hoodBottomY + lowerH/2, backZ + lowerD/2);
                  lowerMesh.castShadow = true; lowerMesh.receiveShadow = true;
                  hoodGroup.add(lowerMesh);

                  const upperMesh = new THREE.Mesh(new THREE.BoxGeometry(hoodW, upperH, upperD), materials.hood);
                  upperMesh.position.set(0, hoodBottomY + lowerH + upperH/2, backZ + upperD/2);
                  upperMesh.castShadow = true; upperMesh.receiveShadow = true;
                  hoodGroup.add(upperMesh);
                  
                  hoodGroup.position.set(stoveZoneX, 0, accessoryZ);
              }
              
              hoodGroup.position.x += stoveInternalXOffset;

              blockGroup.add(hoodGroup);
          }
          const addVerticalFiller = (x: number) => {
              if (isIslandStyle) return;
              const fillerD = bodyDepth - 0.05; 
              const fillerMesh = new THREE.Mesh(new THREE.BoxGeometry(GAP, h, fillerD), materials.rail); 
              fillerMesh.position.set(x, floatH + h/2, bodyDepth/2 - fillerD/2 + bodyZOffset - 0.02 + casingZOffset);
              blockGroup.add(fillerMesh);
          };
          if (isStoveOnly) { addVerticalFiller(startX + stoveUnitW); }
          else {
               if (hasSink) addVerticalFiller(startX + sinkUnitW);
               if (hasDishwasher) addVerticalFiller(startX + sinkUnitW + dishwasherW);
               if (middleStorageW > 0.2) addVerticalFiller(startX + sinkUnitW + (hasDishwasher ? dishwasherW : 0) + middleStorageW);
          }
          
          const kickMat = new THREE.MeshStandardMaterial({color: 0x222222});
          const addKickSegment = (x: number, w: number, customD: number | null = null, customZ: number | null = null) => {
              if (w < 0.01) return;
              const kickD = customD !== null ? customD : bodyDepth - 0.15;
              const kickZ = customZ !== null ? customZ : bodyZOffset + casingZOffset - 0.02;
              const k = new THREE.Mesh(new THREE.BoxGeometry(w - 0.002, floatH, kickD), kickMat);
              k.position.set(x, floatH/2, kickZ);
              blockGroup.add(k);
          };

          if (fullWidthKickStrip && !isSinkBaseOpen) {
             addKickSegment(startX + availableW/2, availableW);
          } else {
              if (isStoveOnly) {
                  addKickSegment(stoveZoneX, stoveUnitW);
              } else {
                  if (hasSink) {
                      if (!isSinkBaseOpen) {
                          addKickSegment(sinkZoneX, sinkUnitW);
                      }
                  }
                  if (hasDishwasher) {
                    if (isSinkBaseOpen) {
                      const kickWidth = (w - sinkUnitW) - (hasWaterfall ? panelThick: 0);
                      const kickX = sinkZoneX + sinkUnitW/2 + kickWidth/2;
                      addKickSegment(kickX, kickWidth, null, bodyZOffset + casingZOffset - 0.02);
                    } else {
                        addKickSegment(dishwasherZoneX, dishwasherW);
                    }
                  }
                  if (middleStorageW > 0.01 && !isSinkBaseOpen) {
                      addKickSegment(middleZoneX, middleStorageW);
                  }
                  if (hasStove && !isSinkBaseOpen) {
                      addKickSegment(stoveZoneX, stoveUnitW);
                  }
              }
          }

          return blockGroup;
      };

      const width = currentConfig.width || 255; const height = currentConfig.height || 85; const depth = 65; 
      const wallH = 2.4; const wallThick = 0.1;

      let effectiveIslandDepth = 90; 
      if (currentConfig.backStyle === 'counter') {
          effectiveIslandDepth = 75;
      } else {
          effectiveIslandDepth = 90;
      }
      const activeBackStyle = currentConfig.backStyle;
      
      const renderCupboard = (mainGroup: THREE.Group, mainDepth: number) => {
          if (currentConfig.cupboardType && currentConfig.cupboardType !== 'none') {
              const cb = createCupboardBlock(currentConfig.cupboardType, currentConfig.cupboardWidth, currentConfig.cupboardDepth);
              
              const aisleGap = 1.2;
              const standardCupboardDepth = 45; 
              
              const backWallZ = (mainDepth * 0.01 / 2) + aisleGap + (standardCupboardDepth * 0.01);
              
              const zPos = backWallZ - (currentConfig.cupboardDepth * 0.01 / 2);
              
              cb.position.z = zPos;
              cb.rotation.y = Math.PI; 
              
              mainGroup.add(cb);
          }
      };

      switch(currentConfig.doorType) {
          case 'type-i': {
              group.add(createCabinetBlock(width, depth, height, true, true, showHood, 'center', true, 0, true, 'none', true, 'cabinet', 'cabinet', 0, true));
              
              const wallGeo = new THREE.BoxGeometry(width * 0.01 + 0.2, wallH, 0.1);
              const wall = new THREE.Mesh(wallGeo, materials.wall);
              wall.userData.isWall = true; 
              wall.position.set(0, wallH/2, -depth*0.01/2 - 0.05 - 0.002);
              group.add(wall);
              break;
          }
          case 'peninsula': {
              group.add(createCabinetBlock(
                width, 
                effectiveIslandDepth, 
                height, 
                true, // hasSink
                true, // hasStove
                showHood, // hasHood
                'side', // hoodType
                true, // doubleSidePanel (hasRightPanel)
                0, // extraOverhang
                false, // forceBackPanel
                activeBackStyle, 
                true, // forceLeftPanel (hasWaterfall)
                'worktop', // leftPanelMaterial
                'cabinet', // rightPanelMaterial
                0, // sidePanelDepthReduction
                false, // fullWidthKickStrip
                0, // casingZOffset
                false, // hideSinkSides
                'right' // wallSide
              ));
              renderCupboard(group, effectiveIslandDepth);
              group.add(createSideWall(width, effectiveIslandDepth));
              break;
          }
          case 'island': {
              group.add(createCabinetBlock(width, effectiveIslandDepth, height, true, true, showHood, 'center', true, 0, false, activeBackStyle, true, 'worktop', 'worktop', 0, false, 0, false, 'none')); 
              renderCupboard(group, effectiveIslandDepth);
              break;
          }
          case 'type-ii':
          case 'type-ii-stove-240':
          case 'type-ii-stove-255':
          case 'type-ii-stove-270': {
              const isPeninsula = currentConfig.typeIIStyle === 'peninsula';
              const iiDepth = effectiveIslandDepth;
              const mainWidthCm = 184;
              const mainZ = -0.80;
              const main = createCabinetBlock(mainWidthCm, iiDepth, height, true, false, false, 'center', 
                true, // hasRightPanel (wall side for peninsula)
                0, false, activeBackStyle, 
                true, // hasLeftPanel (open side)
                'worktop', // leftPanelMaterial
                isPeninsula ? 'cabinet' : 'worktop', // rightPanelMaterial
                0, false, -0.02, true,
                isPeninsula ? 'right' : 'none' // wallSide
              );
              main.position.z = mainZ; 
              
              const back = createCabinetBlock(width, depth, height, false, true, showHood, 'center', true, 0, true, 'none', true, 'cabinet', 'cabinet', 0, true, 0, false, 'none');
              back.rotation.y = Math.PI; back.position.z = 0.80;
              
              const anchorX = 0.92;
              const currentWidth = width * 0.01;
              back.position.x = anchorX - currentWidth / 2;

              group.add(main); group.add(back);
              
              if (isPeninsula) {
                group.add(createSideWall(mainWidthCm, iiDepth, mainZ));
              }

              const wall2 = new THREE.Mesh(new THREE.BoxGeometry(width * 0.01 + 0.2, wallH, 0.1), materials.wall);
              wall2.userData.isWall = true; 
              wall2.position.set(back.position.x, wallH/2, 0.80 + depth*0.01/2 + 0.05 + 0.002);
              group.add(wall2);
              break;
          }
          default: break;
      }

      if (currentConfig.doorType !== 'unselected') {
        const wrapper = new THREE.Group();
        while (group.children.length > 0) {
          wrapper.add(group.children[0]);
        }

        const box = new THREE.Box3().setFromObject(wrapper);
        const center = box.getCenter(new THREE.Vector3());
        
        wrapper.position.x = -center.x;

        group.add(wrapper);
      }
      
      if (currentConfig.sinkPosition === 'right') { group.scale.x = -1; }
      return group;
  };
  
  const createModernDiningSet = () => {
       const group = new THREE.Group();
       const tableMat = baseMaterials.translucentFurniture;

       const tableW = 1.6;
       const tableD = 0.8;
       const tableH = 0.75;
       const topT = 0.04;
       const legSize = 0.03; 

       const topGeo = new THREE.BoxGeometry(tableW, topT, tableD);
       const tableTop = new THREE.Mesh(topGeo, tableMat);
       tableTop.position.y = tableH - topT / 2;
       group.add(tableTop);

       const legH = tableH - topT;
       const createFrameLeg = (x: number) => {
            const frame = new THREE.Group();
            frame.position.x = x;

            const vertGeo = new THREE.BoxGeometry(legSize, legH, legSize);
            const leftPost = new THREE.Mesh(vertGeo, baseMaterials.faucet);
            leftPost.position.set(0, legH / 2, tableD/2 - legSize/2);
            frame.add(leftPost);

            const rightPost = new THREE.Mesh(vertGeo, baseMaterials.faucet);
            rightPost.position.set(0, legH / 2, -tableD/2 + legSize/2);
            frame.add(rightPost);
            
            const horizGeo = new THREE.BoxGeometry(legSize, legSize, tableD);
            const bottomBar = new THREE.Mesh(horizGeo, baseMaterials.faucet);
            bottomBar.position.y = legSize/2;
            frame.add(bottomBar);
            
            group.add(frame);
       };
       
       createFrameLeg(tableW/2 - legSize*2);
       createFrameLeg(-tableW/2 + legSize*2);
       
       const createYChair = (position: THREE.Vector3, rotationY: number) => {
            const chairGroup = new THREE.Group();
            chairGroup.position.copy(position);
            chairGroup.rotation.y = rotationY;
        
            const woodMat = baseMaterials.chairWood;
            const seatMat = baseMaterials.chairSeat;
        
            // Dimensions (meters)
            const legRadius = 0.014; 
            const seatH = 0.425;
            const totalH = 0.730;
            const armH = 0.65; // Approximate height of armrest front
        
            // --- Back Legs (Curved) ---
            const backLegCurveLeft = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0.19, 0, -0.22),
                new THREE.Vector3(0.20, seatH * 0.5, -0.18),
                new THREE.Vector3(0.23, seatH, -0.12),
                new THREE.Vector3(0.22, 0.60, -0.16),
                new THREE.Vector3(0.20, totalH - 0.02, -0.20)
            ]);
            const backLegGeo = new THREE.TubeGeometry(backLegCurveLeft, 24, legRadius, 8, false);
            const blL = new THREE.Mesh(backLegGeo, woodMat);
            chairGroup.add(blL);
        
            const backLegCurveRight = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-0.19, 0, -0.22),
                new THREE.Vector3(-0.20, seatH * 0.5, -0.18),
                new THREE.Vector3(-0.23, seatH, -0.12),
                new THREE.Vector3(-0.22, 0.60, -0.16),
                new THREE.Vector3(-0.20, totalH - 0.02, -0.20)
            ]);
            const blR = new THREE.Mesh(new THREE.TubeGeometry(backLegCurveRight, 24, legRadius, 8, false), woodMat);
            chairGroup.add(blR);
        
            // --- Front Legs (Extended to armrest) ---
            const frontLegH = armH; // Extend to armrest height
            const flGeo = new THREE.CylinderGeometry(0.015, 0.012, frontLegH, 16);
            flGeo.translate(0, frontLegH / 2, 0); 
            const flL = new THREE.Mesh(flGeo, woodMat);
            flL.position.set(0.25, 0, 0.20);
            flL.rotation.x = -0.05; 
            flL.rotation.z = 0.05;
            chairGroup.add(flL);
        
            const flR = new THREE.Mesh(flGeo.clone(), woodMat);
            flR.position.set(-0.25, 0, 0.20);
            flR.rotation.x = -0.05;
            flR.rotation.z = -0.05;
            chairGroup.add(flR);
        
            // --- Seat Rails ---
            const railRadius = 0.012;
            
            const sideRailLeftCurve = new THREE.LineCurve3(
                new THREE.Vector3(0.25, seatH - 0.02, 0.20),
                new THREE.Vector3(0.23, seatH - 0.02, -0.12)
            );
            const srL = new THREE.Mesh(new THREE.TubeGeometry(sideRailLeftCurve, 1, railRadius, 8, false), woodMat);
            chairGroup.add(srL);
        
            const sideRailRightCurve = new THREE.LineCurve3(
                new THREE.Vector3(-0.25, seatH - 0.02, 0.20),
                new THREE.Vector3(-0.23, seatH - 0.02, -0.12)
            );
            const srR = new THREE.Mesh(new THREE.TubeGeometry(sideRailRightCurve, 1, railRadius, 8, false), woodMat);
            chairGroup.add(srR);
            
            const frCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0.25, seatH - 0.02, 0.20),
                new THREE.Vector3(0, seatH - 0.02, 0.23),
                new THREE.Vector3(-0.25, seatH - 0.02, 0.20)
            ]);
            const fr = new THREE.Mesh(new THREE.TubeGeometry(frCurve, 12, railRadius, 8, false), woodMat);
            chairGroup.add(fr);
        
            const br = new THREE.Mesh(new THREE.CylinderGeometry(railRadius, railRadius, 0.40, 8), woodMat);
            br.rotation.z = Math.PI / 2;
            br.position.set(0, seatH - 0.02, -0.12);
            chairGroup.add(br);
        
            // --- Seat ---
            const seatShape = new THREE.Shape();
            seatShape.moveTo(-0.22, -0.12);
            seatShape.lineTo(0.22, -0.12);
            seatShape.lineTo(0.24, 0.20);
            seatShape.lineTo(-0.24, 0.20);
            const seatGeo = new THREE.ExtrudeGeometry(seatShape, { depth: 0.03, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01 });
            seatGeo.rotateX(Math.PI/2);
            const seat = new THREE.Mesh(seatGeo, seatMat);
            seat.position.set(0, seatH - 0.01, 0);
            chairGroup.add(seat);
        
            // --- Top Rail (Corrected) ---
            const trCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-0.25, armH, 0.20),      // Connect to Right Front Leg
                new THREE.Vector3(-0.20, totalH - 0.02, -0.20),  // Connect to Right Back Leg
                new THREE.Vector3(0, totalH, -0.22),            // Back Center
                new THREE.Vector3(0.20, totalH - 0.02, -0.20),   // Connect to Left Back Leg
                new THREE.Vector3(0.25, armH, 0.20)       // Connect to Left Front Leg
            ]);
            const topRail = new THREE.Mesh(new THREE.TubeGeometry(trCurve, 32, 0.018, 16, false), woodMat);
            chairGroup.add(topRail);

            // --- Y Splat ---
            const yShape = new THREE.Shape();
            const yW_bot = 0.04; 
            const yW_top = 0.26;
            const yH = totalH - (seatH - 0.02) + 0.03; // Adjusted height
            
            yShape.moveTo(-yW_bot/2, 0);
            yShape.lineTo(yW_bot/2, 0);
            yShape.bezierCurveTo(yW_bot, yH*0.4, yW_top/2, yH*0.8, yW_top/2, yH);
            yShape.lineTo(yW_top/2 - 0.02, yH);
            yShape.bezierCurveTo(yW_top/4, yH*0.7, 0, yH*0.5, 0, yH*0.4);
            yShape.bezierCurveTo(0, yH*0.5, -yW_top/4, yH*0.7, -yW_top/2 + 0.02, yH);
            yShape.lineTo(-yW_top/2, yH);
            yShape.bezierCurveTo(-yW_top/2, yH*0.8, -yW_bot, yH*0.4, -yW_bot/2, 0);
        
            const yGeo = new THREE.ExtrudeGeometry(yShape, { depth: 0.015, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2 });
            const yMesh = new THREE.Mesh(yGeo, woodMat);
            
            yMesh.rotation.x = 0.28; 
            // Position adjusted to sit correctly on back rail and connect to top rail
            yMesh.position.set(0, seatH - 0.02, -0.12);
        
            chairGroup.add(yMesh);
        
            group.add(chairGroup);
       };
       
       const chairOffsetZ = tableD/2 + 0.3;
       const chairOffsetX = tableW/4;

       createYChair(new THREE.Vector3(chairOffsetX, 0, chairOffsetZ), Math.PI);
       createYChair(new THREE.Vector3(-chairOffsetX, 0, chairOffsetZ), Math.PI);
       createYChair(new THREE.Vector3(chairOffsetX, 0, -chairOffsetZ), 0);
       createYChair(new THREE.Vector3(-chairOffsetX, 0, -chairOffsetZ), 0);
       
       const lightGroup = new THREE.Group();
       lightGroup.position.y = tableH + 0.8;

       const cordGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.8, 8);
       const cord = new THREE.Mesh(cordGeo, new THREE.MeshStandardMaterial({color: 0x222222}));
       cord.position.y = 0.4;
       lightGroup.add(cord);
       
       const fixtureGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.15, 32);
       const fixture = new THREE.Mesh(fixtureGeo, baseMaterials.pendantLight);
       lightGroup.add(fixture);
       
       group.add(lightGroup);
       
       return group;
  };

  const handlePointerMove = (e: React.MouseEvent) => {
    if (!mountRef.current || !cameraRef.current || !showPartLabels) return;
    
    const now = performance.now();
    if (now - lastRaycastTimeRef.current < 50) return; // Throttle to 20fps
    lastRaycastTimeRef.current = now;

    const rect = mountRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 - 1;
    mouseRef.current.set(x, y);

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    
    // Check sprites first
    if (labelsGroupRef.current) {
        const spriteIntersects = raycasterRef.current.intersectObjects(labelsGroupRef.current.children, false);
        if (spriteIntersects.length > 0) {
            const sprite = spriteIntersects[0].object as THREE.Sprite;
            if (sprite.userData.targetPartIndex !== undefined) {
                if (hoveredPartIndex !== sprite.userData.targetPartIndex) {
                    setHoveredPartIndex(sprite.userData.targetPartIndex);
                }
                return;
            }
        }
    }

    // Check meshes
    if (groupRef.current) {
        const meshIntersects = raycasterRef.current.intersectObjects(groupRef.current.children, true);
        if (meshIntersects.length > 0) {
             for (const hit of meshIntersects) {
                 if (hit.object.userData.partIndex !== undefined) {
                     if (hoveredPartIndex !== hit.object.userData.partIndex) {
                        setHoveredPartIndex(hit.object.userData.partIndex);
                     }
                     return;
                 }
             }
        }
    }

    if (hoveredPartIndex !== null) {
        setHoveredPartIndex(null);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
      if (!showPartLabels) return;
      if (hoveredPartIndex !== null) {
          e.stopPropagation();
          setSelectedPartIndex(hoveredPartIndex);
          setIsAutoRotating(false);
      } else {
          setSelectedPartIndex(null);
      }
  };

  useEffect(() => {
      if (!mountRef.current) return; const mountNode = mountRef.current;
      if (rendererRef.current) { if (mountNode.contains(rendererRef.current.domElement)) { mountNode.removeChild(rendererRef.current.domElement); } rendererRef.current.dispose(); }
      
      const scene = new THREE.Scene(); scene.background = new THREE.Color(0xffffff); sceneRef.current = scene;
      
      const camera = new THREE.PerspectiveCamera(45, mountNode.clientWidth / mountNode.clientHeight, 0.1, 100);
      camera.position.set(2.0, 1.7, 2.8); cameraRef.current = camera;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(mountNode.clientWidth, mountNode.clientHeight); renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping; 
      renderer.toneMappingExposure = 1.0; 
      mountNode.appendChild(renderer.domElement); rendererRef.current = renderer;
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(renderer), 0.1).texture;
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true; controls.dampingFactor = 0.05;
      controls.autoRotate = true; controls.autoRotateSpeed = 0.5;
      controls.target.set(0, 0.8, 0);
      controlsRef.current = controls;
      
      const transformControls = new TransformControls(camera, renderer.domElement);
      transformControls.addEventListener('dragging-changed', (event) => {
        if (controlsRef.current) {
            controlsRef.current.enabled = !event.value;
        }
      });
      scene.add(transformControls);
      transformControlsRef.current = transformControls;

      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.2); scene.add(hemiLight);
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.2); 
      dirLight.position.set(-5, 15, -5); dirLight.castShadow = true; dirLight.shadow.bias = -0.0001;
      dirLight.shadow.mapSize.width = 2048; dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.camera.top = 10; dirLight.shadow.camera.bottom = -10; dirLight.shadow.camera.left = -10; dirLight.shadow.camera.right = 10;
      scene.add(dirLight);
      const fillLight = new THREE.DirectionalLight(0xffeedd, 0.3); fillLight.position.set(5, 8, 8); scene.add(fillLight);
      
      const createTextSprite = (text: string, color: string) => {
          const canvas = document.createElement('canvas');
          canvas.width = 64; canvas.height = 64;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.font = 'Bold 48px Arial';
              ctx.fillStyle = color;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(text, 32, 32);
          }
          const texture = new THREE.CanvasTexture(canvas);
          const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
          const sprite = new THREE.Sprite(material);
          sprite.scale.set(0.25, 0.25, 0.25);
          sprite.renderOrder = 999;
          return sprite;
      };

      const axesGroup = new THREE.Group();
      axesGroup.position.y = 0.01;
      axesGroup.renderOrder = 999;
      axesGroup.visible = false; 
      
      const axisLength = 1.125;
      const headLength = 0.15;
      const headWidth = 0.075;

      const addAxis = (dir: THREE.Vector3, color: number, label: string, hexColor: string, labelOffset: THREE.Vector3) => {
        const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), axisLength, color, headLength, headWidth);
        if (arrow.line) arrow.line.material.depthTest = false;
        if (arrow.cone) arrow.cone.material.depthTest = false;
        axesGroup.add(arrow);
        const sprite = createTextSprite(label, hexColor);
        sprite.position.copy(labelOffset);
        axesGroup.add(sprite);
      };

      addAxis(new THREE.Vector3(1, 0, 0), 0xff0000, 'X', '#ff0000', new THREE.Vector3(axisLength + 0.1, 0, 0));
      addAxis(new THREE.Vector3(-1, 0, 0), 0xff0000, '-X', '#ff0000', new THREE.Vector3(-(axisLength + 0.1), 0, 0));

      addAxis(new THREE.Vector3(0, 1, 0), 0x00ff00, 'Y', '#00ff00', new THREE.Vector3(0, axisLength + 0.1, 0));
      addAxis(new THREE.Vector3(0, -1, 0), 0x00ff00, '-Y', '#00ff00', new THREE.Vector3(0, -(axisLength + 0.1), 0));

      addAxis(new THREE.Vector3(0, 0, 1), 0x0000ff, 'Z', '#0000ff', new THREE.Vector3(0, 0, axisLength + 0.1));
      addAxis(new THREE.Vector3(0, 0, -1), 0x0000ff, '-Z', '#0000ff', new THREE.Vector3(0, 0, -(axisLength + 0.1)));
      
      scene.add(axesGroup);
      axesGroupRef.current = axesGroup; 

      const highlightMesh = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshBasicMaterial({ 
              color: 0xff0000, 
              transparent: true, 
              opacity: 0.4, 
              depthTest: false,
              depthWrite: false,
          })
      );
      highlightMesh.visible = false;
      highlightMesh.renderOrder = 9998;
      scene.add(highlightMesh);
      highlightMeshRef.current = highlightMesh;

      const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }));
      floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
      floorMeshRef.current = floor;
      
      const extrasGroup = new THREE.Group(); scene.add(extrasGroup); extrasGroupRef.current = extrasGroup;
      
      const labelsGroup = new THREE.Group();
      labelsGroup.position.y = 0;
      scene.add(labelsGroup);
      labelsGroupRef.current = labelsGroup;

      const animate = () => { animationRef.current = requestAnimationFrame(animate); if (controlsRef.current) controlsRef.current.update(); renderer.render(scene, camera); };
      animate();
      const resizeObserver = new ResizeObserver(() => {
          if (mountNode && camera && renderer) {
              const width = mountNode.clientWidth; const height = mountNode.clientHeight;
              if (width > 0 && height > 0) {
                  const isMobile = width < 1024;
                  if (isMobile) {
                      controls.enableZoom = true;
                      controls.enablePan = true;
                      controls.minPolarAngle = 0; 
                      controls.maxPolarAngle = Math.PI;
                      controls.rotateSpeed = 0.5; // Lower sensitivity for touch
                      camera.position.set(1.5, 1.4, 2.8);
                      controls.target.set(0, 0.8, 0);
                  } else {
                      controls.enableZoom = true; 
                      controls.enablePan = false; 
                      controls.minPolarAngle = 0;
                      controls.maxPolarAngle = Math.PI;
                      controls.rotateSpeed = 1.0; // Default sensitivity for mouse
                  }
                  camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height);
              }
          }
      });
      resizeObserver.observe(mountNode);
      
      const fullDispose = (group: THREE.Group | null) => {
          if (!group) return;
          group.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                  child.geometry?.dispose();
                  if (Array.isArray(child.material)) {
                      child.material.forEach(m => {
                          if (m instanceof THREE.SpriteMaterial && m.map && m.map.image instanceof HTMLCanvasElement) {
                              m.map.dispose();
                          }
                          m.dispose();
                      });
                  } else if (child.material) {
                      if (child.material instanceof THREE.SpriteMaterial && child.material.map && child.material.map.image instanceof HTMLCanvasElement) {
                          child.material.map.dispose();
                      }
                      child.material.dispose();
                  }
              } else if (child instanceof THREE.Sprite) {
                  child.geometry?.dispose();
                  child.material?.map?.dispose();
                  child.material?.dispose();
              }
          });
          sceneRef.current?.remove(group);
      };

      return () => {
          resizeObserver.disconnect(); 
          cancelAnimationFrame(animationRef.current);
          if (controlsRef.current) controlsRef.current.dispose();
          if (transformControlsRef.current) {
            transformControlsRef.current.dispose();
          }
          
          fullDispose(groupRef.current);
          fullDispose(prevGroupRef.current);
          fullDispose(extrasGroupRef.current);
          fullDispose(labelsGroupRef.current);
          fullDispose(axesGroupRef.current);
          fullDispose(importedModelRef.current);

          sceneRef.current?.traverse(child => {
              if (child instanceof THREE.Light) {
                  sceneRef.current?.remove(child);
              }
          });

          if (sceneRef.current) {
              sceneRef.current.environment?.dispose();
          }

          if (rendererRef.current) {
              if (mountNode.contains(rendererRef.current.domElement)) {
                  mountNode.removeChild(rendererRef.current.domElement);
              }
              rendererRef.current.dispose();
          }
      };
  }, []);
  
  useEffect(() => {
    const transformControls = transformControlsRef.current;
    const model = importedModelRef.current;
    if (transformControls && showTransformControls && model) {
      transformControls.attach(model);
      transformControls.setMode(transformMode);
    } else if (transformControls) {
      transformControls.detach();
    }
  }, [showTransformControls, transformMode]);

  useEffect(() => {
    const model = importedModelRef.current;
    const originalColors = originalModelColorsRef.current;
    if (!model || !originalColors) return;

    model.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            const originalColor = originalColors.get(child);
            if (originalColor) {
                child.material.color.copy(originalColor).multiplyScalar(modelBrightness);
            }
        }
    });
  }, [modelBrightness]);


  useEffect(() => {
      if (!extrasGroupRef.current) return;
      const group = extrasGroupRef.current; group.clear();
      if (sceneOption === 'dining2') {
          const dining = createModernDiningSet();
          dining.position.set(0, 0.001, -2.2); 
          dining.rotation.y = Math.PI / 2; 
          group.add(dining);
      }
  }, [sceneOption, baseMaterials]);

  useEffect(() => {
    if (!highlightMeshRef.current || !groupRef.current) return;
    
    const targetIndex = selectedPartIndex !== null ? selectedPartIndex : hoveredPartIndex;

    if (targetIndex === null) {
        highlightMeshRef.current.visible = false;
        return;
    }

    let targetMesh: THREE.Mesh | null = null;
    groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.partIndex === targetIndex) {
            targetMesh = child;
        }
    });

    if (targetMesh) {
        const mesh = targetMesh as THREE.Mesh;
        if (highlightMeshRef.current.geometry !== mesh.geometry) {
            highlightMeshRef.current.geometry.dispose();
            highlightMeshRef.current.geometry = mesh.geometry.clone();
        }
        
        mesh.updateMatrixWorld();
        highlightMeshRef.current.matrix.copy(mesh.matrixWorld);
        highlightMeshRef.current.matrixAutoUpdate = false;
        
        highlightMeshRef.current.visible = true;
        
        const mat = highlightMeshRef.current.material as THREE.MeshBasicMaterial;
        if (selectedPartIndex !== null) {
            mat.color.set(0x00ff00); 
            mat.opacity = 0.5;
        } else {
            mat.color.set(0xff0000); 
            mat.opacity = 0.3;
        }
    } else {
        highlightMeshRef.current.visible = false;
    }

  }, [hoveredPartIndex, selectedPartIndex, config]); 


  useEffect(() => {
      if (!groupRef.current) return;
      
      groupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.userData.partIndex !== undefined) {
              const overrideId = partOverrides[child.userData.partIndex];
              if (overrideId) {
                   const cOption = colors.find(c => c.id === overrideId);
                   if (cOption) {
                        const newMat = baseMaterials.cabinet.clone();
                        const texture = cOption.textureUrl ? loadTexture(cOption.textureUrl) : null;
                        if (texture) {
                            newMat.map = texture;
                            newMat.color.set(0xffffff);
                        } else {
                            newMat.map = null;
                            newMat.color.set(cOption.hex);
                        }
                        if (cOption.category === 'wood') { newMat.roughness = 0.7; newMat.metalness = 0.0; }
                        else if (cOption.category === 'stone') { newMat.roughness = 0.5; newMat.metalness = 0.1; }
                        else if (cOption.category === 'metal') { newMat.roughness = 0.2; newMat.metalness = 0.8; }
                        else { newMat.roughness = 0.4; newMat.metalness = 0.1; }

                        child.material = newMat;
                   }
              }
          }
      });
  }, [partOverrides, config, colors, baseMaterials]); 

  // Optimize label updates - only update visual state of sprites, don't recreate them unless needed
  useEffect(() => {
    if (axesGroupRef.current) {
        axesGroupRef.current.visible = showPartLabels;
    }

    if (!labelsGroupRef.current || !groupRef.current) return;
    const labelsGroup = labelsGroupRef.current;

    const now = performance.now();
    // Only full label rebuild on config change or enable
    // Check if we already have labels
    const hasLabels = labelsGroup.children.length > 0;
    
    // Only highlight update needed if labels exist and just hover changed
    if (hasLabels && showPartLabels) {
        if (now - lastHoverUpdateRef.current > 50) {
            labelsGroup.children.forEach((child) => {
                if (child instanceof THREE.Sprite) {
                    const isHovered = hoveredPartIndex === child.userData.targetPartIndex;
                    const isSelected = selectedPartIndex === child.userData.targetPartIndex;
                    
                    if (isHovered || isSelected) {
                        child.scale.set(0.25, 0.25, 0.25);
                        child.material.color.set(isSelected ? 0x00ff00 : 0xff0000);
                    } else {
                        child.scale.set(0.15, 0.15, 0.15);
                        child.material.color.set(0xffffff);
                    }
                }
            });
            lastHoverUpdateRef.current = now;
        }
        return;
    }

    // Full Rebuild logic (should happen rarely, e.g. on config change)
    labelsGroup.clear();

    if (!showPartLabels) return;

    let counter = 1;
    
    const createLabel = (text: string, position: THREE.Vector3, partIndex: number) => {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.beginPath();
            ctx.arc(32, 32, 30, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(32, 32, 30, 0, Math.PI * 2);
            ctx.stroke();

            ctx.font = 'bold 32px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 32, 32);
        }
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false });
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.scale.set(0.15, 0.15, 0.15);
        sprite.renderOrder = 9999;
        sprite.userData.targetPartIndex = partIndex;
        return sprite;
    };

    groupRef.current.updateMatrixWorld(true);

    groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.userData.partIndex = counter;
            
            // Logic to hide specific parts if needed (e.g. stove side filler in type-ii)
            if ((isTypeII(config.doorType)) && counter === 27) {
                child.visible = false;
            } else {
                child.visible = true;
            }

            if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
            const center = new THREE.Vector3();
            child.geometry.boundingBox?.getCenter(center);
            center.applyMatrix4(child.matrixWorld);
            
            const label = createLabel(counter.toString(), center, counter);
            labelsGroup.add(label);
            
            counter++;
        }
    });
  }, [showPartLabels, config, hoveredPartIndex, selectedPartIndex]);

  useEffect(() => {
    if (controlsRef.current) { controlsRef.current.autoRotate = isAutoRotating; }
  }, [isAutoRotating]);

  useEffect(() => {
      if (!sceneRef.current) return;
      setIsLoading(true);
      const scene = sceneRef.current;
      
      const disposeGroup = (g: THREE.Group) => {
          g.traverse((child) => {
             if (child instanceof THREE.Mesh) {
                 if (child.geometry) child.geometry.dispose();
                 if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach((m: THREE.Material) => { 
                            if (m instanceof THREE.SpriteMaterial) {
                                m.map?.dispose();
                            }
                            m.dispose(); 
                        });
                    } else {
                        if (child.material instanceof THREE.SpriteMaterial) {
                             child.material.map?.dispose();
                        }
                        child.material.dispose();
                    }
                 }
             }
          });
          scene.remove(g);
      };

      if (prevGroupRef.current) {
          disposeGroup(prevGroupRef.current);
          prevGroupRef.current = null;
      }
      
      if (transitionFrameRef.current) {
          cancelAnimationFrame(transitionFrameRef.current);
          transitionFrameRef.current = 0;
      }
      
      const doorTypeChanged = prevConfigRef.current ? prevConfigRef.current.doorType !== config.doorType : false;
      const widthChanged = prevConfigRef.current ? prevConfigRef.current.width !== config.width : false;
      const heightChanged = prevConfigRef.current ? prevConfigRef.current.height !== config.height : false;
      const backStyleChanged = prevConfigRef.current ? prevConfigRef.current.backStyle !== config.backStyle : false;
      const sinkBaseTypeChanged = prevConfigRef.current ? prevConfigRef.current.sinkBaseType !== config.sinkBaseType : false;
      const typeIIStyleChanged = prevConfigRef.current ? prevConfigRef.current.typeIIStyle !== config.typeIIStyle : false;
      const cupboardChanged = prevConfigRef.current ? (prevConfigRef.current.cupboardType !== config.cupboardType || prevConfigRef.current.cupboardWidth !== config.cupboardWidth || prevConfigRef.current.cupboardDepth !== config.cupboardDepth) : false;
      const cupboardLayoutChanged = prevConfigRef.current ? prevConfigRef.current.cupboardLayout !== config.cupboardLayout : false;
      const isStructuralChange = doorTypeChanged || widthChanged || heightChanged || backStyleChanged || sinkBaseTypeChanged || typeIIStyleChanged || cupboardChanged || cupboardLayoutChanged;
      const isInitialSelection = prevConfigRef.current?.doorType === 'unselected' && config.doorType !== 'unselected';

      prevConfigRef.current = config;
      
      const onRenderComplete = (group: THREE.Group) => {
          finalizeMaterials(group);

          // Calculate bounding box and set new orbit target
          if (controlsRef.current) {
              const box = new THREE.Box3().setFromObject(group);
              const center = box.getCenter(new THREE.Vector3());
              const size = box.getSize(new THREE.Vector3());
              // Set pivot to the center of the model's floor plane, with Y at half height for better UX
              controlsRef.current.target.set(center.x, size.y / 2, center.z);
              controlsRef.current.update();
          }

          // Hide loader after a short delay
          setTimeout(() => setIsLoading(false), 300);
      };

      const animateFade = (group: THREE.Group, startOpacity: number, endOpacity: number, onComplete: () => void) => {
          let opacity = startOpacity;
          const increment = 0.011; 
          const direction = endOpacity > startOpacity ? 1 : -1;

          group.traverse((child) => {
              if (child instanceof THREE.Mesh && child.material !== baseMaterials.glass && !child.userData.isWall) {
                  const setupMat = (mat: THREE.Material) => { mat.transparent = true; mat.depthWrite = false; };
                  if (Array.isArray(child.material)) { child.material.forEach(setupMat); } 
                  else if (child.material) { setupMat(child.material); }
              }
          });

          const animationLoop = () => {
              opacity += increment * direction;
              const isFinished = direction === 1 ? opacity >= endOpacity : opacity <= endOpacity;
              if (isFinished) opacity = endOpacity;

              group.traverse((child) => {
                  if (child instanceof THREE.Mesh && child.material !== baseMaterials.glass && !child.userData.isWall) {
                      const setOp = (m: THREE.Material) => { m.opacity = opacity; };
                      if (Array.isArray(child.material)) { child.material.forEach(setOp); } 
                      else if (child.material) { setOp(child.material); }
                  }
              });

              if (isFinished) {
                  transitionFrameRef.current = 0;
                  onComplete();
              } else {
                  transitionFrameRef.current = requestAnimationFrame(animationLoop);
              }
          };
          transitionFrameRef.current = requestAnimationFrame(animationLoop);
      };
      
      const finalizeMaterials = (group: THREE.Group) => {
          const baseScaleX = config.sinkPosition === 'right' ? -1 : 1;
          group.scale.set(baseScaleX, 1, 1);
          group.traverse((child) => {
              if (child instanceof THREE.Mesh && child.material !== baseMaterials.glass && !child.userData.isWall) {
                  const finalMat = (m: THREE.Material) => { m.transparent = false; m.opacity = 1; m.depthWrite = true; m.needsUpdate = true; };
                  if (Array.isArray(child.material)) { child.material.forEach(finalMat); } 
                  else if (child.material) { finalMat(child.material); }
              }
          });
      };
      
      if (config.doorType === 'unselected') {
          if (groupRef.current) { disposeGroup(groupRef.current); groupRef.current = null; }
          setIsLoading(false);
          return; 
      }

      if (isStructuralChange) {
          const oldGroup = groupRef.current;
          groupRef.current = null;
          if (oldGroup) { disposeGroup(oldGroup); }
          
          const newGroup = createKitchenGroup(config);
          scene.add(newGroup);
          groupRef.current = newGroup;
          
          if (isInitialSelection) {
            animateFade(newGroup, 0.0, 1.0, () => onRenderComplete(newGroup));
          } else {
            onRenderComplete(newGroup);
          }
          
      } else { 
          const newGroup = createKitchenGroup(config);
          const baseScaleX = config.sinkPosition === 'right' ? -1 : 1;
          newGroup.scale.set(baseScaleX * 1.0005, 1.0005, 1.0005);
          scene.add(newGroup);
          
          const oldGroup = groupRef.current;
          prevGroupRef.current = oldGroup; 
          groupRef.current = newGroup;
          
          animateFade(newGroup, 0.0, 1.0, () => {
              onRenderComplete(newGroup);
              if (prevGroupRef.current) { 
                  disposeGroup(prevGroupRef.current);
                  prevGroupRef.current = null;
              }
          });
      }
  }, [visualConfigStr, colors, baseMaterials, customModelUrl, modelLibrary]);

  const showControls = config.doorType !== 'unselected';
  
  return (
    <div 
        className="relative w-full h-full bg-gray-200 cursor-move" 
        ref={mountRef}
        onMouseMove={handlePointerMove}
        onClick={handleClick}
    >
      {isLoading && <LoadingIndicator />}
      {showControls && (
        <>
          <div className="hidden lg:block absolute top-4 left-4 text-black text-xs p-4 rounded-lg bg-white/70 backdrop-blur-sm shadow-md w-64 pointer-events-none z-10">
              <div className="font-bold text-sm mb-2 border-b border-gray-400/50 pb-1">{getOptionName(doorTypes, config.doorType)}</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="font-semibold text-gray-600">サイズ:</span>
                <span className="text-right">W{config.width} / H{config.height}</span>
                <span className="font-semibold text-gray-600">カウンター:</span>
                <span className="text-right truncate">{colors.find(c=>c.id === config.counterColor)?.name}</span>
                <span className="font-semibold text-gray-600">扉カラー:</span>
                <span className="text-right truncate">{colors.find(c=>c.id === config.color)?.name}</span>
                <span className="font-semibold text-gray-600">シンク位置:</span>
                <span className="text-right">{config.sinkPosition === 'left' ? '左' : '右'}</span>
              </div>
          </div>
          <div className="absolute bottom-4 left-4 flex-col gap-2 z-10 flex" onClick={e => e.stopPropagation()}>
              <div className="hidden lg:flex flex-col gap-2 mb-2">
                <span className="text-[10px] font-bold text-gray-500 bg-white/50 px-2 rounded w-fit">ADD SCENE</span>
                <button onClick={(e) => { e.stopPropagation(); setSceneOption(prev => prev === 'dining2' ? 'none' : 'dining2'); }}
                      className={`px-2 py-1 text-xs rounded shadow-sm transition-all ${sceneOption === 'dining2' ? 'bg-blue-600 text-white' : 'bg-white/80 text-gray-700 hover:bg-white'}`} >
                    Dining Set
                  </button>
              </div>
              <span className="text-[10px] font-bold text-gray-500 bg-white/50 px-2 rounded w-fit self-start">Scene</span>
              <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setFloorOption('oak'); }} className="w-6 h-6 lg:w-8 lg:h-8 rounded overflow-hidden border border-gray-300 shadow-sm hover:scale-105 transition-transform bg-cover" style={{backgroundImage: 'url(http://25663cc9bda9549d.main.jp/aistudio/linekitchen/floortexture/oakfloor.jpg)', filter: 'brightness(0.7)'}} title="Oak Floor"></button>
                  <button onClick={(e) => { e.stopPropagation(); setFloorOption('tile'); }} className="w-6 h-6 lg:w-8 lg:h-8 rounded overflow-hidden border border-gray-300 shadow-sm hover:scale-105 transition-transform bg-cover" style={{backgroundImage: 'url(http://25663cc9bda9549d.main.jp/aistudio/linekitchen/floortexture/tile.jpg)'}} title="Tile"></button>
                  <button onClick={(e) => { e.stopPropagation(); setFloorOption('stone'); }} className="w-6 h-6 lg:w-8 lg:h-8 rounded overflow-hidden border border-gray-300 shadow-sm hover:scale-105 transition-transform bg-cover" style={{backgroundImage: 'url(http://25663cc9bda9549d.main.jp/aistudio/linekitchen/floortexture/stone.jpg)'}} title="Stone"></button>
                  <button onClick={(e) => { e.stopPropagation(); setFloorOption('herringbone'); }} className="w-6 h-6 lg:w-8 lg:h-8 rounded overflow-hidden border border-gray-300 shadow-sm hover:scale-105 transition-transform bg-cover" style={{backgroundImage: 'url(http://25663cc9bda9549d.main.jp/aistudio/linekitchen/floortexture/herinborn.jpg)', filter: 'brightness(0.7)'}} title="Herringbone"></button>
                  <button onClick={(e) => { e.stopPropagation(); setFloorOption('tile-black'); }} className="w-6 h-6 lg:w-8 lg:h-8 rounded overflow-hidden border border-gray-300 shadow-sm hover:scale-105 transition-transform bg-cover" style={{backgroundImage: 'url(http://25663cc9bda9549d.main.jp/aistudio/linekitchen/floortexture/tileblack.jpg)'}} title="Black Tile"></button>
              </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DoorPreview;
