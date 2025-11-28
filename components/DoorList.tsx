
import React, { useState } from 'react';
import { SavedDoor, DoorOption, DoorTypeId, ColorId, HandleId, ColorOption, FrameTypeId, GlassStyleId, LockId, ProjectInfo } from '../types';
import { generateDocument } from './PresentationGenerator';
import PrintDoorPreview from './PrintDoorPreview';
import { getOptionName } from '../utils';

interface DoorListItemProps {
  door: SavedDoor;
  index: number;
  onDelete: () => void;
  onUpdate: (id: string, updates: Partial<SavedDoor>) => void;
  doorTypes: DoorOption<DoorTypeId>[];
  colors: ColorOption[];
}

const DoorListItem: React.FC<DoorListItemProps> = ({ door, index, onDelete, onUpdate, doorTypes, colors }) => {
  const { config, price, roomName } = door;
  
  const [isEditingRoomName, setIsEditingRoomName] = useState(false);
  const [tempRoomName, setTempRoomName] = useState(roomName || '');

  const handleRoomNameSave = () => {
    onUpdate(door.id, { roomName: tempRoomName });
    setIsEditingRoomName(false);
  };

  const handleRoomNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRoomNameSave();
    }
  };

  return (
    <div className="relative bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center">
       <button
        onClick={onDelete}
        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors duration-200 p-1 rounded-full z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </button>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-800 text-lg flex items-center gap-3">
            {`キッチン${index + 1}`}
            {isEditingRoomName ? (
              <input
                type="text"
                value={tempRoomName}
                onChange={(e) => setTempRoomName(e.target.value)}
                onBlur={handleRoomNameSave}
                onKeyDown={handleRoomNameKeyDown}
                autoFocus
                className="ml-2 px-2 py-0.5 text-base font-normal border border-blue-400 rounded bg-white"
                style={{ width: '150px' }}
              />
            ) : (
              <span 
                onClick={() => setIsEditingRoomName(true)}
                className={`text-base font-normal px-2 py-0.5 rounded cursor-pointer hover:bg-gray-50 ${roomName ? 'text-gray-600 bg-gray-100' : 'text-gray-400 border border-dashed border-gray-300'}`}
              >
                {roomName || '+ 部屋名'}
              </span>
            )}
        </h4>
        <p className="text-sm text-gray-600 mt-1">{getOptionName(doorTypes, config.doorType)}</p>
        <p className="text-sm text-gray-600">W{config.width} × H{config.height} cm</p>
        <p className="text-sm text-gray-600">カラー: {getOptionName(colors, config.color)}</p>
        <p className="text-md font-semibold text-blue-600 mt-2">{price.toLocaleString()}円</p>
      </div>
      <div className="w-16 h-16 ml-4 flex-shrink-0">
            <PrintDoorPreview config={config} colors={colors}/>
      </div>
    </div>
  );
};

interface DoorListProps {
  doors: SavedDoor[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<SavedDoor>) => void;
  doorTypes: DoorOption<DoorTypeId>[];
  colors: ColorOption[];
  notificationMessage?: string | null;
  notificationType?: 'success' | 'delete';
  projectInfo: ProjectInfo;
}

const DoorList: React.FC<DoorListProps> = ({ doors, onDelete, onUpdate, doorTypes, colors, notificationMessage, notificationType, projectInfo }) => {
  const totalListPrice = doors.reduce((sum, door) => sum + door.price, 0);
  
  const handleGenerateDocument = (type: 'presentation' | 'quotation') => {
    // Mock settings for generator
    const settings = { 
        doorTypes, 
        frameTypes: [], 
        colors, 
        handles: [], 
        glassStyles: [], 
        locks: [],
        dividers: [],
        dishwashers: [],
        gasStoves: [],
        ihHeaters: [],
        rangeHoods: [],
        rangeHoodOptions: [],
        faucets: [],
        sinkAccessories: [],
        kitchenPanels: [],
        storageOptions: [],
        kitchenOptions: [],
        cupboardTypes: [],
        cupboardPrices: {},
        cupboardDoorPrices: {},
        cupboardCounterPrices: {}
    };
    generateDocument(type, doors, settings, projectInfo);
  };

  return (
    <div className="w-full mt-4">
      <div className="flex justify-between items-center mb-4 border-b-2 border-gray-200 pb-2">
        <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-gray-800">見積りリスト</h3>
            {notificationMessage && (
                <div className={`${notificationType === 'delete' ? 'bg-red-600' : 'bg-green-600'} text-white text-sm px-3 py-1 rounded-lg`}>
                    {notificationMessage}
                </div>
            )}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">合計金額</p>
          <p className="text-2xl font-bold text-blue-700">{totalListPrice.toLocaleString()}円</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {doors.map((door, index) => (
        <DoorListItem 
            key={door.id} 
            door={door} 
            index={index} 
            onDelete={() => onDelete(door.id)}
            onUpdate={onUpdate}
            doorTypes={doorTypes}
            colors={colors}
        />
        ))}
      </div>

      {doors.length > 0 && (
        <div className="mt-8 pt-6 border-t-2 border-gray-200 flex flex-col sm:flex-row justify-end items-center gap-4">
           <button
             onClick={() => handleGenerateDocument('presentation')}
             className="w-full sm:w-auto bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700"
           >
             プレゼンボード出力
           </button>
           <button
             onClick={() => handleGenerateDocument('quotation')}
             className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700"
           >
             見積り書出力
           </button>
        </div>
       )}
    </div>
  );
};

export default DoorList;
