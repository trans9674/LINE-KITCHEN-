
import React, { useEffect, useRef, useMemo, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ColorOption, DoorConfiguration, DoorOption, DoorTypeId, ColorId, BackStyleId, CupboardTypeId, CupboardStorageTypeId } from '../types';
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

export interface DoorPreviewHandle {
  getScreenshot: () => string | null;
  rotateCameraToCounter: () => void;
  resetCamera: () => void;
}

const DoorPreview = forwardRef<DoorPreviewHandle, DoorPreviewProps>(({ config, colors, doorTypes, customModelUrl, modelLibrary }, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  
  const groupRef = useRef<THREE.Group | null>(null);
  const floorMeshRef = useRef<THREE.Mesh | null>(null);
  
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [floorOption, setFloorOption] = useState<'none' | 'oak' | 'tile' | 'stone' | 'herringbone' | 'tile-black'>('oak');

  const INITIAL_CAMERA_POSITION = useMemo(() => new THREE.Vector3(2.5, 2.0, 3.5), []);
  const COUNTER_CAMERA_POSITION = useMemo(() => new THREE.Vector3(2.5, 2.0, -3.5), []);
  const animationFrameId = useRef<number | null>(null);

  const animateCameraTo = (targetPosition: THREE.Vector3) => {
      if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
      }

      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!camera || !controls) return;

      const startPosition = camera.position.clone();
      const duration = 3000; // 3 second animation
      let startTime = 0;

      const animate = (time: number) => {
          if (startTime === 0) startTime = time;
          const elapsedTime = time - startTime;
          const progress = Math.min(elapsedTime / duration, 1);
          
          const easeProgress = 1 - Math.pow(1 - progress, 4); // Ease-out quart

          camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
          controls.update();

          if (progress < 1) {
              animationFrameId.current = requestAnimationFrame(animate);
          } else {
              animationFrameId.current = null;
          }
      };

      animationFrameId.current = requestAnimationFrame(animate);
  };


  useImperativeHandle(ref, () => ({
    getScreenshot: () => {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        return rendererRef.current.domElement.toDataURL('image/png');
      }
      return null;
    },
    rotateCameraToCounter: () => {
        animateCameraTo(COUNTER_CAMERA_POSITION);
    },
    resetCamera: () => {
        animateCameraTo(INITIAL_CAMERA_POSITION);
    }
  }));

  const getOptionName = <T extends string>(options: DoorOption<T>[], id: T): string => {
    const found = options.find(o => o.id === id);
    return found ? found.name : '不明';
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
          blackWorktop: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.1, side: THREE.DoubleSide }),
      };
      
      const rangeHoodId = currentConfig.rangeHood;
      const isSilver = rangeHoodId.endsWith('-si') || rangeHoodId.endsWith('s5680') || rangeHoodId.endsWith('901vsi') || rangeHoodId.endsWith('s4');
      const isBlack = rangeHoodId.endsWith('-bk') || rangeHoodId.endsWith('tb');
      const isWhite = rangeHoodId.endsWith('-w') || rangeHoodId.endsWith('tw');

      if (isSilver) {
          materials.hood.color.set(0xcccccc); // Silver
          materials.hood.metalness = 0.8;
          materials.hood.roughness = 0.2;
      } else if (isBlack) {
          materials.hood.color.set(0x222222); // Black
          materials.hood.metalness = 0.4;
          materials.hood.roughness = 0.5;
      } else if (isWhite) {
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
          const mesh = new THREE.Mesh(geo, material);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          return mesh;
      };

      const createCupboardBlock = (type: CupboardTypeId, widthCm: number, depthCm: number) => {
          const group = new THREE.Group();
          if (type === 'none') return group;

          const w = widthCm * 0.01;
          const d = 45 * 0.01; // Always 45cm for all parts of mix type
          const baseH = currentConfig.height * 0.01;
          const tallH = 2.05; 
          const topT = 0.02;
          const doorThick = 0.02;
          
          const createUnit = (
            uw: number, 
            uh: number, 
            ud: number, 
            y: number, 
            unitType: 'base' | 'wall' | 'tall', 
            innerSide: 'left' | 'right' | 'none' = 'none',
            specialMixMode: 'left' | 'right' | 'none' = 'none'
          ) => {
             const uGroup = new THREE.Group();
             uGroup.position.set(0, y, 0);
             const kickMat = new THREE.MeshStandardMaterial({color: 0x111111});

             const panelThick = 0.02;
             const useBlackInnerPanel = type === 'tall';

             const leftPanelMaterial = (innerSide === 'left' && useBlackInnerPanel) ? materials.blackWorktop : materials.cabinet;
             const leftPanel = createCabinetMesh(panelThick, uh, ud, leftPanelMaterial);
             leftPanel.position.set(-uw/2 + panelThick/2, 0, 0);
             leftPanel.receiveShadow = true; uGroup.add(leftPanel);
             
             const rightPanelMaterial = (innerSide === 'right' && useBlackInnerPanel) ? materials.blackWorktop : materials.cabinet;
             const rightPanel = createCabinetMesh(panelThick, uh, ud, rightPanelMaterial);
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
                
                let topDrawerH = remainingH * 0.3;
                let botDrawerH = remainingH * 0.7;
                
                if (type === 'mix') {
                    const reduction = 0.05;
                    topDrawerH -= reduction;
                    botDrawerH += reduction;
                }
                
                const numModules = Math.max(1, Math.round(innerW / 0.8));
                const moduleW = innerW / numModules;

                // Handle Kick Panel based on special mode
                let kickW = innerW;
                let kickX = 0;
                const isSpecial = specialMixMode !== 'none';
                
                if (isSpecial && numModules > 1) {
                    const openModuleWidth = moduleW;
                    kickW = innerW - openModuleWidth;
                    if (specialMixMode === 'left') {
                        kickX = startX + openModuleWidth + kickW / 2;
                    } else { // 'right'
                        kickX = startX + kickW / 2;
                    }
                }
                
                if (kickW > 0.01) {
                    const kickD = ud - 0.05;
                    const kickMesh = new THREE.Mesh(new THREE.BoxGeometry(kickW, toeKickH, kickD), kickMat);
                    let kickZ = -0.025;
                    if (type === 'tall' || type === 'mix') {
                        kickZ += 0.01;
                    }
                    kickMesh.position.set(kickX, bottomY + toeKickH/2, kickZ);
                    uGroup.add(kickMesh);

                    const frontPanelThick = 0.003;
                    const frontPanel = createCabinetMesh(kickW, toeKickH, frontPanelThick, kickMat);
                    const frontPanelZ = ud/2 - frontPanelThick/2;
                    frontPanel.position.set(kickX, bottomY + toeKickH/2, frontPanelZ);
                    uGroup.add(frontPanel);
                }
                
                // Handle Modules
                for(let m=0; m<numModules; m++) {
                    const modX = startX + moduleW/2 + (moduleW * m);
                    const gapX = 0.007; 
                    const dW = moduleW - gapX;
                    
                    const isOpenModule = isSpecial && (
                        (specialMixMode === 'left' && m === 0) ||
                        (specialMixMode === 'right' && m === numModules - 1)
                    );

                    let currentY = bottomY + toeKickH;
                    const railD = ud - 0.02;

                    // Top drawer and its rails are always present
                    const topPanelY = currentY + botDrawerH + midRailH;
                    const topPanel = createCabinetMesh(dW, topDrawerH, doorThick, materials.cabinet);
                    topPanel.position.set(modX, topPanelY + topDrawerH/2, ud/2 - doorThick/2);
                    topPanel.castShadow = true; topPanel.receiveShadow = true;
                    uGroup.add(topPanel);

                    const mRailY = currentY + botDrawerH;
                    const mRail = new THREE.Mesh(new THREE.BoxGeometry(dW, midRailH, railD), materials.rail);
                    mRail.position.set(modX, mRailY + midRailH/2, 0);
                    uGroup.add(mRail);
                    
                    const tRailY = currentY + botDrawerH + midRailH + topDrawerH;
                    const tRail = new THREE.Mesh(new THREE.BoxGeometry(dW, topRailH, railD), materials.rail);
                    tRail.position.set(modX, tRailY + topRailH/2, 0);
                    uGroup.add(tRail);
                    
                    // Bottom drawer only for non-open modules
                    if (!isOpenModule) {
                        const botPanel = createCabinetMesh(dW, botDrawerH, doorThick, materials.cabinet);
                        botPanel.position.set(modX, currentY + botDrawerH/2, ud/2 - doorThick/2);
                        botPanel.castShadow = true; botPanel.receiveShadow = true;
                        uGroup.add(botPanel);
                    }
                }

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
                 
                 const kickD = ud - 0.05;
                 const kickMesh = new THREE.Mesh(new THREE.BoxGeometry(innerW, toeKickH, kickD), kickMat);
                 let kickZ = -0.025;
                 if (type === 'tall' || type === 'mix') {
                     kickZ += 0.01;
                 }
                 kickMesh.position.set(0, bottomY + toeKickH/2, kickZ);
                 uGroup.add(kickMesh);

                 const frontPanelThick = 0.003;
                 const frontPanel = createCabinetMesh(innerW, toeKickH, frontPanelThick, kickMat);
                 const frontPanelZ = ud/2 - frontPanelThick/2;
                 frontPanel.position.set(0, bottomY + toeKickH/2, frontPanelZ);
                 frontPanel.castShadow = true;
                 frontPanel.receiveShadow = true;
                 uGroup.add(frontPanel);
                 
                 const currentY = bottomY + toeKickH;

                 if (type === 'mix') {
                    // Calculate drawer heights from base unit to ensure alignment
                    const baseUnitH = baseH - topT;
                    const baseWorkingH = baseUnitH - toeKickH;
                    const baseTopRailH = 0.02;
                    const baseMidRailH = 0.02;
                    const baseRemainingH = baseWorkingH - baseTopRailH - baseMidRailH;
                    const reduction = 0.05;
                    const topDrawerH = (baseRemainingH * 0.3) - reduction;
                    const botDrawerH = (baseRemainingH * 0.7) + reduction;

                    // Create bottom panel
                    const botPanel = createCabinetMesh(innerW, botDrawerH, doorThick, materials.cabinet);
                    botPanel.position.set(0, currentY + botDrawerH / 2, ud / 2 - doorThick / 2);
                    botPanel.castShadow = true; botPanel.receiveShadow = true;
                    uGroup.add(botPanel);

                    // Create middle channel
                    const midChannelY = currentY + botDrawerH;
                    const midChannel = new THREE.Mesh(new THREE.BoxGeometry(innerW, channelH, ud - 0.02), materials.rail);
                    midChannel.position.set(0, midChannelY + channelH / 2, 0);
                    uGroup.add(midChannel);

                    // Create top panel
                    const topPanelY = midChannelY + channelH;
                    const topPanel = createCabinetMesh(innerW, topDrawerH, doorThick, materials.cabinet);
                    topPanel.position.set(0, topPanelY + topDrawerH / 2, ud / 2 - doorThick / 2);
                    topPanel.castShadow = true; topPanel.receiveShadow = true;
                    uGroup.add(topPanel);

                    // Create top channel
                    const topChannelY = topPanelY + topDrawerH;
                    const topChannel = new THREE.Mesh(new THREE.BoxGeometry(innerW, channelH, ud - 0.02), materials.rail);
                    topChannel.position.set(0, topChannelY + channelH / 2, 0);
                    uGroup.add(topChannel);

                    // Create upper doors in remaining space
                    const upperDoorStartY = topChannelY + channelH;
                    const upperDoorH = (uh / 2) - upperDoorStartY; // Top of unit to start of doors
                    
                    const numModulesUpper = Math.max(1, Math.round(innerW / 0.6));
                    const moduleWUpper = innerW / numModulesUpper;
                    for (let m = 0; m < numModulesUpper; m++) {
                        const modX = startX + moduleWUpper / 2 + (moduleWUpper * m);
                        const gapX = 0.007;
                        const dW = moduleWUpper - gapX;
                        const udMesh = createCabinetMesh(dW, upperDoorH, doorThick, materials.cabinet);
                        udMesh.position.set(modX, upperDoorStartY + upperDoorH / 2, ud / 2 - doorThick / 2);
                        udMesh.castShadow = true; udMesh.receiveShadow = true;
                        uGroup.add(udMesh);
                    }

                 } else { // Standard tall unit logic
                    const lowerDoorH = (baseH - 0.02) - toeKickH - channelH;
                    const ld = createCabinetMesh(innerW, lowerDoorH, doorThick, materials.cabinet);
                    ld.position.set(0, currentY + lowerDoorH/2, ud/2 - doorThick/2);
                    ld.castShadow = true; ld.receiveShadow = true;
                    uGroup.add(ld);
                    
                    const chY = currentY + lowerDoorH;
                    const ch = new THREE.Mesh(new THREE.BoxGeometry(innerW, channelH, ud - 0.02), materials.rail);
                    ch.position.set(0, chY + channelH/2, 0);
                    uGroup.add(ch);

                    const upperDoorH = (uh - toeKickH) - lowerDoorH - channelH;
                    const numModulesUpper = Math.max(1, Math.round(innerW / 0.6));
                    const moduleWUpper = innerW / numModulesUpper;

                    for(let m=0; m<numModulesUpper; m++) {
                        const modX = startX + moduleWUpper/2 + (moduleWUpper * m);
                        const gapX = 0.007;
                        const dW = moduleWUpper - gapX;
                        
                        const udY = currentY + lowerDoorH + channelH;
                        const udMesh = createCabinetMesh(dW, upperDoorH, doorThick, materials.cabinet);
                        udMesh.position.set(modX, udY + upperDoorH/2, ud/2 - doorThick/2);
                        udMesh.castShadow = true; udMesh.receiveShadow = true;
                        uGroup.add(udMesh);
                    }
                 }
                 
                 const body = createCabinetMesh(innerW, uh, ud - doorThick, materials.cabinet);
                 body.position.set(0, 0, -doorThick/2);
                 body.receiveShadow = true;
                 uGroup.add(body);
             }
             
             return uGroup;
          };

          if (type === 'floor') {
              const unitH = baseH - topT;
              const unit = createUnit(w, unitH, d, (unitH)/2, 'base', 'none', 'none');
              group.add(unit);
              const top = createUVMappedBox(w, topT, d, materials.worktop);
              top.position.y = unitH + topT/2;
              group.add(top);

          } else if (type === 'separate') {
              const unitH = baseH - topT;
              const base = createUnit(w, unitH, d, (unitH)/2, 'base', 'none', 'none');
              group.add(base);
              const top = createUVMappedBox(w, topT, d, materials.worktop);
              top.position.y = unitH + topT/2;
              group.add(top);
              
              const upperH = 0.7;
              const upperY = tallH - upperH/2;
              const upperD = 0.35;
              group.add(createUnit(w, upperH, upperD, upperY, 'wall', 'none', 'none'));

          } else if (type === 'tall') {
              let unitW_m = 0;

              if (widthCm === 169 || widthCm === 184) {
                  unitW_m = (94 / 2) * 0.01;
              } else if (widthCm === 244 || widthCm === 259 || widthCm === 274) {
                  const counterW_m = 0.90;
                  unitW_m = (w - counterW_m) / 2;
              }

              if (unitW_m > 0) {
                  const leftUnit = createUnit(unitW_m, tallH, d, tallH/2, 'tall', 'right', 'none');
                  leftUnit.position.x = -w / 2 + unitW_m / 2;
                  group.add(leftUnit);
                  
                  const rightUnit = createUnit(unitW_m, tallH, d, tallH/2, 'tall', 'left', 'none');
                  rightUnit.position.x = w / 2 - unitW_m / 2;
                  group.add(rightUnit);

                  // Add counter/shelves and back panel in the middle
                  const counterW = w - (2 * unitW_m);
                  if (counterW > 0.01) {
                      // Add back panel
                      const backPanelThick = 0.02;
                      const backPanel = createCabinetMesh(counterW, tallH, backPanelThick, materials.blackWorktop);
                      backPanel.position.set(0, tallH / 2, -d / 2 + backPanelThick / 2);
                      backPanel.receiveShadow = true;
                      group.add(backPanel);
                      
                      // Add shelves
                      const shelfHeights = [80, 115, 165]; // Top shelf removed
                      const defaultShelfThickness = 0.03; 
                      
                      shelfHeights.forEach(heightCm => {
                          const shelfH_m = heightCm * 0.01;
                          const shelfThickness = (heightCm === 80) ? 0.07 : defaultShelfThickness; // Bottom shelf thicker
                          
                          if (shelfH_m <= tallH) { 
                              if (heightCm === 80) {
                                  const panelThick = 0.003;
                                  const shelfDepth = d - panelThick;
                                  const shelf = createUVMappedBox(counterW - 0.004, shelfThickness, shelfDepth, materials.blackWorktop);
                                  shelf.position.y = shelfH_m - shelfThickness / 2;
                                  shelf.position.z = -panelThick / 2; // Move shelf back
                                  group.add(shelf);
                                  
                                  const panel = createCabinetMesh(counterW - 0.004, shelfThickness, panelThick, materials.cabinet);
                                  panel.position.set(0, shelfH_m - shelfThickness / 2, d / 2 - panelThick / 2);
                                  panel.castShadow = true;
                                  panel.receiveShadow = true;
                                  group.add(panel);
                              } else {
                                  const shelf = createUVMappedBox(counterW - 0.004, shelfThickness, d, materials.blackWorktop);
                                  shelf.position.y = shelfH_m - shelfThickness / 2;
                                  group.add(shelf);
                              }
                          }
                      });
                  }
              } else {
                  // Fallback for other widths (e.g., 94)
                  group.add(createUnit(w, tallH, d, tallH/2, 'tall', 'none', 'none'));
              }
          } else if (type === 'mix') {
              const tallW = 0.90;
              const sepW = w - tallW;
              const isFlipped = currentConfig.cupboardLayout === 'right';
              
              if (sepW > 0) {
                  const tallX = isFlipped ? (-w/2 + tallW/2) : (w/2 - tallW/2);
                  const sepX = isFlipped ? (w/2 - sepW/2) : (-w/2 + sepW/2);
                  const sepInnerSide = isFlipped ? 'left' : 'right';
                  const tallInnerSide = isFlipped ? 'right' : 'left';

                  const tallPart = createUnit(tallW, tallH, d, tallH/2, 'tall', tallInnerSide, 'none');
                  tallPart.position.x = tallX;
                  group.add(tallPart);

                  const sepGroup = new THREE.Group();
                  sepGroup.position.x = sepX;
                  
                  const isSpecialMix = ['opening-open', 'drawer-open', 'opening-appliance', 'drawer-appliance'].includes(currentConfig.cupboardStorageType);
                  const specialMixModeForBase = isSpecialMix ? (isFlipped ? 'right' : 'left') : 'none';

                  const unitH = baseH - topT;
                  const base = createUnit(sepW, unitH, d, (unitH)/2, 'base', sepInnerSide, specialMixModeForBase);
                  sepGroup.add(base);
                  const top = createUVMappedBox(sepW, topT, d, materials.worktop);
                  top.position.y = unitH + topT/2;
                  sepGroup.add(top);

                  const upperH = 0.7;
                  const upperY = tallH - upperH/2;
                  sepGroup.add(createUnit(sepW, upperH, d, upperY, 'wall', sepInnerSide, 'none'));
                  
                  group.add(sepGroup);
              } else {
                   group.add(createUnit(w, tallH, d, tallH/2, 'tall', 'none', 'none'));
              }
          }
          
          const wallH = 2.4;
          const wallW = 4.0; 
          const wallThick = 0.1;
          const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(wallW, wallH, wallThick), materials.wall);
          wallMesh.userData.isWall = true;
          wallMesh.position.set(0, wallH/2, -d/2 - wallThick/2 - 0.01); 
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
          wallSide: 'none' | 'left' | 'right' = 'none',
          hasWallCabinet: boolean = false
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
                 apron.position.set(0, apronY + typeITopOffset, localD/2 - thick/2); apron.receiveShadow = true; apron.castShadow = true; zoneGroup.add(apron);

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
                    const sideH = h; // Cabinet height, not full height from floor
                    const sideY = h / 2; // Position it within the cabinet block, not from the floor
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

          if (hasWallCabinet) {
              const wallCabH = (config.hangingCabinetHeight || 70) * 0.01;
              const wallCabD = 0.375;
              const hoodBottomGap = 0.80; // Standard gap from counter to hood/wall cabinet bottom
              
              const counterY = floatH + h + revealH + topH;
              
              // Align bottom of cabinet with bottom of hood (0.80m above counter)
              const wallCabBottomY = counterY + hoodBottomGap;
              
              const cabinetMat = materials.cabinet;
              const hoodW = 0.90;
              const hoodHalf = hoodW / 2;
              
              // Calculate wall cabinet position
              // Default assumption: continuous block from edges to hood
              
              const stoveRealX = stoveZoneX + stoveInternalXOffset;
              const hoodMinX = stoveRealX - hoodHalf;
              const hoodMaxX = stoveRealX + hoodHalf;
              
              const startXPos = -w/2 + (hasWaterfall ? panelThick : 0);
              const endXPos = w/2 - (hasRightPanel ? panelThick : 0);
              
              // Create a helper to add wall cabinet segment
              const addWallSegment = (sX: number, eX: number) => {
                  const sW = eX - sX;
                  if (sW > 0.1) {
                      const cX = sX + sW / 2;
                      const cabGroup = new THREE.Group();
                      
                      // Split into doors (approx 45cm each)
                      const numDoors = Math.max(1, Math.round(sW / 0.45));
                      const doorW = sW / numDoors;
                      const doorThick = 0.02;
                      
                      for(let i=0; i<numDoors; i++) {
                           const dX = -sW/2 + doorW/2 + (i * doorW);
                           const gap = 0.002;
                           const actualDW = doorW - gap;
                           const doorMesh = createCabinetMesh(actualDW, wallCabH, doorThick, cabinetMat);
                           doorMesh.position.set(dX, 0, wallCabD/2 - doorThick/2);
                           doorMesh.castShadow = true; doorMesh.receiveShadow = true;
                           cabGroup.add(doorMesh);
                      }
                      
                      // Carcass
                      const body = createCabinetMesh(sW, wallCabH, wallCabD - doorThick, cabinetMat);
                      body.position.set(0, 0, -doorThick/2);
                      body.castShadow = true; body.receiveShadow = true;
                      cabGroup.add(body);
                      
                      // Recalculate Z based on back alignment:
                      const backZ = -d / 2;
                      cabGroup.position.set(cX, wallCabBottomY + wallCabH/2, backZ + wallCabD / 2 + casingZOffset + bodyZOffset);
                      
                      blockGroup.add(cabGroup);
                  }
              };
              
              if (hasHood) {
                  // If stove is on the right side
                  if (stoveRealX > 0) {
                      addWallSegment(startXPos, hoodMinX);
                  } else {
                      // If stove is on the left side
                      addWallSegment(hoodMaxX, endXPos);
                  }
              } else {
                  // No hood, full width
                  addWallSegment(startXPos, endXPos);
              }
          }
          
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
                   bPanel.position.set(startXBack + segW * i + segW / 2, -d / 2 + backPanelThick + 0.0005 + casingZOffset - 0.008); // Push back to avoid flicker
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
              topMesh.position.set(0, topY, topCenterZ);
              topMesh.receiveShadow = true;
              topMesh.castShadow = true;
              blockGroup.add(topMesh);
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
                 m.position.set(x, topY, z);
                 m.receiveShadow = true;
                 m.castShadow = true;
                 blockGroup.add(m);
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

              const frontPanelThick = 0.003;
              const frontPanel = createCabinetMesh(w - 0.002, floatH, frontPanelThick, kickMat);
              const frontPanelZ = bodyZOffset + casingZOffset + (bodyDepth / 2) - (frontPanelThick / 2);
              frontPanel.position.set(x, floatH / 2, frontPanelZ);
              frontPanel.castShadow = true;
              frontPanel.receiveShadow = true;
              blockGroup.add(frontPanel);
          };

            if (fullWidthKickStrip && !isSinkBaseOpen) {
                addKickSegment(startX + availableW / 2, availableW);
            } else {
                if (isStoveOnly) {
                    addKickSegment(stoveZoneX, stoveUnitW);
                } else {
                    if (hasSink && !isSinkBaseOpen) {
                        addKickSegment(sinkZoneX, sinkUnitW);
                    }
                    if (hasDishwasher) {
                        addKickSegment(dishwasherZoneX, dishwasherW);
                    }
                    if (middleStorageW > 0.01) {
                        addKickSegment(middleZoneX, middleStorageW);
                    }
                    if (hasStove) {
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
              group.add(createCabinetBlock(
                width, 
                depth, 
                height, 
                true, 
                true, 
                showHood, 
                'center', 
                true, 
                0, 
                true, 
                'none', 
                true, 
                'cabinet', 
                'cabinet', 
                0, 
                true, 
                0, 
                false, 
                'none', 
                currentConfig.hasHangingCabinet // Add hasWallCabinet arg
              ));
              
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

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe5e5e5);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.copy(INITIAL_CAMERA_POSITION); 
    cameraRef.current = camera;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent going below floor
    // Center the controls on the kitchen countertop height approximately
    controls.target.set(0, 0.5, 0);
    controlsRef.current = controls;

    // Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.top = 4;
    dirLight.shadow.camera.bottom = -2;
    dirLight.shadow.camera.left = -4;
    dirLight.shadow.camera.right = 4;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 20;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(20, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x777777, // Default to oak tint
      roughness: 0.8,
      metalness: 0
    });

    const oakUrl = 'http://25663cc9bda9549d.main.jp/aistudio/linekitchen/floortexture/oakfloor.jpg';
    const initialTexture = loadTexture(oakUrl);
    if (initialTexture) {
      initialTexture.wrapS = THREE.RepeatWrapping;
      initialTexture.wrapT = THREE.RepeatWrapping;
      initialTexture.repeat.set(12.5, 12.5);
      floorMat.map = initialTexture;
    }

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    floorMeshRef.current = floor;

    // Groups
    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    // Resize handler
    const handleResize = () => {
        if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    };
    animate();

    return () => {
        window.removeEventListener('resize', handleResize);
        if (rendererRef.current && mountRef.current) {
            mountRef.current.removeChild(rendererRef.current.domElement);
        }
        renderer.dispose();
    };
  }, []); // Run once on mount

  // Update Kitchen Group when config changes
  useEffect(() => {
      if (!groupRef.current) return;
      
      // Clear old kitchen
      while(groupRef.current.children.length > 0){ 
          groupRef.current.remove(groupRef.current.children[0]); 
      }

      const kitchen = createKitchenGroup(config);
      groupRef.current.add(kitchen);

  }, [config, colors, createKitchenGroup]); // Re-run when config changes

  const floorOptions = [
      { id: 'oak', name: 'オーク', url: 'http://25663cc9bda9549d.main.jp/aistudio/linekitchen/floortexture/oakfloor.jpg' },
      { id: 'tile', name: 'タイル', url: 'http://25663cc9bda9549d.main.jp/aistudio/linekitchen/floortexture/tile.jpg' },
      { id: 'stone', name: 'ストーン', url: 'http://25663cc9bda9549d.main.jp/aistudio/linekitchen/floortexture/stone.jpg' },
      { id: 'herringbone', name: 'ヘリンボーン', url: 'http://25663cc9bda9549d.main.jp/aistudio/linekitchen/floortexture/herinborn.jpg' },
      { id: 'tile-black', name: 'タイル(黒)', url: 'http://25663cc9bda9549d.main.jp/aistudio/linekitchen/floortexture/tileblack.jpg' },
      { id: 'none', name: '床なし', url: '' },
  ] as const;

  return (
    <div className="relative w-full h-full bg-gray-100 overflow-hidden" ref={mountRef}>
      {isLoading && <LoadingIndicator />}
      
      {/* Bottom Left Controls Overlay (Floor Toggle) */}
      <div className="absolute bottom-4 left-4 z-10 flex gap-2 p-2 bg-white/30 backdrop-blur-sm rounded-full">
          {floorOptions.map((opt) => (
              <button
                  key={opt.id}
                  onClick={() => setFloorOption(opt.id)}
                  className={`relative w-10 h-10 rounded-full border-2 overflow-hidden transition-all hover:scale-110 ${floorOption === opt.id ? 'border-[#8b8070] scale-110 shadow-md' : 'border-white/50 opacity-80 hover:opacity-100'}`}
                  title={opt.name}
              >
                  {opt.id === 'none' ? (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <span className="block w-2/3 h-0.5 bg-gray-500 transform -rotate-45"></span>
                      </div>
                  ) : (
                      <img 
                          src={`https://images.weserv.nl/?url=${encodeURIComponent(opt.url.replace(/^https?:\/\//, ''))}&w=100&output=webp`} 
                          alt={opt.name} 
                          className="w-full h-full object-cover" 
                      />
                  )}
              </button>
          ))}
      </div>

    </div>
  );
});

export default DoorPreview;
