import axios from 'axios';

export interface ScanVideosParams {
  platform: 'tiktok' | 'douyin';
  videoLinks: string[];
  userProfiles: string[];
  hashtags: string[];
  cookies: string;
  onProgress?: (progress: number) => void;
}

export interface DownloadVideosParams {
  videoIds: string[];
  platform: 'tiktok' | 'douyin';
  cookies: string;
  onProgress?: (progress: number) => void;
}

export interface VideoItem {
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

export interface ScanResult {
  success: boolean;
  videos: VideoItem[];
  message?: string;
  totalCount?: number;
}

export interface DownloadResult {
  success: boolean;
  downloadedCount: number;
  message?: string;
  errors?: string[];
}

// Mock data cho development - sẽ thay thế bằng API thật
const mockVideos: VideoItem[] = [
  {
    id: '1',
    tiktok_id: '7303728609955515653',
    title: 'Video TikTok đẹp #1',
    content: 'Nội dung video TikTok rất thú vị và hấp dẫn',
    likes: 15000,
    views: 150000,
    uploader: '@vzry4n.cenas',
    thumbnail_url: 'https://via.placeholder.com/160x120/ff0000/ffffff?text=TikTok',
    video_url: 'https://example.com/video1.mp4',
    downloaded: false,
    status: 'pending'
  },
  {
    id: '2',
    tiktok_id: '7303728609955515654',
    title: 'Video TikTok hay #2',
    content: 'Nội dung video TikTok rất thú vị và hấp dẫn',
    likes: 25000,
    views: 250000,
    uploader: '@hieuhayho',
    thumbnail_url: 'https://via.placeholder.com/160x120/00ff00/ffffff?text=TikTok',
    video_url: 'https://example.com/video2.mp4',
    downloaded: false,
    status: 'pending'
  },
  {
    id: '3',
    tiktok_id: '7303728609955515655',
    title: 'Video TikTok hot #3',
    content: 'Nội dung video TikTok rất thú vị và hấp dẫn',
    likes: 35000,
    views: 350000,
    uploader: '@user123',
    thumbnail_url: 'https://via.placeholder.com/160x120/0000ff/ffffff?text=TikTok',
    video_url: 'https://example.com/video3.mp4',
    downloaded: false,
    status: 'pending'
  }
];

export const scanVideos = async (params: ScanVideosParams): Promise<ScanResult> => {
  try {
    console.log('Starting video scan with params:', params);
    
    // Call backend API
    const response = await axios.post('/api/scan-videos', {
      platform: params.platform,
      videoLinks: params.videoLinks,
      userProfiles: params.userProfiles,
      hashtags: params.hashtags,
      cookies: params.cookies
    });

    if (response.data.success) {
      // Simulate progress updates for better UX
      if (params.onProgress) {
        for (let i = 0; i <= 100; i += 20) {
          params.onProgress(i);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      return response.data;
    } else {
      return {
        success: false,
        videos: [],
        message: response.data.message || 'Scan failed'
      };
    }

  } catch (error) {
    console.error('Error scanning videos:', error);
    return {
      success: false,
      videos: [],
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

export const downloadVideos = async (params: DownloadVideosParams): Promise<DownloadResult> => {
  try {
    console.log('Starting video download with params:', params);
    
    // Call backend API
    const response = await axios.post('/api/download-video', {
      videoIds: params.videoIds,
      platform: params.platform,
      cookies: params.cookies
    });

    if (response.data.success) {
      // Simulate progress updates for better UX
      if (params.onProgress) {
        for (let i = 0; i <= 100; i += 10) {
          params.onProgress(i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return response.data;
    } else {
      return {
        success: false,
        downloadedCount: 0,
        message: response.data.message || 'Download failed'
      };
    }

  } catch (error) {
    console.error('Error downloading videos:', error);
    return {
      success: false,
      downloadedCount: 0,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Helper functions for TikTok/Douyin URL parsing
export const parseTikTokUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    
    // Extract video ID from various TikTok URL formats
    if (urlObj.pathname.includes('/video/')) {
      const videoId = urlObj.pathname.split('/video/')[1]?.split('?')[0];
      return { type: 'video', id: videoId };
    }
    
    // Extract user profile
    if (urlObj.pathname.includes('/@')) {
      const username = urlObj.pathname.split('/@')[1]?.split('/')[0];
      return { type: 'user', id: username };
    }
    
    return { type: 'unknown', id: null };
  } catch (error) {
    return { type: 'invalid', id: null };
  }
};

export const parseDouyinUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    
    // Extract video ID from Douyin URL formats
    if (urlObj.pathname.includes('/video/')) {
      const videoId = urlObj.pathname.split('/video/')[1]?.split('?')[0];
      return { type: 'video', id: videoId };
    }
    
    // Extract user profile
    if (urlObj.pathname.includes('/user/')) {
      const userId = urlObj.pathname.split('/user/')[1]?.split('/')[0];
      return { type: 'user', id: userId };
    }
    
    return { type: 'unknown', id: null };
  } catch (error) {
    return { type: 'invalid', id: null };
  }
};

// Function to extract video metadata from TikTok/Douyin
export const extractVideoMetadata = async (videoId: string, platform: 'tiktok' | 'douyin', cookies: string) => {
  try {
    // TODO: Implement real metadata extraction
    // 1. Use TikTok/Douyin API or web scraping
    // 2. Extract title, content, likes, views, uploader, thumbnail
    // 3. Get video URL without watermark
    
    // For now, return mock data
    return {
      title: `Video ${videoId}`,
      content: `Nội dung video ${videoId}`,
      likes: Math.floor(Math.random() * 50000) + 1000,
      views: Math.floor(Math.random() * 500000) + 10000,
      uploader: `@user${Math.floor(Math.random() * 1000)}`,
      thumbnail_url: `https://via.placeholder.com/160x120/${Math.floor(Math.random()*16777215).toString(16)}/ffffff?text=${platform}`,
      video_url: `https://example.com/video_${videoId}.mp4`
    };
  } catch (error) {
    console.error('Error extracting video metadata:', error);
    throw error;
  }
};

// Function to download video without watermark
export const downloadVideoWithoutWatermark = async (videoId: string, platform: 'tiktok' | 'douyin', cookies: string) => {
  try {
    // TODO: Implement real watermark removal
    // 1. Fetch video with watermark
    // 2. Process video to remove watermark
    // 3. Save processed video
    
    console.log(`Downloading video ${videoId} from ${platform} without watermark`);
    
    // Simulate download process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      filePath: `downloads/${platform}_${videoId}_no_watermark.mp4`,
      size: Math.floor(Math.random() * 10000000) + 1000000 // 1MB - 10MB
    };
  } catch (error) {
    console.error('Error downloading video without watermark:', error);
    throw error;
  }
};
