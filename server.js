require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fs = require('fs');
const multer = require('multer');  
const cors = require('cors');   

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));
app.use(cors());  
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));   
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);  
  }
});

const upload = multer({ storage: storage });
 
const mongoURI = process.env.MONGODB_URI ||
  'mongodb+srv://kunalsonne:kunalsonne1847724@cluster0.95mdg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));
 
const detectionSchema = new mongoose.Schema({
  imagePath: String,  
  timestamp: Date,
  logs: String
});
const Detection = mongoose.model('Detection', detectionSchema);

app.get('/', (req, res) => {
  res.send('SARV Detection Server is running');
});
 
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const { timestamp, logs } = req.body;
    const imagePath = req.file ? req.file.path : null;  
 
    const detection = new Detection({
      imagePath: imagePath,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      logs: logs || ''
    });

    await detection.save();
    res.status(201).json({ message: 'Detection saved', imagePath });
  } catch (err) {
    console.error('Error saving detection:', err);
    res.status(500).json({ error: 'Failed to save detection' });
  }
}); 
app.get('/detections', async (req, res) => {
  try {
    const last15Minutes = new Date(Date.now() - 15 * 60 * 1000);  
    const detections = await Detection.find({ timestamp: { $gte: last15Minutes } });

    res.status(200).json(detections);  
  } catch (err) {
    console.error('Error fetching detections:', err);
    res.status(500).json({ error: 'Failed to fetch detections' });
  }
});


app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
