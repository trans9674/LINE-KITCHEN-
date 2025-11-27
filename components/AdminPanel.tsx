
import React, { useState } from 'react';
import { PREFECTURES } from '../constants';

interface AdminPanelProps {
  settings: any;
  onUpdateSettings: (newSettings: any) => void;
  onClose: () => void;
}

// 日本語マッピング
const categoryNames: { [key: string]: string } = {
  doorTypes: 'キッチンタイプ',
  colors: 'カラー',
  dividers: 'ディバイダー',
  storageOptions: '収納オプション',
  kitchenOptions: 'キッチンオプション',
  dishwashers: '食器洗い乾燥機',
  gasStoves: 'ガスコンロ',
  ihHeaters: 'IHヒーター',
  rangeHoods: 'レンジフード',
  rangeHoodOptions: 'レンジフードオプション',
  faucets: '水栓金具',
  sinkAccessories: 'シンクアクセサリー',
  kitchenPanels: 'キッチンパネル',
  cupboardTypes: 'カップボードタイプ',
  cupboardStorageTypes: 'カップボード収納タイプ',
  cupboardOptionPanels: 'カップボードオプションパネル',
};

const cupboardTypeNames: { [key: string]: string } = {
    floor: 'フロア',
    separate: 'セパレート',
    tall: 'トール',
    mix: 'ミックス',
};

const CUPBOARD_DEPTHS = [45, 60, 65];
const CUPBOARD_WIDTHS = [94, 169, 184, 244, 259, 274];
const CUPBOARD_TYPES_LIST = ['floor', 'separate', 'tall', 'mix'];

