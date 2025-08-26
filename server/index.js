const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const TikTokService = require('./services/tiktokService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database initialization
const db = new sqlite3.Database('./database/tiktok_automation.db');

// Initialize database tables
db.serialize(() => {
  // Videos table
  db.run(`CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tiktok_id TEXT UNIQUE,
    title TEXT,
    content TEXT,
    likes INTEGER,
    views INTEGER,
    uploader TEXT,
    thumbnail_url TEXT,
    video_url TEXT,
    downloaded BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Accounts table
  db.run(`CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT,
    username TEXT,
    cookie TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Scheduled posts table
  db.run(`CREATE TABLE IF NOT EXISTS scheduled_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id INTEGER,
    account_id INTEGER,
    platform TEXT,
    scheduled_time DATETIME,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos (id),
    FOREIGN KEY (account_id) REFERENCES accounts (id)
  )`);
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'TikTok Automation Server is running' });
});

// Video scanning endpoint
app.post('/api/scan-videos', async (req, res) => {
  try {
    const { platform, videoLinks, userProfiles, hashtags, cookies } = req.body;
    
    // Initialize TikTok service
    const tiktokService = new TikTokService();
    
    // Start scanning
    const result = await tiktokService.scanVideos({
      platform,
      videoLinks: videoLinks || [],
      userProfiles: userProfiles || [],
      hashtags: hashtags || [],
      cookies: cookies || ''
    });
    
    if (result.success) {
      // Save videos to database
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO videos 
        (tiktok_id, title, content, likes, views, uploader, thumbnail_url, video_url, downloaded, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      
      for (const video of result.videos) {
        stmt.run([
          video.tiktok_id,
          video.title,
          video.content,
          video.likes,
          video.views,
          video.uploader,
          video.thumbnail_url,
          video.video_url,
          video.downloaded ? 1 : 0
        ]);
      }
      
      stmt.finalize();
      
      res.json(result);
    } else {
      res.status(400).json(result);
    }
    
    // Clean up
    await tiktokService.closeBrowser();
    
  } catch (error) {
    console.error('Error scanning videos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error scanning videos',
      error: error.message 
    });
  }
});

// Get scanned videos
app.get('/api/videos', (req, res) => {
  db.all('SELECT * FROM videos ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching videos',
        error: err.message 
      });
    } else {
      res.json({ 
        success: true, 
        data: rows 
      });
    }
  });
});

// Download video endpoint
app.post('/api/download-video', async (req, res) => {
  try {
    const { videoIds, platform, cookies } = req.body;
    
    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Video IDs are required'
      });
    }
    
    // Initialize TikTok service
    const tiktokService = new TikTokService();
    
    const results = [];
    const errors = [];
    
    // Download each video
    for (const videoId of videoIds) {
      try {
        // Get video info from database
        const video = await new Promise((resolve, reject) => {
          db.get('SELECT * FROM videos WHERE id = ?', [videoId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
        
        if (!video) {
          errors.push(`Video ${videoId} not found`);
          continue;
        }
        
        // Download video without watermark
        const downloadResult = await tiktokService.downloadVideo(
          video.tiktok_id, 
          platform || 'tiktok', 
          cookies || ''
        );
        
        if (downloadResult.success) {
          // Update database
          db.run('UPDATE videos SET downloaded = 1 WHERE id = ?', [videoId]);
          results.push({
            videoId,
            success: true,
            filePath: downloadResult.filePath,
            size: downloadResult.size
          });
        } else {
          errors.push(`Failed to download video ${videoId}`);
        }
        
      } catch (error) {
        console.error(`Error downloading video ${videoId}:`, error);
        errors.push(`Error downloading video ${videoId}: ${error.message}`);
      }
    }
    
    // Clean up
    await tiktokService.closeBrowser();
    
    res.json({
      success: true,
      downloadedCount: results.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error downloading videos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error downloading videos',
      error: error.message 
    });
  }
});

// Schedule post endpoint
app.post('/api/schedule-post', async (req, res) => {
  try {
    const { videoId, accountId, platform, scheduledTime } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO scheduled_posts (video_id, account_id, platform, scheduled_time)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run([videoId, accountId, platform, scheduledTime], function(err) {
      if (err) {
        res.status(500).json({ 
          success: false, 
          message: 'Error scheduling post',
          error: err.message 
        });
      } else {
        res.json({ 
          success: true, 
          message: 'Post scheduled successfully',
          postId: this.lastID 
        });
      }
    });
    
    stmt.finalize();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error scheduling post',
      error: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TikTok Automation Server running on port ${PORT}`);
  console.log(`📱 Frontend will be available at http://localhost:3000`);
});

module.exports = app;
