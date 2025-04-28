require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

// Google Drive setup
const KEYFILE = credentials.json; // path to service account JSON
const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID; // your Drive folder ID
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE,
  scopes: ['https://www.googleapis.com/auth/drive.file']
});
const driveService = google.drive({ version: 'v3', auth });

app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));
app.use(cors());
app.use('/uploads', express.static('uploads'));

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
  timestamp: Date,
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

app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const { timestamp, logs } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No image file' });

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
    fs.unlink(req.file.path, err => { if (err) console.error('Local file deletion error', err); });

    res.status(201).json({ message: 'Detection saved', driveLink });
  } catch (err) {
    console.error('Error in upload:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/detections', async (req, res) => {
  try {
    const last15 = new Date(Date.now() - 15 * 60 * 1000);
    const det = await Detection.find({ timestamp: { $gte: last15 } });
    res.json(det);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
