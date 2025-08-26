const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class TikTokService {
  constructor() {
    this.browser = null;
    this.cookies = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      });
    }
    return this.browser;
  }

  async setCookies(cookies) {
    this.cookies = cookies;
  }

  async parseCookies(cookieString) {
    const cookies = [];
    const cookiePairs = cookieString.split(';');
    
    for (const pair of cookiePairs) {
      const [name, value] = pair.trim().split('=');
      if (name && value) {
        cookies.push({
          name: name.trim(),
          value: value.trim(),
          domain: '.tiktok.com',
          path: '/'
        });
      }
    }
    
    return cookies;
  }

  async scanVideos(params) {
    const { platform, videoLinks, userProfiles, hashtags, cookies } = params;
    
    try {
      console.log(`Starting scan for platform: ${platform}`);
      console.log(`Video links: ${videoLinks.length}, User profiles: ${userProfiles.length}, Hashtags: ${hashtags.length}`);
      
      await this.setCookies(cookies);
      const browser = await this.initBrowser();
      const videos = [];

      // Scan video links
      for (const videoLink of videoLinks) {
        console.log(`Scanning video link: ${videoLink}`);
        const videoData = await this.scanVideoLink(videoLink, platform);
        if (videoData) {
          videos.push(videoData);
          console.log(`Successfully scanned video: ${videoData.tiktok_id}`);
        }
      }

      // Scan user profiles
      for (const userProfile of userProfiles) {
        console.log(`Scanning user profile: ${userProfile}`);
        const userVideos = await this.scanUserProfile(userProfile, platform);
        videos.push(...userVideos);
        console.log(`Found ${userVideos.length} videos from user profile`);
      }

      // Scan hashtags
      for (const hashtag of hashtags) {
        console.log(`Scanning hashtag: ${hashtag}`);
        const hashtagVideos = await this.scanHashtag(hashtag, platform);
        videos.push(...hashtagVideos);
        console.log(`Found ${hashtagVideos.length} videos from hashtag`);
      }

      console.log(`Total videos found: ${videos.length}`);
      return {
        success: true,
        videos,
        totalCount: videos.length
      };

    } catch (error) {
      console.error('Error scanning videos:', error);
      return {
        success: false,
        videos: [],
        message: error.message
      };
    }
  }

  async scanVideoLink(videoLink, platform) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      // Set cookies if available
      if (this.cookies) {
        const cookies = await this.parseCookies(this.cookies);
        await page.setCookie(...cookies);
      }

      // Set user agent và viewport
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });

      // Tăng timeout và cải thiện navigation
      await page.goto(videoLink, { 
        waitUntil: 'domcontentloaded', 
        timeout: 60000 
      });
      
      // Đợi thêm để page load hoàn toàn
      await page.waitForTimeout(5000);
      
      // Thử đợi một số element quan trọng
      try {
        await page.waitForSelector('h1, [data-e2e="video-title"], .video-title', { timeout: 10000 });
      } catch (e) {
        console.log('Timeout waiting for title element, continuing...');
      }

             // Extract video information
       const videoData = await page.evaluate((platformParam) => {
         // TikTok video page structure - cải thiện selector
         const titleElement = document.querySelector('h1[data-e2e="video-title"]') || 
                            document.querySelector('.video-meta-title') ||
                            document.querySelector('h1') ||
                            document.querySelector('[data-e2e="browse-video-title"]') ||
                            document.querySelector('.video-title');
         
         const contentElement = document.querySelector('.video-meta-caption') ||
                              document.querySelector('.video-description') ||
                              document.querySelector('p') ||
                              document.querySelector('[data-e2e="browse-video-desc"]') ||
                              document.querySelector('.video-caption');
         
         const likesElement = document.querySelector('[data-e2e="like-count"]') ||
                            document.querySelector('.like-count') ||
                            document.querySelector('[data-e2e="like-icon"] + span') ||
                            document.querySelector('[data-e2e="browse-like-count"]') ||
                            document.querySelector('.like-icon + span');
         
         const viewsElement = document.querySelector('[data-e2e="video-views"]') ||
                            document.querySelector('.video-views') ||
                            document.querySelector('.view-count') ||
                            document.querySelector('[data-e2e="browse-video-count"]') ||
                            document.querySelector('.video-count');
         
         const uploaderElement = document.querySelector('[data-e2e="video-author-uniqueId"]') ||
                               document.querySelector('.author-unique-id') ||
                               document.querySelector('.username') ||
                               document.querySelector('[data-e2e="browse-user-uniqueId"]') ||
                               document.querySelector('.user-unique-id');

         // Extract video ID from URL
         const videoId = window.location.pathname.split('/video/')[1]?.split('?')[0] || 'unknown';

         return {
           tiktok_id: videoId,
           title: titleElement?.textContent?.trim() || 'Untitled Video',
           content: contentElement?.textContent?.trim() || '',
           likes: parseInt(likesElement?.textContent?.replace(/[^\d]/g, '') || '0'),
           views: parseInt(viewsElement?.textContent?.replace(/[^\d]/g, '') || '0'),
           uploader: uploaderElement?.textContent?.trim() || 'Unknown User',
           thumbnail_url: '', // Will be extracted separately
           video_url: '', // Will be extracted separately
           platform: platformParam
         };
       }, platform);

                    // Extract thumbnail and video URL
       const mediaData = await this.extractMediaUrls(page);
       
       await page.close();

       // Tạo fallback thumbnail nếu không tìm thấy
       if (!mediaData.thumbnail_url) {
         mediaData.thumbnail_url = `https://via.placeholder.com/160x120/ff0050/ffffff?text=${encodeURIComponent(videoData.title)}`;
       }

       return {
         id: `video_${videoData.tiktok_id}`,
         ...videoData,
         ...mediaData,
         downloaded: false,
         status: 'pending'
       };

    } catch (error) {
      console.error(`Error scanning video link ${videoLink}:`, error);
      
      // Thử lại một lần nữa nếu là lỗi timeout
      if (error.name === 'TimeoutError') {
        console.log(`Retrying video link ${videoLink} due to timeout...`);
        try {
          await page.waitForTimeout(2000);
                     const retryData = await page.evaluate((platformParam) => {
             // Simplified retry logic
             const titleElement = document.querySelector('h1') || document.querySelector('title');
             const videoId = window.location.pathname.split('/video/')[1]?.split('?')[0] || 'unknown';
             
             // Thử tìm thumbnail trong retry
             let thumbnailUrl = '';
             const imgSelectors = [
               'img[src*="tiktok"]',
               'img[src*="amazonaws"]',
               'img[src*="cdn"]',
               'img[src*="sf16"]'
             ];
             
             for (const selector of imgSelectors) {
               const img = document.querySelector(selector);
               if (img && img.src) {
                 thumbnailUrl = img.src;
                 break;
               }
             }
             
             return {
               tiktok_id: videoId,
               title: titleElement?.textContent?.trim() || 'Untitled Video',
               content: '',
               likes: 0,
               views: 0,
               uploader: 'Unknown User',
               thumbnail_url: thumbnailUrl,
               video_url: '',
               platform: platformParam
             };
           }, platform);
          
                     await page.close();
           
           // Tạo fallback thumbnail nếu không tìm thấy
           if (!retryData.thumbnail_url) {
             retryData.thumbnail_url = `https://via.placeholder.com/160x120/ff0050/ffffff?text=${encodeURIComponent(retryData.title)}`;
           }
           
           return {
             id: `video_${retryData.tiktok_id}`,
             ...retryData,
             downloaded: false,
             status: 'pending'
           };
        } catch (retryError) {
          console.error(`Retry failed for ${videoLink}:`, retryError);
        }
      }
      
      return null;
    }
  }

  async scanUserProfile(userProfile, platform) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      // Set cookies if available
      if (this.cookies) {
        const cookies = await this.parseCookies(this.cookies);
        await page.setCookie(...cookies);
      }

      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      // Tăng timeout và cải thiện navigation
      await page.goto(userProfile, { 
        waitUntil: 'domcontentloaded', 
        timeout: 60000 
      });
      
      // Đợi thêm để page load hoàn toàn
      await page.waitForTimeout(3000);

      // Scroll to load more videos
      await this.scrollToLoadMore(page);

      // Extract all video information
      const videos = await page.evaluate(() => {
        const videoElements = document.querySelectorAll('[data-e2e="user-post-item"]') ||
                            document.querySelectorAll('.video-feed-item') ||
                            document.querySelectorAll('a[href*="/video/"]');

        return Array.from(videoElements).map((element, index) => {
          const linkElement = element.querySelector('a[href*="/video/"]');
          const videoId = linkElement?.href?.split('/video/')[1]?.split('?')[0] || `unknown_${index}`;
          
          const titleElement = element.querySelector('.video-title') ||
                             element.querySelector('h3') ||
                             element.querySelector('p');
          
          const likesElement = element.querySelector('.like-count') ||
                             element.querySelector('[data-e2e="like-count"]') ||
                             element.querySelector('.stats-item:first-child');
          
          const viewsElement = element.querySelector('.view-count') ||
                             element.querySelector('[data-e2e="video-views"]') ||
                             element.querySelector('.stats-item:last-child');

          return {
            tiktok_id: videoId,
            title: titleElement?.textContent?.trim() || `Video ${index + 1}`,
            content: '',
            likes: parseInt(likesElement?.textContent?.replace(/[^\d]/g, '') || '0'),
            views: parseInt(viewsElement?.textContent?.replace(/[^\d]/g, '') || '0'),
            uploader: window.location.pathname.split('/@')[1]?.split('/')[0] || 'Unknown User',
            thumbnail_url: '',
            video_url: '',
            platform: 'tiktok'
          };
        });
      });

      await page.close();

             // Limit to first 20 videos to avoid overwhelming
       return videos.slice(0, 20).map(video => ({
         id: `user_${video.tiktok_id}`,
         ...video,
         thumbnail_url: video.thumbnail_url || `https://via.placeholder.com/160x120/ff0050/ffffff?text=${encodeURIComponent(video.title)}`,
         downloaded: false,
         status: 'pending'
       }));

    } catch (error) {
      console.error(`Error scanning user profile ${userProfile}:`, error);
      return [];
    }
  }

  async scanHashtag(hashtag, platform) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      // Set cookies if available
      if (this.cookies) {
        const cookies = await this.parseCookies(this.cookies);
        await page.setCookie(...cookies);
      }

      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      // Construct hashtag search URL
      const searchUrl = `https://www.tiktok.com/tag/${hashtag.replace('#', '')}`;
      // Tăng timeout và cải thiện navigation
      await page.goto(searchUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 60000 
      });
      
      // Đợi thêm để page load hoàn toàn
      await page.waitForTimeout(3000);

      // Scroll to load more videos
      await this.scrollToLoadMore(page);

      // Extract video information
      const videos = await page.evaluate(() => {
        const videoElements = document.querySelectorAll('[data-e2e="search-card-container"]') ||
                            document.querySelectorAll('.video-card') ||
                            document.querySelectorAll('a[href*="/video/"]');

        return Array.from(videoElements).map((element, index) => {
          const linkElement = element.querySelector('a[href*="/video/"]');
          const videoId = linkElement?.href?.split('/video/')[1]?.split('?')[0] || `hashtag_${index}`;
          
          const titleElement = element.querySelector('.video-title') ||
                             element.querySelector('h3') ||
                             element.querySelector('p');
          
          const uploaderElement = element.querySelector('.author-unique-id') ||
                                element.querySelector('.username') ||
                                element.querySelector('a[href*="/@"]');

          return {
            tiktok_id: videoId,
            title: titleElement?.textContent?.trim() || `Hashtag Video ${index + 1}`,
            content: '',
            likes: 0, // Will be updated when scanning individual video
            views: 0, // Will be updated when scanning individual video
            uploader: uploaderElement?.textContent?.trim() || 'Unknown User',
            thumbnail_url: '',
            video_url: '',
            platform: 'tiktok'
          };
        });
      });

      await page.close();

             // Limit to first 15 videos
       return videos.slice(0, 15).map(video => ({
         id: `hashtag_${video.tiktok_id}`,
         ...video,
         thumbnail_url: video.thumbnail_url || `https://via.placeholder.com/160x120/ff0050/ffffff?text=${encodeURIComponent(video.title)}`,
         downloaded: false,
         status: 'pending'
       }));

    } catch (error) {
      console.error(`Error scanning hashtag ${hashtag}:`, error);
      return [];
    }
  }

  async scrollToLoadMore(page) {
    try {
      // Scroll down to load more content
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      console.error('Error scrolling to load more:', error);
    }
  }

  async extractMediaUrls(page) {
    try {
      // Extract thumbnail URL - cải thiện selector cho TikTok
      const thumbnailUrl = await page.evaluate(() => {
        // TikTok specific selectors
        const selectors = [
          'img[src*="tiktok"]',
          'img[src*="amazonaws"]',
          'img[src*="cdn"]',
          'img[src*="sf16"]',
          'img[data-src*="tiktok"]',
          'img[data-src*="amazonaws"]',
          'img[data-src*="cdn"]',
          'img[data-src*="sf16"]',
          '.video-thumbnail img',
          '.video-poster img',
          '[data-e2e="video-thumbnail"] img',
          '[data-e2e="browse-video-thumbnail"] img',
          'img[alt*="video"]',
          'img[alt*="thumbnail"]',
          'img[alt*="poster"]'
        ];
        
        for (const selector of selectors) {
          const img = document.querySelector(selector);
          if (img && img.src && img.src.length > 0) {
            return img.src;
          }
          if (img && img.getAttribute('data-src') && img.getAttribute('data-src').length > 0) {
            return img.getAttribute('data-src');
          }
        }
        
        // Fallback: tìm bất kỳ img nào có kích thước hợp lý
        const allImages = document.querySelectorAll('img');
        for (const img of allImages) {
          if (img.src && img.src.includes('http') && 
              (img.src.includes('tiktok') || img.src.includes('amazonaws') || img.src.includes('cdn'))) {
            return img.src;
          }
        }
        
        return '';
      });

      // Extract video URL
      const videoUrl = await page.evaluate(() => {
        const selectors = [
          'video source',
          'video',
          '[data-e2e="video-player"] source',
          '[data-e2e="video-player"] video',
          '.video-player source',
          '.video-player video'
        ];
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.src) {
            return element.src;
          }
        }
        
        return '';
      });

      console.log(`Extracted thumbnail: ${thumbnailUrl ? 'Found' : 'Not found'}`);
      console.log(`Extracted video URL: ${videoUrl ? 'Found' : 'Not found'}`);

      return {
        thumbnail_url: thumbnailUrl,
        video_url: videoUrl
      };

    } catch (error) {
      console.error('Error extracting media URLs:', error);
      return {
        thumbnail_url: '',
        video_url: ''
      };
    }
  }

  async downloadVideo(videoId, platform, cookies) {
    try {
      // This is a placeholder for actual video download logic
      // In a real implementation, you would:
      // 1. Fetch the video file from TikTok/Douyin
      // 2. Process it to remove watermark
      // 3. Save to local storage
      
      console.log(`Downloading video ${videoId} from ${platform}`);
      
      // Simulate download process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Create downloads directory if it doesn't exist
      const downloadsDir = path.join(__dirname, '../downloads');
      await fs.mkdir(downloadsDir, { recursive: true });
      
      // Generate filename
      const filename = `${platform}_${videoId}_no_watermark.mp4`;
      const filePath = path.join(downloadsDir, filename);
      
      // Create a dummy file for now
      await fs.writeFile(filePath, `Dummy video content for ${videoId}`);
      
      return {
        success: true,
        filePath,
        size: Math.floor(Math.random() * 10000000) + 1000000 // 1MB - 10MB
      };

    } catch (error) {
      console.error(`Error downloading video ${videoId}:`, error);
      throw error;
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = TikTokService;
