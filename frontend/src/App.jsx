import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

const initialFormValues = {
  monster_id: '',
  display_name: '',
  class: 'Normal',
  elements: [],
  media: {
    thumbnail: 'assets/pck/default_thumb.png',
    pck_url: 'assets/pck/monsters.pck',
    sprite_frames_path: 'res://monsters/default.tres',
    animations: { idle: 'idle', attack: 'attack', die: 'die' }
  },
  stats_base: {
    health: 1000,
    mana: 100,
    attack_power: 120,
    defense: 80,
    speed: 50
  },
  abilities: [],
  loot_table: {
    exp_reward: 200,
    gold_reward: { min: 20, max: 60 },
    drops: []
  },
  lore: ''
};

export default function App() {
  const [activeTab, setActiveTab] = useState('bestiary'); // 'bestiary' or 'benchmark'
  const [monsters, setMonsters] = useState([]);
  const [selectedMonster, setSelectedMonster] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dbLoading, setDbLoading] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [elementFilter, setElementFilter] = useState('');

  // Modal CRUD State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [formValues, setFormValues] = useState(initialFormValues);
  const [newAbility, setNewAbility] = useState({ name: '', type: 'Active', damage_type: 'Physical', base_damage: 100, cooldown: 5, description: '' });
  const [newDrop, setNewDrop] = useState({ item_id: '', name: '', rarity: 'Common', drop_chance: 0.1 });

  // Benchmarking State
  const [selectedBenchId, setSelectedBenchId] = useState('');
  const [singleBenchLoading, setSingleBenchLoading] = useState(false);
  const [singleBenchResult, setSingleBenchResult] = useState(null);

  const [batchCount, setBatchCount] = useState(100);
  const [batchConcurrent, setBatchConcurrent] = useState(false);
  const [batchBenchLoading, setBatchBenchLoading] = useState(false);
  const [batchBenchResult, setBatchBenchResult] = useState(null);

  // Fetch all monsters
  const fetchMonsters = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bestiary`);
      const data = await res.json();
      setMonsters(data);
      if (data.length > 0 && !selectedMonster) {
        setSelectedMonster(data[0]);
      }
    } catch (err) {
      console.error('Error fetching monsters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonsters();
  }, []);

  // Update selected monster reference when list updates
  useEffect(() => {
    if (selectedMonster && monsters.length > 0) {
      const updated = monsters.find(m => m.monster_id === selectedMonster.monster_id);
      if (updated) setSelectedMonster(updated);
    }
  }, [monsters]);

  // Handle CRUD submissions
  const handleOpenAddModal = () => {
    setFormValues({
      ...initialFormValues,
      monster_id: `MSTR-${Math.floor(1000 + Math.random() * 9000)}`
    });
    setModalMode('add');
    setShowModal(true);
  };

  const handleOpenEditModal = (monster) => {
    setFormValues({ ...monster });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDeleteMonster = async (monsterId) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus monster ${monsterId}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/bestiary/${monsterId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Monster berhasil dihapus!');
        const updatedList = monsters.filter(m => m.monster_id !== monsterId);
        setMonsters(updatedList);
        setSelectedMonster(updatedList.length > 0 ? updatedList[0] : null);
      }
    } catch (err) {
      alert('Gagal menghapus monster: ' + err.message);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const method = modalMode === 'add' ? 'POST' : 'PUT';
    const endpoint = modalMode === 'add' ? `${API_BASE}/bestiary` : `${API_BASE}/bestiary/${formValues.monster_id}`;
    
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues)
      });
      const data = await res.json();
      if (res.ok) {
        alert(modalMode === 'add' ? 'Monster berhasil ditambahkan!' : 'Monster berhasil diperbarui!');
        setShowModal(false);
        fetchMonsters();
      } else {
        alert('Gagal menyimpan monster: ' + data.message);
      }
    } catch (err) {
      alert('Terjadi kesalahan: ' + err.message);
    }
  };

  // Helper forms
  const handleElementToggle = (element) => {
    const activeElements = [...formValues.elements];
    if (activeElements.includes(element)) {
      setFormValues({ ...formValues, elements: activeElements.filter(e => e !== element) });
    } else {
      setFormValues({ ...formValues, elements: [...activeElements, element] });
    }
  };

  const handleAddAbility = () => {
    if (!newAbility.name) return alert('Nama Ability harus diisi');
    setFormValues({
      ...formValues,
      abilities: [...formValues.abilities, { ...newAbility }]
    });
    setNewAbility({ name: '', type: 'Active', damage_type: 'Physical', base_damage: 100, cooldown: 5, description: '' });
  };

  const handleRemoveAbility = (index) => {
    const updated = [...formValues.abilities];
    updated.splice(index, 1);
    setFormValues({ ...formValues, abilities: updated });
  };

  const handleAddDrop = () => {
    if (!newDrop.item_id || !newDrop.name) return alert('Item ID dan Nama harus diisi');
    setFormValues({
      ...formValues,
      loot_table: {
        ...formValues.loot_table,
        drops: [...formValues.loot_table.drops, { ...newDrop }]
      }
    });
    setNewDrop({ item_id: '', name: '', rarity: 'Common', drop_chance: 0.1 });
  };

  const handleRemoveDrop = (index) => {
    const updated = [...formValues.loot_table.drops];
    updated.splice(index, 1);
    setFormValues({
      ...formValues,
      loot_table: {
        ...formValues.loot_table,
        drops: updated
      }
    });
  };

  // Seeding/DB Controls
  const handleResetDB = async () => {
    if (!window.confirm('Reset database akan menghapus semua entitas dan menyemai 5 monster default kembali. Lanjutkan?')) return;
    setDbLoading(true);
    try {
      const res = await fetch(`${API_BASE}/db/setup`, { method: 'POST' });
      const data = await res.json();
      alert(data.message);
      fetchMonsters();
    } catch (err) {
      alert('Setup Gagal: ' + err.message);
    } finally {
      setDbLoading(false);
    }
  };

  const handleSeedDB = async () => {
    setDbLoading(true);
    try {
      const count = prompt('Masukkan jumlah monster acak yang ingin disemai (misal: 100, 500, 1000):', '100');
      if (!count) return;
      const res = await fetch(`${API_BASE}/db/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: parseInt(count) })
      });
      const data = await res.json();
      alert(data.message);
      fetchMonsters();
    } catch (err) {
      alert('Seeding Gagal: ' + err.message);
    } finally {
      setDbLoading(false);
    }
  };

  const handleClearDB = async () => {
    if (!window.confirm('PERINGATAN! Ini akan menghapus SELURUH entitas monster dari MongoDB dan MySQL. Kosongkan?')) return;
    setDbLoading(true);
    try {
      const res = await fetch(`${API_BASE}/db/clear`, { method: 'POST' });
      const data = await res.json();
      alert(data.message);
      fetchMonsters();
      setSelectedMonster(null);
    } catch (err) {
      alert('Wipe Gagal: ' + err.message);
    } finally {
      setDbLoading(false);
    }
  };

  // Benchmarking
  const runSingleBenchmark = async () => {
    if (!selectedBenchId) return alert('Pilih monster untuk diuji');
    setSingleBenchLoading(true);
    try {
      const res = await fetch(`${API_BASE}/benchmark/${selectedBenchId}`);
      const data = await res.json();
      setSingleBenchResult(data);
    } catch (err) {
      alert('Benchmark tunggal gagal: ' + err.message);
    } finally {
      setSingleBenchLoading(false);
    }
  };

  const runBatchBenchmark = async () => {
    setBatchBenchLoading(true);
    try {
      const res = await fetch(`${API_BASE}/benchmark/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: batchCount, concurrent: batchConcurrent })
      });
      const data = await res.json();
      if (res.ok) {
        setBatchBenchResult(data);
      } else {
        alert(data.error || 'Batch benchmark gagal');
      }
    } catch (err) {
      alert('Batch benchmark gagal: ' + err.message);
    } finally {
      setBatchBenchLoading(false);
    }
  };

  // Filter & Search Logic
  const filteredMonsters = monsters.filter(monster => {
    const matchesSearch = monster.display_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          monster.monster_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter ? monster.class === classFilter : true;
    const matchesElement = elementFilter ? monster.elements?.includes(elementFilter) : true;
    return matchesSearch && matchesClass && matchesElement;
  });

  // Element Emojis mapping for labels
  const elementIcons = {
    Fire: '🔥', Water: '💧', Earth: '⛰️', Air: '💨',
    Light: '☀️', Dark: '🌙', Lightning: '⚡', Ice: '❄️'
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="logo-icon">💠</div>
          <div className="app-title">
            <h1>Aetheria Bestiary</h1>
            <div className="app-subtitle">Document Store vs Relational Database Sandbox</div>
          </div>
        </div>

        <nav className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'bestiary' ? 'active' : ''}`}
            onClick={() => setActiveTab('bestiary')}
          >
            👾 Bestiary CMS
          </button>
          <button 
            className={`tab-btn ${activeTab === 'benchmark' ? 'active' : ''}`}
            onClick={() => setActiveTab('benchmark')}
          >
            ⚡ Performance Testbench
          </button>
        </nav>
      </header>

      {/* ----------------- TAB 1: CMS BESTIARY ----------------- */}
      {activeTab === 'bestiary' && (
        <div className="dashboard-grid">
          {/* Sidebar */}
          <aside className="sidebar-panel">
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button className="action-btn" onClick={handleOpenAddModal}>
                <span>➕</span> Tambah Monster Baru
              </button>

              <input 
                type="text" 
                placeholder="Cari nama / ID..." 
                className="search-box"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />

              <div className="filter-row">
                <select 
                  className="filter-select"
                  value={classFilter}
                  onChange={e => setClassFilter(e.target.value)}
                >
                  <option value="">Semua Class</option>
                  <option value="Normal">Normal</option>
                  <option value="Elite">Elite</option>
                  <option value="World Boss">World Boss</option>
                </select>

                <select 
                  className="filter-select"
                  value={elementFilter}
                  onChange={e => setElementFilter(e.target.value)}
                >
                  <option value="">Semua Elemen</option>
                  {Object.keys(elementIcons).map(el => (
                    <option key={el} value={el}>{elementIcons[el]} {el}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* List */}
            <div className="glass-panel" style={{ flex: 1 }}>
              <h3 className="section-title">👾 Monsters List ({filteredMonsters.length})</h3>
              
              {loading ? (
                <div style={{ padding: '2rem 0' }}>
                  <div className="loader-spinner"></div>
                </div>
              ) : filteredMonsters.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                  Tidak ada monster ditemukan.
                </div>
              ) : (
                <div className="monster-list">
                  {filteredMonsters.map(m => (
                    <div 
                      key={m.monster_id}
                      className={`monster-mini-card ${selectedMonster?.monster_id === m.monster_id ? 'selected' : ''}`}
                      onClick={() => setSelectedMonster(m)}
                    >
                      <div className="card-avatar">
                        {m.elements && m.elements.length > 0 ? elementIcons[m.elements[0]] || '👾' : '👾'}
                      </div>
                      <div className="card-info">
                        <h4>{m.display_name}</h4>
                        <div className="card-meta">
                          <span className={`class-tag ${m.class?.toLowerCase().replace(' ', '-')}`}>
                            {m.class}
                          </span>
                          <div className="element-dots">
                            {m.elements?.map(el => (
                              <span 
                                key={el} 
                                className={`el-dot bg-${el.toLowerCase()}`}
                                title={el}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Right Main Panel: Detail Info */}
          <main className="glass-panel">
            {selectedMonster ? (
              <div className="detail-panel">
                {/* Hero Header */}
                <div className="monster-hero">
                  <div className="monster-large-avatar">
                    {selectedMonster.elements && selectedMonster.elements.length > 0 ? 
                      elementIcons[selectedMonster.elements[0]] || '👾' : '👾'}
                  </div>
                  <div className="monster-title-block">
                    <span className="id-badge">{selectedMonster.monster_id}</span>
                    <h2 className="monster-hero-name">{selectedMonster.display_name}</h2>
                    <div className="tag-container">
                      <span className={`class-tag ${selectedMonster.class?.toLowerCase().replace(' ', '-')}`} style={{ fontSize: '0.85rem', padding: '0.2rem 0.6rem' }}>
                        {selectedMonster.class}
                      </span>
                      {selectedMonster.elements?.map(el => (
                        <span key={el} className={`badge-element bg-${el.toLowerCase()}`}>
                          {elementIcons[el]} {el}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Lore */}
                {selectedMonster.lore && (
                  <p className="monster-lore">"{selectedMonster.lore}"</p>
                )}

                {/* Stats */}
                <div>
                  <h3 className="section-title">📊 Base Stats</h3>
                  <div className="stat-grid">
                    {[
                      { name: 'HP (Health)', value: selectedMonster.stats_base?.health, max: 20000, cls: 'bar-hp', label: '❤️' },
                      { name: 'MP (Mana)', value: selectedMonster.stats_base?.mana, max: 1000, cls: 'bar-mp', label: '🧪' },
                      { name: 'Attack Power', value: selectedMonster.stats_base?.attack_power, max: 1500, cls: 'bar-atk', label: '⚔️' },
                      { name: 'Defense', value: selectedMonster.stats_base?.defense, max: 1000, cls: 'bar-def', label: '🛡️' },
                      { name: 'Speed', value: selectedMonster.stats_base?.speed, max: 200, cls: 'bar-spd', label: '🏃‍♂️' }
                    ].map(stat => {
                      const percentage = Math.min((stat.value / stat.max) * 100, 100) || 0;
                      return (
                        <div key={stat.name} className="stat-item">
                          <div className="stat-label-row">
                            <span className="stat-name">{stat.label} {stat.name}</span>
                            <span className="stat-value">{stat.value}</span>
                          </div>
                          <div className="stat-track">
                            <div 
                              className={`stat-bar ${stat.cls}`} 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Abilities */}
                <div>
                  <h3 className="section-title">⚔️ Abilities ({selectedMonster.abilities?.length || 0})</h3>
                  {selectedMonster.abilities && selectedMonster.abilities.length > 0 ? (
                    <div className="abilities-container">
                      {selectedMonster.abilities.map((ab, idx) => (
                        <div key={idx} className="ability-card">
                          <div className="ability-header">
                            <span className="ability-name">{ab.name}</span>
                            <div className="ability-tags">
                              <span className="ability-badge" style={{ color: varColor(ab.type) }}>{ab.type}</span>
                              {ab.damage_type && (
                                <span className="ability-badge" style={{ color: '#fb7185' }}>{ab.damage_type}</span>
                              )}
                              {ab.base_damage > 0 && (
                                <span className="ability-badge" style={{ color: '#fbbf24' }}>💥 {ab.base_damage} DMG</span>
                              )}
                              {ab.cooldown > 0 && (
                                <span className="ability-badge" style={{ color: '#38bdf8' }}>⏳ {ab.cooldown}s CD</span>
                              )}
                            </div>
                          </div>
                          {ab.description && <p className="ability-desc">{ab.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Monster ini tidak memiliki kemampuan terdaftar.</p>
                  )}
                </div>

                {/* Loot Drops */}
                <div>
                  <h3 className="section-title">💎 Loot Table & Rewards</h3>
                  <div className="loot-card">
                    <div className="loot-summary">
                      <div className="loot-sum-item">
                        <h5>Reward EXP</h5>
                        <p>{selectedMonster.loot_table?.exp_reward || 0} XP</p>
                      </div>
                      <div className="loot-sum-item">
                        <h5>Reward Gold</h5>
                        <p>🪙 {selectedMonster.loot_table?.gold_reward?.min || 0} - {selectedMonster.loot_table?.gold_reward?.max || 0}</p>
                      </div>
                    </div>

                    {selectedMonster.loot_table?.drops && selectedMonster.loot_table.drops.length > 0 ? (
                      <table className="loot-table-el">
                        <thead>
                          <tr>
                            <th>Item ID</th>
                            <th>Nama Item</th>
                            <th>Rarity</th>
                            <th>Drop Chance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedMonster.loot_table.drops.map((dp, idx) => (
                            <tr key={idx}>
                              <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{dp.item_id}</td>
                              <td style={{ fontWeight: 600 }}>{dp.name}</td>
                              <td>
                                <span className={`rarity-badge rarity-${dp.rarity?.toLowerCase()}`}>
                                  {dp.rarity}
                                </span>
                              </td>
                              <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 'bold' }}>
                                {(dp.drop_chance * 100).toFixed(0)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Tidak ada item yang di-drop oleh monster ini.</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="detail-actions-row">
                  <button 
                    className="action-btn btn-secondary"
                    style={{ width: 'auto' }}
                    onClick={() => handleOpenEditModal(selectedMonster)}
                  >
                    ✏️ Edit Monster
                  </button>
                  <button 
                    className="action-btn btn-danger"
                    style={{ width: 'auto' }}
                    onClick={() => handleDeleteMonster(selectedMonster.monster_id)}
                  >
                    🗑️ Hapus Monster
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👾</div>
                <h2>Archive Empty</h2>
                <p>Tidak ada monster yang dipilih atau database Anda kosong. Klik "Tambah Monster" di kiri atau setup database di tab Benchmark.</p>
              </div>
            )}
          </main>
        </div>
      )}

      {/* ----------------- TAB 2: BENCHMARK / TESTBENCH ----------------- */}
      {activeTab === 'benchmark' && (
        <div className="benchmark-layout">
          <div className="benchmark-control-grid">
            {/* Database controls */}
            <div className="glass-panel seeding-controls">
              <h3 className="section-title">⚙️ DB Management</h3>
              
              <div className="db-stats-card">
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: varColor('Active') }}>Total Records</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MongoDB & MySQL</p>
                </div>
                <div className="db-stat-num">{monsters.length}</div>
              </div>

              <button 
                className="action-btn btn-secondary" 
                onClick={handleResetDB}
                disabled={dbLoading}
              >
                🔄 Reset & Seed 5 Monster Default
              </button>

              <button 
                className="action-btn btn-secondary"
                onClick={handleSeedDB}
                disabled={dbLoading}
              >
                🧬 Seed Random Monsters (+N)
              </button>

              <button 
                className="action-btn btn-danger"
                onClick={handleClearDB}
                disabled={dbLoading}
              >
                🚨 Kosongkan Seluruh Database (Wipe)
              </button>

              {dbLoading && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div className="loader-spinner"></div>
                  <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Memproses database...
                  </p>
                </div>
              )}
            </div>

            {/* Testbench Panel */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 className="section-title">⚡ Performance Testbench</h3>

              {/* Single query benchmark */}
              <div style={{ borderBottom: '1px solid var(--border-glow)', paddingBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.75rem' }}>1. Single Lookup Test</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Mengambil data monster tunggal beserta relasinya dan mengukur waktu kueri secara real-time.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select 
                    className="filter-select"
                    value={selectedBenchId}
                    onChange={e => setSelectedBenchId(e.target.value)}
                    style={{ flex: 2 }}
                  >
                    <option value="">Pilih Monster...</option>
                    {monsters.map(m => (
                      <option key={m.monster_id} value={m.monster_id}>
                        {m.display_name} ({m.monster_id})
                      </option>
                    ))}
                  </select>
                  <button 
                    className="action-btn"
                    style={{ flex: 1 }}
                    onClick={runSingleBenchmark}
                    disabled={singleBenchLoading}
                  >
                    {singleBenchLoading ? 'Menguji...' : 'Jalankan'}
                  </button>
                </div>

                {/* Single benchmark results */}
                {singleBenchResult && (
                  <div className="benchmark-vis-row" style={{ marginTop: '1.5rem' }}>
                    <div className="vis-meter-box">
                      <div className="vis-meter-header">
                        <span className="vis-meter-title nosql">MongoDB (NoSQL)</span>
                        <span style={{ fontSize: '0.75rem' }}>Single Document Read</span>
                      </div>
                      <div className="vis-meter-time">{singleBenchResult.nosql.time} ms</div>
                      <div className="vis-meter-track">
                        <div className="vis-meter-fill nosql" style={{ width: `${getBarWidth(singleBenchResult.nosql.time, singleBenchResult.sql.time)}%` }}></div>
                      </div>
                    </div>

                    <div className="vis-meter-box">
                      <div className="vis-meter-header">
                        <span className="vis-meter-title sql">MySQL (SQL)</span>
                        <span style={{ fontSize: '0.75rem' }}>JOIN Query</span>
                      </div>
                      <div className="vis-meter-time">{singleBenchResult.sql.time} ms</div>
                      <div className="vis-meter-track">
                        <div className="vis-meter-fill sql" style={{ width: `${getBarWidth(singleBenchResult.sql.time, singleBenchResult.nosql.time)}%` }}></div>
                      </div>
                    </div>

                    <div className="speed-comparison-alert">
                      {getSpeedupText(singleBenchResult.nosql.time, singleBenchResult.sql.time)}
                    </div>
                  </div>
                )}
              </div>

              {/* Batch query benchmark */}
              <div>
                <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.75rem' }}>2. Bulk Batch Load Test</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Jalankan kueri massal secara acak berturut-turut atau konkuren untuk menguji ketahanan database di bawah beban kerja tinggi.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Jumlah Kueri:</label>
                    <select 
                      className="filter-select" 
                      value={batchCount} 
                      onChange={e => setBatchCount(parseInt(e.target.value))}
                      style={{ width: '100px' }}
                    >
                      <option value="100">100</option>
                      <option value="500">500</option>
                      <option value="1000">1000</option>
                      <option value="2000">2000</option>
                    </select>
                  </div>

                  <label className="checkbox-label" style={{ userSelect: 'none' }}>
                    <input 
                      type="checkbox"
                      checked={batchConcurrent}
                      onChange={e => setBatchConcurrent(e.target.checked)}
                    />
                    Jalankan Secara Konkuren (Promise.all)
                  </label>

                  <button 
                    className="action-btn"
                    style={{ flex: 1, minWidth: '150px' }}
                    onClick={runBatchBenchmark}
                    disabled={batchBenchLoading}
                  >
                    {batchBenchLoading ? 'Menjalankan Load Test...' : 'Jalankan Load Test'}
                  </button>
                </div>

                {batchBenchLoading && (
                  <div style={{ padding: '2rem 0', textAlign: 'center' }}>
                    <div className="loader-spinner"></div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem' }}>
                      Mengeksekusi {batchCount} query acak ke MongoDB dan MySQL...
                    </p>
                  </div>
                )}

                {/* Batch results */}
                {batchBenchResult && !batchBenchLoading && (
                  <div className="batch-results-panel">
                    <div className="batch-stats-grid">
                      <div className="batch-stat-card">
                        <h5>Rata-rata (MongoDB)</h5>
                        <p className="nosql-val">{batchBenchResult.nosql.avg} ms</p>
                      </div>
                      <div className="batch-stat-card">
                        <h5>Throughput (MongoDB)</h5>
                        <p className="nosql-val">{batchBenchResult.nosql.rps} QPS</p>
                      </div>
                      <div className="batch-stat-card">
                        <h5>Rata-rata (MySQL)</h5>
                        <p className="sql-val">{batchBenchResult.sql.avg} ms</p>
                      </div>
                      <div className="batch-stat-card">
                        <h5>Throughput (MySQL)</h5>
                        <p className="sql-val">{batchBenchResult.sql.rps} QPS</p>
                      </div>
                    </div>

                    {/* Chart */}
                    <div style={{ marginTop: '1rem' }}>
                      <h5 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '0.5rem', textAlign: 'center' }}>
                        Perbandingan Rata-rata Latensi (Lebih Pendek Lebih Baik)
                      </h5>
                      <div className="graph-container">
                        <div className="graph-y-axis"></div>
                        <div className="graph-x-axis"></div>
                        
                        {/* MongoDB Avg Bar */}
                        <div className="graph-bar-group">
                          <div className="graph-bars">
                            <div 
                              className="graph-bar nosql" 
                              style={{ height: `${getBatchBarHeight(batchBenchResult.nosql.avg, batchBenchResult.sql.avg)}px` }}
                            >
                              <span className="graph-bar-val">{batchBenchResult.nosql.avg}ms</span>
                            </div>
                          </div>
                          <span className="graph-label">MongoDB</span>
                        </div>

                        {/* MySQL Avg Bar */}
                        <div className="graph-bar-group">
                          <div className="graph-bars">
                            <div 
                              className="graph-bar sql" 
                              style={{ height: `${getBatchBarHeight(batchBenchResult.sql.avg, batchBenchResult.nosql.avg)}px` }}
                            >
                              <span className="graph-bar-val">{batchBenchResult.sql.avg}ms</span>
                            </div>
                          </div>
                          <span className="graph-label">MySQL</span>
                        </div>
                      </div>
                      <div className="graph-legend">
                        <div className="legend-item">
                          <div className="legend-color" style={{ backgroundColor: 'var(--accent-cyan)' }}></div>
                          <span>MongoDB (NoSQL)</span>
                        </div>
                        <div className="legend-item">
                          <div className="legend-color" style={{ backgroundColor: 'var(--accent-purple)' }}></div>
                          <span>MySQL (SQL)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Education panel */}
          <div className="glass-panel info-card">
            <h4>🧠 Analisis SBD: Mengapa Document Store Unggul pada Skema Dinamis?</h4>
            <p>
              Pada sistem ensiklopedia game (Bestiary), data entitas bersifat heterogen dan sangat bercabang (misal monster memiliki status dasar, kumpulan elemen, list kemampuan unik yang strukturnya dinamis, dan tabel drop item/loot table).
            </p>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
              <li>
                <strong>Data Locality (MongoDB):</strong> Seluruh data monster, status, kemampuan, dan loot table disimpan bersama dalam satu dokumen JSON/BSON. Kueri MongoDB hanyalah pembacaan disk tunggal (`findOne`) menggunakan indeks, mengembalikan seluruh payload secara instan tanpa biaya gabungan (JOIN).
              </li>
              <li>
                <strong>Relational Overhead (SQL):</strong> Untuk merekonstruksi objek monster yang sama, sistem SQL harus melakukan operasi `JOIN` ke tabel-tabel terpisah (`monsters`, `monster_stats`, `monster_elements`, `monster_abilities`). Operasi gabungan ini menghasilkan overhead CPU dan memori yang eksponensial seiring bertambahnya hubungan relasi dan ukuran database.
              </li>
              <li>
                <strong>Dynamic Schema:</strong> Menambahkan atribut kustom baru (misal: "limited_edition_event: True") tidak memerlukan migrasi DDL berat di MongoDB, sedangkan pada SQL hal itu memerlukan modifikasi alter table yang berisiko menyebabkan database lock di lingkungan produksi.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ----------------- MODAL FORM: ADD / EDIT MONSTER ----------------- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{modalMode === 'add' ? '➕ Tambah Monster Baru' : '✏️ Edit Monster'}</h2>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleFormSubmit}>
              {/* Seksi Info Utama */}
              <div className="form-section-title">1. Informasi Utama</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Monster ID (Unik)</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={formValues.monster_id}
                    onChange={e => setFormValues({ ...formValues, monster_id: e.target.value.toUpperCase() })}
                    disabled={modalMode === 'edit'}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Display Name</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={formValues.display_name}
                    onChange={e => setFormValues({ ...formValues, display_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Class Monster</label>
                  <select 
                    className="form-input"
                    value={formValues.class}
                    onChange={e => setFormValues({ ...formValues, class: e.target.value })}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Elite">Elite</option>
                    <option value="World Boss">World Boss</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Lore / Deskripsi Singkat</label>
                  <textarea 
                    className="form-input"
                    rows="2"
                    value={formValues.lore}
                    onChange={e => setFormValues({ ...formValues, lore: e.target.value })}
                  />
                </div>
              </div>

              {/* Seksi Elemen */}
              <div className="form-section-title">2. Elemen</div>
              <div className="checkbox-group">
                {Object.keys(elementIcons).map(el => {
                  const isChecked = formValues.elements.includes(el);
                  return (
                    <label key={el} className="checkbox-label">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleElementToggle(el)}
                      />
                      <span>{elementIcons[el]} {el}</span>
                    </label>
                  );
                })}
              </div>

              {/* Seksi Stats Dasar */}
              <div className="form-section-title">3. Status Dasar (Base Stats)</div>
              <div className="form-grid">
                {[
                  { key: 'health', name: 'HP (Health)', min: 1 },
                  { key: 'mana', name: 'MP (Mana)', min: 0 },
                  { key: 'attack_power', name: 'Attack Power', min: 1 },
                  { key: 'defense', name: 'Defense', min: 1 },
                  { key: 'speed', name: 'Speed', min: 1 }
                ].map(stat => (
                  <div key={stat.key} className="form-group">
                    <label>{stat.name}</label>
                    <input 
                      type="number" 
                      className="form-input"
                      min={stat.min}
                      value={formValues.stats_base[stat.key]}
                      onChange={e => setFormValues({
                        ...formValues,
                        stats_base: {
                          ...formValues.stats_base,
                          [stat.key]: parseInt(e.target.value) || 0
                        }
                      })}
                      required
                    />
                  </div>
                ))}
              </div>

              {/* Seksi Abilities */}
              <div className="form-section-title">4. Abilities ({formValues.abilities.length})</div>
              
              <div className="form-abilities-list">
                {formValues.abilities.map((ab, idx) => (
                  <div key={idx} className="form-ability-item">
                    <button type="button" className="remove-item-btn" onClick={() => handleRemoveAbility(idx)}>
                      Hapus
                    </button>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>{ab.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {ab.type} | {ab.damage_type} | DMG: {ab.base_damage} | CD: {ab.cooldown}s
                    </div>
                  </div>
                ))}

                {/* Form Ability Input Baru */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px' }}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Nama Skill</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={newAbility.name}
                        onChange={e => setNewAbility({ ...newAbility, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Tipe</label>
                      <select 
                        className="form-input"
                        value={newAbility.type}
                        onChange={e => setNewAbility({ ...newAbility, type: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Passive">Passive</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Jenis Damage</label>
                      <select 
                        className="form-input"
                        value={newAbility.damage_type}
                        onChange={e => setNewAbility({ ...newAbility, damage_type: e.target.value })}
                      >
                        <option value="Physical">Physical</option>
                        <option value="Magical">Magical</option>
                        <option value="Pure">Pure</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Base DMG</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={newAbility.base_damage}
                        onChange={e => setNewAbility({ ...newAbility, base_damage: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Cooldown (detik)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={newAbility.cooldown}
                        onChange={e => setNewAbility({ ...newAbility, cooldown: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <button type="button" className="add-sub-btn" onClick={handleAddAbility} style={{ width: '100%', marginTop: '0.75rem' }}>
                    ➕ Tambahkan Ability ke List
                  </button>
                </div>
              </div>

              {/* Seksi Loot Drops */}
              <div className="form-section-title">5. Loot Table & Rewards</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>EXP Reward</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={formValues.loot_table.exp_reward}
                    onChange={e => setFormValues({
                      ...formValues,
                      loot_table: {
                        ...formValues.loot_table,
                        exp_reward: parseInt(e.target.value) || 0
                      }
                    })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Min Gold</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={formValues.loot_table.gold_reward.min}
                    onChange={e => setFormValues({
                      ...formValues,
                      loot_table: {
                        ...formValues.loot_table,
                        gold_reward: {
                          ...formValues.loot_table.gold_reward,
                          min: parseInt(e.target.value) || 0
                        }
                      }
                    })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Max Gold</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={formValues.loot_table.gold_reward.max}
                    onChange={e => setFormValues({
                      ...formValues,
                      loot_table: {
                        ...formValues.loot_table,
                        gold_reward: {
                          ...formValues.loot_table.gold_reward,
                          max: parseInt(e.target.value) || 0
                        }
                      }
                    })}
                    required
                  />
                </div>
              </div>

              {/* Loot Drops List */}
              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Drop Items ({formValues.loot_table.drops.length})</label>
                <div className="form-abilities-list" style={{ marginTop: '0.5rem' }}>
                  {formValues.loot_table.drops.map((dp, idx) => (
                    <div key={idx} className="form-ability-item" style={{ padding: '0.75rem' }}>
                      <button type="button" className="remove-item-btn" onClick={() => handleRemoveDrop(idx)}>
                        Hapus
                      </button>
                      <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 'bold' }}>{dp.name} ({dp.item_id})</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        Rarity: {dp.rarity} | Drop Chance: {(dp.drop_chance * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}

                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px' }}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Item ID</label>
                        <input 
                          type="text" 
                          className="form-input"
                          placeholder="ITM-DRG-SCALE"
                          value={newDrop.item_id}
                          onChange={e => setNewDrop({ ...newDrop, item_id: e.target.value.toUpperCase() })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Nama Item</label>
                        <input 
                          type="text" 
                          className="form-input"
                          placeholder="Dragon Scale"
                          value={newDrop.name}
                          onChange={e => setNewDrop({ ...newDrop, name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Rarity</label>
                        <select 
                          className="form-input"
                          value={newDrop.rarity}
                          onChange={e => setNewDrop({ ...newDrop, rarity: e.target.value })}
                        >
                          <option value="Common">Common</option>
                          <option value="Rare">Rare</option>
                          <option value="Epic">Epic</option>
                          <option value="Legendary">Legendary</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Drop Chance (0.01 - 1.0)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          min="0.01" 
                          max="1.0"
                          className="form-input"
                          value={newDrop.drop_chance}
                          onChange={e => setNewDrop({ ...newDrop, drop_chance: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <button type="button" className="add-sub-btn" onClick={handleAddDrop} style={{ width: '100%', marginTop: '0.75rem' }}>
                      ➕ Tambahkan Drop Item ke List
                    </button>
                  </div>
                </div>
              </div>

              {/* Form buttons */}
              <div className="form-actions-row">
                <button type="button" className="action-btn btn-secondary" style={{ width: 'auto' }} onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="action-btn" style={{ width: 'auto' }}>
                  Simpan Monster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Visual helpers for elements or badges
function varColor(type) {
  if (type === 'Active') return '#f43f5e';
  if (type === 'Passive') return '#10b981';
  return '#9ca3af';
}

function getBarWidth(time, otherTime) {
  const t = parseFloat(time) || 0;
  const ot = parseFloat(otherTime) || 0;
  const max = Math.max(t, ot);
  if (max === 0) return 0;
  return (t / max) * 100;
}

function getSpeedupText(nosqlTime, sqlTime) {
  const n = parseFloat(nosqlTime) || 0.0001;
  const s = parseFloat(sqlTime) || 0.0001;
  if (n < s) {
    const diff = (s / n).toFixed(1);
    return `⚡ MongoDB (NoSQL) lebih cepat sekitar ${diff}x dibandingkan MySQL (SQL) dalam kueri ini!`;
  } else {
    const diff = (n / s).toFixed(1);
    return `🐢 MySQL (SQL) lebih cepat ${diff}x dibandingkan MongoDB dalam kueri ini (kemungkinan karena cache database atau data sangat kecil).`;
  }
}

function getBatchBarHeight(avg, otherAvg) {
  const a = parseFloat(avg) || 0;
  const oa = parseFloat(otherAvg) || 0;
  const max = Math.max(a, oa);
  if (max === 0) return 0;
  // scale to max 160px height
  return (a / max) * 160;
}
