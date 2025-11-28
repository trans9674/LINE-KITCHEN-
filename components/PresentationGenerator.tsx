
import React from 'react';
import { createRoot } from 'react-dom/client';
import { SavedDoor, DoorOption, DoorTypeId, FrameTypeId, ColorOption, HandleId, GlassStyleId, LockId, ProjectInfo, DividerId, DishwasherId, GasStoveId, IhHeaterId, RangeHoodId, RangeHoodOptionId, FaucetId, SinkAccessoryId, KitchenPanelId, StorageOptionId, KitchenOptionId, CupboardTypeId } from '../types';
import PrintDoorPreview from './PrintDoorPreview';
import { getOptionName, getProxiedImageUrl } from '../utils';

interface Props {
  type: 'presentation' | 'quotation' | 'drawing';
  doors: SavedDoor[];
  settings: {
    doorTypes: DoorOption<DoorTypeId>[];
    frameTypes: DoorOption<FrameTypeId>[];
    colors: ColorOption[];
    handles: DoorOption<HandleId>[];
    glassStyles: DoorOption<GlassStyleId>[];
    locks: DoorOption<LockId>[];
    dividers: DoorOption<DividerId>[];
    dishwashers: DoorOption<DishwasherId>[];
    gasStoves: DoorOption<GasStoveId>[];
    ihHeaters: DoorOption<IhHeaterId>[];
    rangeHoods: DoorOption<RangeHoodId>[];
    rangeHoodOptions: DoorOption<RangeHoodOptionId>[];
    faucets: DoorOption<FaucetId>[];
    sinkAccessories: DoorOption<SinkAccessoryId>[];
    kitchenPanels: DoorOption<KitchenPanelId>[];
    storageOptions: DoorOption<StorageOptionId>[];
    kitchenOptions: DoorOption<KitchenOptionId>[];
    cupboardTypes: DoorOption<CupboardTypeId>[];
    cupboardPrices: any;
    cupboardDoorPrices: any;
    cupboardCounterPrices: any;
  };
  projectInfo: ProjectInfo;
  screenshotUrl?: string | null;
}

