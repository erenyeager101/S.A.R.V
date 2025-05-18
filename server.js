const express    = require('express');
const mongoose   = require('mongoose');
const bodyParser = require('body-parser');
const cors       = require('cors');

const app  = express();
const port = 3000;

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());

// --- MongoDB Connection ---
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
  useNewUrlParser:    true,
  useUnifiedTopology: true
});

mongoose.connection
  .on('open',  () => console.log("✔ MongoDB connected"))
  .on('error', err => console.error("MongoDB connection error:", err));

// --- Schema & Model ---
const DataSchema = new mongoose.Schema({
  temperature: Number,
  humanProb:   Number,
  longitude:   Number,
  ts:          { type: Date, default: Date.now }
});


const HeatGPS = mongoose.model('HeatGPS', DataSchema);

// --- Endpoint to receive data ---
app.post('/data', async (req, res) => {
  try {
    const data = new HeatGPS(req.body);
    await data.save();
    console.log("📩 Received Data:", req.body);
    res.json({ status: "ok", saved: true });
  } catch (err) {
    console.error("❌ Error saving data:", err);
    res.status(500).json({ status: "error", error: err.toString() });
  }
});

// --- Optional: Get all data ---
app.get('/data', async (req, res) => {
  try {
    const allData = await HeatGPS.find().sort({ ts: -1 }).limit(100);
    res.json(allData);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});