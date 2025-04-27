require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if not exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Database connection
const mongoURI = process.env.MONGODB_URI ||
  'mongodb+srv://kunalsonne:kunalsonne1847724@cluster0.95mdg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schema and Model
const detectionSchema = new mongoose.Schema({
  imagePath: String,
  timestamp: Date,
  logs: String
});
const Detection = mongoose.model('Detection', detectionSchema);

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());
app.use('/uploads', express.static(uploadDir));

// Routes
app.get('/', (req, res) => {
  res.send('SARV Detection Server is running');
});

app.post('/upload', async (req, res) => {
  try {
    const { timestamp, logs, image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Generate filename
    const filename = `detection-${Date.now()}.jpg`;
    const imagePath = path.join(uploadDir, filename);

    try {
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(image, 'base64');
      
      // Save image to filesystem
      fs.writeFileSync(imagePath, imageBuffer);
      
      // Create database record
      const detection = new Detection({
        imagePath: filename,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        logs: logs || 'No detection info'
      });

      await detection.save();
      res.status(201).json({
        message: 'Detection saved successfully',
        imageUrl: `https://${req.get('host')}/uploads/${filename}`
      });

    } catch (fileError) {
      console.error('File save error:', fileError);
      return res.status(500).json({ error: 'Failed to save image file' });
    }

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/detections', async (req, res) => {
  try {
    const timeFilter = new Date(Date.now() - 15 * 60 * 1000); // Last 15 minutes
    const results = await Detection.find({
      timestamp: { $gte: timeFilter }
    }).sort({ timestamp: -1 });

    // Convert to client-friendly format
    const detections = results.map(d => ({
      timestamp: d.timestamp,
      logs: d.logs,
      imageUrl: `https://${req.get('host')}/uploads/${d.imagePath}`
    }));

    res.status(200).json(detections);

  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve detections' });
  }
});

// Cleanup old files (run every hour)
setInterval(async () => {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    const oldRecords = await Detection.find({ timestamp: { $lt: cutoff } });
    
    oldRecords.forEach(record => {
      const filePath = path.join(uploadDir, record.imagePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    
    await Detection.deleteMany({ timestamp: { $lt: cutoff } });
    console.log(`Cleaned up ${oldRecords.length} old records`);

  } catch (cleanupError) {
    console.error('Cleanup error:', cleanupError);
  }
}, 3600000); // 1 hour interval

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Upload directory: ${uploadDir}`);
});
