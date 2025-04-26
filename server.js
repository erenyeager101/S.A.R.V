require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
 
app.use(bodyParser.json({ limit: '20mb' }));
 
const mongoURI = process.env.MONGODB_URI ||
  'mongodb+srv://kunalsonne:kunalsonne1847724@cluster0.95mdg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));
 
const detectionSchema = new mongoose.Schema({
  image: Buffer,
  contentType: String,
  timestamp: Date,
  logs: String
});
const Detection = mongoose.model('Detection', detectionSchema);

// Health check
app.get('/', (req, res) => {
  res.send('SARV Detection Server is running');
});
 
app.post('/upload', async (req, res) => {
  try {
    const { image: base64Image, timestamp, logs } = req.body;
    const buffer = Buffer.from(base64Image, 'base64');

    const detection = new Detection({
      image: buffer,
      contentType: 'image/jpeg',
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      logs
    });

    await detection.save();
    res.status(201).json({ message: 'Detection saved' });
  } catch (err) {
    console.error('Error saving detection:', err);
    res.status(500).json({ error: 'Failed to save detection' });
  }
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
