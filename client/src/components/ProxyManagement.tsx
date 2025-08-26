import React from 'react';
import { Shield, Globe, Settings } from 'lucide-react';

const ProxyManagement: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý proxy</h1>
      </div>
      
      <div className="p-6">
        <div className="text-center text-gray-500 py-12">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">Quản lý proxy</h3>
          <p>Hãy chờ phiên bản cập nhật để sử dụng tính năng quản lý proxy</p>
        </div>
      </div>
    </div>
  );
};

export default ProxyManagement;

