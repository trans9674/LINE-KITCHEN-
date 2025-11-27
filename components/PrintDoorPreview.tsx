
import React from 'react';
import { DoorConfiguration, ColorOption } from '../types';

const PrintDoorPreview: React.FC<{ config: DoorConfiguration, colors: ColorOption[] }> = ({ config, colors }) => {
  const color = colors.find(c => c.id === config.color);
  const baseColor = color ? color.hex : '#e5e7eb';
  
  const boxStyle: React.CSSProperties = {
      backgroundColor: baseColor,
      border: '1px solid #000',
      position: 'absolute'
  };

  // Simple schematic representation of kitchen types
  switch(config.doorType) {
      case 'type-i':
          return (
              <div className="relative w-full h-full bg-white border border-gray-200 p-1">
                  {/* I-shape against top */}
                  <div style={{ ...boxStyle, top: '10%', left: '10%', width: '80%', height: '30%' }}></div>
              </div>
          );
      case 'peninsula':
          return (
              <div className="relative w-full h-full bg-white border border-gray-200 p-1">
                  {/* Peninsula attached to left */}
                  <div style={{ ...boxStyle, top: '30%', left: '0%', width: '70%', height: '40%' }}></div>
              </div>
          );
      case 'island':
          return (
              <div className="relative w-full h-full bg-white border border-gray-200 p-1">
                  {/* Island in center */}
                  <div style={{ ...boxStyle, top: '30%', left: '20%', width: '60%', height: '40%' }}></div>
              </div>
          );
      case 'type-ii':
          return (
              <div className="relative w-full h-full bg-white border border-gray-200 p-1">
                  {/* Two parallel lines */}
                  <div style={{ ...boxStyle, top: '10%', left: '10%', width: '80%', height: '25%' }}></div>
                  <div style={{ ...boxStyle, bottom: '10%', left: '10%', width: '80%', height: '25%' }}></div>
              </div>
          );
      default:
          return <div className="w-full h-full bg-gray-100"></div>;
  }
};

export default PrintDoorPreview;
