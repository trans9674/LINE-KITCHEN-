
import React, { useState, useEffect } from 'react';
import { ProjectInfo } from '../types';
import { PREFECTURES } from '../constants';

interface ProjectInfoModalProps {
  isOpen: boolean;
  initialInfo: ProjectInfo;
  onComplete: (info: ProjectInfo) => void;
  onClose: () => void;
  shippingRates: Record<string, number>;
  onAdminClick: () => void;
}

const ProjectInfoModal: React.FC<ProjectInfoModalProps> = ({ isOpen, initialInfo, onComplete, onClose, shippingRates, onAdminClick }) => {
  const [info, setInfo] = useState<ProjectInfo>(initialInfo);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setInfo(initialInfo);
    } else {
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialInfo]);

  if (!visible) return null;

  const handleChange = (key: keyof ProjectInfo, value: string | number) => {
    if (key === 'constructionLocation') {
      const cost = shippingRates[value as string] || 0;
      setInfo(prev => ({ ...prev, [key]: value as string, shippingCost: cost }));
    } else {
      setInfo(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(info);
  };

  return (
    <div className={`fixed inset-0 z-[70] flex items-center justify-center px-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div className={`relative bg-[#f5f2eb] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all duration-500 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'} max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">プロジェクト設定</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="group">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">お客様名</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-focus-within:text-[#8b8070] transition-colors" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={info.customerName}
                        onChange={(e) => handleChange('customerName', e.target.value)}
                        placeholder="例：山田 太郎"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#8b8070] focus:border-transparent bg-white transition-all"
                    />
                </div>
            </div>

            <div className="group">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                    建築地
                    <span className="ml-2 text-[10px] font-normal text-gray-400 tracking-normal">【送料の計算に反映されます】</span>
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-focus-within:text-[#8b8070] transition-colors" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <select
                        value={info.constructionLocation}
                        onChange={(e) => handleChange('constructionLocation', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#8b8070] focus:border-transparent bg-white transition-all appearance-none"
                    >
                        <option value="">都道府県を選択</option>
                        {PREFECTURES.map(pref => (
                        <option key={pref} value={pref}>{pref}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>
                </div>
            </div>

            <div className="group">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">建築会社名</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-focus-within:text-[#8b8070] transition-colors" viewBox="0 0 20 20" fill="currentColor">
                             <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={info.constructionCompany}
                        onChange={(e) => handleChange('constructionCompany', e.target.value)}
                        placeholder="例：株式会社〇〇工務店"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#8b8070] focus:border-transparent bg-white transition-all"
                    />
                </div>
            </div>

            <div className="pt-6 border-b border-gray-300 pb-6 mb-4">
                <button
                type="submit"
                className="w-full bg-[#8b8070] hover:bg-[#797061] text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-amber-200 transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                <span>設定を保存</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                </button>
            </div>
            </form>
            
            <div className="mt-6 pt-6">
                <button
                    type="button"
                    onClick={onAdminClick}
                    className="w-full text-gray-500 hover:text-gray-800 hover:bg-gray-200 p-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    管理者設定
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectInfoModal;