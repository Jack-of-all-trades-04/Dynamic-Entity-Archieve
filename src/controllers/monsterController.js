const Monster = require('../models/monster');
const mongoose = require('mongoose');

// 1. Mengambil semua data monster (untuk daftar list di UI Godot)
exports.getAllMonsters = async (req, res) => {
  try {
    const monsters = await Monster.find({});
    console.log("Database yang diakses:", mongoose.connection.name);
    console.log("Jumlah data ditemukan:", monsters.length); 
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

// 3. Menambahkan monster baru (berguna untuk CMS / Live-Ops Tool nanti)
exports.createMonster = async (req, res) => {
  try {
    const newMonster = new Monster(req.body);
    const savedMonster = await newMonster.save();
    res.status(201).json({ message: "Monster berhasil ditambahkan", data: savedMonster });
  } catch (error) {
    res.status(400).json({ message: "Gagal menambahkan monster", error: error.message });
  }
};