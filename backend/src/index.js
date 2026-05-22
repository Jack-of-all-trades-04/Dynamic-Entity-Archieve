const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const sqlPool = require('./config/mysql');
const Monster = require('./models/monster');

// Failsafe untuk crypto di Node versi lama
if (!global.crypto) {
  global.crypto = crypto;
}

const app = express();
const PORT = process.env.PORT || 5000;

// --- 1. KONEKSI DATABASE MONGODB ---
connectDB();

// --- 2. MIDDLEWARE ---
app.use(express.json());
app.use(cors());
// Melayani file .pck secara statis
app.use('/assets', express.static(path.resolve(__dirname, '../assets')));

// --- 3. MOUNT ROUTING CRUD BESTIARY ---
app.use('/api/bestiary', require('./routes/monsterRoutes'));

// --- 4. SEEDING & DATABASE UTILITIES ---

// Helper untuk Seeding Monster Random
const seedMonsters = async (count = 10) => {
    const classes = ['Normal', 'Elite', 'World Boss'];
    const elementsList = ['Fire', 'Water', 'Earth', 'Air', 'Light', 'Dark', 'Lightning', 'Ice'];
    const prefixes = ['Ignis', 'Aether', 'Gloom', 'Frost', 'Terracore', 'Storm', 'Solar', 'Lunar', 'Spectral', 'Volcanic'];
    const suffixes = ['Drake', 'Sentinel', 'Weaver', 'Stalker', 'Colossus', 'Wraith', 'Viper', 'Golem', 'Beast', 'Reaper'];
    const abilityNames = ['Inferno Blast', 'Aegis Shield', 'Shadow Strike', 'Glacial Spike', 'Tectonic Slam', 'Thunderbolt', 'Holy Light', 'Void Pulse'];

    const monstersToSaveMongo = [];
    const conn = await sqlPool.getConnection();
    try {
        await conn.beginTransaction();

        for (let i = 0; i < count; i++) {
            const randomId = `MSTR-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${i}`;
            const dispName = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
            const cls = classes[Math.floor(Math.random() * classes.length)];
            const elemCount = Math.floor(Math.random() * 2) + 1; // 1 atau 2 elemen
            const elements = [];
            for (let e = 0; e < elemCount; e++) {
                const el = elementsList[Math.floor(Math.random() * elementsList.length)];
                if (!elements.includes(el)) elements.push(el);
            }

            const hp = Math.floor(Math.random() * 15000) + 200;
            const mana = Math.floor(Math.random() * 300) + 50;
            const atk = Math.floor(Math.random() * 600) + 50;
            const df = Math.floor(Math.random() * 400) + 30;
            const spd = Math.floor(Math.random() * 80) + 20;

            const abilities = [
                {
                    name: abilityNames[Math.floor(Math.random() * abilityNames.length)],
                    type: Math.random() > 0.3 ? 'Active' : 'Passive',
                    damage_type: Math.random() > 0.5 ? 'Magical' : 'Physical',
                    base_damage: Math.floor(Math.random() * 1000) + 100,
                    cooldown: Math.floor(Math.random() * 15) + 3,
                    description: `Menggunakan kekuatan mistis untuk memicu ${dispName.split(' ')[0]}.`,
                    vfx_path: 'res://vfx/generic.tscn'
                }
            ];

            const monsterDoc = {
                monster_id: randomId,
                display_name: dispName,
                class: cls,
                elements: elements,
                media: {
                    thumbnail: 'assets/pck/default_thumb.png',
                    pck_url: 'assets/pck/monsters.pck',
                    sprite_frames_path: `res://monsters/${dispName.toLowerCase().replace(' ', '_')}.tres`,
                    animations: { idle: 'idle', attack: 'attack', die: 'die' }
                },
                stats_base: {
                    health: hp,
                    mana: mana,
                    attack_power: atk,
                    defense: df,
                    speed: spd,
                    resistances: { fire: 0.1, ice: 0.0 }
                },
                abilities: abilities,
                loot_table: {
                    exp_reward: Math.floor(hp * 0.4),
                    gold_reward: { min: Math.floor(hp * 0.05), max: Math.floor(hp * 0.15) },
                    drops: [{ item_id: 'ITM-GENERIC', name: 'Monster Core', rarity: 'Common', drop_chance: 0.6 }]
                },
                lore: `Makhluk legendaris dari ras ${cls} yang memiliki elemen ${elements.join(' dan ')}.`
            };

            monstersToSaveMongo.push(monsterDoc);

            // MySQL Insert
            const [res] = await conn.query(`
                INSERT INTO monsters (monster_id, display_name, class, lore, media_thumbnail, media_pck_url, media_sprite_frames_path)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [randomId, dispName, cls, monsterDoc.lore, monsterDoc.media.thumbnail, monsterDoc.media.pck_url, monsterDoc.media.sprite_frames_path]);
            const m_id = res.insertId;

            await conn.query(`
                INSERT INTO monster_stats (m_id, health, mana, attack_power, defense, speed)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [m_id, hp, mana, atk, df, spd]);

            for (const el of elements) {
                await conn.query(`INSERT INTO monster_elements (m_id, element) VALUES (?, ?)`, [m_id, el]);
            }

            for (const ab of abilities) {
                await conn.query(`
                    INSERT INTO monster_abilities (m_id, name, type, damage_type, base_damage, cooldown, description, vfx_path)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [m_id, ab.name, ab.type, ab.damage_type, ab.base_damage, ab.cooldown, ab.description, ab.vfx_path]);
            }
        }

        // Simpan MongoDB massal
        await Monster.insertMany(monstersToSaveMongo);
        await conn.commit();
        console.log(`[DB] Berhasil menyemai ${count} monster ke kedua database.`);
    } catch (err) {
        await conn.rollback();
        console.error('[DB] Gagal menyemai database:', err.message);
        throw err;
    } finally {
        conn.release();
    }
};

// 1. SETUP DDL TABEL MYSQL
app.post('/api/db/setup', async (req, res) => {
    try {
        const conn = await sqlPool.getConnection();
        try {
            await conn.query('SET FOREIGN_KEY_CHECKS = 0');
            await conn.query('DROP TABLE IF EXISTS monster_abilities');
            await conn.query('DROP TABLE IF EXISTS monster_elements');
            await conn.query('DROP TABLE IF EXISTS monster_stats');
            await conn.query('DROP TABLE IF EXISTS monsters');
            await conn.query('SET FOREIGN_KEY_CHECKS = 1');

            await conn.query(`
                CREATE TABLE monsters (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    monster_id VARCHAR(50) UNIQUE NOT NULL,
                    display_name VARCHAR(100) NOT NULL,
                    class VARCHAR(50) DEFAULT 'Normal',
                    lore TEXT,
                    media_thumbnail VARCHAR(255),
                    media_pck_url VARCHAR(255),
                    media_sprite_frames_path VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);

            await conn.query(`
                CREATE TABLE monster_stats (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    m_id INT NOT NULL,
                    health INT NOT NULL,
                    mana INT DEFAULT 0,
                    attack_power INT NOT NULL,
                    defense INT NOT NULL,
                    speed INT DEFAULT 50,
                    FOREIGN KEY (m_id) REFERENCES monsters(id) ON DELETE CASCADE
                )
            `);

            await conn.query(`
                CREATE TABLE monster_elements (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    m_id INT NOT NULL,
                    element VARCHAR(50) NOT NULL,
                    FOREIGN KEY (m_id) REFERENCES monsters(id) ON DELETE CASCADE
                )
            `);

            await conn.query(`
                CREATE TABLE monster_abilities (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    m_id INT NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    damage_type VARCHAR(50),
                    base_damage INT,
                    cooldown INT,
                    description TEXT,
                    vfx_path VARCHAR(255),
                    FOREIGN KEY (m_id) REFERENCES monsters(id) ON DELETE CASCADE
                )
            `);

            // Kosongkan MongoDB juga agar sinkron
            await Monster.deleteMany({});
            
            // Seed 5 monster default
            await seedMonsters(5);

            res.json({ message: "Inisialisasi database SQL & MongoDB berhasil, 5 monster default disemai." });
        } finally {
            conn.release();
        }
    } catch (err) {
        res.status(500).json({ error: "Gagal setup database SQL: " + err.message });
    }
});

// 2. SEED N MONSTER BARU
app.post('/api/db/seed', async (req, res) => {
    try {
        const count = parseInt(req.body.count) || 10;
        await seedMonsters(count);
        res.json({ message: `Berhasil menambahkan ${count} monster acak ke MongoDB dan MySQL.` });
    } catch (err) {
        res.status(500).json({ error: "Gagal seeding: " + err.message });
    }
});

// 3. WIPE ALL DATA
app.post('/api/db/clear', async (req, res) => {
    try {
        await Monster.deleteMany({});
        await sqlPool.query('DELETE FROM monsters');
        res.json({ message: "Database MongoDB dan MySQL dikosongkan sepenuhnya." });
    } catch (err) {
        res.status(500).json({ error: "Gagal mengosongkan database: " + err.message });
    }
});

// --- 5. ROUTES BENCHMARK ---

// Benchmark Real-Time Single (Kueri 1 monster)
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

// Benchmark Batch Testbench
app.post('/api/benchmark/batch', async (req, res) => {
    try {
        const count = parseInt(req.body.count) || 100;
        const concurrent = !!req.body.concurrent;

        // Ambil semua ID untuk dipilih acak
        const monsters = await Monster.find({}, 'monster_id');
        if (monsters.length === 0) {
            return res.status(400).json({ error: "Database kosong. Sediakan data terlebih dahulu melalui tombol seeding." });
        }

        const ids = monsters.map(m => m.monster_id);
        const randomIds = Array.from({ length: count }, () => ids[Math.floor(Math.random() * ids.length)]);

        // BENCHMARK NOSQL (MONGODB)
        const startNoSQL = performance.now();
        let nosqlTimes = [];
        if (concurrent) {
            await Promise.all(randomIds.map(async (id) => {
                const t0 = performance.now();
                await Monster.findOne({ monster_id: id });
                const t1 = performance.now();
                nosqlTimes.push(t1 - t0);
            }));
        } else {
            for (const id of randomIds) {
                const t0 = performance.now();
                await Monster.findOne({ monster_id: id });
                const t1 = performance.now();
                nosqlTimes.push(t1 - t0);
            }
        }
        const endNoSQL = performance.now();
        const nosqlTotalTime = endNoSQL - startNoSQL;

        // BENCHMARK SQL (MYSQL)
        const startSQL = performance.now();
        let sqlTimes = [];
        if (concurrent) {
            await Promise.all(randomIds.map(async (id) => {
                const t0 = performance.now();
                await sqlPool.query(`
                    SELECT m.*, s.health, s.attack_power, s.defense, s.speed 
                    FROM monsters m 
                    JOIN monster_stats s ON m.id = s.m_id 
                    WHERE m.monster_id = ?`, [id]);
                const t1 = performance.now();
                sqlTimes.push(t1 - t0);
            }));
        } else {
            for (const id of randomIds) {
                const t0 = performance.now();
                await sqlPool.query(`
                    SELECT m.*, s.health, s.attack_power, s.defense, s.speed 
                    FROM monsters m 
                    JOIN monster_stats s ON m.id = s.m_id 
                    WHERE m.monster_id = ?`, [id]);
                const t1 = performance.now();
                sqlTimes.push(t1 - t0);
            }
        }
        const endSQL = performance.now();
        const sqlTotalTime = endSQL - startSQL;

        const calculateStats = (times, totalTime) => {
            const sum = times.reduce((a, b) => a + b, 0);
            const avg = sum / times.length;
            const min = Math.min(...times);
            const max = Math.max(...times);
            const rps = (times.length / (totalTime / 1000)).toFixed(2);
            return {
                avg: avg.toFixed(4),
                min: min.toFixed(4),
                max: max.toFixed(4),
                total: totalTime.toFixed(4),
                rps: parseFloat(rps)
            };
        };

        res.json({
            count,
            concurrent,
            nosql: calculateStats(nosqlTimes, nosqlTotalTime),
            sql: calculateStats(sqlTimes, sqlTotalTime)
        });
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