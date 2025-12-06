
import { useState, useMemo, useCallback } from 'react';
import { DoorConfiguration, DoorOption, ColorOption, DoorTypeId, FrameTypeId, HandleId, GlassStyleId, LockId, DividerId, DishwasherId, GasStoveId, IhHeaterId, RangeHoodId, FaucetId, StorageOptionId, KitchenOptionId, SinkAccessoryId, KitchenPanelId, CupboardEndPanelId } from '../types';
import { INITIAL_CONFIG, CUPBOARD_PRICES, CUPBOARD_COUNTER_PRICES, CUPBOARD_DOOR_PRICES, COLORS, TYPE_II_ISLAND_UPCHARGE, HANGING_CABINET_PRICE } from '../constants';

interface AppSettings {
  doorTypes: DoorOption<DoorTypeId>[];
  colors: ColorOption[];
  dishwashers: DoorOption<DishwasherId>[];
  gasStoves: DoorOption<GasStoveId>[];
  ihHeaters: DoorOption<IhHeaterId>[];
  rangeHoods: DoorOption<RangeHoodId>[];
  faucets: DoorOption<FaucetId>[];
  storageOptions: DoorOption<StorageOptionId>[];
  kitchenOptions: DoorOption<KitchenOptionId>[];
  sinkAccessories: DoorOption<SinkAccessoryId>[];
  kitchenPanels: DoorOption<KitchenPanelId>[];
  cupboardPrices: typeof CUPBOARD_PRICES;
  cupboardCounterPrices: typeof CUPBOARD_COUNTER_PRICES;
  cupboardDoorPrices: typeof CUPBOARD_DOOR_PRICES;
  cupboardEndPanels: DoorOption<CupboardEndPanelId>[];
  // Other settings...
  [key: string]: any;
}

