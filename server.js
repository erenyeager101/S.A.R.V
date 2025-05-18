require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');

const app  = express();
const port = 3000;

// Google Drive setup
const KEYFILE = path.join(__dirname, 'credentials.json'); // path to service account JSON
const DRIVE_FOLDER_ID = '1nnt3XLKD6Wdn5VQn1FiNTn0YAeJBeQ3V'; // your Drive folder ID
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE,
  scopes: ['https://www.googleapis.com/auth/drive.file']
});
const driveService = google.drive({ version: 'v3', auth });

app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));
app.use(cors());
app.use(bodyParser.json());

// Multer config for local temp storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// MongoDB setup
const mongoURI = process.env.MONGODB_URI;
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const detectionSchema = new mongoose.Schema({
  imagePath: String,    // Google Drive webViewLink
  timestamp: { type: Date, default: Date.now },
  logs: String
});
const Detection = mongoose.model('Detection', detectionSchema);

// Upload file to Google Drive folder, return webViewLink
async function uploadToDrive(localPath, filename) {
  const fileMetadata = {
    name: filename,
    parents: [DRIVE_FOLDER_ID]
  };
  const media = {
    mimeType: 'image/jpeg',
    body: fs.createReadStream(localPath)
  };
  const response = await driveService.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, webViewLink, webContentLink'
  });
  return response.data;
}

// Upload route
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const { timestamp, logs } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded' });

    // Upload to Drive
    const driveFile = await uploadToDrive(req.file.path, req.file.filename);
    const driveLink = driveFile.webViewLink;

    // Save detection in DB
    const detection = new Detection({
      imagePath: driveLink,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      logs: logs || ''
    });
    await detection.save();

    // Remove local file
    fs.unlink(req.file.path, err => {
      if (err) console.error('Error deleting local file:', err);
    });

    res.status(201).json({ message: 'Detection saved successfully', driveLink });
  } catch (err) {
    console.error('Error during upload:', err);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

// Fetch recent detections route
app.get('/detections', async (req, res) => {
  try {
    const last15Minutes = new Date(Date.now() - 15 * 60 * 1000);
    const detections = await Detection.find({ timestamp: { $gte: last15Minutes } });
    res.json(detections);
  } catch (err) {
    console.error('Error fetching detections:', err);
    res.status(500).json({ error: 'Failed to fetch detections', details: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
