
export type ColorId = 
  'natural-white' | 
  'dark-beige' | 
  'dark-gray' | 
  'gray-stone' | 
  'molta-light' | 
  'molta-black' | 
  'stainless' | 
  'quartz-stone' | 
  'gratta-light' | 
  'gratta-dark' | 
  'ash' | 
  'teak' | 
  'walnut' |
  'ww' | 'lg' | 'dg' | 'co' | 'ga' | 'pw';

export type HandleId = 'satin-nickel' | 'white' | 'black';
export type GlassStyleId = 'none' | 'clear' | 'frosted';
export type LockId = 'none' | 'display-lock';
export type DividerId = 'none' | 'glass-70';
export type BackStyleId = 'counter' | 'storage';
export type SinkBaseTypeId = 'drawers' | 'open';
export type TypeIIStyleId = 'island' | 'peninsula';

export type DoorTypeId =
  'unselected' |
  'peninsula' |
  'island' |
  'type-ii' |
  'type-i' |
  'type-ii-stove-240' |
  'type-ii-stove-255' |
  'type-ii-stove-270';

export type FrameTypeId = 'threeWay' | 'twoWay';

// New Cupboard Types
export type CupboardTypeId = 'none' | 'floor' | 'separate' | 'tall' | 'mix';

export type StorageOptionId = 'counter-plan' | 'dining-storage-plan';
export type KitchenOptionId = 'inner-drawer' | 'cross-gallery' | 'non-slip-mat' | 'non-slip-mat-inner';
export type DishwasherId = 'none' | 'rinnai-405am' | 'rinnai-sd401gpma' | 'panasonic-45md9waa' | 'miele-g5434sci' | 'miele-g5644sci' | 'miele-7130sci' | 'bosch-spi4hds006';
export type GasStoveId = 'paloma-pkd-509ws' | 'paloma-brillio-pd-743ws' | 'paloma-brillio-pd-743w' | 'rinnai-lisse' | 'rinnai-delicia' | 'harman-do' | 'rinnai-rd641stsa';
export type IhHeaterId = 'none' | 'mitsubishi-cs-g318m' | 'panasonic-ys-ch-trs6c' | 'panasonic-ys-ch-trs7c' | 'panasonic-ch-mrs7a1' | 'hitachi-ht-n150ktwf' | 'mitsubishi-cs-t322bfr';
export type RangeHoodId = 'none' | 'shvrl-3a-901-si' | 'shvrl-3a-901-bk' | 'shvrl-3a-901-w' | 'fujioh-shvrl-3a-901v-si' | 'fujioh-shvrl-3a-901v-bk' | 'fujioh-shvrl-3a-901v-w' | 'no-hood';
export type RangeHoodOptionId = 'none' | 'damper-100v' | 'damper-shutter-100v' | 'height-change-700' | 'height-change-850' | 'top-plate';
export type FaucetId = 'none' | 'grohe-jp205702' | 'sanei-k87122ejv' | 'hansgrohe-74800674' | 'sanei-k8731e1jv' | 'sanei-k8781jv-djp' | 'grohe-3028020' | 'grohe-32321gn2j' | 'sanei-ek8700e' | 'takagi-ls106mn' | 'takagi-ls106bn' | 'takagi-jy396mn' | 'takagi-lc122mn' | 'other';
export type SinkAccessoryId = 'none' | 'basket-s' | 'detergent-box' | 'cutlery-box' | 'plate-no-hole' | 'plate-hole' | 'basket-l' | 'steers' | 'cutting-board' | 'palette' | 'under-plate';
export type KitchenPanelId = 'none' | 'aica-fkm6000zgn-1' | 'aica-fkm6000zgn-2' | 'aica-fkm6000zgn-3' | 'aica-fas809zmn-1' | 'aica-fas809zmn-2' | 'aica-fas809zmn-3';
export type CupboardStorageTypeId = 'opening' | 'drawer' | 'opening-open' | 'drawer-open' | 'opening-appliance' | 'drawer-appliance';
export type CupboardOptionPanelId = 'none' | 'one-side' | 'floor' | 'separate' | 'tall' | 'mix';

export interface DoorOption<T> {
  id: T;
  name: string;
  price: number;
  priceH2200?: number;
  priceH2400?: number;
  priceH90?: number;
  priceH120?: number;
  priceW90?: number;
  priceW120?: number;
  priceW160?: number;
  priceW200?: number;
  subOptions?: DoorOption<T>[];
  // FIX: Added optional swatchUrl to support images for various options.
  swatchUrl?: string;
}

export interface ColorOption extends DoorOption<ColorId> {
  shortId: string;
  class?: string;
  handleColorClass: string;
  hex: string;
  previewHex: string;
  handleHex: string;
  category: 'monotone' | 'wood' | 'stone' | 'metal';
  swatchUrl: string;
  textureUrl: string;
  availableFor: ('door' | 'counter')[];
}

export interface DoorConfiguration {
  doorType: DoorTypeId;
  color: ColorId;
  counterColor: ColorId;
  handle: HandleId;
  glassStyle: GlassStyleId;
  lock: LockId;
  divider: DividerId;
  width: number;
  height: number;
  count: number;
  hingeSide: 'left' | 'right';
  sinkPosition: 'left' | 'right';
  frameType: FrameTypeId;
  backStyle: BackStyleId;
  sinkBaseType: SinkBaseTypeId;
  typeIIStyle: TypeIIStyleId;
  
  // New options
  storageOption: StorageOptionId;
  hasInnerDrawer: boolean;
  hasCrossGallery: boolean;
  hasNonSlipMat: boolean;
  dishwasher: DishwasherId;
  gasStove: GasStoveId | null;
  ihHeater: IhHeaterId | null;
  rangeHood: RangeHoodId;
  rangeHoodOption: RangeHoodOptionId;
  faucet: FaucetId;
  sinkAccessories: SinkAccessoryId[];
  kitchenPanel: KitchenPanelId;

  // Cupboard config
  cupboardType: CupboardTypeId;
  cupboardWidth: number;
  cupboardDepth: number;
  cupboardLayout: 'left' | 'right';
  confirmedCupboard: {
    type: CupboardTypeId;
    width: number;
    depth: number;
  } | null;
}

export interface SavedDoor {
  id: string;
  config: DoorConfiguration;
  price: number;
  roomName?: string;
}

export interface ProjectInfo {
  customerName: string;
  constructionLocation: string;
  constructionCompany: string;
  shippingCost: number;
}

export type CupboardPriceMatrix = {
  [key in CupboardTypeId]?: {
    [depth: number]: {
      [width: number]: number;
    };
  };
};

export type CupboardCounterPriceMatrix = {
  [counterType: string]: {
      [width: number]: number;
  }
};

export type CupboardDoorPriceMatrix = {
    [cupboardType in 'floor' | 'separate' | 'tall' | 'mix']?: {
        [doorColor: string]: {
            [width: number]: number;
        }
    }
};
