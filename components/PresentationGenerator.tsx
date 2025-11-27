
import React from 'react';
import { createRoot } from 'react-dom/client';
import { SavedDoor, DoorOption, DoorTypeId, FrameTypeId, ColorOption, HandleId, GlassStyleId, LockId, ProjectInfo, DividerId } from '../types';
import PrintDoorPreview from './PrintDoorPreview';
import { getOptionName } from '../utils';

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
  };
  projectInfo: ProjectInfo;
}

const PrintLayout: React.FC<Props> = ({ type, doors, settings, projectInfo }) => {
  const doorsTotal = doors.reduce((sum, d) => sum + d.price, 0);
  const shippingCost = projectInfo.shippingCost || 0;
  const subTotal = doorsTotal + shippingCost;
  const taxAmount = Math.floor(subTotal * 0.1);
  const totalWithTax = subTotal + taxAmount;
  
  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

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
      <div className="p-4 mx-auto bg-white min-h-screen text-gray-900 w-full box-border">
        <div className="flex justify-between items-end border-b-2 border-gray-800 pb-2 mb-3">
          <div>
             <h1 className="text-xl font-bold mb-1">プレゼンテーションボード</h1>
             <div className="flex gap-4 text-sm text-gray-800">
                 {projectInfo.customerName && <span className="font-bold">{projectInfo.customerName} 様邸</span>}
                 {projectInfo.constructionLocation && <span>建築地: {projectInfo.constructionLocation}</span>}
                 {projectInfo.constructionCompany && <span>{projectInfo.constructionCompany} 御中</span>}
             </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-600">作成日: {today}</p>
            <p className="text-md font-bold">LINE KITCHEN</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {doors.map((door, index) => {
            const isMaterial = door.config.doorType.startsWith('material-');
            const isStorage = door.config.doorType.startsWith('storage-');
            let idPrefix = 'WD';
            if (isStorage) idPrefix = 'SB';
            if (isMaterial) idPrefix = '造作材';

            return (
            <div key={door.id} className="border border-gray-200 rounded-sm shadow-sm bg-white flex flex-row h-40 overflow-hidden break-inside-avoid">
               {/* Image Section - Hidden for Materials */}
              {!isMaterial && (
              <div className="w-5/12 bg-gray-50 border-r border-gray-100 relative">
                 <div className="absolute inset-1">
                    <PrintDoorPreview config={door.config} colors={settings.colors} />
                 </div>
              </div>
              )}

               {/* Details Section - Full width for Materials */}
              <div className={`${isMaterial ? 'w-full' : 'w-7/12'} p-2 flex flex-col`}>
                <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-1">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="bg-gray-800 text-white text-[13px] px-2 py-0.5 rounded font-mono font-bold whitespace-nowrap">
                            {isMaterial ? '造作材' : `${idPrefix}${index + 1}`}
                        </span>
                        {door.roomName && (
                            <span className="text-[10px] font-bold text-gray-700 truncate bg-gray-100 px-2 py-0.5 rounded">
                                {door.roomName}
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="text-[10px] leading-tight space-y-1 text-gray-600">
                    <div className="grid grid-cols-[24px_1fr] gap-x-1">
                        <span className="font-bold text-gray-400">種類</span>
                        <span className="truncate font-medium text-gray-800">{getOptionName(settings.doorTypes, door.config.doorType)}</span>
                    </div>
                    
                    {!isMaterial ? (
                        <div className="grid grid-cols-[24px_1fr] gap-x-1">
                            <span className="font-bold text-gray-400">寸法</span>
                            <span className="tracking-tighter font-medium text-gray-800">W{door.config.width}×H{door.config.height}</span>
                        </div>
                    ) : null}
                    
                    <div className="grid grid-cols-[24px_1fr] gap-x-1">
                        <span className="font-bold text-gray-400">天板</span>
                        <span className="truncate font-medium text-gray-800">{getOptionName(settings.colors, door.config.counterColor)}</span>
                    </div>

                    <div className="grid grid-cols-[24px_1fr] gap-x-1">
                        <span className="font-bold text-gray-400">色</span>
                        <span className="truncate font-medium text-gray-800">{getOptionName(settings.colors, door.config.color)}</span>
                    </div>

                    {!isStorage && !isMaterial && !door.config.doorType.startsWith('folding') && door.config.doorType !== 'double' && door.config.doorType !== 'hinged-storage' && (
                        <div className="grid grid-cols-[24px_1fr] gap-x-1">
                            <span className="font-bold text-gray-400">取手</span>
                            <span className="truncate">{getOptionName(settings.handles, door.config.handle)}</span>
                        </div>
                    )}

                    {door.config.divider && door.config.divider !== 'none' && (
                         <div className="grid grid-cols-[24px_1fr] gap-x-1">
                            <span className="font-bold text-gray-400">他</span>
                            <span className="truncate">{getOptionName(settings.dividers, door.config.divider)}</span>
                        </div>
                    )}
                 </div>
              </div>
            </div>
          )})}
        </div>
        
        <div className="mt-2 pt-1 border-t border-gray-300 text-right text-[8px] text-gray-400">
            <p>※本図はイメージです。実際の色味や質感とは異なる場合があります。</p>
        </div>
      </div>
    );
  }

  // Quotation Layout (Formal Japanese Style)
  return (
    <div className="p-12 max-w-[210mm] mx-auto bg-white min-h-screen text-gray-900 box-border">
      {/* Header Area */}
      <div className="flex justify-between items-start mb-12">
          <div className="w-1/2">
              <div className="border-b border-gray-800 pb-1 mb-6 inline-block min-w-[280px]">
                  <span className="text-xl ml-2 font-bold">{projectInfo.customerName ? `${projectInfo.customerName} 様` : '　　　　　　　　　様'}</span>
              </div>
              <div className="text-sm space-y-2">
                  <p>下記の通り御見積申し上げます。</p>
                  <p className="font-bold">件名: 建具工事 御見積書</p>
                  {projectInfo.constructionLocation && <p>建築地: {projectInfo.constructionLocation}</p>}
                  {projectInfo.constructionCompany && <p>建築会社: {projectInfo.constructionCompany}</p>}
              </div>
          </div>
          <div className="w-1/2 text-right">
              <p className="text-xs text-gray-500 mb-1">No. {Date.now().toString().slice(-8)}</p>
              <p className="text-sm mb-4">発行日: {today}</p>
              <div className="inline-block text-left">
                  <h2 className="text-xl font-bold mb-2">LINE KITCHEN</h2>
                  <p className="text-xs text-gray-600">〒100-0000</p>
                  <p className="text-xs text-gray-600">東京都〇〇区〇〇 1-2-3</p>
                  <p className="text-xs text-gray-600">TEL: 03-0000-0000</p>
                  <div className="mt-4 w-20 h-20 border border-red-300 text-red-300 rounded-full flex items-center justify-center text-xs transform rotate-[-15deg] opacity-50 select-none ml-auto mr-4">
                      印
                  </div>
              </div>
          </div>
      </div>

      {/* Total Amount Box */}
      <div className="mb-10 border-b-4 border-double border-gray-800 pb-2">
          <div className="flex justify-between items-end px-2">
              <span className="text-lg font-bold">御見積金額（税込）</span>
              <span className="text-4xl font-bold underline decoration-1 underline-offset-8">¥ {totalWithTax.toLocaleString()} -</span>
          </div>
      </div>

      {/* Detail Table */}
      <table className="w-full border-collapse border-t border-b border-gray-400 text-sm mb-8">
         <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-center w-12 border-b border-gray-300 font-semibold">No.</th>
              <th className="p-3 text-left border-b border-gray-300 font-semibold">品名・仕様</th>
              <th className="p-3 text-center w-16 border-b border-gray-300 font-semibold">数量</th>
              <th className="p-3 text-right w-24 border-b border-gray-300 font-semibold">単価</th>
              <th className="p-3 text-right w-28 border-b border-gray-300 font-semibold">金額</th>
            </tr>
         </thead>
         <tbody>
           {doors.map((door, index) => {
             const isMaterial = door.config.doorType.startsWith('material-');
             const isStorage = door.config.doorType.startsWith('storage-');
             const isCornerSkirting = door.config.doorType === 'material-corner-skirting';
             let idPrefix = 'WD';
             if (isStorage) idPrefix = 'SB';
             if (isMaterial) idPrefix = '造作材';

             return (
             <tr key={door.id} className="border-b border-dotted border-gray-300 hover:bg-gray-50">
               <td className="p-3 text-center">
                   {index + 1}
               </td>
               <td className="p-3">
                 <div className="font-bold text-base text-gray-800">
                     {getOptionName(settings.doorTypes, door.config.doorType)}
                     <span className="text-xs font-normal text-gray-500 ml-2">
                        ({isMaterial ? '造作材' : `${idPrefix}${index + 1}`})
                     </span>
                     {door.roomName && <span className="ml-2 text-sm text-gray-600 bg-gray-100 px-2 rounded">[{door.roomName}]</span>}
                 </div>
                 <div className="text-xs text-gray-500 mt-1 pl-2 border-l-2 border-gray-200">
                   {isMaterial ? (
                       <span>数量: {door.config.count}{isCornerSkirting ? '個' : '本'} / </span>
                   ) : (
                       <span>W{door.config.width}×H{door.config.height} / </span>
                   )}
                   <span>天板: {getOptionName(settings.colors, door.config.counterColor)} / </span>
                   <span>扉: {getOptionName(settings.colors, door.config.color)}</span>
                   {door.config.lock && door.config.lock !== 'none' && (
                       <> / <span>{getOptionName(settings.locks, door.config.lock)}</span></>
                   )}
                   {door.config.glassStyle !== 'none' && (
                       <> / <span>{getOptionName(settings.glassStyles, door.config.glassStyle)}</span></>
                   )}
                   {door.config.divider && door.config.divider !== 'none' && (
                       <> / <span className="text-[#8b8070]">{getOptionName(settings.dividers, door.config.divider)}</span></>
                   )}
                 </div>
               </td>
               <td className="p-3 text-center">{isMaterial ? door.config.count : 1}</td>
               <td className="p-3 text-right">{(door.price / (isMaterial ? (door.config.count || 1) : 1)).toLocaleString()}</td>
               <td className="p-3 text-right">{door.price.toLocaleString()}</td>
             </tr>
           )})}
           
           {/* Shipping Cost Row */}
           <tr className="border-b border-dotted border-gray-300 hover:bg-gray-50">
             <td className="p-3 text-center text-gray-400">-</td>
             <td className="p-3">
                 <div className="font-bold text-base text-gray-800">配送費</div>
                 {projectInfo.constructionLocation && <div className="text-xs text-gray-500 mt-1">納品先：{projectInfo.constructionLocation}</div>}
             </td>
             <td className="p-3 text-center">1</td>
             <td className="p-3 text-right">
                {projectInfo.constructionLocation ? shippingCost.toLocaleString() : <span className="text-red-600 text-xs font-bold">県名が入力されていません</span>}
             </td>
             <td className="p-3 text-right">
                {projectInfo.constructionLocation ? shippingCost.toLocaleString() : <span className="text-red-600 text-xs font-bold">県名が入力されていません</span>}
             </td>
           </tr>

           {/* Filler rows to ensure table looks complete if few items */}
           {Array.from({ length: Math.max(0, 4 - doors.length) }).map((_, i) => (
               <tr key={`filler-${i}`} className="border-b border-dotted border-gray-200 h-12">
                   <td className="p-3 text-center"></td>
                   <td className="p-3"></td>
                   <td className="p-3 text-center"></td>
                   <td className="p-3 text-right"></td>
                   <td className="p-3 text-right"></td>
               </tr>
           ))}
         </tbody>
         <tfoot>
           <tr>
             <td colSpan={3} className="border-t border-gray-400"></td>
             <td className="p-3 text-right font-bold bg-gray-50 border-t border-gray-400">小計</td>
             <td className="p-3 text-right font-bold bg-gray-50 border-t border-gray-400">{subTotal.toLocaleString()}</td>
           </tr>
           <tr>
             <td colSpan={3}></td>
             <td className="p-3 text-right font-bold bg-gray-50">消費税 (10%)</td>
             <td className="p-3 text-right font-bold bg-gray-50">{taxAmount.toLocaleString()}</td>
           </tr>
           <tr>
             <td colSpan={3}></td>
             <td className="p-3 text-right font-bold bg-gray-100 border-t border-gray-800">合計</td>
             <td className="p-3 text-right font-bold text-lg bg-gray-100 border-t border-gray-800">{totalWithTax.toLocaleString()}</td>
           </tr>
         </tfoot>
      </table>

      {/* Remarks / Notes */}
      <div className="border border-gray-300 p-6 rounded-lg h-40">
          <h4 className="text-sm font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1 inline-block">備考</h4>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>御見積有効期限：発行日より1ヶ月とさせていただきます。</li>
              <li>本御見積は概算となります。現場状況により変動する場合がございます。</li>
              <li>施工費は別途となります。</li>
          </ul>
      </div>

      <div className="mt-12 text-center no-print">
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
  projectInfo: ProjectInfo
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
      root.render(<PrintLayout type={type} doors={doors} settings={settings} projectInfo={projectInfo} />);
  }
};
