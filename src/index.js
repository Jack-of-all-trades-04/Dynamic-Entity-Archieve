const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

// Failsafe untuk crypto di Node versi lama
if (!global.crypto) {
  global.crypto = crypto;
}

const app = express();
const PORT = process.env.PORT || 5000;

// --- 1. KONEKSI DATABASE MONGODB ---
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://mongodb-service:27017/test');
        console.log('[DB] MongoDB Connected...');
    } catch (err) {
        console.error('[DB] MongoDB Error:', err.message);
    }
};
connectDB();

// --- 2. SETUP KONEKSI MYSQL (Untuk Benchmark) ---
const sqlPool = mysql.createPool({
    host: 'mysql-service',
    user: 'root',
    password: 'admin123',
    database: 'bestiary_db',
    waitForConnections: true,
    connectionLimit: 10
});

// --- 3. INLINE MODEL (Agar tidak MODULE_NOT_FOUND) ---
const monsterSchema = new mongoose.Schema({
    monster_id: String,
    display_name: String,
    media: Object,
    stats_base: Object,
    lore: String
}, { collection: 'monsters' });

const Monster = mongoose.models.Monster || mongoose.model('Monster', monsterSchema);

// --- 4. MIDDLEWARE ---
app.use(express.json());
app.use(cors());
// Melayani file .pck secara statis
app.use('/assets', express.static(path.resolve(__dirname, '../assets')));

// --- 5. ROUTES ---

// Endpoint untuk Game Godot (Ambil semua monster)
app.get('/api/bestiary', async (req, res) => {
    try {
        const monsters = await Monster.find();
        res.json(monsters);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint untuk Benchmark Real-Time (NoSQL vs SQL)
app.get('/api/benchmark/:id', async (req, res) => {
    try {
        const monsterId = req.params.id;
        const results = {};

        // BENCHMARK NOSQL (MONGODB)
        const startNoSQL = performance.now();
        const dataNoSQL = await Monster.findOne({ monster_id: monsterId });
        const endNoSQL = performance.now();
        results.nosql = {
            time: (endNoSQL - startNoSQL).toFixed(4),
            data: dataNoSQL
        };

        // BENCHMARK SQL (MYSQL)
        const startSQL = performance.now();
        const [rows] = await sqlPool.query(`
            SELECT m.*, s.health, s.attack_power, s.defense, s.speed 
            FROM monsters m 
            JOIN monster_stats s ON m.id = s.m_id 
            WHERE m.monster_id = ?`, [monsterId]);
        const endSQL = performance.now();
        results.sql = {
            time: (endSQL - startSQL).toFixed(4),
            data: rows[0] || null
        };

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Health Check
app.get('/api/health', (req, res) => res.json({ status: "OK", message: "Aetheria Backend Active" }));

// --- 6. START SERVER ---
app.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`[SERVER] Running on http://localhost:${PORT}`);
    console.log(`-----------------------------------------`);
});