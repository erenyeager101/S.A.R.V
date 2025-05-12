// server.js
const express      = require('express');
const mongoose     = require('mongoose');
const bodyParser   = require('body-parser');
const cors         = require('cors');

const app  = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB
const mongoURI = "YOUR_MONGO_URI_HERE";
mongoose.connect(mongoURI, {
  useNewUrlParser:    true,
  useUnifiedTopology: true
});
mongoose.connection
  .on('open',  () => console.log("✔ MongoDB connected"))
  .on('error', err => console.error("MongoDB error:", err));

// Schema & Model
const DataSchema = new mongoose.Schema({
  temperature: Number,
  humanProb:   Number,
  isHuman:     Boolean,
  latitude:    Number,
  longitude:   Number,
  ts:          { type: Date, default: Date.now }
});
const DataModel = mongoose.model("HeatGPS", DataSchema);

// Endpoint
app.post('/data', async (req, res) => {
  try {
    const doc = new DataModel(req.body);
    await doc.save();
    res.json({ status: 'ok', data: doc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: 'error', error: e.toString() });
  }
});

app.listen(port, () =>
  console.log(`Server listening on http://localhost:${port}`)
);
