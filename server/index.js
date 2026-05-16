const express = require('express');
const cors = require('cors');
const speciesRoutes = require('./src/routes/speciesRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/species', speciesRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.send('Lloa Reforestation API is operational');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});