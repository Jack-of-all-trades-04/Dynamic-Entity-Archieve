const express = require('express');
const router = express.Router();
const monsterController = require('../controllers/monsterController');

// Endpoint: GET /api/bestiary (Ambil semua monster)
router.get('/', monsterController.getAllMonsters);

// Endpoint: GET /api/bestiary/:id (Ambil detail satu monster)
router.get('/:id', monsterController.getMonsterById);

// Endpoint: POST /api/bestiary (Tambah data monster baru)
router.post('/', monsterController.createMonster);

module.exports = router;