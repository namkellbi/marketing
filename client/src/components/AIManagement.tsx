import React from 'react';
import { Brain, Settings, Zap } from 'lucide-react';

const AIManagement: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý AI</h1>
      </div>
      
      <div className="p-6">
        <div className="text-center text-gray-500 py-12">
          <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">Tính năng AI đang phát triển</h3>
          <p>Hãy chờ phiên bản cập nhật để sử dụng các tính năng AI</p>
        </div>
      </div>
    </div>
  );
};

export default AIManagement;

