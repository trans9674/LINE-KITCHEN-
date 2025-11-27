import React from 'react';
import { DoorOption, DoorTypeId } from '../types';

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
    case 'peninsula':
      return (
        <svg {...commonProps}>
          <rect x="2" y="8" width="18" height="8" />
          <rect x="5" y="10" width="6" height="4" />
          <line x1="20" y1="4" x2="20" y2="20" />
        </svg>
      );
    case 'island':
      return (
        <svg {...commonProps}>
          <rect x="3" y="8" width="18" height="8" />
          <rect x="6" y="10" width="6" height="4" />
        </svg>
      );
    case 'type-ii':
      return (
        <svg {...commonProps}>
          <rect x="4" y="6" width="16" height="5" />
          <rect x="4" y="13" width="16" height="5" />
          <rect x="6" y="14" width="6" height="3" />
        </svg>
      );
    case 'type-i':
      return (
        <svg {...commonProps}>
          <rect x="3" y="9" width="18" height="8" />
          <rect x="6" y="11" width="6" height="4" />
          <line x1="0" y1="9" x2="24" y2="9" />
        </svg>
      );
    default:
      return null;
  }
};

interface TypeSelectionModalProps {
  doorTypes: DoorOption<DoorTypeId>[];
  onSelect: (type: DoorTypeId) => void;
  isFadingOut: boolean;
}

const TypeSelectionModal: React.FC<TypeSelectionModalProps> = ({ doorTypes, onSelect, isFadingOut }) => {
  return (
    <div className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-30 flex items-center justify-center transition-opacity duration-500 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`bg-white/80 p-6 lg:p-8 rounded-2xl shadow-lg transition-all duration-500 ${isFadingOut ? 'scale-95' : 'scale-100'}`}>
        <h2 className="text-xl lg:text-2xl font-bold text-gray-800 text-center mb-6">キッチンタイプを選択してください</h2>
        <div className="grid grid-cols-2 gap-3 lg:gap-4">
          {doorTypes.map(dt => (
            <button
              key={dt.id}
              onClick={() => onSelect(dt.id)}
              className="group relative flex flex-col items-center justify-center p-4 lg:p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-[#8b8070] hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
            >
              <DoorCategoryIcon id={dt.id} className="h-14 lg:h-20 w-14 lg:w-20 mb-2 text-gray-400 group-hover:text-[#8b8070] transition-colors" />
              <span className="font-bold text-base lg:text-lg text-center mb-1 text-gray-800">{dt.name}</span>
              <span className="text-sm lg:text-base text-gray-500">{dt.price.toLocaleString()}円〜</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TypeSelectionModal;