const PrintLayout: React.FC<Props> = ({ type, doors, settings, projectInfo, screenshotUrl }) => {
  const doorsTotal = doors.reduce((sum, d) => sum + d.price, 0);
  // Shipping cost hidden for quotation
  const shippingCost = type === 'quotation' ? 0 : (projectInfo.shippingCost || 0);
  const subTotal = doorsTotal + shippingCost;
  const taxAmount = Math.floor(subTotal * 0.1);
  const totalWithTax = subTotal + taxAmount;
  
  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

  // Helper to generate the spec string
  const getSpecString = (config: any) => {
      let depthStr = "65cm";
      if (['peninsula', 'island', 'type-ii', 'type-ii-stove-240', 'type-ii-stove-255', 'type-ii-stove-270'].includes(config.doorType)) {
          depthStr = config.backStyle === 'storage' ? "90cm" : "75cm";
      }
      const dividerStr = config.divider === 'none' ? 'キッチンディバイダーなし' : 'ガラスディバイダーあり';
      const sinkStr = config.sinkBaseType === 'drawers' ? 'シンク下 引出し' : 'シンク下 オープン';
      
      if (config.doorType === 'type-i') {
          return `奥行65cm、${sinkStr}`;
      }
      return `カウンタータイプ 奥行${depthStr}、${dividerStr}、${sinkStr}`;
  };

  if (type === 'drawing') {
    return (
        <div className="p-12 mx-auto bg-white min-h-screen text-gray-900 w-full box-border">
            <div className="flex justify-between items-end border-b-2 border-gray-800 pb-4 mb-8">
                <div>
                   <h1 className="text-2xl font-bold mb-2">仕様詳細図</h1>
                   <div className="flex flex-col gap-1 text-sm text-gray-800">
                       <p className="font-bold text-lg">{projectInfo.customerName ? `${projectInfo.customerName} 様邸` : ''}</p>
                       {projectInfo.constructionLocation && <p>建築地: {projectInfo.constructionLocation}</p>}
                       {projectInfo.constructionCompany && <p>施工: {projectInfo.constructionCompany}</p>}
                   </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">作成日: {today}</p>
                  <p className="text-xl font-bold tracking-widest mt-1">LINE KITCHEN</p>
                </div>
            </div>

            <div className="space-y-12">
                {doors.map((door, index) => (
                    <div key={door.id} className="break-inside-avoid border border-gray-300 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 p-3 border-b border-gray-300 flex justify-between items-center">
                            <h2 className="font-bold text-lg text-gray-800">
                                {index + 1}. {getOptionName(settings.doorTypes, door.config.doorType)}
                                {door.roomName && <span className="ml-3 text-base font-normal text-gray-600">({door.roomName})</span>}
                            </h2>
                            <span className="font-mono font-bold text-gray-500">W{door.config.width} x H{door.config.height}</span>
                        </div>
                        <div className="p-6 flex flex-row gap-8">
                            <div className="w-1/2 flex flex-col gap-4">
                                <div className="aspect-video w-full border border-gray-200 bg-gray-50 relative rounded">
                                     <PrintDoorPreview config={door.config} colors={settings.colors} />
                                </div>
                            </div>
                            <div className="w-1/2">
                                <h3 className="font-bold border-b border-gray-800 pb-1 mb-3">仕様詳細</h3>
                                <table className="w-full text-sm">
                                    <tbody>
                                        {[
                                            ['タイプ', getOptionName(settings.doorTypes, door.config.doorType)],
                                            ['サイズ', `幅 ${door.config.width}cm / 高さ ${door.config.height}cm`],
                                            ['扉カラー', getOptionName(settings.colors, door.config.color)],
                                            ['カウンター', getOptionName(settings.colors, door.config.counterColor)],
                                            ['取手', getOptionName(settings.handles, door.config.handle)],
                                            ['シンク位置', door.config.sinkPosition === 'left' ? '左' : '右'],
                                            ['その他', door.config.divider !== 'none' ? getOptionName(settings.dividers, door.config.divider) : '-']
                                        ].map(([label, value]) => (
                                            <tr key={label} className="border-b border-gray-100">
                                                <th className="py-2 text-left font-medium text-gray-500 w-32">{label}</th>
                                                <td className="py-2 text-gray-900">{value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
             <div className="mt-8 pt-4 border-t border-gray-300 text-right text-xs text-gray-400">
                <p>※図面はイメージです。詳細な納まり等は別途承認図をご確認ください。</p>
            </div>
        </div>
    );
  }

  if (type === 'presentation') {
    return (
      <div className="p-8 mx-auto bg-white min-h-screen text-gray-900 w-full box-border">
        {/* Header */}
        <div className="flex justify-between items-end border-b-2 border-gray-800 pb-2 mb-6">
          <div>
             <h1 className="text-2xl font-bold mb-1">プレゼンテーションボード</h1>
             <div className="flex gap-4 text-sm text-gray-800">
                 {projectInfo.customerName && <span className="font-bold">{projectInfo.customerName} 様邸</span>}
                 {projectInfo.constructionLocation && <span>建築地: {projectInfo.constructionLocation}</span>}
                 {projectInfo.constructionCompany && <span>{projectInfo.constructionCompany} 御中</span>}
             </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">作成日: {today}</p>
            <p className="text-lg font-bold">LINE KITCHEN</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-12">
          {doors.map((door, index) => {
            const isMaterial = door.config.doorType.startsWith('material-');
            
            // Helper to find option object
            const findOpt = (list: any[], id: string) => list.find(i => i.id === id);

            // 1. Basic Info
            const doorTypeObj = findOpt(settings.doorTypes, door.config.doorType);
            const typeName = doorTypeObj ? doorTypeObj.name : '不明';
            const sizeText = `W${door.config.width} × H${door.config.height}`;
            
            // 2. Colors
            const doorColor = findOpt(settings.colors, door.config.color);
            const counterColor = findOpt(settings.colors, door.config.counterColor);

            // 3. Equipment & Options
            const equipments = [];
            // Faucet
            const faucet = findOpt(settings.faucets, door.config.faucet);
            if (faucet) equipments.push({ label: '水栓', ...faucet });
            // Dishwasher
            const dw = findOpt(settings.dishwashers, door.config.dishwasher);
            if (dw) equipments.push({ label: '食洗機', ...dw });
            // Stove
            if (door.config.gasStove) {
                const gas = findOpt(settings.gasStoves, door.config.gasStove);
                if(gas) equipments.push({ label: '加熱機器', ...gas });
            }
            if (door.config.ihHeater) {
                const ih = findOpt(settings.ihHeaters, door.config.ihHeater);
                if(ih) equipments.push({ label: '加熱機器', ...ih });
            }
            // Hood
            const hood = findOpt(settings.rangeHoods, door.config.rangeHood);
            if (hood && hood.id !== 'no-hood') equipments.push({ label: 'レンジフード', ...hood });

            // Kitchen Options
            if (door.config.hasInnerDrawer) {
                const opt = findOpt(settings.kitchenOptions, 'inner-drawer');
                if (opt) equipments.push({ label: 'キッチンOP', ...opt });
            }
            if (door.config.hasCrossGallery) {
                const opt = findOpt(settings.kitchenOptions, 'cross-gallery');
                if (opt) equipments.push({ label: 'キッチンOP', ...opt });
            }
            if (door.config.hasNonSlipMat) {
                const id = door.config.hasInnerDrawer ? 'non-slip-mat-inner' : 'non-slip-mat';
                const opt = findOpt(settings.kitchenOptions, id);
                if (opt) equipments.push({ label: 'キッチンOP', ...opt });
            }

            // Sink Accessories
            (door.config.sinkAccessories || []).forEach(accId => {
                const acc = findOpt(settings.sinkAccessories, accId);
                if (acc && acc.id !== 'none') equipments.push({ label: 'シンクAcc', ...acc });
            });

            // Kitchen Panel
            const panel = findOpt(settings.kitchenPanels, door.config.kitchenPanel);
            if (panel && panel.id !== 'none') equipments.push({ label: 'パネル', ...panel });

            // Range Hood Option
            const hoodOpt = findOpt(settings.rangeHoodOptions, door.config.rangeHoodOption);
            if (hoodOpt && hoodOpt.id !== 'none') equipments.push({ label: 'フードOP', ...hoodOpt });

            // 4. Cupboard
            let cupboardText = 'なし';
            if (door.config.confirmedCupboard) {
                const { type, width, depth } = door.config.confirmedCupboard;
                const cType = findOpt(settings.cupboardTypes, type);
                cupboardText = `${cType ? cType.name : type} W${width} / D${depth}`;
                if (type === 'mix') {
                    cupboardText += ` / ${door.config.cupboardLayout === 'left' ? '左配置' : '右配置'}`;
                }
            } else if (door.config.cupboardType !== 'none') {
                 const cType = findOpt(settings.cupboardTypes, door.config.cupboardType);
                 cupboardText = `${cType ? cType.name : door.config.cupboardType} (未確定)`;
            }

            // 5. Options (Summary for left side)
            // Kitchen Options Summary
            const activeKitchenOpts = [];
            if (door.config.hasInnerDrawer) activeKitchenOpts.push('内引出し');
            if (door.config.hasCrossGallery) activeKitchenOpts.push('クロスギャラリー');
            if (door.config.hasNonSlipMat) activeKitchenOpts.push('ノンスリップマット');
            const kitchenOptText = activeKitchenOpts.length > 0 ? activeKitchenOpts.join(', ') : 'なし';

            // Sink Accessories Summary
            const activeSinkAccs = (door.config.sinkAccessories || []).map(id => {
                const acc = findOpt(settings.sinkAccessories, id);
                return acc ? acc.name : null;
            }).filter(Boolean);
            const sinkAccText = activeSinkAccs.length > 0 ? activeSinkAccs.join(', ') : 'なし';

            // Panel Summary
            const panelText = (panel && panel.id !== 'none') ? panel.name : 'なし';

            // Hood Option Summary
            const hoodOptText = (hoodOpt && hoodOpt.id !== 'none') ? hoodOpt.name : 'なし';

            const useScreenshot = (index === 0 && screenshotUrl);
            const specString = getSpecString(door.config);

            return (
            <div key={door.id} className="break-inside-avoid">
               <div className="flex flex-row gap-8 items-start">
                   
                   {/* LEFT COLUMN: Main Info & Visuals (50%) */}
                   <div className="w-1/2 flex flex-col gap-6">
                       
                       {/* Top Details */}
                       <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-800">
                            <h2 className="text-xl font-bold text-gray-800 mb-1">
                                {typeName}
                                {door.roomName && <span className="ml-3 text-base font-normal text-gray-600">({door.roomName})</span>}
                            </h2>
                            <div className="text-sm text-gray-600 font-bold mb-2">
                                {sizeText} / {door.roomName || 'Current Plan'}
                            </div>
                            <div className="text-sm text-gray-700 border-t border-gray-200 pt-2">
                                <span className="font-bold mr-2">仕様詳細:</span>
                                {specString}
                            </div>
                       </div>

                       {/* Visuals: 2 Cuts (Perspective & Plan) */}
                       {!isMaterial && (
                           <div className="flex gap-4 h-72">
                               {/* Cut 1: 3D Perspective */}
                               <div className="w-1/2 bg-white rounded border border-gray-200 overflow-hidden relative shadow-sm">
                                   {useScreenshot ? (
                                       <img src={useScreenshot} className="w-full h-full object-contain" alt="3D Perspective" />
                                   ) : (
                                       <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">No 3D Image</div>
                                   )}
                                   <div className="absolute top-0 left-0 bg-gray-800 text-white text-[10px] px-3 py-1 opacity-90 font-bold">Current Plan</div>
                               </div>
                               {/* Cut 2: Plan View (Schematic) */}
                               <div className="w-1/2 bg-white rounded border border-gray-200 relative shadow-sm p-4">
                                   <div className="w-full h-full relative">
                                       <PrintDoorPreview config={door.config} colors={settings.colors} />
                                   </div>
                               </div>
                           </div>
                       )}

                       {/* Colors */}
                       <div className="flex gap-8 border-t border-gray-200 pt-4">
                           <div className="flex items-center gap-3">
                               {doorColor && doorColor.swatchUrl ? (
                                   <img src={getProxiedImageUrl(doorColor.swatchUrl)} className="w-14 h-14 object-cover rounded border border-gray-200" />
                               ) : <div className="w-14 h-14 bg-gray-100 rounded border border-gray-200"></div>}
                               <div>
                                   <span className="block text-[10px] font-bold text-gray-400">扉カラー</span>
                                   <span className="font-bold text-base leading-tight">{doorColor ? doorColor.name : '-'}</span>
                               </div>
                           </div>
                           <div className="flex items-center gap-3">
                               {counterColor && counterColor.swatchUrl ? (
                                   <img src={getProxiedImageUrl(counterColor.swatchUrl)} className="w-14 h-14 object-cover rounded border border-gray-200" />
                               ) : <div className="w-14 h-14 bg-gray-100 rounded border border-gray-200"></div>}
                               <div>
                                   <span className="block text-[10px] font-bold text-gray-400">カウンター</span>
                                   <span className="font-bold text-base leading-tight">{counterColor ? counterColor.name : '-'}</span>
                               </div>
                           </div>
                       </div>

                       {/* Options List Summary */}
                       <div className="border-t border-gray-200 pt-4 text-xs space-y-2">
                          <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                              <span className="font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded text-center">カップボード</span>
                              <span className="text-sm">{cupboardText}</span>
                          </div>
                          <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                              <span className="font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded text-center">キッチンOP</span>
                              <span className="text-sm">{kitchenOptText}</span>
                          </div>
                          <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                              <span className="font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded text-center">シンクAcc</span>
                              <span className="text-sm">{sinkAccText}</span>
                          </div>
                          <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                              <span className="font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded text-center">パネル</span>
                              <span className="text-sm">{panelText}</span>
                          </div>
                          <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                              <span className="font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded text-center">フードOP</span>
                              <span className="text-sm">{hoodOptText}</span>
                          </div>
                       </div>
                   </div>

                   {/* RIGHT COLUMN: Equipment & Options (50%) */}
                   <div className="w-1/2 flex flex-col">
                        <h3 className="font-bold text-gray-500 mb-3 border-b border-gray-200 pb-1">設備機器・オプション</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {equipments.map((eq, i) => (
                                <div key={i} className="flex flex-row gap-3 items-center border border-gray-200 rounded p-2 bg-white shadow-sm">
                                    <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-gray-50 rounded overflow-hidden p-1 border border-gray-100">
                                        {eq.swatchUrl ? (
                                            <img src={getProxiedImageUrl(eq.swatchUrl)} className="w-full h-full object-contain" />
                                        ) : (
                                            <span className="text-[9px] text-gray-400">No Image</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="block text-[10px] font-bold text-gray-500 mb-0.5">{eq.label}</span>
                                        <span className="block text-xs font-bold leading-tight break-all">{eq.name}</span>
                                        {(eq.id === 'none' && eq.label === '加熱機器') && (
                                            <span className="block text-[9px] text-red-500 font-bold mt-1">※グリルレスの機器は使用できません。必ずグリル付きの製品を設置下さい。</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {equipments.length === 0 && <span className="text-gray-400 italic text-sm">なし</span>}
                        </div>
                   </div>

               </div>
            </div>
          )})}
        </div>
        
        <div className="mt-4 pt-2 border-t border-gray-300 text-right text-[10px] text-gray-400">
            <p>※本図はイメージです。実際の色味や質感とは異なる場合があります。</p>
        </div>
      </div>
    );
  }

  // Quotation Layout (Formal Japanese Style)
  return (
    <div className="p-8 max-w-[210mm] mx-auto bg-white min-h-screen text-gray-900 box-border">
      {/* Header Area */}
      <div className="flex justify-between items-start mb-2">
          <div className="w-1/2">
              <div className="border-b border-gray-800 pb-1 mb-2 inline-block min-w-[280px]">
                  <span className="text-xl ml-2 font-bold">{projectInfo.customerName ? `${projectInfo.customerName} 様` : '　　　　　　　　　様'}</span>
              </div>
              <div className="text-xs space-y-1">
                  <p>下記の通り御見積申し上げます。</p>
                  <p className="font-bold">件名: キッチン 御見積書</p>
                  {projectInfo.constructionLocation && <p>建築地: {projectInfo.constructionLocation}</p>}
                  {projectInfo.constructionCompany && <p>建築会社: {projectInfo.constructionCompany}</p>}
              </div>
          </div>
          <div className="w-1/2 text-right">
              <p className="text-[10px] text-gray-500 mb-1">No. {Date.now().toString().slice(-8)}</p>
              <p className="text-xs mb-2">発行日: {today}</p>
              <div className="inline-block text-left">
                  <h2 className="text-lg font-bold mb-1">LINE KITCHEN</h2>
                  <p className="text-[10px] text-gray-600">〒100-0000</p>
                  <p className="text-[10px] text-gray-600">東京都〇〇区〇〇 1-2-3</p>
                  <p className="text-[10px] text-gray-600">TEL: 03-0000-0000</p>
                  <div className="mt-2 w-16 h-16 border border-red-300 text-red-300 rounded-full flex items-center justify-center text-[10px] transform rotate-[-15deg] opacity-50 select-none ml-auto mr-4">
                      印
                  </div>
              </div>
          </div>
      </div>

      {/* Total Amount Box */}
      <div className="mb-4 border-b-4 border-double border-gray-800 pb-1">
          <div className="flex justify-between items-end px-2">
              <span className="text-base font-bold">御見積金額（税込）</span>
              <span className="text-3xl font-bold underline decoration-1 underline-offset-4">¥ {totalWithTax.toLocaleString()} -</span>
          </div>
      </div>

      {/* Detail Table */}
      <table className="w-full border-collapse border-t border-b border-gray-400 text-xs mb-4">
         <thead className="bg-gray-100">
            <tr>
              <th className="p-1.5 text-center w-10 border-b border-gray-300 font-semibold">No.</th>
              <th className="p-1.5 text-left border-b border-gray-300 font-semibold">品名・仕様</th>
              <th className="p-1.5 text-center w-12 border-b border-gray-300 font-semibold">数量</th>
              <th className="p-1.5 text-right w-20 border-b border-gray-300 font-semibold">単価</th>
              <th className="p-1.5 text-right w-24 border-b border-gray-300 font-semibold">金額</th>
            </tr>
         </thead>
         <tbody>
           {doors.map((door, doorIndex) => {
             const items = [];
             const { config } = door;
             let lineNo = 1;

             // 1. Base Unit
             const baseOption = settings.doorTypes.find(d => d.id === config.doorType);
             if (baseOption) {
                 items.push({ 
                     name: `キッチン本体 (${baseOption.name})`, 
                     spec: `W${config.width} × H${config.height} / ${door.roomName || ''}`, 
                     price: baseOption.price 
                 });
                 
                 const isTypeIIFamily = config.doorType === 'type-ii' || config.doorType.startsWith('type-ii-stove-');
                 if (isTypeIIFamily && config.typeIIStyle === 'island') {
                     items.push({ name: 'Ⅱ型アイランド仕様変更', spec: '', price: 80000 });
                 }
             }

             // 2. Specifications Row
             items.push({ name: '仕様詳細', spec: getSpecString(config), price: 0 });


             // 3. Counter & Door Color Upcharges
             const counterOpt = settings.colors.find(c => c.id === config.counterColor);
             if (counterOpt && counterOpt.price > 0) items.push({ name: 'カウンター変更', spec: counterOpt.name, price: counterOpt.price });

             const doorOpt = settings.colors.find(c => c.id === config.color);
             if (doorOpt && doorOpt.price > 0) items.push({ name: '扉カラー変更', spec: doorOpt.name, price: doorOpt.price });

             // 4. Appliances (Show even if 0 yen as per request)
             const dw = settings.dishwashers?.find(d => d.id === config.dishwasher);
             if (dw && dw.id !== 'none') items.push({ name: '食器洗い乾燥機', spec: dw.name, price: dw.price });

             const gas = settings.gasStoves?.find(d => d.id === config.gasStove);
             if (gas) items.push({ name: 'ガスコンロ', spec: gas.name, price: gas.price });

             const ih = settings.ihHeaters?.find(d => d.id === config.ihHeater);
             if (ih && ih.id !== 'none') items.push({ name: 'IHヒーター', spec: ih.name, price: ih.price });

             const hood = settings.rangeHoods?.find(d => d.id === config.rangeHood);
             if (hood && hood.id !== 'none' && hood.id !== 'no-hood') items.push({ name: 'レンジフード', spec: hood.name, price: hood.price });

             const hoodOpt = settings.rangeHoodOptions?.find(d => d.id === config.rangeHoodOption);
             if (hoodOpt) {
                 items.push({ name: 'レンジフードオプション', spec: hoodOpt.id !== 'none' ? hoodOpt.name : 'なし', price: hoodOpt.price });
             }

             const faucet = settings.faucets?.find(d => d.id === config.faucet);
             if (faucet && faucet.id !== 'none') items.push({ name: '水栓金具', spec: faucet.name, price: faucet.price });

             // 5. Options
             const storage = settings.storageOptions?.find(d => d.id === config.storageOption);
             if (storage && storage.price > 0) items.push({ name: '収納プラン', spec: storage.name, price: storage.price });

             // Kitchen Option: Inner Drawer
             if (config.hasInnerDrawer) {
                 const opt = settings.kitchenOptions?.find(o => o.id === 'inner-drawer');
                 if (opt) items.push({ name: 'キッチンオプション', spec: opt.name, price: opt.price });
             } else {
                 items.push({ name: 'キッチンオプション', spec: '内引出しなし', price: 0 });
             }

             if (config.hasCrossGallery) {
                 const opt = settings.kitchenOptions?.find(o => o.id === 'cross-gallery');
                 if (opt) items.push({ name: 'キッチンオプション', spec: opt.name, price: opt.price });
             }
             if (config.hasNonSlipMat) {
                 const id = config.hasInnerDrawer ? 'non-slip-mat-inner' : 'non-slip-mat';
                 const opt = settings.kitchenOptions?.find(o => o.id === id);
                 if (opt) items.push({ name: 'キッチンオプション', spec: opt.name, price: opt.price });
             }

             // 6. Accessories
             if (config.sinkAccessories && config.sinkAccessories.length > 0) {
                 config.sinkAccessories.forEach(accId => {
                     const acc = settings.sinkAccessories?.find(a => a.id === accId);
                     if (acc && acc.id !== 'none') items.push({ name: 'シンクアクセサリー', spec: acc.name, price: acc.price });
                 });
             } else {
                 items.push({ name: 'シンクアクセサリー', spec: 'なし', price: 0 });
             }

             // 7. Panel & Other
             const panel = settings.kitchenPanels?.find(p => p.id === config.kitchenPanel);
             if (panel) {
                 items.push({ name: 'キッチンパネル', spec: panel.id !== 'none' ? panel.name : 'なし', price: panel.price });
             }
             
             if (config.glassStyle && config.glassStyle !== 'none') {
                 const g = settings.glassStyles?.find(o => o.id === config.glassStyle);
                 if (g && g.price > 0) items.push({ name: 'ガラスオプション', spec: g.name, price: g.price });
             }
             
             if (config.lock && config.lock !== 'none') {
                 const l = settings.locks?.find(o => o.id === config.lock);
                 if (l && l.price > 0) items.push({ name: '錠前オプション', spec: l.name, price: l.price });
             }

             // 8. Cupboard
             if (config.confirmedCupboard) {
                 const { type, depth, width } = config.confirmedCupboard;
                 let cupboardTotal = settings.cupboardPrices?.[type]?.[depth]?.[width] || 0;
                 
                 const doorColorInfo = settings.colors.find(c => c.id === config.color);
                 const premiumColors = ['gratta-light', 'gratta-dark', 'ash', 'teak', 'walnut'];
                 if (doorColorInfo && premiumColors.includes(doorColorInfo.id) && type !== 'none') {
                    const typeKey = type as 'floor' | 'separate' | 'tall' | 'mix'; // cast for indexing
                    cupboardTotal += settings.cupboardDoorPrices?.[typeKey]?.['premium']?.[width] || 0;
                 }

                 if (type === 'floor' || type === 'separate') {
                    const counterColorInfo = settings.colors.find(c => c.id === config.counterColor);
                    if (counterColorInfo && counterColorInfo.id.startsWith('stainless')) {
                        const counterKey = depth === 45 ? 'stainless450' : 'stainless600';
                        cupboardTotal += settings.cupboardCounterPrices?.[counterKey]?.[width] || 0;
                    }
                 }
                 const typeName = settings.cupboardTypes?.find(t => t.id === type)?.name || type;
                 let specText = `${typeName} W${width} D${depth}`;
                 
                 if (type === 'mix') {
                     const layoutStr = config.cupboardLayout === 'left' ? '左 (L)' : '右 (R)';
                     specText += ` / 配置: ${layoutStr}`;
                 }
                 
                 items.push({ name: 'カップボード一式', spec: specText, price: cupboardTotal });
             }

             return (
               <React.Fragment key={door.id}>
                 {items.map((item, i) => (
                     <tr key={`${door.id}-${i}`} className="border-b border-dotted border-gray-300 hover:bg-gray-50">
                       <td className="p-1.5 text-center">{i === 0 ? doorIndex + 1 : ''}</td>
                       <td className="p-1.5">
                         <div className="font-bold text-sm text-gray-800 leading-tight">{item.name}</div>
                         {item.spec && <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{item.spec}</div>}
                       </td>
                       <td className="p-1.5 text-center">1</td>
                       <td className="p-1.5 text-right">{item.price.toLocaleString()}</td>
                       <td className="p-1.5 text-right">{item.price.toLocaleString()}</td>
                     </tr>
                 ))}
                 {/* Divider row between kitchens if multiple */}
                 {doors.length > 1 && doorIndex < doors.length - 1 && (
                     <tr className="bg-gray-100 border-b border-gray-300">
                         <td colSpan={5} className="h-1"></td>
                     </tr>
                 )}
               </React.Fragment>
             );
           })}
           
           {/* Filler rows to ensure table looks complete if few items - Reduced multiplier */}
           {Array.from({ length: Math.max(0, 3 - doors.length * 2) }).map((_, i) => (
               <tr key={`filler-${i}`} className="border-b border-dotted border-gray-200 h-8">
                   <td className="p-1.5 text-center"></td>
                   <td className="p-1.5"></td>
                   <td className="p-1.5 text-center"></td>
                   <td className="p-1.5 text-right"></td>
                   <td className="p-1.5 text-right"></td>
               </tr>
           ))}
         </tbody>
         <tfoot>
           <tr>
             <td colSpan={3} className="border-t border-gray-400"></td>
             <td className="p-1.5 text-right font-bold bg-gray-50 border-t border-gray-400">小計</td>
             <td className="p-1.5 text-right font-bold bg-gray-50 border-t border-gray-400">{subTotal.toLocaleString()}</td>
           </tr>
           <tr>
             <td colSpan={3}></td>
             <td className="p-1.5 text-right font-bold bg-gray-50">消費税 (10%)</td>
             <td className="p-1.5 text-right font-bold bg-gray-50">{taxAmount.toLocaleString()}</td>
           </tr>
           <tr>
             <td colSpan={3}></td>
             <td className="p-1.5 text-right font-bold bg-gray-100 border-t border-gray-800">合計</td>
             <td className="p-1.5 text-right font-bold text-base bg-gray-100 border-t border-gray-800">{totalWithTax.toLocaleString()}</td>
           </tr>
         </tfoot>
      </table>

      {/* Remarks / Notes */}
      <div className="border border-gray-300 p-4 rounded-lg h-32">
          <h4 className="text-xs font-bold text-gray-700 mb-1 border-b border-gray-200 pb-0.5 inline-block">備考</h4>
          <ul className="text-[10px] text-gray-600 space-y-0.5 list-disc list-inside">
              <li>御見積有効期限：発行日より1ヶ月とさせていただきます。</li>
              <li>本御見積は概算となります。現場状況により変動する場合がございます。</li>
              <li>施工費は別途となります。</li>
          </ul>
      </div>

      <div className="mt-8 text-center no-print">
        <button 
            onClick={() => window.print()} 
            className="bg-[#8b8070] text-white px-8 py-3 rounded-lg shadow-lg hover:bg-[#797061] transition-colors font-bold flex items-center justify-center mx-auto gap-2"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            印刷 / PDF保存
        </button>
        <p className="mt-4 text-sm text-gray-500">※ PDFとして保存するには、印刷画面の「送信先」で「PDFに保存」を選択してください。</p>
      </div>
    </div>
  );
};

export const generateDocument = (
  type: 'presentation' | 'quotation' | 'drawing',
  doors: SavedDoor[],
  settings: Props['settings'],
  projectInfo: ProjectInfo,
  screenshotUrl?: string | null
) => {
  const newWindow = window.open('', '_blank');
  if (!newWindow) {
      alert('ポップアップがブロックされました。ブラウザの設定を確認してください。');
      return;
  }

  // Dynamically set page size based on type
  const pageSize = type === 'presentation' || type === 'drawing' ? 'A3 landscape' : 'A4 portrait';

  newWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ja">
      <head>
        <title>${type === 'presentation' ? 'プレゼンボード' : type === 'drawing' ? '仕様詳細図' : '御見積書'} - LINE KITCHEN</title>
        <meta charset="utf-8" />
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
           @media print {
             .no-print { display: none !important; }
             body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
             @page { 
                margin: 0;
                size: ${pageSize}; 
             }
           }
           body { 
             font-family: 'Noto Sans JP', sans-serif; 
             background-color: #f3f4f6; /* Light gray background for preview */
             margin: 0;
             padding: 20px;
           }
           /* Simulate paper look in browser */
           #root > div {
             box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
           }
           @media print {
             body { background-color: white; padding: 0; }
             #root > div { box-shadow: none; }
           }
        </style>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `);
  newWindow.document.close();

  const rootElement = newWindow.document.getElementById('root');
  if (rootElement) {
      const root = createRoot(rootElement);
      root.render(<PrintLayout type={type} doors={doors} settings={settings} projectInfo={projectInfo} screenshotUrl={screenshotUrl} />);
  }
};
