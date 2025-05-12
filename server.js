// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const mongoURI = "mongodb+srv://kunalsonne:kunalsonne1847724@cluster0.95mdg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.once('open', () => console.log("Connected to MongoDB"));
db.on('error', console.error.bind(console, 'MongoDB error:'));

// Schema
const DataSchema = new mongoose.Schema({
  temperature: Number,
  isHuman: Boolean,
  latitude: Number,
  longitude: Number,
  timestamp: { type: Date, default: Date.now }
});

const DataModel = mongoose.model("HumanTempData", DataSchema);

// Endpoint to receive data
app.post('/data', async (req, res) => {
  try {         
    const newData = new DataModel(req.body);
    await newData.save();
    res.status(200).json({ message: "Data saved", data: newData });
  } catch (err) {
    res.status(500).json({ message: "Error saving data", error: err });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
