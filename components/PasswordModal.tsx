import React from 'react';

interface PasswordModalProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onClose: () => void;
  error: string;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ value, onChange, onSubmit, onClose, error }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[80] flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">管理者認証</h2>
            <p className="text-sm text-gray-600 mb-4">続行するには暗証番号を入力してください。</p>
            <input
              type="password"
              value={value}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#8b8070] focus:border-[#8b8070] bg-white text-gray-900"
              placeholder="暗証番号"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
          <div className="bg-gray-50 px-6 py-3 flex justify-end items-center gap-3 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#8b8070] text-white rounded-md hover:bg-[#797061] transition-colors"
            >
              認証
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;