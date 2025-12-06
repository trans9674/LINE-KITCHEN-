// FIX: Added CupboardTypeId to the import list to resolve a type error.
import { DoorOption, ColorOption, DoorTypeId, FrameTypeId, HandleId, GlassStyleId, LockId, DividerId, StorageOptionId, KitchenOptionId, DishwasherId, GasStoveId, IhHeaterId, RangeHoodId, RangeHoodOptionId, FaucetId, SinkAccessoryId, KitchenPanelId, DoorConfiguration, CupboardPriceMatrix, CupboardCounterPriceMatrix, CupboardDoorPriceMatrix, CupboardStorageTypeId, CupboardOptionPanelId, CupboardTypeId, ColorId } from './types';

export const TYPE_II_ISLAND_UPCHARGE = 80000;
export const HANGING_CABINET_PRICE = 105000;

export const DOOR_TYPES: DoorOption<DoorTypeId>[] = [
    {
      "id": "peninsula",
      "name": "ペニンシュラ",
      "price": 900000
    },
    {
      "id": "island",
      "name": "アイランド",
      "price": 980000
    },
    {
      "id": "type-i",
      "name": "I型壁付け",
      "price": 800000
    },
    {
      "id": "type-ii",
      "name": "Ⅱ型 コンロ側 184",
      "price": 1000000
    },
    {
      "id": "type-ii-stove-240",
      "name": "Ⅱ型 コンロ側 240",
      "price": 1300000
    },
    {
      "id": "type-ii-stove-255",
      "name": "Ⅱ型 コンロ側 255",
      "price": 1300000
    },
    {
      "id": "type-ii-stove-270",
      "name": "Ⅱ型 コンロ側 270",
      "price": 1300000
    }
];

export const FRAME_TYPES: DoorOption<FrameTypeId>[] = [
  { id: "twoWay", name: "2方枠", price: 0 },
  { id: "threeWay", name: "3方枠", price: 0 }
];

