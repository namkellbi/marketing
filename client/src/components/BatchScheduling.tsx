import React from 'react';
import { Clock, Calendar, Repeat } from 'lucide-react';

const BatchScheduling: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Lên lịch hàng loạt</h1>
      </div>
      
      <div className="p-6">
        <div className="text-center text-gray-500 py-12">
          <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">Lên lịch hàng loạt</h3>
          <p>Hãy chờ phiên bản cập nhật để sử dụng tính năng lên lịch hàng loạt</p>
        </div>
      </div>
    </div>
  );
};

export default BatchScheduling;

