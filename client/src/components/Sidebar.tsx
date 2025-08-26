import React from 'react';
import { 
  Search, 
  Download, 
  Brain, 
  Scissors, 
  FolderOpen, 
  Music, 
  Users, 
  UserCheck, 
  Shield, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Instagram, 
  Youtube, 
  Facebook 
} from 'lucide-react';

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menuId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeMenu, onMenuChange }) => {
  const menuItems = [
    {
      id: 'scan-video',
      label: 'Quét video',
      icon: Search,
      section: 'main'
    },
    {
      id: 'downloaded-videos',
      label: 'DS video đã download',
      icon: Download,
      section: 'main'
    },
    {
      id: 'ai-management',
      label: 'Quản lý AI',
      icon: Brain,
      section: 'main'
    },
    {
      id: 'video-editor',
      label: 'Chỉnh sửa video',
      icon: Scissors,
      section: 'main'
    },
    {
      id: 'video-group-management',
      label: 'Quản lý nhóm video',
      icon: FolderOpen,
      section: 'main'
    },
    {
      id: 'music-library',
      label: 'Kho nhạc',
      icon: Music,
      section: 'main'
    },
    {
      id: 'account-management',
      label: 'Quản lý tài khoản',
      icon: Users,
      section: 'management'
    },
    {
      id: 'account-group-management',
      label: 'Quản lý nhóm tài khoản',
      icon: UserCheck,
      section: 'management'
    },
    {
      id: 'proxy-management',
      label: 'Quản lý proxy',
      icon: Shield,
      section: 'management'
    },
    {
      id: 'post-schedule',
      label: 'Lịch trình đăng bài',
      icon: Calendar,
      section: 'management'
    },
    {
      id: 'batch-scheduling',
      label: 'Lên lịch hàng loạt',
      icon: Clock,
      section: 'management'
    },
    {
      id: 'fb-reels-comments',
      label: 'Gắn bình luận cho Reels FB',
      icon: MessageSquare,
      section: 'management',
      badge: 'NEW'
    },
    {
      id: 'post-reels-profile',
      label: 'Đăng reels Profile',
      icon: Facebook,
      section: 'posting'
    },
    {
      id: 'post-reels-fanpage',
      label: 'Đăng reels Fanpage',
      icon: Facebook,
      section: 'posting'
    },
    {
      id: 'post-reels-instagram',
      label: 'Đăng reels Instagram',
      icon: Instagram,
      section: 'posting'
    },
    {
      id: 'post-youtube-short',
      label: 'Đăng Youtube short',
      icon: Youtube,
      section: 'posting'
    },
    {
      id: 'post-tiktok',
      label: 'Đăng Tiktok',
      icon: Facebook,
      section: 'posting'
    }
  ];

  const sections = [
    { id: 'main', label: 'Tính năng chính' },
    { id: 'management', label: 'Quản lý' },
    { id: 'posting', label: 'Tác vụ đăng video' }
  ];

  const renderSection = (sectionId: string) => {
    const sectionItems = menuItems.filter(item => item.section === sectionId);
    
    return (
      <div key={sectionId} className="mb-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">
          {sections.find(s => s.id === sectionId)?.label}
        </h3>
        {sectionItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeMenu === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onMenuChange(item.id)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-red-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <IconComponent className="w-5 h-5 mr-3" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto py-4">
      <div className="px-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
      </div>
      
      {sections.map(section => renderSection(section.id))}
    </div>
  );
};

export default Sidebar;