export const COLORS: ColorOption[] = [
  { id: "natural-white", shortId: "NW", name: "ナチュラルホワイト", price: 0, handleColorClass: "bg-gray-700", hex: "#F0F0F0", previewHex: "#F0F0F0", handleHex: "#4A5568", category: "monotone", availableFor: ['door', 'counter'], swatchUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/naturalwhite.jpg", textureUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/naturalwhite.jpg" },
  { id: "dark-beige", shortId: "DB", name: "ダークベージュ", price: 0, handleColorClass: "bg-gray-800", hex: "#211f19", previewHex: "#211f19", handleHex: "#2D3748", category: "monotone", availableFor: ['door', 'counter'], swatchUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/darkbeige.jpg", textureUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/darkbeige.jpg" },
  { id: "dark-gray", shortId: "DG", name: "ダークグレー", price: 0, handleColorClass: "bg-gray-300", hex: "#181818", previewHex: "#181818", handleHex: "#D1D5DB", category: "monotone", availableFor: ['door', 'counter'], swatchUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/darkgray.jpg", textureUrl: "" },
  { id: "gray-stone", shortId: "GS", name: "グレーストーン", price: 0, handleColorClass: "bg-gray-300", hex: "#606060", previewHex: "#606060", handleHex: "#D1D5DB", category: "stone", availableFor: ['door', 'counter'], swatchUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/graystone.jpg", textureUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/graystone.jpg" },
  { id: "molta-light", shortId: "ML", name: "モルタライト", price: 0, handleColorClass: "bg-gray-800", hex: "#A0A0A0", previewHex: "#A0A0A0", handleHex: "#2D3748", category: "stone", availableFor: ['door', 'counter'], swatchUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/moltalight.jpg", textureUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/moltalight.jpg" },
  { id: "molta-black", shortId: "MB", name: "モルタブラック", price: 0, handleColorClass: "bg-gray-300", hex: "#202020", previewHex: "#202020", handleHex: "#D1D5DB", category: "stone", availableFor: ['door', 'counter'], swatchUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/moltablack.jpg", textureUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/moltablack.jpg" },
  { id: "stainless", shortId: "SUS", name: "ステンレス", price: 0, handleColorClass: "bg-gray-800", hex: "#C0C0C0", previewHex: "#C0C0C0", handleHex: "#2D3748", category: "metal", availableFor: ['counter'], swatchUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/sus-09.jpg", textureUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/sus-09.jpg" },
  { id: "quartz-stone", shortId: "QS", name: "クオーツストーン", price: 234000, handleColorClass: "bg-gray-800", hex: "#E0E0E0", previewHex: "#E0E0E0", handleHex: "#2D3748", category: "stone", availableFor: ['counter'], swatchUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/quartsstone.jpg", textureUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/quartsstone.jpg" },
  { id: "gratta-light", shortId: "GL", name: "グラッタライト", price: 144000, handleColorClass: "bg-gray-800", hex: "#D0C0B0", previewHex: "#D0C0B0", handleHex: "#2D3748", category: "stone", availableFor: ['door'], swatchUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/grattalight (1).jpg", textureUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/grattalight (1).jpg" },
  { id: "gratta-dark", shortId: "GD", name: "グラッタダーク", price: 144000, handleColorClass: "bg-gray-300", hex: "#4A3B2A", previewHex: "#4A3B2A", handleHex: "#D1D5DB", category: "stone", availableFor: ['door'], swatchUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/grattadark.jpg", textureUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/grattadark.jpg" },
  { id: "ash", shortId: "ASH", name: "アッシュ", price: 144000, handleColorClass: "bg-gray-800", hex: "#D9CBB0", previewHex: "#D9CBB0", handleHex: "#2D3748", category: "wood", availableFor: ['door'], swatchUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/ash (1).jpg", textureUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/ash (1).jpg" },
  { id: "teak", shortId: "TEAK", name: "チーク", price: 144000, handleColorClass: "bg-gray-700", hex: "#8C6A4B", previewHex: "#8C6A4B", handleHex: "#4A5568", category: "wood", availableFor: ['door'], swatchUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/teack.jpg", textureUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/teack.jpg" },
  { id: "walnut", shortId: "WN", name: "ウォルナット", price: 144000, handleColorClass: "bg-gray-300", hex: "#5D4037", previewHex: "#5D4037", handleHex: "#D1D5DB", category: "wood", availableFor: ['door'], swatchUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/wallnat.jpg", textureUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/wallnat.jpg" }
];

export const HANDLES: DoorOption<HandleId>[] = [
  { id: "satin-nickel", name: "サテンニッケル", price: 0 },
  { id: "white", name: "ホワイト", price: 0 },
  { id: "black", name: "マットブラック", price: 0 }
];

export const GLASS_STYLES: DoorOption<GlassStyleId>[] = [
  { id: "none", name: "ガラスなし", price: 0 },
  { id: "clear", name: "透明強化ガラス5mm", price: 27300 },
  { id: "frosted", name: "すりガラス", price: 21300 }
];

export const LOCKS: DoorOption<LockId>[] = [
    { id: "none", name: "なし", price: 0 },
    { id: "display-lock", name: "表示錠", price: 2000 }
];

export const DIVIDERS: DoorOption<DividerId>[] = [
  { id: "none", name: "なし", price: 0 },
  { id: "glass-70", name: "ガラスディバイダー (W700/H300)", price: 0 }
];

export const STORAGE_OPTIONS: DoorOption<StorageOptionId>[] = [
    { id: 'counter-plan', name: 'カウンタープラン', price: 0 },
    { id: 'dining-storage-plan', name: 'ダイニング収納プラン', price: 130000 },
];

export const KITCHEN_OPTIONS: DoorOption<KitchenOptionId>[] = [
    { id: 'inner-drawer', name: '内引出し', price: 34400, swatchUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/uchihikidashi.jpg" },
    { id: 'cross-gallery', name: 'クロスギャラリー', price: 4000, swatchUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/kurosuhikidashi.jpg" },
    { id: 'non-slip-mat', name: 'ノンスリップマット', price: 18500, swatchUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/nonslipmat.jpg" },
    { id: 'non-slip-mat-inner', name: 'ノンスリップマット (内引出)', price: 33500, swatchUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/nonslipmat.jpg" },
];

export const DISHWASHERS: DoorOption<DishwasherId>[] = [
    {
      "id": "rinnai-405am",
      "name": "浅型食洗機/リンナイRKW-405AM-SV",
      "price": 0,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/asagata.jpg"
    },
    {
      "id": "rinnai-sd401gpma",
      "name": "深型食洗機/リンナイ RKW-SD401GPMA",
      "price": 124000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/fuka.jpg"
    },
    {
      "id": "panasonic-45md9waa",
      "name": "深型食洗機/パナソニック NP-45MD9WAA",
      "price": 182000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/NP-45MD9WAA.jpg"
    },
    {
      "id": "miele-g5434sci",
      "name": "Miele/W450 G5434Sciステンレススチール",
      "price": 235000,
      "swatchUrl": " http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/miele45.jpg"
    },
    {
      "id": "miele-g5644sci",
      "name": "Miele/W450 G5644SCi ED",
      "price": 350000,
      "swatchUrl": " http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/miele45frontopen0.jpg"
    },
    {
      "id": "miele-7130sci",
      "name": "Miele/W600 7130CSCIED",
      "price": 441000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/G-7130-C-SCi-ED.jpg"
    },
    {
      "id": "bosch-spi4hds006",
      "name": "BOSCH/W450 SPI4HDS006",
      "price": 165000,
      "swatchUrl": " http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/SPI4HDS006.jpg"
    },
    {
      "id": "none",
      "name": "食洗機なし",
      "price": 0,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/nasi.jpg"
    }
];

export const GAS_STOVES: DoorOption<GasStoveId>[] = [
    {
      "id": "paloma-pkd-509ws",
      "name": "パロマ/PKD-509WS-60GK W600",
      "price": 0,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/gusbasic.jpg"
    },
    {
      "id": "paloma-brillio-pd-743ws",
      "name": "パロマ BRilliO/PD-743WS-75GH W750シルバー",
      "price": 61000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/PD-743W-75GZ.jpg"
    },
    {
      "id": "paloma-brillio-pd-743w",
      "name": "パロマ BRilliO /PD-743W-75GZ W750 ブラック",
      "price": 61000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/PD-743WS-75GH.jpg"
    },
    {
      "id": "rinnai-lisse",
      "name": "リンナイ リッセ/RHB71W42J5RSTW W750",
      "price": 226000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/RHB71W38M11RCBW.jpg"
    },
    {
      "id": "rinnai-delicia",
      "name": "リンナイ DELICIA/RHB71W38M11RCBW W750",
      "price": 310000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/DELICIA.jpg"
    },
    {
      "id": "harman-do",
      "name": "ハーマン +do/DW35S9JTKSTED W750",
      "price": 237000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/DW35S9JTKSTED.jpg"
    },
    {
      "id": "rinnai-rd641stsa",
      "name": "リンナイ グリルレス/RD641STSA W600",
      "price": 139000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/RD641STSA.jpg"
    }
];

export const IH_HEATERS: DoorOption<IhHeaterId>[] = [
    {
      "id": "mitsubishi-cs-g318m",
      "name": "三菱電機CS-G318M W600",
      "price": 0,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/IHbasic.jpg"
    },
    {
      "id": "panasonic-ys-ch-trs6c",
      "name": "パナソニック/YS CH-TRS6C W600",
      "price": 191000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/CH-TRS6C.jpg"
    },
    {
      "id": "panasonic-ys-ch-trs7c",
      "name": "パナソニック/YS CH-TRS7C W750",
      "price": 203000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/CH-TRS7C.jpg"
    },
    {
      "id": "panasonic-ch-mrs7a1",
      "name": "パナソニック/CH-MRS7A1 W750",
      "price": 286000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/CH-MRS7A1.jpg"
    },
    {
      "id": "hitachi-ht-n150ktwf",
      "name": "日立 HT-N150KTWF-K W750",
      "price": 301000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/M150T.jpg"
    },
    {
      "id": "mitsubishi-cs-t322bfr",
      "name": "三菱電機/グリスレスCS-T322BFR",
      "price": 309000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/CS-T322BFR.jpg"
    },
    {
      "id": "none",
      "name": "加熱機器なし（支給）",
      "price": 0
    }
];

export const RANGE_HOODS: DoorOption<RangeHoodId>[] = [
    // Peninsula
    {
      "id": "shvrl-3a-901-si",
      "name": "シルバー/SHVRL-3A-901-SI",
      "price": 0,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/SHVRL-3A-901-SI.jpg"
    },
    {
      "id": "shvrl-3a-901-bk",
      "name": "ブラック/SHVRL-3A-901-BK",
      "price": 0,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/SHVR-3A-901BK.jpg"
    },
    {
      "id": "shvrl-3a-901-w",
      "name": "ホワイト/SHVRL-3A-901-W",
      "price": 0,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/SHVR-3A-901WH.jpg"
    },
    {
      "id": "fujioh-shvrl-3a-901v-si",
      "name": "FUJIOH 同時給排シルバー/ SHVRL-3A-901V-SI",
      "price": 56000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/SHVRL-3A-901V.jpg"
    },
    {
      "id": "fujioh-shvrl-3a-901v-bk",
      "name": "FUJIOH 同時給排 ブラック/ SHVRL-3A-901V-BK",
      "price": 56000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/SHVRL-3A-901V-BK.jpg"
    },
    {
      "id": "fujioh-shvrl-3a-901v-w",
      "name": "FUJIOH 同時給排ホワイト/ SHVRL-3A-901V-W",
      "price": 56000,
      "swatchUrl": " http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/SHVRL-3A-901V-W.jpg"
    },
    // Island
    {
      "id": "flbt-90s-s5680",
      "name": "ステンレス/FLBT-90S S5680",
      "price": 0,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/rengefood/island-2.jpg"
    },
    {
      "id": "fujioh-cblrl-3r-901vsi",
      "name": "FUJIOH 同時給排 CBLRL-3R-901VSI",
      "price": 149000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/rengefood/CBLRL-3R-901VSI.jpg"
    },
    // Type I / II
    {
      "id": "asr-3a-9027-si",
      "name": "シルバー/ASR-3A-9027",
      "price": 0,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/rengefood/iSV.jpg"
    },
    {
      "id": "asr-3a-9027-bk",
      "name": "ブラック/ASR-3A-9027",
      "price": 0,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/rengefood/iBK.jpg"
    },
    {
      "id": "asr-3a-9027-w",
      "name": "ホワイト/ASR-3A-9027",
      "price": 0,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/rengefood/iWH.jpg"
    },
    {
      "id": "ariafina-bar-903-s4",
      "name": "アリアフィーナ/ステンレス BAR-903 S4",
      "price": 155000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/rengefood/BAR903S4.jpg"
    },
    {
      "id": "ariafina-bar-903-tb",
      "name": "アリアフィーナ/ブラック BAR-903 TB",
      "price": 155000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/rengefood/BAR903bk.jpg"
    },
    {
      "id": "ariafina-bar-903-tw",
      "name": "アリアフィーナ/ホワイト BAR-903 TW",
      "price": 155000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/rengefood/BAR903tw.jpg"
    },
    {
      "id": "fujioh-asr-3a-9027v-si",
      "name": "FUJIOH 同時給排/ASR-3A-9027V シルバー",
      "price": 118000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/rengefood/productSV.jpg"
    },
    {
      "id": "fujioh-asr-3a-9027v-bk",
      "name": "FUJIOH 同時給排/ASR-3A-9027V ブラック",
      "price": 118000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/rengefood/productBK.jpg"
    },
    {
      "id": "fujioh-asr-3a-9027v-w",
      "name": "FUJIOH 同時給排/ASR-3A-9027V ホワイト",
      "price": 118000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/rengefood/productWH.jpg"
    },
    {
      "id": "no-hood",
      "name": "レンジフードなし",
      "price": -30000
    }
];

export const RANGE_HOOD_OPTIONS: DoorOption<RangeHoodOptionId>[] = [
    { "id": "none", "name": "オプションなし", "price": 0 },
    { "id": "damper-100v", "name": "電動給気ダンパー用 100V出力線", "price": 8000, "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/100vsen.jpg" },
    { "id": "damper-shutter-100v", "name": "給気用100V出力線+電動排気シャッター", "price": 30000, "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/haikishutter.png" },
    { "id": "height-change-700", "name": "高さ変更 標準H700mm", "price": 13000 },
    { "id": "height-change-850", "name": "高さ変更 標準H700-850mm", "price": 12000 },
    { "id": "top-plate", "name": "上部塞ぎ板", "price": 13000 }
];

export const FAUCETS: DoorOption<FaucetId>[] = [
    {
      "id": "grohe-jp205702",
      "name": "GROHE ユーロスタイル/JP205702",
      "price": 0,
      "swatchUrl": " http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/groheeurostyle.jpg"
    },
    {
      "id": "sanei-k87122ejv",
      "name": "SANEI column K87122EJV",
      "price": 26000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/Hansgrohe Zesis74800674-1.jpg"
    },
    {
      "id": "hansgrohe-74800674",
      "name": "Hansgrohe Zesis M33/74800674",
      "price": 48000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/Hansgrohe Zesis74800674-1.jpg"
    },
    {
      "id": "sanei-k8731e1jv",
      "name": "SANEI SUTTO K8731E1JV-13 クローム",
      "price": 55000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/SANEI-SUITO.jpg"
    },
    {
      "id": "sanei-k8781jv-djp",
      "name": "SANEI MONOTONブラック K8781JV-DJP-13",
      "price": 180000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/SANEIMONOTONK8781JV-DJP-13.jpg"
    },
    {
      "id": "grohe-3028020",
      "name": "GROHE ミンタ/3028020",
      "price": 54000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/minta3028020J.jpg"
    },
    {
      "id": "grohe-32321gn2j",
      "name": "GROHE ミンタ/32321GN2J-2",
      "price": 47900,
      "swatchUrl": " http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/minta32321GN2J-2-1.jpg"
    },
    {
      "id": "sanei-ek8700e",
      "name": "SANEI タッチレスEK8700E",
      "price": 65000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/SANEIEK8700E.jpg"
    },
    {
      "id": "takagi-ls106mn",
      "name": "TAKAGI 浄水器内蔵/LS106MN-NNBN01 メッキ",
      "price": 23000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/TAKAGILS106MN-NNBN01.jpg"
    },
    {
      "id": "takagi-ls106bn",
      "name": "TAKAGI 浄水器内蔵/LS106BN-NNBN01 ブラック",
      "price": 54000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/TAKAGILS106BN-NNBN01.jpg"
    },
    {
      "id": "takagi-jy396mn",
      "name": "TAKAGI 浄水器+ウルトラファインバブル/JY396MN-NNE",
      "price": 40000,
      "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/TAKAGIJY396MN-NNBN01-1.jpg"
    },
    {
      "id": "takagi-lc122mn",
      "name": "TAKAGI タッチレス LC122MN-3NB802",
      "price": 72000,
      "swatchUrl": " http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/TAKAGILC122MN-3NB801.jpg"
    },
    {
      "id": "none",
      "name": "水栓金具なし",
      "price": 0
    },
];

export const SINK_ACCESSORIES: DoorOption<SinkAccessoryId>[] = [
    { "id": "none", "name": "なし", "price": 0 },
    { "id": "basket-s", "name": "バスケット(小) WB-430", "price": 8000, "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/bascketsmall.jpg" },
    { "id": "detergent-box", "name": "洗剤BOX BXS-100", "price": 8000, "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/senzaibox.jpg" },
    { "id": "cutlery-box", "name": "カトラリーBOX BXC-60", "price": 8000, "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/katoraribox.jpg" },
    { "id": "plate-no-hole", "name": "穴なしプレート P-430C", "price": 13000, "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/ananashiplate.jpg" },
    { "id": "plate-hole", "name": "穴あきプレート P-430B", "price": 13000, "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/anaakiplate.jpg" },
    { "id": "basket-l", "name": "バスケット(大) WB15-225", "price": 13000, "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/bascketbig.jpg" },
    { "id": "steers", "name": "ステアズ S-410", "price": 11000, "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/suteazu.jpg" },
    { "id": "cutting-board", "name": "カッティングボード CBR-430", "price": 19000, "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/cuttingboard.jpg" },
    { "id": "palette", "name": "パレット WP-410", "price": 13000, "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/palette.jpg" },
    { "id": "under-plate", "name": "アンダープレート P-410B", "price": 13000, "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/underplate.jpg" }
];

export const KITCHEN_PANELS: DoorOption<KitchenPanelId>[] = [
    { "id": "none", "name": "なし", "price": 0 },
    { "id": "aica-fkm6000zgn-1", "name": "マットホワイト/AICA FKM6000ZGN 1枚", "price": 39000, "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/mattwhite.jpg" },
    { "id": "aica-fkm6000zgn-2", "name": "マットホワイト/AICA FKM6000ZGN 2枚", "price": 59000, "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/mattwhite.jpg" },
    { "id": "aica-fkm6000zgn-3", "name": "マットホワイト/AICA FKM6000ZGN 3枚", "price": 78000, "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/mattwhite.jpg" },
    { "id": "aica-fas809zmn-1", "name": "メタリックシルバー/AICA FAS809ZMN 1枚", "price": 39000, "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/metalicsilver.jpg" },
    { "id": "aica-fas809zmn-2", "name": "メタリックシルバー/AICA FAS809ZMN 2枚", "price": 59000, "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/metalicsilver.jpg" },
    { "id": "aica-fas809zmn-3", "name": "メタリックシルバー/AICA FAS809ZMN 3枚", "price": 78000, "swatchUrl": "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/photo/metalicsilver.jpg" }
];

export const CUPBOARD_TYPES: DoorOption<CupboardTypeId>[] = [
    { id: 'none', name: 'なし', price: 0 },
    { id: 'floor', name: 'フロア', price: 0 },
    { id: 'separate', name: 'セパレート', price: 0 },
    { id: 'tall', name: 'トール', price: 0 },
    { id: 'mix', name: 'ミックス', price: 0 },
];

export const CUPBOARD_STORAGE_TYPES: DoorOption<CupboardStorageTypeId>[] = [
  { id: 'opening', name: '開き', price: 0, swatchUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/cupboard/tallhiraki.jpg" },
  { id: 'drawer', name: '引出し', price: 0, swatchUrl: "http://25663cc9bda9549d.main.jp/aistudio/linekitchen/cupboard/tallhiki.jpg" },
  { id: 'opening-open', name: '開き＋オープン', price: 0 },
  { id: 'drawer-open', name: '引出し＋オープン', price: 0 },
  { id: 'opening-appliance', name: '開き＋家電収納', price: 0 },
  { id: 'drawer-appliance', name: '引出し＋家電収納', price: 0 },
];

export const CUPBOARD_OPTION_PANELS: DoorOption<CupboardOptionPanelId>[] = [
  { id: 'none', name: 'なし', price: 0 },
  { id: 'one-side', name: '片側', price: 20000 },
];

export const INITIAL_CONFIG: DoorConfiguration = {
  doorType: 'unselected',
  color: 'natural-white',
  counterColor: 'stainless',
  handle: 'satin-nickel',
  glassStyle: 'none',
  lock: 'none',
  divider: 'glass-70',
  width: 255,
  height: 85,
  count: 1,
  hingeSide: 'left',
  sinkPosition: 'left',
  frameType: 'twoWay',
  backStyle: 'counter',
  sinkBaseType: 'drawers',
  typeIIStyle: 'peninsula',
  storageOption: 'counter-plan',
  hasInnerDrawer: false,
  hasCrossGallery: false,
  hasNonSlipMat: false,
  hasHangingCabinet: false,
  hangingCabinetHeight: 70, // Default height
  dishwasher: 'rinnai-405am',
  gasStove: 'paloma-pkd-509ws',
  ihHeater: null,
  rangeHood: 'shvrl-3a-901-si',
  rangeHoodOption: 'none',
  faucet: 'grohe-jp205702',
  sinkAccessories: [],
  kitchenPanel: 'none',
  cupboardType: 'none',
  cupboardWidth: 169,
  cupboardDepth: 45,
  cupboardLayout: 'left',
  cupboardStorageType: 'opening',
  confirmedCupboard: null,
};

export const SHIPPING_RATES: { [key: string]: number } = {
  '北海道': 100000, '青森県': 80000, '岩手県': 80000, '宮城県': 70000, '秋田県': 80000,
  '山形県': 70000, '福島県': 70000, '茨城県': 60000, '栃木県': 60000, '群馬県': 60000,
  '埼玉県': 60000, '千葉県': 60000, '東京都': 60000, '神奈川県': 60000, '新潟県': 70000,
  '富山県': 70000, '石川県': 70000, '福井県': 70000, '山梨県': 60000, '長野県': 60000,
  '岐阜県': 50000, '静岡県': 50000, '愛知県': 50000, '三重県': 50000, '滋賀県': 50000,
  '京都府': 60000, '大阪府': 60000, '兵庫県': 60000, '奈良県': 50000, '和歌山県': 60000,
  '鳥取県': 80000, '島根県': 80000, '岡山県': 70000, '広島県': 80000, '山口県': 80000,
  '徳島県': 80000, '香川県': 80000, '愛媛県': 80000, '高知県': 80000, '福岡県': 90000,
  '佐賀県': 90000, '長崎県': 100000, '熊本県': 90000, '大分県': 90000, '宮崎県': 100000,
  '鹿児島県': 100000, '沖縄県': 150000
};

// FIX: Export PREFECTURES constant to be used in other components.
export const PREFECTURES = Object.keys(SHIPPING_RATES);

export const CUPBOARD_PRICES: CupboardPriceMatrix = {
  floor: { 45: { 94: 115000, 169: 187000, 184: 202000, 244: 260000, 259: 275000, 274: 290000 }, 60: { 94: 125000, 169: 197000, 184: 212000, 244: 270000, 259: 285000, 274: 300000 }, 65: { 94: 125000, 169: 197000, 184: 212000, 244: 270000, 259: 285000, 274: 300000 } },
  separate: { 45: { 94: 200000, 169: 310000, 184: 335000, 244: 430000, 259: 455000, 274: 480000 }, 60: { 94: 210000, 169: 320000, 184: 345000, 244: 440000, 259: 465000, 274: 490000 }, 65: { 94: 210000, 169: 320000, 184: 345000, 244: 440000, 259: 465000, 274: 490000 } },
  tall: { 45: { 94: 220000, 169: 350000, 184: 380000, 244: 490000, 259: 520000, 274: 550000 } },
  mix: { 45: { 169: 374000, 184: 398000, 244: 508000, 259: 538000, 274: 568000 } }
};

export const CUPBOARD_COUNTER_PRICES: CupboardCounterPriceMatrix = {
    stainless450: { 94: 15000, 169: 20000, 184: 22000, 244: 30000, 259: 32000, 274: 34000 },
    stainless600: { 94: 20000, 169: 25000, 184: 27000, 244: 35000, 259: 37000, 274: 39000 }
};

export const CUPBOARD_DOOR_PRICES: CupboardDoorPriceMatrix = {
    floor: { premium: { 94: 20000, 169: 30000, 184: 33000, 244: 40000, 259: 43000, 274: 46000 } },
    separate: { premium: { 94: 30000, 169: 45000, 184: 48000, 244: 60000, 259: 63000, 274: 66000 } },
    tall: { premium: { 94: 35000, 169: 50000, 184: 53000, 244: 65000, 259: 68000, 274: 71000 } },
    mix: { premium: { 169: 55000, 184: 58000, 244: 70000, 259: 73000, 274: 76000 } }
};