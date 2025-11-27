
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { DoorConfiguration, DoorOption, ColorOption, DoorTypeId, ColorId, KitchenOptionId, SinkAccessoryId, GasStoveId, IhHeaterId, DishwasherId, FaucetId, RangeHoodId, KitchenPanelId, RangeHoodOptionId } from '../types';
import { getProxiedImageUrl } from '../utils';

interface CustomizationPanelProps {
  config: DoorConfiguration;
  updateConfig: <K extends keyof DoorConfiguration>(key: K, value: DoorConfiguration[K]) => void;
  totalPrice: number;
  settings: {
    doorTypes: DoorOption<DoorTypeId>[];
    colors: ColorOption[];
    dividers: DoorOption<any>[];
    dishwashers: DoorOption<DishwasherId>[];
    gasStoves: DoorOption<GasStoveId>[];
    ihHeaters: DoorOption<IhHeaterId>[];
    rangeHoods: DoorOption<RangeHoodId>[];
    faucets: DoorOption<FaucetId>[];
    kitchenOptions: DoorOption<KitchenOptionId>[];
    sinkAccessories: DoorOption<SinkAccessoryId>[];
    kitchenPanels: DoorOption<KitchenPanelId>[];
    rangeHoodOptions: DoorOption<RangeHoodOptionId>[];
    cupboardTypes: DoorOption<any>[];
    cupboardPrices: any;
    cupboardDoorPrices: any;
    cupboardCounterPrices: any;
  };
  onConfirmCupboard: () => void;
}

type SectionKey = 'type' | 'size' | 'counter' | 'color' | 'equipment' | 'cupboard' | 'other';

