const Monster = require('../models/monster');
const sqlPool = require('../config/mysql');
const mongoose = require('mongoose');

// Helper untuk Sync Insert ke MySQL
async function syncInsertToSQL(monster) {
    const conn = await sqlPool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Insert ke tabel monsters
        const [result] = await conn.query(`
            INSERT INTO monsters (monster_id, display_name, class, lore, media_thumbnail, media_pck_url, media_sprite_frames_path)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            monster.monster_id,
            monster.display_name,
            monster.class || 'Normal',
            monster.lore || '',
            monster.media?.thumbnail || '',
            monster.media?.pck_url || '',
            monster.media?.sprite_frames_path || ''
        ]);
        const m_id = result.insertId;

        // 2. Insert ke tabel monster_stats
        await conn.query(`
            INSERT INTO monster_stats (m_id, health, mana, attack_power, defense, speed)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            m_id,
            monster.stats_base?.health || 0,
            monster.stats_base?.mana || 0,
            monster.stats_base?.attack_power || 0,
            monster.stats_base?.defense || 0,
            monster.stats_base?.speed || 50
        ]);

        // 3. Insert ke tabel monster_elements
        if (monster.elements && Array.isArray(monster.elements)) {
            for (const el of monster.elements) {
                await conn.query(`
                    INSERT INTO monster_elements (m_id, element)
                    VALUES (?, ?)
                `, [m_id, el]);
            }
        }

        // 4. Insert ke tabel monster_abilities
        if (monster.abilities && Array.isArray(monster.abilities)) {
            for (const ab of monster.abilities) {
                await conn.query(`
                    INSERT INTO monster_abilities (m_id, name, type, damage_type, base_damage, cooldown, description, vfx_path)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    m_id,
                    ab.name,
                    ab.type || 'Active',
                    ab.damage_type || '',
                    ab.base_damage || 0,
                    ab.cooldown || 0,
                    ab.description || '',
                    ab.vfx_path || ''
                ]);
            }
        }

        await conn.commit();
    } catch (err) {
        await conn.rollback();
        console.error('[SQL Sync] Insert Error:', err.message);
        throw err;
    } finally {
        conn.release();
    }
}

// Helper untuk Sync Update ke MySQL
async function syncUpdateToSQL(monsterId, updatedData) {
    const conn = await sqlPool.getConnection();
    try {
        await conn.beginTransaction();

        // Cari ID utama di SQL
        const [rows] = await conn.query('SELECT id FROM monsters WHERE monster_id = ?', [monsterId]);
        if (rows.length === 0) {
            // Jika tidak ditemukan di SQL (misal karena setup manual/sebelumnya tidak sinkron), kita lakukan insert saja
            await conn.commit();
            conn.release();
            await syncInsertToSQL({ monster_id: monsterId, ...updatedData });
            return;
        }
        const m_id = rows[0].id;

        // 1. Update tabel monsters
        await conn.query(`
            UPDATE monsters 
            SET display_name = ?, class = ?, lore = ?, media_thumbnail = ?, media_pck_url = ?, media_sprite_frames_path = ?
            WHERE id = ?
        `, [
            updatedData.display_name,
            updatedData.class || 'Normal',
            updatedData.lore || '',
            updatedData.media?.thumbnail || '',
            updatedData.media?.pck_url || '',
            updatedData.media?.sprite_frames_path || '',
            m_id
        ]);

        // 2. Update tabel monster_stats
        await conn.query(`
            UPDATE monster_stats 
            SET health = ?, mana = ?, attack_power = ?, defense = ?, speed = ?
            WHERE m_id = ?
        `, [
            updatedData.stats_base?.health || 0,
            updatedData.stats_base?.mana || 0,
            updatedData.stats_base?.attack_power || 0,
            updatedData.stats_base?.defense || 0,
            updatedData.stats_base?.speed || 50,
            m_id
        ]);

        // 3. Reset dan insert ulang elements
        await conn.query('DELETE FROM monster_elements WHERE m_id = ?', [m_id]);
        if (updatedData.elements && Array.isArray(updatedData.elements)) {
            for (const el of updatedData.elements) {
                await conn.query(`
                    INSERT INTO monster_elements (m_id, element)
                    VALUES (?, ?)
                `, [m_id, el]);
            }
        }

        // 4. Reset dan insert ulang abilities
        await conn.query('DELETE FROM monster_abilities WHERE m_id = ?', [m_id]);
        if (updatedData.abilities && Array.isArray(updatedData.abilities)) {
            for (const ab of updatedData.abilities) {
                await conn.query(`
                    INSERT INTO monster_abilities (m_id, name, type, damage_type, base_damage, cooldown, description, vfx_path)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    m_id,
                    ab.name,
                    ab.type || 'Active',
                    ab.damage_type || '',
                    ab.base_damage || 0,
                    ab.cooldown || 0,
                    ab.description || '',
                    ab.vfx_path || ''
                ]);
            }
        }

        await conn.commit();
    } catch (err) {
        await conn.rollback();
        console.error('[SQL Sync] Update Error:', err.message);
        throw err;
    } finally {
        conn.release();
    }
}

