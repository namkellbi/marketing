import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import VideoScanner from './components/VideoScanner';
import DownloadedVideos from './components/DownloadedVideos';
import AIManagement from './components/AIManagement';
import VideoEditor from './components/VideoEditor';
import VideoGroupManagement from './components/VideoGroupManagement';
import MusicLibrary from './components/MusicLibrary';
import AccountManagement from './components/AccountManagement';
import AccountGroupManagement from './components/AccountGroupManagement';
import ProxyManagement from './components/ProxyManagement';
import PostSchedule from './components/PostSchedule';
import BatchScheduling from './components/BatchScheduling';
import FBReelsComments from './components/FBReelsComments';
import PostReelsProfile from './components/PostReelsProfile';
import PostReelsFanpage from './components/PostReelsFanpage';
import PostReelsInstagram from './components/PostReelsInstagram';
import PostYoutubeShort from './components/PostYoutubeShort';
import PostTiktok from './components/PostTiktok';

export type MenuItem = {
  id: string;
  label: string;
  icon: string;
  badge?: string;
  children?: MenuItem[];
};

const App: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState('scan-video');

  const renderContent = () => {
    switch (activeMenu) {
      case 'scan-video':
        return <VideoScanner />;
      case 'downloaded-videos':
        return <DownloadedVideos />;
      case 'ai-management':
        return <AIManagement />;
      case 'video-editor':
        return <VideoEditor />;
      case 'video-group-management':
        return <VideoGroupManagement />;
      case 'music-library':
        return <MusicLibrary />;
      case 'account-management':
        return <AccountManagement />;
      case 'account-group-management':
        return <AccountGroupManagement />;
      case 'proxy-management':
        return <ProxyManagement />;
      case 'post-schedule':
        return <PostSchedule />;
      case 'batch-scheduling':
        return <BatchScheduling />;
      case 'fb-reels-comments':
        return <FBReelsComments />;
      case 'post-reels-profile':
        return <PostReelsProfile />;
      case 'post-reels-fanpage':
        return <PostReelsFanpage />;
      case 'post-reels-instagram':
        return <PostReelsInstagram />;
      case 'post-youtube-short':
        return <PostYoutubeShort />;
      case 'post-tiktok':
        return <PostTiktok />;
      default:
        return <VideoScanner />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-semibold text-gray-800">
                MARKETING BY NAMNH
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            TikTok Automation Tool v2.0
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="fixed left-0 top-16 h-full w-64 bg-white border-r border-gray-200 z-40">
        <Sidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} />
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 mt-16 overflow-auto">
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default App;