const AdminPanel: React.FC<AdminPanelProps> = ({ settings, onUpdateSettings, onClose }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [exportJson, setExportJson] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('kitchen');

  const handleItemChange = (category: string, id: string, field: string, value: any) => {
    // Ensure price is always a number
    const processedValue = field === 'price' ? parseInt(value) || 0 : value;
    setLocalSettings((prev: any) => ({
      ...prev,
      [category]: prev[category].map((item: any) =>
        item.id === id ? { ...item, [field]: processedValue } : item
      ),
    }));
  };

  const handleAddItem = (category: string) => {
      let newItem: any;
      const baseItem = { id: `new-${Date.now()}`, name: '新規項目', price: 0 };

      if (category === 'colors') {
          newItem = {
              ...baseItem,
              id: `new-color-${Date.now()}`,
              shortId: 'NEW',
              handleColorClass: 'bg-gray-700',
              hex: '#cccccc',
              previewHex: '#cccccc',
              handleHex: '#4A5568',
              category: 'monotone',
              availableFor: ['door', 'counter'],
              swatchUrl: 'https://via.placeholder.com/100/cccccc/000000?Text=URL',
              textureUrl: 'https://via.placeholder.com/512/cccccc/000000?Text=URL'
          };
      } else {
          newItem = baseItem;
      }

      setLocalSettings((prev: any) => ({
        ...prev,
        [category]: [...prev[category], newItem]
      }));
  };
  
  const handleDeleteItem = (category: string, id: string) => {
      if (window.confirm('この項目を削除してもよろしいですか？')) {
          setLocalSettings((prev: any) => ({
            ...prev,
            [category]: prev[category].filter((item: any) => item.id !== id)
          }));
      }
  };


  const handleShippingRateChange = (prefecture: string, value: number) => {
      setLocalSettings((prev: any) => ({
          ...prev,
          shippingRates: { ...prev.shippingRates, [prefecture]: value }
      }));
  };
  
  const handleCupboardPriceChange = (type: string, depth: number, width: number, price: number) => {
      setLocalSettings((prev: any) => {
        // Guard against undefined cupboardPrices
        const currentPrices = prev.cupboardPrices || {};
        const newCupboardPrices = JSON.parse(JSON.stringify(currentPrices));
        
        if (!newCupboardPrices[type]) newCupboardPrices[type] = {};
        if (!newCupboardPrices[type][depth]) newCupboardPrices[type][depth] = {};
        newCupboardPrices[type][depth][width] = isNaN(price) ? 0 : price;
        return {
            ...prev,
            cupboardPrices: newCupboardPrices
        };
    });
  };

  const handleSaveChanges = () => {
    onUpdateSettings(localSettings);
    
    // Calculate Diff
    const changes: any = {};
    let hasChanges = false;

    // Check standard array categories
    Object.keys(categoryNames).forEach(key => {
        if (JSON.stringify(settings[key]) !== JSON.stringify(localSettings[key])) {
            changes[key] = localSettings[key];
            hasChanges = true;
        }
    });

    // Check Cupboard Prices
    if (JSON.stringify(settings.cupboardPrices) !== JSON.stringify(localSettings.cupboardPrices)) {
        changes.cupboardPrices = localSettings.cupboardPrices;
        hasChanges = true;
    }

    // Check Shipping Rates
    if (JSON.stringify(settings.shippingRates) !== JSON.stringify(localSettings.shippingRates)) {
        changes.shippingRates = localSettings.shippingRates;
        hasChanges = true;
    }

    if (!hasChanges) {
        // Show modal even if no changes, just to inform
        setExportJson("変更点はありません。");
        return;
    }

    const jsonString = JSON.stringify(changes, null, 2);
    setExportJson(jsonString);
  };

  const copyToClipboard = () => {
      if (exportJson) {
          navigator.clipboard.writeText(exportJson).then(() => {
              alert("コピーしました！\nAIのチャット欄に貼り付けて送信してください。");
          }).catch(() => alert("コピーに失敗しました。"));
      }
  };
  
  const inputStyle = { backgroundColor: '#ffffff', color: '#111827' };

  const renderShippingRates = () => (
      <div className="p-4">
          <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left">都道府県</th><th className="px-6 py-3 text-right">運賃 (円)</th></tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {PREFECTURES.map(pref => (
                      <tr key={pref}>
                          <td className="px-6 py-2">{pref}</td>
                          <td className="px-6 py-2">
                              <input 
                                  type="number" 
                                  value={localSettings.shippingRates[pref] || 0} 
                                  onChange={(e) => handleShippingRateChange(pref, parseInt(e.target.value) || 0)} 
                                  className="w-full p-1 border rounded text-right"
                                  style={inputStyle}
                              />
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
  );

  const renderKitchenPrices = () => (
    <div className="p-4 space-y-6">
        {Object.keys(localSettings)
            .filter(k => Array.isArray(localSettings[k]) && categoryNames[k])
            .map(category => (
            <div key={category}>
                <h3 className="text-lg font-bold text-gray-800 mb-3 border-b-2 border-gray-200 pb-2">{categoryNames[category] || category}</h3>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">項目名</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">画像リンクURL</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">価格 (円)</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">操作</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {localSettings[category].map((item: any) => (
                            <tr key={item.id}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                    <input 
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => handleItemChange(category, item.id, 'name', e.target.value)}
                                        className="w-full p-1 border rounded"
                                        style={inputStyle}
                                    />
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                    <div className="flex flex-col gap-1">
                                        <input
                                            type="text"
                                            value={item.swatchUrl || ''}
                                            placeholder={category === 'colors' ? "Swatch URL" : "画像URL"}
                                            onChange={(e) => handleItemChange(category, item.id, 'swatchUrl', e.target.value)}
                                            className="w-full p-1 border rounded text-xs"
                                            style={inputStyle}
                                        />
                                        {category === 'colors' && (
                                            <input
                                                type="text"
                                                value={item.textureUrl || ''}
                                                placeholder="Texture URL"
                                                onChange={(e) => handleItemChange(category, item.id, 'textureUrl', e.target.value)}
                                                className="w-full p-1 border rounded text-xs"
                                                style={inputStyle}
                                            />
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="number"
                                        value={item.price}
                                        onChange={(e) => handleItemChange(category, item.id, 'price', e.target.value)}
                                        className="w-full p-1 border rounded text-right"
                                        style={inputStyle}
                                    />
                                </td>
                                <td className="px-4 py-2 text-right">
                                    <button onClick={() => handleDeleteItem(category, item.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">削除</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={4} className="pt-4">
                                <button onClick={() => handleAddItem(category)} className="px-3 py-1.5 bg-green-100 text-green-800 text-sm font-medium rounded-md hover:bg-green-200">
                                    + {categoryNames[category] || category} を追加
                                </button>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        ))}
        <div>
              <h3 className="text-lg font-bold text-gray-800 mb-6 border-b-2 border-gray-200 pb-2">カップボード価格マトリクス</h3>
              
              {CUPBOARD_DEPTHS.map((depth) => (
                  <div key={depth} className="mb-8">
                      <div className="flex items-center gap-2 mb-2 bg-gray-100 p-2 rounded">
                          <span className="font-bold text-lg text-gray-800">奥行: {depth}cm</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r w-32 sticky left-0 bg-gray-100">タイプ / 幅</th>
                                    {CUPBOARD_WIDTHS.map(width => (
                                        <th key={width} className="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase tracking-wider border-r min-w-[100px]">
                                            W{width}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {CUPBOARD_TYPES_LIST.map(type => (
                                    <tr key={type} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 text-sm font-bold text-gray-800 border-r sticky left-0 bg-white shadow-sm">
                                            {cupboardTypeNames[type] || type}
                                        </td>
                                        {CUPBOARD_WIDTHS.map(width => {
                                            const price = localSettings.cupboardPrices?.[type]?.[depth]?.[width] ?? 0;
                                            return (
                                                <td key={`${type}-${width}`} className="px-2 py-2 border-r text-center">
                                                    <input
                                                        type="number"
                                                        value={price}
                                                        onChange={(e) => handleCupboardPriceChange(type, depth, width, parseInt(e.target.value))}
                                                        className="w-full p-1.5 border border-gray-300 rounded text-right text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        style={inputStyle}
                                                    />
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                  </div>
              ))}
          </div>
    </div>
  );


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[95vh] flex flex-col relative">
        <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-bold">管理者設定</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
        </header>
        <div className="border-b"><nav className="-mb-px flex space-x-8 px-4">
            <button onClick={() => setActiveTab('kitchen')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'kitchen' ? 'border-[#8b8070] text-[#8b8070]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>キッチン価格</button>
            <button onClick={() => setActiveTab('shipping')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'shipping' ? 'border-[#8b8070] text-[#8b8070]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>運賃</button>
        </nav></div>
        <main className="flex-grow overflow-y-auto">
            {activeTab === 'kitchen' && renderKitchenPrices()}
            {activeTab === 'shipping' && renderShippingRates()}
        </main>
        <footer className="p-4 border-t flex justify-end gap-4 flex-shrink-0 bg-gray-50">
          <button onClick={onClose} className="px-6 py-2 bg-gray-200 rounded-md">キャンセル</button>
          <button onClick={handleSaveChanges} className="px-6 py-2 bg-[#8b8070] hover:bg-[#797061] text-white rounded-md">変更内容をプロンプトで表示</button>
        </footer>

        {exportJson && (
            <div className="absolute inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-6">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-3/4 flex flex-col p-6">
                    <h3 className="text-xl font-bold mb-2">設定保存用データ</h3>
                    <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded border mb-4">以下の変更内容をコピーし、AIのチャット欄に貼り付けて送信してください。</p>
                    <textarea readOnly value={exportJson} className="flex-grow w-full p-4 bg-white text-gray-900 border font-mono text-xs rounded-lg" style={inputStyle}/>
                    <div className="flex justify-end gap-4 mt-4">
                        <button onClick={() => { setExportJson(null); onClose(); }} className="px-6 py-2 bg-gray-200 rounded-lg">閉じる</button>
                        <button onClick={copyToClipboard} className="px-6 py-2 bg-[#8b8070] hover:bg-[#797061] text-white rounded-lg">コピー</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
