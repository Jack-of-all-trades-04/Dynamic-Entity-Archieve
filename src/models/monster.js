const mongoose = require('mongoose');

// Skema untuk kemampuan (abilities) monster
const AbilitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Active', 'Passive'], required: true },
  damage_type: { type: String },
  base_damage: { type: Number },
  cooldown: { type: Number },
  description: { type: String },
  vfx_path: { type: String } // Menyimpan path asset visual untuk Godot (misal: res://vfx/fire.tscn)
});

// Skema untuk drop item (loot table)
const DropSchema = new mongoose.Schema({
  item_id: { type: String, required: true },
  name: { type: String, required: true },
  rarity: { type: String },
  drop_chance: { type: Number, required: true } // Nilai desimal (0.01 hingga 1.0)
});

// Skema Utama Monster / Bestiary
const MonsterSchema = new mongoose.Schema({
  monster_id: { type: String, required: true, unique: true },
  display_name: { type: String, required: true },
  class: { type: String, default: 'Normal' },
  elements: [{ type: String }], // Array of strings, misal: ["Fire", "Flying"]
  media: {
    thumbnail: { type: String },
    pck_url: { type: String, required: true },          // Menyimpan URL Cloud (Cloudflare/Cloudinary)
    sprite_frames_path: { type: String, required: true }, // Menyimpan target path internal res:// di dalam PCK
    animations: {
      idle: { type: String, default: 'default' },
      attack: { type: String },
      die: { type: String }
    }
  },
  stats_base: {
    health: { type: Number, required: true },
    mana: { type: Number, default: 0 },
    attack_power: { type: Number, required: true },
    defense: { type: Number, required: true },
    speed: { type: Number, default: 50 },
    resistances: { type: Map, of: Number } // Fleksibel untuk menyimpan elemen dinamis
  },
  abilities: [AbilitySchema], // Embedding array sub-document
  loot_table: {
    exp_reward: { type: Number, default: 0 },
    gold_reward: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 }
    },
    drops: [DropSchema]
  },
  lore: { type: String }
}, { timestamps: true }); // Menambahkan kolom createdAt dan updatedAt otomatis

module.exports = mongoose.model('monster', MonsterSchema);