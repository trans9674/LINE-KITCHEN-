
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useDoorConfiguration } from './hooks/useDoorConfiguration';
import CustomizationPanel from './components/CustomizationPanel';
import DoorPreview from './components/DoorPreview';
import AdminPanel from './components/AdminPanel';
import PasswordModal from './components/PasswordModal';
import ProjectInfoModal from './components/ProjectInfoModal';
import TypeSelectionModal from './components/TypeSelectionModal';
import { SavedDoor, ProjectInfo, DoorTypeId, DoorOption } from './types';
import { generateDocument } from './components/PresentationGenerator';
import * as C from './constants';
import SplashScreen from './components/SplashScreen';

const APP_SETTINGS_KEY = 'tripLineDoorAppSettings_v54';

const isObject = (item: any): item is Record<string, any> => {
  return (item && typeof item === 'object' && !Array.isArray(item));
};

const deepMerge = <T extends Record<string, any>>(target: T, source: Record<string, any>): T => {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target) || !isObject(target[key])) {
          (output as any)[key] = source[key];
        } else {
          (output as any)[key] = deepMerge(target[key], source[key]);
        }
      } else {
        (output as any)[key] = source[key];
      }
    });
  }
  return output;
};

// FIX: Explicitly type `defItem` to resolve type inference issue where it was treated as `unknown`.
// Also, add a check for `s` being an object before accessing `s.id` for safety with data from localStorage.
const mergeOptions = (defaults: any[], saved: any[]): any[] => {
  if (!saved || !Array.isArray(saved)) return defaults;
  return defaults.map((defItem: { id: any; [key: string]: any; }) => {
    const savedItem = saved.find((s: any) => s && typeof s === 'object' && s.id === defItem.id);
    if (!savedItem) return defItem;
    const mergedItem = { ...defItem };
    if (typeof savedItem.price === 'number') mergedItem.price = savedItem.price;
    if (defItem.subOptions && Array.isArray(defItem.subOptions)) {
        const savedSubOptions = (savedItem.subOptions && Array.isArray(savedItem.subOptions)) ? savedItem.subOptions : [];
        mergedItem.subOptions = mergeOptions(defItem.subOptions, savedSubOptions);
    }
    return mergedItem;
  });
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<'splash' | 'selecting' | 'configuring'>('splash');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppState('selecting');
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const [appSettings, setAppSettings] = useState(() => {
    const defaults = {
      doorTypes: C.DOOR_TYPES,
      frameTypes: C.FRAME_TYPES,
      colors: C.COLORS,
      handles: C.HANDLES,
      glassStyles: C.GLASS_STYLES,
      locks: C.LOCKS,
      dividers: C.DIVIDERS,
      storageOptions: C.STORAGE_OPTIONS,
      kitchenOptions: C.KITCHEN_OPTIONS,
      dishwashers: C.DISHWASHERS,
      gasStoves: C.GAS_STOVES,
      ihHeaters: C.IH_HEATERS,
      rangeHoods: C.RANGE_HOODS,
      rangeHoodOptions: C.RANGE_HOOD_OPTIONS,
      faucets: C.FAUCETS,
      sinkAccessories: C.SINK_ACCESSORIES,
      kitchenPanels: C.KITCHEN_PANELS,
      cupboardTypes: C.CUPBOARD_TYPES,
      cupboardStorageTypes: C.CUPBOARD_STORAGE_TYPES,
      cupboardOptionPanels: C.CUPBOARD_OPTION_PANELS,
      cupboardPrices: C.CUPBOARD_PRICES,
      cupboardCounterPrices: C.CUPBOARD_COUNTER_PRICES,
      cupboardDoorPrices: C.CUPBOARD_DOOR_PRICES,
      shippingRates: C.SHIPPING_RATES,
    };

    try {
      const savedSettingsJSON = localStorage.getItem(APP_SETTINGS_KEY);
      if (savedSettingsJSON) {
        const saved = JSON.parse(savedSettingsJSON);
        console.log("Loaded settings from storage:", saved);
        
        const finalSettings = { ...defaults };

        Object.keys(defaults).forEach(key => {
          const defaultVal = defaults[key as keyof typeof defaults];
          const savedVal = saved[key];

          if (Array.isArray(defaultVal)) {
            (finalSettings as any)[key] = mergeOptions(defaultVal, savedVal);
          } else if (isObject(defaultVal)) {
            if (isObject(savedVal)) {
              (finalSettings as any)[key] = deepMerge(defaultVal, savedVal);
            }
          }
        });
        
        return finalSettings;
      }
    } catch (error) {
      console.error('Error loading settings from localStorage, falling back to defaults:', error);
      localStorage.removeItem(APP_SETTINGS_KEY);
    }
    return defaults;
  });

  useEffect(() => {
    try {
      localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(appSettings));
      console.log("Settings saved to localStorage");
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  }, [appSettings]);


  const { config, updateConfig, totalPrice, confirmCupboard } = useDoorConfiguration(appSettings);
  const [savedDoors, setSavedDoors] = useState<SavedDoor[]>([]);
  
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [showProjectInfoModal, setShowProjectInfoModal] = useState(false);
  
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    customerName: '',
    constructionLocation: '',
    constructionCompany: '',
    shippingCost: 0,
  });

  const handleTypeSelect = (type: DoorTypeId) => {
    setIsFadingOut(true);
    setTimeout(() => {
      updateConfig('doorType', type);
      setAppState('configuring');
    }, 500); // Must match fade-out animation duration
  };

  const visibleDoorTypes = useMemo(() => {
    const visibleIds: DoorTypeId[] = ['peninsula', 'island', 'type-i', 'type-ii'];
    const isTypeII = (id: DoorTypeId) => id === 'type-ii' || id.startsWith('type-ii-stove-');
    const visibleItems = appSettings.doorTypes
        .filter(dt => visibleIds.includes(dt.id))
        .map(dt => {
            if (isTypeII(dt.id)) {
                return { ...dt, name: 'Ⅱ型', id: 'type-ii' as DoorTypeId }; // Normalize to 'type-ii' for selection
            }
            return dt;
        });
    // Deduplicate
    const uniqueItems = Array.from(new Map(visibleItems.map((item: DoorOption<DoorTypeId>) => [item.id, item])).values());
    // FIX: Explicitly type array sort arguments to prevent 'unknown' type inference error.
    uniqueItems.sort((a: DoorOption<DoorTypeId>, b: DoorOption<DoorTypeId>) => visibleIds.indexOf(a.id) - visibleIds.indexOf(b.id));
    return uniqueItems;
  }, [appSettings.doorTypes]);

  const handleGenerateDocument = (type: 'presentation' | 'quotation' | 'drawing') => {
      // If there are no saved doors, create a temporary list containing the current configuration.
      const doorsToPrint = savedDoors.length > 0 ? savedDoors : [{
          id: 'current-preview',
          config: config,
          price: totalPrice,
          roomName: 'Current Plan'
      }];
      generateDocument(type, doorsToPrint, appSettings, projectInfo);
  };

  const handleProjectInfoComplete = (info: ProjectInfo) => {
    setProjectInfo(info);
    setShowProjectInfoModal(false);
  };

  const handleAdminClick = () => {
    setPasswordInput('');
    setPasswordError('');
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === '0000') {
      setIsPasswordModalOpen(false);
      setIsAdminModalOpen(true);
    } else {
      setPasswordError('暗証番号が違います。');
    }
  };

  return (
    <div className="w-full h-full text-gray-800 flex flex-col" style={{ backgroundColor: '#f5f2eb' }}>
      {appState === 'splash' && <SplashScreen />}
      
      {appState !== 'splash' && (
        <>
          <header className="bg-white shadow-md flex-shrink-0 z-20 relative">
            <div className="container mx-auto px-4 py-4 lg:py-6 flex justify-between items-center">
              <div className="flex items-baseline gap-2 lg:gap-4 overflow-hidden">
                <h1 className="text-xl lg:text-3xl font-light tracking-[0.2em] text-gray-800 whitespace-nowrap">
                  LINE KITCHEN
                </h1>
                <span className="hidden lg:inline-block text-lg font-light tracking-widest text-gray-500 pb-1 whitespace-nowrap">
                </span>
                {projectInfo.customerName && (
                  <span className="text-xs lg:text-sm font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded truncate self-end mb-1">{projectInfo.customerName} 様</span>
                )}
              </div>
               <div className="flex items-center gap-4">
                <div className="lg:hidden text-right">
                  <p className="text-xs text-gray-600">見積り価格(税別)</p>
                  <p className="text-xl font-bold text-gray-800 -mt-1 tracking-tight">{totalPrice.toLocaleString()}円</p>
                </div>
                <button onClick={() => setShowProjectInfoModal(true)} className="hidden lg:flex items-center justify-center w-10 h-10 text-gray-600 bg-[#e7e4db] rounded-full hover:bg-[#dcd8cd] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 flex flex-col lg:flex-row-reverse relative">
              {appState === 'configuring' && (
                <div className="w-full lg:w-[30%] flex-shrink-0 h-1/2 lg:h-full order-2 lg:order-1 animate-fade-in relative z-10">
                  <CustomizationPanel
                    config={config}
                    updateConfig={updateConfig}
                    totalPrice={totalPrice}
                    settings={appSettings}
                    onConfirmCupboard={confirmCupboard}
                  />
                </div>
              )}
              <div className="flex-1 lg:w-[70%] w-full h-1/2 lg:h-full relative order-1 lg:order-2">
                  <DoorPreview config={config} {...appSettings} />
              </div>
          </main>
        </>
      )}

      {appState === 'selecting' && (
        <TypeSelectionModal
          doorTypes={visibleDoorTypes}
          onSelect={handleTypeSelect}
          isFadingOut={isFadingOut}
        />
      )}

      {isPasswordModalOpen && <PasswordModal value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onSubmit={handlePasswordSubmit} onClose={() => setIsPasswordModalOpen(false)} error={passwordError} />}
      {isAdminModalOpen && <AdminPanel settings={appSettings} onUpdateSettings={setAppSettings} onClose={() => setIsAdminModalOpen(false)} />}
      {showProjectInfoModal && (
          <ProjectInfoModal 
            isOpen={showProjectInfoModal} 
            initialInfo={projectInfo} 
            onComplete={handleProjectInfoComplete} 
            onClose={() => setShowProjectInfoModal(false)} 
            shippingRates={appSettings.shippingRates} 
            onGenerate={handleGenerateDocument}
            onAdminClick={handleAdminClick}
          />
      )}
    </div>
  );
};

export default App;
