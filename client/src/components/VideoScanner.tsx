import React, { useState } from 'react';
import { Search, Download, StopCircle, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { scanVideos, downloadVideos } from '../services/videoService';

interface VideoItem {
  id: string;
  tiktok_id: string;
  title: string;
  content: string;
  likes: number;
  views: number;
  uploader: string;
  thumbnail_url: string;
  video_url: string;
  downloaded: boolean;
  status: 'pending' | 'scanning' | 'downloading' | 'completed' | 'error';
  error?: string;
}

const VideoScanner: React.FC = () => {
  const [platform, setPlatform] = useState<'tiktok' | 'douyin'>('tiktok');
  const [links, setLinks] = useState('');
  const [cookies, setCookies] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedRange, setSelectedRange] = useState({ from: 0, to: 0 });
  const [filterViews, setFilterViews] = useState(0);
  const [skipDownloaded, setSkipDownloaded] = useState(true);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [scanProgress, setScanProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Parse input links
  const parseInput = (input: string) => {
    const lines = input.split('\n').filter(line => line.trim());
    const result = {
      videoLinks: [] as string[],
      userProfiles: [] as string[],
      hashtags: [] as string[]
    };

    lines.forEach((line: string) => {
      const trimmed = line.trim();
      if (trimmed.includes('/video/')) {
        result.videoLinks.push(trimmed);
      } else if (trimmed.includes('/@')) {
        result.userProfiles.push(trimmed);
      } else if (trimmed.startsWith('#')) {
        result.hashtags.push(trimmed);
      } else if (trimmed.includes('tiktok.com') || trimmed.includes('douyin.com')) {
        if (trimmed.includes('/@')) {
          result.userProfiles.push(trimmed);
        } else {
          result.videoLinks.push(trimmed);
        }
      }
    });

    return result;
  };

  const handleScan = async () => {
    if (!links.trim()) {
      alert('Vui lòng nhập link video, user profile hoặc hashtag để quét!');
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setVideos([]);
    setSelectedVideos(new Set());

    try {
      const parsedInput = parseInput(links);
      console.log('Parsed input:', parsedInput);

      const scanResult = await scanVideos({
        platform,
        videoLinks: parsedInput.videoLinks,
        userProfiles: parsedInput.userProfiles,
        hashtags: parsedInput.hashtags,
        cookies,
        onProgress: (progress: number) => setScanProgress(progress)
      });

      if (scanResult.success) {
        setVideos(scanResult.videos);
        alert(`Quét thành công! Tìm thấy ${scanResult.videos.length} video.`);
      } else {
        alert(`Lỗi khi quét: ${scanResult.message}`);
      }
    } catch (error) {
      console.error('Scan error:', error);
      alert('Có lỗi xảy ra khi quét video!');
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const handleStopScan = () => {
    setIsScanning(false);
    setScanProgress(0);
  };

  const handleDownload = async () => {
    if (selectedVideos.size === 0) {
      alert('Vui lòng chọn video để download!');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const selectedVideoIds = Array.from(selectedVideos);
      const downloadResult = await downloadVideos({
        videoIds: selectedVideoIds,
        platform,
        cookies,
        onProgress: (progress: number) => setDownloadProgress(progress)
      });

      if (downloadResult.success) {
        alert(`Download thành công ${downloadResult.downloadedCount} video!`);
        setVideos((prev: VideoItem[]) => prev.map((video: VideoItem) => 
          selectedVideos.has(video.id) 
            ? { ...video, downloaded: true, status: 'completed' }
            : video
        ));
        setSelectedVideos(new Set());
      } else {
        alert(`Lỗi khi download: ${downloadResult.message}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Có lỗi xảy ra khi download video!');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleStopDownload = () => {
    setIsDownloading(false);
    setDownloadProgress(0);
  };

  const handleDeleteList = () => {
    if (window.confirm('Bạn có chắc muốn xóa danh sách video này?')) {
      setVideos([]);
      setSelectedVideos(new Set());
    }
  };

  const handleSelectAll = () => {
    if (selectedVideos.size === videos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(videos.map((v: VideoItem) => v.id)));
    }
  };

  const handleSelectVideo = (videoId: string) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId);
    } else {
      newSelected.add(videoId);
    }
    setSelectedVideos(newSelected);
  };

  const handleSelectRange = () => {
    if (selectedRange.from > 0 && selectedRange.to > 0 && selectedRange.from <= selectedRange.to) {
      const rangeVideos = videos.slice(selectedRange.from - 1, selectedRange.to);
      setSelectedVideos(new Set(rangeVideos.map((v: VideoItem) => v.id)));
    }
  };

  const handleFilterByViews = () => {
    if (filterViews > 0) {
      const filteredVideos = videos.filter((video: VideoItem) => video.views >= filterViews);
      setVideos(filteredVideos);
    }
  };

  const filteredVideos = videos.filter((video: VideoItem) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        video.title.toLowerCase().includes(searchLower) ||
        video.content.toLowerCase().includes(searchLower) ||
        video.uploader.toLowerCase().includes(searchLower) ||
        video.tiktok_id.includes(searchTerm)
      );
    }
    return true;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Quét video</h1>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setPlatform('tiktok')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                platform === 'tiktok'
                  ? 'bg-red-500 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Tiktok
            </button>
            <button
              onClick={() => setPlatform('douyin')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                platform === 'douyin'
                  ? 'bg-red-500 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Douyin
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhập link video/link user/#hashtag/từ khoá muốn quét:
            </label>
            <div className="text-sm text-gray-500 mb-2">
              Vd: https://www.tiktok.com/@vzry4n.cenas/video/7303728609955515653 | https://www.tiktok.com/@hieuhayho | #OmVaoLong
            </div>
            <div className="text-sm text-gray-500 mb-3">
              Quét theo link video có thể quét nhiều link cùng lúc bằng cách xuống dòng cho mỗi link.
            </div>
            <textarea
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              placeholder="Nhập link video, user, hashtag hoặc từ khóa..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhập cookie
            </label>
            <textarea
              value={cookies}
              onChange={(e) => setCookies(e.target.value)}
              placeholder="Nhập cookie Tiktok"
              className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="flex items-center px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Search className="w-5 h-5 mr-2" />
              {isScanning ? `Đang quét... ${scanProgress}%` : 'Quét'}
            </button>
            <button
              onClick={handleStopScan}
              disabled={!isScanning}
              className="flex items-center px-6 py-3 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <StopCircle className="w-5 h-5 mr-2" />
              Dừng quét
            </button>
          </div>

          {isScanning && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${scanProgress}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Mục download luôn hiển thị */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Tích chọn từ:</span>
              <input
                type="number"
                value={selectedRange.from}
                onChange={(e) => setSelectedRange({ ...selectedRange, from: parseInt(e.target.value) || 0 })}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
              />
              <span className="text-sm text-gray-700">đến</span>
              <input
                type="number"
                value={selectedRange.to}
                onChange={(e) => setSelectedRange({ ...selectedRange, to: parseInt(e.target.value) || 0 })}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
              />
              <button 
                onClick={handleSelectRange}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                Chọn
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Lọc videos cao hơn:</span>
              <input
                type="number"
                value={filterViews}
                onChange={(e) => setFilterViews(parseInt(e.target.value) || 0)}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
              />
              <button 
                onClick={handleFilterByViews}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
              >
                Lọc
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleDownload}
              disabled={isDownloading || selectedVideos.size === 0 || videos.length === 0}
              className="flex items-center px-4 py-2 bg-green-500 text-white font-medium rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? `Đang tải... ${downloadProgress}%` : `Tải xuống video đã chọn (${selectedVideos.size})`}
            </button>
            <button
              onClick={handleStopDownload}
              disabled={!isDownloading}
              className="px-4 py-2 bg-yellow-500 text-white font-medium rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Dừng tải
            </button>
            <button
              onClick={handleDeleteList}
              disabled={videos.length === 0}
              className="flex items-center px-4 py-2 bg-red-500 text-white font-medium rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Xoá DS
            </button>
          </div>

          {isDownloading && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
          )}

          <div className="w-full max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo ID, tiêu đề, nội dung..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        {videos.length > 0 ? (
          <div className="mt-8">
            <div className="bg-red-500 text-white px-4 py-3 rounded-t-lg">
              <div className="grid grid-cols-9 gap-4 text-sm font-medium">
                <div>STT</div>
                <div className="flex justify-center">
                  <input 
                    type="checkbox" 
                    checked={selectedVideos.size === videos.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4" 
                  />
                </div>
                <div>Thumbnails</div>
                <div>ID</div>
                <div>Tiêu đề</div>
                <div>Nội dung</div>
                <div>Like</div>
                <div>View</div>
                <div>Trạng thái</div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-b-lg">
              {filteredVideos.map((video: VideoItem, index: number) => (
                <div 
                  key={video.id} 
                  className={`grid grid-cols-9 gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                    selectedVideos.has(video.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center">{index + 1}</div>
                  <div className="flex justify-center">
                    <input 
                      type="checkbox" 
                      checked={selectedVideos.has(video.id)}
                      onChange={() => handleSelectVideo(video.id)}
                      className="w-4 h-4" 
                    />
                  </div>
                  <div className="flex items-center">
                    <img 
                      src={video.thumbnail_url} 
                      alt="Thumbnail" 
                      className="w-16 h-12 object-cover rounded"
                    />
                  </div>
                  <div className="flex items-center text-sm font-mono">{video.tiktok_id}</div>
                  <div className="flex items-center text-sm">{video.title}</div>
                  <div className="flex items-center text-sm text-gray-600">{video.content}</div>
                  <div className="flex items-center text-sm">{video.likes.toLocaleString()}</div>
                  <div className="flex items-center text-sm">{video.views.toLocaleString()}</div>
                  <div className="flex items-center">
                    {video.status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {video.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    {video.status === 'downloading' && (
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {video.status === 'pending' && (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <div className="bg-red-500 text-white px-4 py-3 rounded-t-lg">
              <div className="grid grid-cols-8 gap-4 text-sm font-medium">
                <div>STT</div>
                <div className="flex justify-center">
                  <input type="checkbox" className="w-4 h-4" />
                </div>
                <div>Thumbnails</div>
                <div>ID</div>
                <div>Tiêu đề</div>
                <div>Nội dung</div>
                <div>Like</div>
                <div>View</div>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-b-lg p-8 text-center">
              <div className="text-gray-500">
                Chưa có video nào được quét. Hãy nhập link hoặc hashtag và nhấn "Quét" để bắt đầu.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoScanner;
