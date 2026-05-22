const express = require('express');
const router = express.Router();
const monsterController = require('../controllers/monsterController');

// Endpoint: GET /api/bestiary (Ambil semua monster)
router.get('/', monsterController.getAllMonsters);

// Endpoint: GET /api/bestiary/:id (Ambil detail satu monster)
router.get('/:id', monsterController.getMonsterById);

// Endpoint: POST /api/bestiary (Tambah data monster baru)
router.post('/', monsterController.createMonster);

// Endpoint: PUT /api/bestiary/:id (Perbarui data monster)
router.put('/:id', monsterController.updateMonster);

// Endpoint: DELETE /api/bestiary/:id (Hapus data monster)
router.delete('/:id', monsterController.deleteMonster);

module.exports = router;