const ColorSwatch: React.FC<{ color: ColorOption; active: boolean; onClick: () => void; disabled?: boolean; }> = ({ color, active, onClick, disabled = false }) => (
  <button onClick={onClick} disabled={disabled} className={`text-center transition-all duration-200 group ${active ? 'transform scale-105' : 'hover:scale-105'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <div className={`relative w-full aspect-square rounded-lg border-4 shadow-sm overflow-hidden ${active ? 'border-[#8b8070]' : 'border-transparent group-hover:border-gray-300'}`}>
      <img src={getProxiedImageUrl(color.swatchUrl)} alt={color.name} className={`w-full h-full object-cover ${disabled ? 'grayscale' : ''}`} />
    </div>
    <p className="mt-1 text-sm font-bold text-gray-800">{color.shortId}</p>
    <p className="text-xs text-gray-600 truncate">{color.name}</p>
  </button>
);

const DoorCategoryIcon: React.FC<{ id: string, className?: string }> = ({ id, className }) => {
  const commonProps = {
    className: className || "h-12 w-12",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.5
  };

  let displayId = id;
  if (id.startsWith('type-ii-stove-') || id.startsWith('new-')) {
    displayId = 'type-ii';
  }

  switch (displayId) {
    case 'peninsula': return <svg {...commonProps}><rect x="2" y="8" width="18" height="8" /><rect x="5" y="10" width="6" height="4" /><line x1="20" y1="4" x2="20" y2="20" /></svg>;
    case 'island': return <svg {...commonProps}><rect x="3" y="8" width="18" height="8" /><rect x="6" y="10" width="6" height="4" /></svg>;
    case 'type-ii': return <svg {...commonProps}><rect x="4" y="6" width="16" height="5" /><rect x="4" y="13" width="16" height="5" /><rect x="6" y="14" width="6" height="3" /></svg>;
    case 'type-i': return <svg {...commonProps}><rect x="3" y="9" width="18" height="8" /><rect x="6" y="11" width="6" height="4" /><line x1="0" y1="9" x2="24" y2="9" /></svg>;
    default: return null;
  }
};

const VisualOptionGrid = <T extends string>({ title, options, selectedIds, onSelect, isMultiSelect = false }: {
  title: string;
  options: (DoorOption<T> & { configKey?: keyof DoorConfiguration; note?: string })[];
  selectedIds: T[];
  onSelect: (option: DoorOption<T> & { configKey?: keyof DoorConfiguration; note?: string }) => void;
  isMultiSelect?: boolean;
}) => (
  <div>
    <label className="block text-base font-medium text-gray-700 mb-3">{title}</label>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {options.map(opt => {
        const isSelected = selectedIds.includes(opt.id);
        const proxiedUrl = getProxiedImageUrl(opt.swatchUrl);
        return (
          <button key={opt.id} onClick={() => onSelect(opt)} className={`relative text-left p-2 rounded-lg border-2 transition-all duration-200 ${isSelected ? 'border-[#8b8070] bg-[#f5f2eb] shadow-md' : 'border-gray-200 bg-white hover:border-gray-400'}`}>
            {opt.price === 0 && opt.id !== 'none' && (<span className="absolute top-1.5 left-1.5 bg-[#5d5448] text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-10">標準</span>)}
            <div className="w-full aspect-video bg-gray-100 rounded-md overflow-hidden mb-2 relative">
              {proxiedUrl ? (<img src={getProxiedImageUrl(opt.swatchUrl)} alt={opt.name} className="w-full h-full object-contain" />) : (<div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px] italic">画像なし</div>)}
            </div>
            <p className="text-xs font-bold text-gray-800 leading-tight line-clamp-2" style={{minHeight: '2.5em'}}>{opt.name}</p>
            {opt.note && <p className="text-[10px] text-red-500 font-medium mt-1">{opt.note}</p>}
            <p className="text-sm font-semibold text-gray-700 mt-1">+{opt.price.toLocaleString()}円</p>
            {isSelected && (<div className="absolute top-1.5 right-1.5 bg-[#8b8070] text-white rounded-full w-5 h-5 flex items-center justify-center shadow"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg></div>)}
          </button>
        );
      })}
    </div>
  </div>
);

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({ config, updateConfig, totalPrice, settings, onConfirmCupboard }) => {
  const [activeSubPanel, setActiveSubPanel] = useState<SectionKey | null>(null);
  const [touchedSections, setTouchedSections] = useState<Set<string>>(new Set());
  const [colorSelectionStep, setColorSelectionStep] = useState<'counter' | 'door'>('counter');
  const [equipmentStep, setEquipmentStep] = useState(0);

  const [itemConfirmation, setItemConfirmation] = useState<{
    isOpen: boolean;
    item: DoorOption<any> | null;
    onConfirm: (() => void) | null;
  }>({ isOpen: false, item: null, onConfirm: null });

  const [cupboardConfirmation, setCupboardConfirmation] = useState<{
    isOpen: boolean;
    onConfirm: (() => void) | null;
  }>({ isOpen: false, onConfirm: null });

  const subPanelRef = useRef<HTMLDivElement>(null);
  const cupboardPanelRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (activeSubPanel !== 'color') {
      setColorSelectionStep('counter');
    }
    if (activeSubPanel !== 'equipment') {
      setEquipmentStep(0);
    }
  }, [activeSubPanel]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      if (itemConfirmation.isOpen) {
        if (cupboardPanelRef.current && !cupboardPanelRef.current.contains(targetNode)) {
          setItemConfirmation({ isOpen: false, item: null, onConfirm: null });
        }
      }
    };
    if (itemConfirmation.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [itemConfirmation.isOpen]);

  const isTypeComplete = config.doorType !== 'unselected';
  const isTypeII = useMemo(() => config.doorType === 'type-ii' || config.doorType.startsWith('type-ii-stove-'), [config.doorType]);
  const isTypeI = useMemo(() => config.doorType === 'type-i', [config.doorType]);
  
  const showDividerOption = !isTypeI && !isTypeII;

  const presetWidths = useMemo(() => isTypeII ? [184, 240, 255, 270] : [229, 244, 259], [isTypeII]);
  const presetHeights = [85, 90];
  const cupboardWidths = [94, 169, 184, 244, 259, 274];
  const cupboardDepths = [45, 60, 65];

  const counterColors = useMemo(() => settings.colors.filter(c => c.availableFor.includes('counter')), [settings.colors]);
  const doorColors = useMemo(() => settings.colors.filter(c => c.availableFor.includes('door')), [settings.colors]);

  const kitchenMultiOptions = useMemo(() => {
    const { kitchenOptions } = settings;
    const innerDrawer = kitchenOptions.find(o => o.id === 'inner-drawer');
    const crossGallery = kitchenOptions.find(o => o.id === 'cross-gallery');
    const nonSlipMat = kitchenOptions.find(o => o.id === 'non-slip-mat');
    const nonSlipMatInner = kitchenOptions.find(o => o.id === 'non-slip-mat-inner');

    type KitchenMultiOption = DoorOption<KitchenOptionId> & { configKey: keyof DoorConfiguration, note?: string };
    const options: KitchenMultiOption[] = [];

    if (innerDrawer) options.push({ ...innerDrawer, configKey: 'hasInnerDrawer' });
    if (crossGallery) options.push({ ...crossGallery, configKey: 'hasCrossGallery' });
    if (nonSlipMat) {
        const price = config.hasInnerDrawer ? nonSlipMatInner?.price : nonSlipMat.price;
        const note = config.hasInnerDrawer ? '※内引出し分を含む' : undefined;
        options.push({ ...nonSlipMat, price: price || 0, configKey: 'hasNonSlipMat', note });
    }
    return options;
  }, [settings.kitchenOptions, config.hasInnerDrawer]);

  const handleSinkAccessoryToggle = (id: string) => {
    const accessoryId = id as SinkAccessoryId;
    const current = config.sinkAccessories || [];
    const newAccessories = current.includes(accessoryId) ? current.filter(item => item !== accessoryId) : [...current, accessoryId];
    updateConfig('sinkAccessories', newAccessories);
  };

  const visibleDoorTypes = useMemo(() => {
    const visibleIds: DoorTypeId[] = ['peninsula', 'island', 'type-i', 'type-ii'];
    const items = settings.doorTypes.filter(dt => visibleIds.includes(dt.id)).map(dt => dt.id === 'type-ii' ? { ...dt, name: 'Ⅱ型' } : dt);
    items.sort((a, b) => visibleIds.indexOf(a.id) - visibleIds.indexOf(b.id));
    return items;
  }, [settings.doorTypes]);

  const sectionCompletion = {
    type: isTypeComplete,
    size: isTypeComplete && touchedSections.has('size'),
    counter: isTypeComplete && touchedSections.has('counter'),
    color: isTypeComplete && touchedSections.has('color'),
    equipment: isTypeComplete && touchedSections.has('equipment'),
    cupboard: isTypeComplete && ((config.cupboardType === 'none' && touchedSections.has('cupboard')) || (config.cupboardType !== 'none' && !!config.confirmedCupboard)),
    other: isTypeComplete && touchedSections.has('other'),
  };

  const sections: { key: SectionKey; title: string; }[] = [
    { key: 'type', title: 'キッチンタイプ' },
    { key: 'size', title: 'サイズ・レイアウト' },
    { key: 'counter', title: 'カウンター & オプション' },
    { key: 'color', title: '扉・カウンターカラー' },
    { key: 'equipment', title: '設備オプション' },
    { key: 'cupboard', title: 'カップボード' },
    { key: 'other', title: 'その他オプション' },
  ];

  const handleConfirmCupboard = () => {
    const confirmAndClose = () => {
      onConfirmCupboard();
      setActiveSubPanel(null);
    };

    if ((isTypeI || isTypeII) && config.cupboardType !== 'none') {
      setCupboardConfirmation({
        isOpen: true,
        onConfirm: () => {
          confirmAndClose();
          setCupboardConfirmation({ isOpen: false, onConfirm: null });
        }
      });
    } else {
      confirmAndClose();
    }
  };
  
  const cupboardSelectionPrice = useMemo(() => {
    if (config.cupboardType === 'none' || !settings.cupboardPrices) return 0;
    
    let price = settings.cupboardPrices[config.cupboardType]?.[config.cupboardDepth]?.[config.cupboardWidth] || 0;
    
    const doorColorInfo = settings.colors.find(c => c.id === config.color);
    const premiumColors = ['gratta-light', 'gratta-dark', 'ash', 'teak', 'walnut'];
    if (doorColorInfo && premiumColors.includes(doorColorInfo.id) && config.cupboardType !== 'none') {
        const doorPrice = settings.cupboardDoorPrices[config.cupboardType]?.['premium']?.[config.cupboardWidth] || 0;
        price += doorPrice;
    }

    if (config.cupboardType === 'floor' || config.cupboardType === 'separate') {
        const counterColorInfo = settings.colors.find(c => c.id === config.counterColor);
        if (counterColorInfo && counterColorInfo.id.startsWith('stainless')) {
            const counterKey = config.cupboardDepth === 45 ? 'stainless450' : 'stainless600';
            const counterPrice = settings.cupboardCounterPrices[counterKey]?.[config.cupboardWidth] || 0;
            price += counterPrice;
        }
    }
    return price;
  }, [config.cupboardType, config.cupboardWidth, config.cupboardDepth, config.color, config.counterColor, settings]);

  const handleSectionClick = (key: SectionKey) => {
    setActiveSubPanel(key);
    setTouchedSections(prev => new Set(prev).add(key));
  };

  const handleItemSelection = (
    item: DoorOption<any>,
    onConfirmAction: () => void
  ) => {
    if (item.id === 'none' || item.id === 'other') {
      onConfirmAction();
      return;
    }
    setItemConfirmation({
      isOpen: true,
      item: item,
      onConfirm: () => {
        onConfirmAction();
        setItemConfirmation({ isOpen: false, item: null, onConfirm: null });
      }
    });
  };

  const renderSubPanelContent = () => {
    switch(activeSubPanel) {
      case 'type': {
        const isTypeIIfromConfig = config.doorType === 'type-ii' || config.doorType.startsWith('type-ii-stove-');
        return (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-3">
              {visibleDoorTypes.map(dt => {
                const isActive = config.doorType === dt.id || (isTypeIIfromConfig && dt.id === 'type-ii');
                return (
                  <button 
                    key={dt.id} 
                    onClick={() => {
                      if (config.doorType === 'unselected' && dt.id !== 'unselected') {
                        setTouchedSections(prev => new Set(prev).add('type'));
                        setActiveSubPanel('size');
                      }
                      updateConfig('doorType', dt.id);
                    }} 
                    className={`group relative flex flex-col items-center justify-center p-4 lg:p-6 rounded-xl border-2 transition-all duration-200 ${isActive ? 'border-[#8b8070] bg-[#f5f2eb] shadow-md scale-[1.02]' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'}`}
                  >
                    <span className={`font-bold text-base lg:text-lg text-center mb-1 ${isActive ? 'text-[#5d5448]' : 'text-gray-800'}`}>{dt.name}</span>
                    <span className="text-sm lg:text-base text-gray-500">{dt.price.toLocaleString()}円〜</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      }
      case 'size': return (
        <div className="p-6 space-y-4">
            <div>
                <label className="block text-base lg:text-lg font-medium text-gray-700 mb-2">{isTypeII ? '幅 (コンロ側)' : '幅'} <span className="text-xs lg:text-sm font-normal text-gray-500">{isTypeII && '※シンク側は184cm固定'}</span></label>
                <div className="grid grid-cols-4 gap-2">
                    {presetWidths.map(w => <button key={w} onClick={() => updateConfig('width', w)} className={`w-full py-3 text-sm lg:text-base font-medium rounded-lg transition-all ${config.width === w ? 'bg-[#8b8070] text-white shadow-md' : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-200'}`}>{w} cm</button>)}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-base lg:text-lg font-medium text-gray-700 mb-2">高さ</label>
                    <div className="grid grid-cols-2 gap-3">
                        {presetHeights.map(h => <button key={h} onClick={() => updateConfig('height', h)} className={`py-3 text-sm lg:text-base rounded-lg border ${config.height === h ? 'bg-[#8b8070] text-white shadow-md' : 'bg-white hover:bg-gray-100'}`}>{h} cm</button>)}
                    </div>
                </div>
                <div>
                    <label className="block text-base lg:text-lg font-medium text-gray-700 mb-2">シンク位置</label>
                    <div className="grid grid-cols-2 gap-3">
                        {(['left', 'right'] as const).map(p => <button key={p} onClick={() => updateConfig('sinkPosition', p)} className={`py-3 text-sm lg:text-base rounded-lg border ${config.sinkPosition === p ? 'bg-[#8b8070] text-white shadow-md' : 'bg-white hover:bg-gray-100'}`}>{p === 'left' ? '左' : '右'}</button>)}
                    </div>
                </div>
            </div>
        </div>
      );
      case 'counter': return (
        <div className="p-6 space-y-4">
            {isTypeII && <div><label className="block text-base lg:text-lg font-medium text-gray-700 mb-2">Ⅱ型スタイル</label><div className="grid grid-cols-2 gap-3"><button onClick={() => updateConfig('typeIIStyle', 'peninsula')} className={`py-3 text-sm lg:text-base rounded-lg border ${config.typeIIStyle === 'peninsula' ? 'bg-[#8b8070] text-white shadow-md' : 'bg-white hover:bg-gray-100'}`}>ペニンシュラ</button><button onClick={() => updateConfig('typeIIStyle', 'island')} className={`py-3 text-sm lg:text-base rounded-lg border ${config.typeIIStyle === 'island' ? 'bg-[#8b8070] text-white shadow-md' : 'bg-white hover:bg-gray-100'}`}>アイランド</button></div></div>}
            
            <div><label className="block text-base lg:text-lg font-medium text-gray-700 mb-2">カウンタータイプ</label><div className="grid grid-cols-2 gap-3"><button onClick={() => updateConfig('backStyle', 'counter')} className={`py-2 text-sm lg:text-base rounded-lg border text-center ${config.backStyle === 'counter' ? 'bg-[#8b8070] text-white shadow-md' : 'bg-white hover:bg-gray-100'}`}>カウンター<span className="block text-[10px] lg:text-xs opacity-90">奥行75cm</span></button><button onClick={() => updateConfig('backStyle', 'storage')} className={`py-2 text-sm lg:text-base rounded-lg border text-center ${config.backStyle === 'storage' ? 'bg-[#8b8070] text-white shadow-md' : 'bg-white hover:bg-gray-100'}`}>ダイニング収納<span className="block text-[10px] lg:text-xs opacity-90">奥行90cm</span></button></div></div>
            
            {showDividerOption && <div><label className="block text-base lg:text-lg font-medium text-gray-700 mb-2">キッチンディバイダー</label><div className="grid grid-cols-2 gap-3"><button onClick={() => updateConfig('divider', 'none')} className={`py-3 text-sm lg:text-base rounded-lg border ${config.divider === 'none' ? 'bg-[#8b8070] text-white shadow-md' : 'bg-white hover:bg-gray-100'}`}>なし</button><button onClick={() => updateConfig('divider', 'glass-70')} className={`py-3 text-sm lg:text-base rounded-lg border ${config.divider === 'glass-70' ? 'bg-[#8b8070] text-white shadow-md' : 'bg-white hover:bg-gray-100'}`}>あり</button></div></div>}
            
            <div><label className="block text-base lg:text-lg font-medium text-gray-700 mb-2">シンク下</label><div className="grid grid-cols-2 gap-3"><button onClick={() => updateConfig('sinkBaseType', 'drawers')} className={`py-3 text-sm lg:text-base rounded-lg border ${config.sinkBaseType === 'drawers' ? 'bg-[#8b8070] text-white shadow-md' : 'bg-white hover:bg-gray-100'}`}>引き出し</button><button onClick={() => updateConfig('sinkBaseType', 'open')} className={`py-3 text-sm lg:text-base rounded-lg border ${config.sinkBaseType === 'open' ? 'bg-[#8b8070] text-white shadow-md' : 'bg-white hover:bg-gray-100'}`}>オープン</button></div></div>
        </div>
      );
      case 'color':
        return (
          <div className="relative w-full h-full overflow-hidden">
            <div className={`w-[200%] h-full flex transition-transform duration-500 ease-in-out ${colorSelectionStep === 'door' ? '-translate-x-1/2' : 'translate-x-0'}`}>
              <div className="w-1/2 h-full overflow-y-auto p-6 space-y-6">
                {[...new Set(counterColors.map(c => c.category))].map(cat => (
                  <div key={cat} className="mb-4">
                    <h4 className="text-base font-semibold text-gray-600 mb-2 flex items-center"><span className="inline-block w-1 h-3 bg-black mr-2"></span><span>{cat}</span></h4>
                    <div className="grid grid-cols-4 gap-3 pt-1">
                      {counterColors.filter(c => c.category === cat).map(c =>
                        <ColorSwatch
                          key={c.id}
                          color={c}
                          active={config.counterColor === c.id}
                          onClick={() => {
                            updateConfig('counterColor', c.id);
                            setColorSelectionStep('door');
                          }}
                          disabled={isTypeII && c.id === 'quartz-stone'}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="w-1/2 h-full overflow-y-auto p-6 space-y-6">
                {[...new Set(doorColors.map(c => c.category))].map(cat => (
                  <div key={cat} className="mb-4">
                    <h4 className="text-base font-semibold text-gray-600 mb-2 flex items-center"><span className="inline-block w-1 h-3 bg-black mr-2"></span><span>{cat}</span></h4>
                    <div className="grid grid-cols-4 gap-3 pt-1">
                      {doorColors.filter(c => c.category === cat).map(c =>
                        <ColorSwatch
                          key={c.id}
                          color={c}
                          active={config.color === c.id}
                          onClick={() => updateConfig('color', c.id)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'equipment': {
        const steps = [
          <div key={0} className="p-6 space-y-6">
            <VisualOptionGrid title="ガスコンロ" options={settings.gasStoves} selectedIds={[config.gasStove]} onSelect={(opt) => {
                if (config.gasStove === opt.id) {
                    updateConfig('gasStove', null);
                } else {
                    handleItemSelection(opt, () => {
                        updateConfig('gasStove', opt.id as GasStoveId);
                        setEquipmentStep(1);
                    });
                }
            }} />
            <VisualOptionGrid title="IHヒーター" options={settings.ihHeaters} selectedIds={[config.ihHeater]} onSelect={(opt) => {
                if (config.ihHeater === opt.id) {
                    updateConfig('ihHeater', null);
                } else {
                    handleItemSelection(opt, () => {
                        updateConfig('ihHeater', opt.id as IhHeaterId);
                        setEquipmentStep(1);
                    });
                }
            }} />
          </div>,
          <div key={1} className="p-6 space-y-6"><VisualOptionGrid title="食器洗い乾燥機" options={settings.dishwashers} selectedIds={[config.dishwasher]} onSelect={(opt) => {
                if (config.dishwasher === opt.id) {
                    updateConfig('dishwasher', 'none');
                }
                handleItemSelection(opt, () => {
                    updateConfig('dishwasher', opt.id as DishwasherId);
                    setEquipmentStep(2);
                });
          }} /></div>,
          <div key={2} className="p-6 space-y-6"><VisualOptionGrid title="水栓金具" options={settings.faucets} selectedIds={[config.faucet]} onSelect={(opt) => {
                if (config.faucet === opt.id) {
                    updateConfig('faucet', 'none');
                }
                handleItemSelection(opt, () => {
                    updateConfig('faucet', opt.id as FaucetId);
                    setEquipmentStep(3);
                });
          }} /></div>,
          <div key={3} className="p-6 space-y-6"><VisualOptionGrid title="レンジフード" options={settings.rangeHoods} selectedIds={[config.rangeHood]} onSelect={(opt) => {
              if (config.rangeHood === opt.id) {
                    updateConfig('rangeHood', 'none');
                } else {
                    handleItemSelection(opt, () => {
                        updateConfig('rangeHood', opt.id as RangeHoodId);
                        setActiveSubPanel(null);
                    });
                }
          }} /></div>
        ];
        return (
            <div className="flex flex-col h-full">
                <div className="flex-grow relative overflow-hidden">
                    <div className="absolute inset-0 w-[400%] flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${equipmentStep * 25}%)` }}>
                        {steps.map((step, index) => (<div key={index} className="w-1/4 h-full overflow-y-auto">{step}</div>))}
                    </div>
                </div>
                <div className="flex-shrink-0 p-4 border-t bg-gray-50/80 backdrop-blur-sm flex justify-between items-center">
                    <button
                        onClick={() => setEquipmentStep(prev => Math.max(0, prev - 1))}
                        disabled={equipmentStep === 0}
                        className="p-3 rounded-full bg-white border border-gray-300 disabled:opacity-50 hover:bg-gray-100 transition-colors"
                        aria-label="Previous Step"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    
                    <div className="flex gap-2">
                        {steps.map((_, index) => (
                            <button key={index} onClick={() => setEquipmentStep(index)} className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-colors ${equipmentStep === index ? 'bg-[#8b8070]' : 'bg-gray-300 hover:bg-gray-400'}`} aria-label={`Go to step ${index + 1}`}></button>
                        ))}
                    </div>

                    <button
                        onClick={() => setEquipmentStep(prev => Math.min(steps.length - 1, prev + 1))}
                        disabled={equipmentStep === steps.length - 1}
                        className="p-3 rounded-full bg-white border border-gray-300 disabled:opacity-50 hover:bg-gray-100 transition-colors"
                        aria-label="Next Step"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>
        );
      }
      case 'cupboard': return null;
      case 'other': return <div className="p-6 space-y-6">
          <VisualOptionGrid 
              title="キッチンオプション"
              options={kitchenMultiOptions}
              selectedIds={kitchenMultiOptions.filter(o => config[o.configKey as keyof DoorConfiguration]).map(o => o.id)}
              onSelect={(opt) => {
                  const key = opt.configKey as keyof DoorConfiguration;
                  updateConfig(key, !config[key]);
              }}
              isMultiSelect={true}
          />
          <VisualOptionGrid
              title="シンクアクセサリー"
              options={settings.sinkAccessories.filter(o => o.id !== 'none')}
              selectedIds={config.sinkAccessories}
              onSelect={(opt) => handleSinkAccessoryToggle(opt.id)}
              isMultiSelect={true}
          />
          <VisualOptionGrid
              title="キッチンパネル"
              options={settings.kitchenPanels}
              selectedIds={[config.kitchenPanel]}
              onSelect={(opt) => {
                if (config.kitchenPanel === opt.id) {
                    updateConfig('kitchenPanel', 'none');
                } else {
                    handleItemSelection(opt, () => updateConfig('kitchenPanel', opt.id as KitchenPanelId));
                }
              }}
              isMultiSelect={false}
          />
          <VisualOptionGrid
              title="レンジフードオプション"
              options={settings.rangeHoodOptions}
              selectedIds={[config.rangeHoodOption]}
              onSelect={(opt) => {
                if (config.rangeHoodOption === opt.id) {
                    updateConfig('rangeHoodOption', 'none');
                } else {
                    handleItemSelection(opt, () => updateConfig('rangeHoodOption', opt.id as RangeHoodOptionId));
                }
              }}
              isMultiSelect={false}
          />
      </div>;
      default: return null;
    }
  };

  const handleSubPanelBack = () => {
    if (activeSubPanel === 'color' && colorSelectionStep === 'door') {
      setColorSelectionStep('counter');
    } else if (activeSubPanel === 'equipment' && equipmentStep > 0) {
        setEquipmentStep(prev => prev - 1);
    } else {
      setActiveSubPanel(null);
    }
  };

  const subPanelTitle = useMemo(() => {
    if (activeSubPanel === 'color') {
        return colorSelectionStep === 'counter' ? 'カウンター・側板カラー' : '扉カラー';
    }
    if (activeSubPanel === 'equipment') {
      const titles = ['加熱機器', '食洗機', '水栓金具', 'レンジフード'];
      return titles[equipmentStep] || '設備オプション';
    }
    return sections.find(s => s.key === activeSubPanel)?.title;
  }, [activeSubPanel, colorSelectionStep, equipmentStep]);

  return (
    <div className="relative w-full h-full">
        {/* Content Container */}
        <div className="w-full h-full bg-gray-50 shadow-lg flex flex-col border-t border-gray-300 lg:border-t-0 lg:border-l">
            {/* Main Area */}
            <div className="flex-grow relative">
                {/* Main Panel */}
                <div className="absolute inset-0 overflow-y-auto p-4 text-base lg:text-lg space-y-3">
                    {sections.map(({key, title}) => {
                      const isDisabled = key !== 'type' && !isTypeComplete;
                      const isComplete = sectionCompletion[key as keyof typeof sectionCompletion];
                      return (
                        <button key={key} onClick={() => { if(!isDisabled) { handleSectionClick(key); }}} disabled={isDisabled} className={`w-full flex justify-between items-center text-left p-4 lg:py-6 rounded-xl border transition-all duration-300 ${isDisabled ? 'bg-gray-100 opacity-60' : 'bg-white border-gray-200 shadow-lg hover:shadow-xl hover:border-gray-300'}`}>
                            <div className="flex items-center gap-3">
                                {isComplete ? <svg className="w-5 h-5 text-[#8b8070] flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> : <svg className="w-5 h-5 text-gray-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                <div className="flex items-baseline">
                                    <h3 className={`text-base lg:text-xl font-bold ${isDisabled ? 'text-gray-400' : 'text-gray-700'}`}>{title}</h3>
                                    {key === 'cupboard' && (isTypeI || isTypeII) && (
                                        <span className="ml-2 text-xs font-normal text-red-500">※３Dには表示されません</span>
                                    )}
                                </div>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                        </button>
                      );
                    })}
                </div>

                {/* Sub Panel */}
                <div ref={subPanelRef} className={`absolute top-0 right-0 h-full w-full lg:w-[150%] bg-gray-50 shadow-2xl z-20 flex flex-col border-l border-gray-200 transform transition-transform duration-300 ease-in-out ${activeSubPanel ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="flex-shrink-0 p-4 border-b flex justify-between items-center sticky top-0 bg-gray-50/80 backdrop-blur-sm z-10">
                        <div className="flex items-center">
                            <button onClick={handleSubPanelBack} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <h2 className="text-xl font-bold ml-4 hidden lg:block">{subPanelTitle}</h2>
                        </div>
                        <button
                          onClick={() => setActiveSubPanel(null)}
                          className="bg-[#8b8070] hover:bg-[#797061] text-white font-bold py-2 px-5 rounded-lg shadow-md transition-all text-sm"
                        >
                          決定
                        </button>
                    </div>
                    
                    {activeSubPanel === 'cupboard' ? (
                      <div className="flex-grow flex flex-col h-full">
                        <div className="flex-grow overflow-y-auto p-6 space-y-4">
                          <div>
                            <label className="block text-base font-medium text-gray-700 mb-2">タイプ</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {settings.cupboardTypes.map(t => <button key={t.id} onClick={() => updateConfig('cupboardType', t.id)} className={`py-3 rounded-lg border ${config.cupboardType === t.id ? 'bg-[#8b8070] text-white shadow' : 'bg-white hover:bg-gray-100'}`}>{t.name}</button>)}
                            </div>
                          </div>
                          {config.cupboardType !== 'none' && (
                            <>
                              <div>
                                <label className="block text-base font-medium text-gray-700 mb-2">幅</label>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                  {cupboardWidths.map(w => <button key={w} onClick={() => updateConfig('cupboardWidth', w)} className={`py-2 rounded-lg border text-sm ${config.cupboardWidth === w ? 'bg-[#8b8070] text-white shadow' : 'bg-white hover:bg-gray-100'}`}>{w} cm</button>)}
                                </div>
                              </div>
                              <div>
                                <label className="block text-base font-medium text-gray-700 mb-2">奥行</label>
                                <div className="grid grid-cols-3 gap-3">
                                  {cupboardDepths.map(d => <button key={d} onClick={() => updateConfig('cupboardDepth', d)} disabled={(config.cupboardType === 'tall' || config.cupboardType === 'mix') && d !== 45} className={`py-3 rounded-lg border ${config.cupboardDepth === d ? 'bg-[#8b8070] text-white shadow' : 'bg-white hover:bg-gray-100'} disabled:bg-gray-200 disabled:opacity-50`}>{d} cm</button>)}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex-shrink-0 p-6 border-t bg-gray-50">
                          <div className="flex justify-end items-baseline gap-3 mb-4">
                            <p className="text-sm text-gray-600">カップボード価格</p>
                            <p className="text-4xl font-bold">{cupboardSelectionPrice.toLocaleString()}円</p>
                          </div>
                          <button onClick={handleConfirmCupboard} className="w-full bg-[#8b8070] hover:bg-[#797061] text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all">決定</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-grow overflow-y-auto">
                          {renderSubPanelContent()}
                      </div>
                    )}
                </div>
            </div>

            {/* Price Display */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white/80 backdrop-blur-sm z-10 hidden lg:block">
                <div className="flex justify-between items-center">
                    <p className="text-base text-gray-600">見積り価格 <span className="text-sm">(税別)</span></p>
                    <p className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">{totalPrice.toLocaleString()} <span className="text-base font-normal">円</span></p>
                </div>
            </div>
        </div>
        
        {/* Item Confirmation Modal */}
        {itemConfirmation.isOpen && itemConfirmation.item && (
          <div className="absolute inset-0 z-30 flex items-end pb-12 justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setItemConfirmation({ isOpen: false, item: null, onConfirm: null })}>
            <div ref={cupboardPanelRef} className="bg-white rounded-xl shadow-lg w-1/2 max-w-md m-4 flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6">
                <h3 className="text-sm font-bold text-gray-800 text-center mb-4">選択内容の確認</h3>
                <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                  {itemConfirmation.item.swatchUrl ? (
                    <img src={getProxiedImageUrl(itemConfirmation.item.swatchUrl)} alt={itemConfirmation.item.name} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm italic">画像なし</div>
                  )}
                </div>
                <p className="text-xs font-bold text-gray-800 text-center">{itemConfirmation.item.name}</p>
                <p className="text-sm font-semibold text-gray-700 text-center mt-1">+{itemConfirmation.item.price.toLocaleString()}円</p>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex justify-end items-center gap-3 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setItemConfirmation({ isOpen: false, item: null, onConfirm: null })}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  戻る
                </button>
                <button
                  type="button"
                  onClick={() => {
                    itemConfirmation.onConfirm?.();
                  }}
                  className="px-4 py-2 bg-[#8b8070] hover:bg-[#797061] text-white rounded-md transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cupboard 3D Confirmation Modal */}
        {cupboardConfirmation.isOpen && (
          <div className="absolute inset-0 z-40 flex items-start pt-8 justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setCupboardConfirmation({ isOpen: false, onConfirm: null })}>
            <div className="bg-white rounded-xl shadow-lg w-[70%] max-w-md m-4 flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-8 text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-4">確認</h3>
                <p className="text-gray-600">
                  ３D画像には表示されませんが追加しますか？
                </p>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex justify-end items-center gap-3 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setCupboardConfirmation({ isOpen: false, onConfirm: null })}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={() => {
                    cupboardConfirmation.onConfirm?.();
                  }}
                  className="px-4 py-2 bg-[#8b8070] hover:bg-[#797061] text-white rounded-md transition-colors"
                >
                  追加する
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default CustomizationPanel;
