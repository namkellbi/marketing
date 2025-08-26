import React from 'react';
import { Download, Play, Trash2 } from 'lucide-react';

const DownloadedVideos: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">DS video đã download</h1>
      </div>
      
      <div className="p-6">
        <div className="text-center text-gray-500 py-12">
          <Download className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">Chưa có video nào được download</h3>
          <p>Hãy quét và download video từ trang "Quét video" trước</p>
        </div>
      </div>
    </div>
  );
};

export default DownloadedVideos;