// Helper untuk Sync Delete ke MySQL
async function syncDeleteFromSQL(monsterId) {
    const conn = await sqlPool.getConnection();
    try {
        await conn.beginTransaction();
        // Cascade delete akan otomatis menghapus stats, elements, dan abilities di MySQL
        await conn.query('DELETE FROM monsters WHERE monster_id = ?', [monsterId]);
        await conn.commit();
    } catch (err) {
        await conn.rollback();
        console.error('[SQL Sync] Delete Error:', err.message);
        throw err;
    } finally {
        conn.release();
    }
}

// 1. Mengambil semua data monster dari MongoDB
exports.getAllMonsters = async (req, res) => {
  try {
    const monsters = await Monster.find({}).sort({ createdAt: -1 });
    res.status(200).json(monsters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Mengambil detail satu monster berdasarkan monster_id
exports.getMonsterById = async (req, res) => {
  try {
    const monster = await Monster.findOne({ monster_id: req.params.id });
    if (!monster) {
      return res.status(404).json({ message: "Monster tidak ditemukan" });
    }
    res.status(200).json(monster);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil detail monster", error: error.message });
  }
};

// 3. Menambahkan monster baru (MongoDB & MySQL)
exports.createMonster = async (req, res) => {
  try {
    // Simpan ke MongoDB
    const newMonster = new Monster(req.body);
    const savedMonster = await newMonster.save();

    // Sinkronisasi ke SQL
    try {
        await syncInsertToSQL(savedMonster);
    } catch (sqlErr) {
        console.warn('[WARNING] Gagal sinkronisasi data baru ke SQL:', sqlErr.message);
    }

    res.status(201).json({ message: "Monster berhasil ditambahkan", data: savedMonster });
  } catch (error) {
    res.status(400).json({ message: "Gagal menambahkan monster", error: error.message });
  }
};

// 4. Memperbarui monster (MongoDB & MySQL)
exports.updateMonster = async (req, res) => {
  try {
    const { id } = req.params; // monster_id
    
    // Perbarui di MongoDB
    const updatedMonster = await Monster.findOneAndUpdate(
        { monster_id: id },
        req.body,
        { new: true, runValidators: true }
    );

    if (!updatedMonster) {
        return res.status(404).json({ message: "Monster tidak ditemukan di MongoDB" });
    }

    // Sinkronisasi ke SQL
    try {
        await syncUpdateToSQL(id, updatedMonster);
    } catch (sqlErr) {
        console.warn('[WARNING] Gagal sinkronisasi update ke SQL:', sqlErr.message);
    }

    res.status(200).json({ message: "Monster berhasil diperbarui", data: updatedMonster });
  } catch (error) {
    res.status(400).json({ message: "Gagal memperbarui monster", error: error.message });
  }
};

// 5. Menghapus monster (MongoDB & MySQL)
exports.deleteMonster = async (req, res) => {
  try {
    const { id } = req.params; // monster_id
    
    // Hapus di MongoDB
    const deletedMonster = await Monster.findOneAndDelete({ monster_id: id });
    if (!deletedMonster) {
        return res.status(404).json({ message: "Monster tidak ditemukan di MongoDB" });
    }

    // Sinkronisasi ke SQL
    try {
        await syncDeleteFromSQL(id);
    } catch (sqlErr) {
        console.warn('[WARNING] Gagal sinkronisasi delete ke SQL:', sqlErr.message);
    }

    res.status(200).json({ message: "Monster berhasil dihapus", data: deletedMonster });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus monster", error: error.message });
  }
};