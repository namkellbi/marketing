import React from 'react';
import { Scissors, Video, Edit3 } from 'lucide-react';

const VideoEditor: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa video</h1>
      </div>
      
      <div className="p-6">
        <div className="text-center text-gray-500 py-12">
          <Scissors className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">Trình chỉnh sửa video</h3>
          <p>Hãy chờ phiên bản cập nhật để sử dụng tính năng chỉnh sửa video</p>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;

