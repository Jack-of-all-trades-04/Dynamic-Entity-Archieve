const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import Rute Bestiary
const monsterRoutes = require('./routes/monsterRoutes');

app.use(cors());
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Koneksi ke MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Sukses terhubung ke MongoDB!'))
  .catch((err) => console.error('Gagal terhubung ke MongoDB:', err));

// Route testing dasar
app.get('/api/health', (req, res) => {
  res.json({ status: "OK", message: "Server berjalan dengan baik" });
});

// DAFTARKAN ROUTE DI SINI
// Semua rute monster akan diawali dengan /api/bestiary
app.use('/api/bestiary', monsterRoutes);

app.listen(PORT, () => {
  console.log(`Server backend berjalan di http://localhost:${PORT}`);
});