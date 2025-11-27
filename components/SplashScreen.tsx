
import React from 'react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white animate-splash-bg pointer-events-none">
      <div className="text-center animate-splash-content">
        <h1 className="text-3xl lg:text-3xl font-light tracking-[0.3em] text-gray-800">
          LINE KITCHEN
        </h1>
        <p className="text-lg lg:text-sm font-light tracking-widest text-gray-500 mt-2">
          Build Your Best Kitchen
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