export const useDoorConfiguration = (settings: AppSettings) => {
  const [config, setConfig] = useState<DoorConfiguration>(INITIAL_CONFIG);

  const updateConfig = useCallback(<K extends keyof DoorConfiguration>(key: K, value: DoorConfiguration[K]) => {
    setConfig(prev => {
      let newConfig = { ...prev, [key]: value };

      // Mutual exclusivity for heating options
      if (key === 'gasStove' && value !== null) {
        newConfig.ihHeater = null;
      } else if (key === 'ihHeater' && value !== null) {
        newConfig.gasStove = null;
      }

      // Reset confirmed cupboard if related settings change
      if (['cupboardType', 'cupboardWidth', 'cupboardDepth', 'cupboardStorageType'].includes(key as string)) {
        newConfig.confirmedCupboard = null;
      }
      if (key === 'cupboardType' && value === 'none') {
        newConfig.confirmedCupboard = null;
        newConfig.cupboardColorMode = 'same';
      }

      // If cupboard type is changed to tall or mix, and depth is not 45, reset depth to 45.
      if (key === 'cupboardType' && (value === 'tall' || value === 'mix')) {
        if (prev.cupboardDepth !== 45) {
          newConfig.cupboardDepth = 45;
        }
      }

      const isTypeIIFamily = (type: DoorTypeId) => type === 'type-ii' || type.startsWith('type-ii-stove-');

      // When width changes, sync doorType for Type II family
      if (key === 'width' && isTypeIIFamily(prev.doorType)) {
        const newWidth = value as number;
        if (newWidth === 184) newConfig.doorType = 'type-ii';
        else if (newWidth === 240) newConfig.doorType = 'type-ii-stove-240';
        else if (newWidth === 255) newConfig.doorType = 'type-ii-stove-255';
        else if (newWidth === 270) newConfig.doorType = 'type-ii-stove-270';
      }

      // When doorType changes, sync width and other defaults
      if (key === 'doorType') {
        const newType = value as DoorTypeId;
        const isNewTypeI = newType === 'type-i';
        const isNewTypeIIFamily = isTypeIIFamily(newType);

        if (isNewTypeIIFamily) {
          if (newType === 'type-ii') newConfig.width = 184;
          else if (newType === 'type-ii-stove-240') newConfig.width = 240;
          else if (newType === 'type-ii-stove-255') newConfig.width = 255;
          else if (newType === 'type-ii-stove-270') newConfig.width = 270;
          
          newConfig.height = 85;
          newConfig.sinkPosition = 'left';

          // If selecting a Type II kitchen and quartz stone is the current counter, reset it.
          if (prev.counterColor === 'quartz-stone') {
            newConfig.counterColor = 'stainless';
          }
        } else if (newType !== 'unselected') {
          // Reset width and other defaults for other types
          newConfig.width = 255;
          newConfig.height = 85;
          newConfig.sinkPosition = 'left';
        }
        
        // A new kitchen type selection should require re-confirming the cupboard
        newConfig.confirmedCupboard = null;

        // Reset divider if the new type doesn't support it
        if (isNewTypeI || isNewTypeIIFamily) {
          newConfig.divider = 'none';
        }
        
        // Reset hanging cabinet if not Type I
        if (!isNewTypeI) {
            newConfig.hasHangingCabinet = false;
        }

        // Set default range hood based on kitchen type
        if (newType === 'peninsula') {
            newConfig.rangeHood = 'shvrl-3a-901-si';
        } else if (newType === 'island') {
            newConfig.rangeHood = 'flbt-90s-s5680';
        } else if (isNewTypeI || isNewTypeIIFamily) {
            newConfig.rangeHood = 'asr-3a-9027-si';
        }
      }
      
      // If backStyle is changed to 'storage', update storageOption to dining-storage-plan
      if (key === 'backStyle') {
          if (value === 'storage') {
              newConfig.storageOption = 'dining-storage-plan';
          } else {
              newConfig.storageOption = 'counter-plan';
          }
      }

      return newConfig;
    });
  }, []);

  const confirmCupboard = useCallback(() => {
    setConfig(prev => {
      if (prev.cupboardType === 'none') {
        return { ...prev, confirmedCupboard: null };
      }
      return {
        ...prev,
        confirmedCupboard: {
          type: prev.cupboardType,
          width: prev.cupboardWidth,
          depth: prev.cupboardDepth,
        }
      };
    });
  }, []);

  const totalPrice = useMemo(() => {
    let total = 0;

    // Base kitchen price
    const doorTypeOption = settings.doorTypes.find(t => t.id === config.doorType);
    if (doorTypeOption) total += doorTypeOption.price;

    // Add upcharge for Type II Island
    const isTypeIIFamily = config.doorType === 'type-ii' || config.doorType.startsWith('type-ii-stove-');
    if (isTypeIIFamily && config.typeIIStyle === 'island') {
        total += TYPE_II_ISLAND_UPCHARGE;
    }
    
    // Add hanging cabinet price
    if (config.hasHangingCabinet) {
        total += HANGING_CABINET_PRICE;
    }
    
    // Counter color price
    const counterColorOption = settings.colors.find(c => c.id === config.counterColor);
    if (counterColorOption) total += counterColorOption.price;

    // Door color price
    const doorColorOption = settings.colors.find(c => c.id === config.color);
    if (doorColorOption) total += doorColorOption.price;

    // Optional appliances
    const dishwasherOption = settings.dishwashers.find(d => d.id === config.dishwasher);
    if (dishwasherOption) total += dishwasherOption.price;

    const gasStoveOption = settings.gasStoves.find(d => d.id === config.gasStove);
    if (gasStoveOption) total += gasStoveOption.price;

    const ihHeaterOption = settings.ihHeaters.find(d => d.id === config.ihHeater);
    if (ihHeaterOption) total += ihHeaterOption.price;

    const rangeHoodOption = settings.rangeHoods.find(d => d.id === config.rangeHood);
    if (rangeHoodOption) total += rangeHoodOption.price;

    const faucetOption = settings.faucets.find(d => d.id === config.faucet);
    if (faucetOption) total += faucetOption.price;

    // Other options
    const storageOption = settings.storageOptions.find(o => o.id === config.storageOption);
    if (storageOption) total += storageOption.price;

    // Kitchen Options (multiple choice)
    if (config.hasInnerDrawer) {
      const option = settings.kitchenOptions.find(o => o.id === 'inner-drawer');
      if (option) total += option.price;
    }
    if (config.hasCrossGallery) {
      const option = settings.kitchenOptions.find(o => o.id === 'cross-gallery');
      if (option) total += option.price;
    }
    if (config.hasNonSlipMat) {
      if (config.hasInnerDrawer) {
        const option = settings.kitchenOptions.find(o => o.id === 'non-slip-mat-inner');
        if (option) total += option.price;
      } else {
        const option = settings.kitchenOptions.find(o => o.id === 'non-slip-mat');
        if (option) total += option.price;
      }
    }
    
    if (config.sinkAccessories) {
      config.sinkAccessories.forEach(id => {
        const accessoryOption = settings.sinkAccessories.find(o => o.id === id);
        if (accessoryOption) {
          total += accessoryOption.price;
        }
      });
    }

    const kitchenPanelOption = settings.kitchenPanels.find(o => o.id === config.kitchenPanel);
    if (kitchenPanelOption) total += kitchenPanelOption.price;

    // Cupboard price from confirmed selection
    if (config.confirmedCupboard) {
      const { type, depth, width } = config.confirmedCupboard;
      const basePrice = settings.cupboardPrices[type]?.[depth]?.[width] || 0;
      total += basePrice;

      // Cupboard door color upcharge
      const cupboardDoorColorId = config.cupboardColorMode === 'separate' ? config.cupboardColor : config.color;
      const doorColorInfo = COLORS.find(c => c.id === cupboardDoorColorId);
      const premiumColors = ['gratta-light', 'gratta-dark', 'ash', 'teak', 'walnut'];
      if (doorColorInfo && premiumColors.includes(doorColorInfo.id) && type !== 'none') {
        const doorPrice = settings.cupboardDoorPrices[type]?.['premium']?.[width] || 0;
        total += doorPrice;
      }

      // Cupboard counter upcharge (for floor and separate types)
      if (type === 'floor' || type === 'separate' || type === 'mix') {
        const cupboardCounterColorId = config.cupboardColorMode === 'separate' ? config.cupboardCounterColor : config.counterColor;
        const counterColorInfo = COLORS.find(c => c.id === cupboardCounterColorId);
        if (counterColorInfo && counterColorInfo.id.startsWith('stainless')) {
          const counterKey = depth === 45 ? 'stainless450' : 'stainless600'; // Note: 'mix' type always has depth 45
          
          let priceWidth = width;
          if (type === 'mix') {
            // For mix type, the counter is on the 'separate' part, which is `width - 90cm`.
            priceWidth = width - 90;
          }

          const counterPrice = settings.cupboardCounterPrices[counterKey]?.[priceWidth] || 0;
          total += counterPrice;
        }
      }

      // Add end panel price
      const endPanelOption = settings.cupboardEndPanels.find(p => p.id === config.cupboardEndPanel);
      if (endPanelOption) {
        total += endPanelOption.price;
      }
    }
    
    return total; 
  }, [config, settings]);

  return { config, updateConfig, totalPrice, confirmCupboard };
};