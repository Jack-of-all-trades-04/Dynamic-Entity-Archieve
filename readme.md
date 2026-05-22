# Detroit Bestiary: Dynamic Entity Archive
### SBD (Sistem Basis Data) Research & CMS Project

Proyek ini adalah monorepo sistem manajemen entitas game dinamis (Bestiary) berbasis web yang membandingkan performa antara **Document Store NoSQL (MongoDB)** dan **Relational Database SQL (MySQL)** secara langsung melalui aplikasi **React + Vite** dan **Express Backend API**.

---

## 📁 Struktur Repositori

```text
Dynamic-Entity-Archieve/
├── backend/            # Express.js API & Database Sync Logic
│   ├── src/
│   │   ├── config/     # Konfigurasi Database (MongoDB & MySQL Pool)
│   │   ├── controllers/# Logic CRUD & Sinkronisasi SQL
│   │   ├── models/     # Mongoose Schemas (NoSQL Document)
│   │   ├── routes/     # Routing CRUD Bestiary
│   │   └── index.js    # Entry point backend & API benchmark
│   ├── Dockerfile
│   ├── manifest.yaml   # K8s Deployment (MongoDB, Backend, Cloudflared)
│   └── mysql-manifest.yaml
└── frontend/           # React + Vite Client (CMS & Testbench)
    ├── src/
    │   ├── App.jsx     # Logic & State (CMS & Performance Chart)
    │   ├── index.css   # Desain system bertema Cyber Dark Mode
    │   └── main.jsx
    └── index.html
```

---

## 🛠 Tech Stack

- **Frontend & Client**: React 18, Vite, Vanilla CSS (Premium Cyberpunk Dark Theme, SVG Charts, Glassmorphism).
- **Backend API**: Node.js, Express.js.
- **NoSQL Database**: MongoDB (Mongoose) - Menyimpan dokumen polimorfik entitas Monster secara utuh (Abilities, Stats, Loot Table) dalam satu dokumen.
- **SQL Database**: MySQL (mysql2) - Menyimpan data relasional terpisah di tabel `monsters`, `monster_stats`, `monster_elements`, dan `monster_abilities` dengan relasi kunci asing (Foreign Key & Cascade Delete) sebagai pembanding.

---

## 🚀 Panduan Menjalankan Aplikasi (CLI Commands)

Jalankan perintah berikut menggunakan terminal di Windows (PowerShell/CMD).

### Langkah 1: Jalankan Database

#### Pilihan A: Menggunakan Kubernetes (Minikube)
Masuk ke folder `backend` lalu terapkan manifest Kubernetes:
```powershell
cd backend
# Mulai minikube
minikube start

# Terapkan deploy MongoDB & Backend & MySQL
kubectl apply -f manifest.yaml
kubectl apply -f mysql-manifest.yaml

# Forward port database ke komputer lokal
kubectl port-forward svc/mongodb-service 27017:27017
kubectl port-forward svc/mysql-service 3306:3306
```

#### Pilihan B: Menggunakan Docker (Local)
Jika menggunakan Docker Desktop langsung di lokal tanpa Kubernetes:
```powershell
# Jalankan MongoDB lokal
docker run -d --name mongodb-local -p 27017:27017 mongo:latest

# Jalankan MySQL lokal (Password diset: admin123, Database: bestiary_db)
docker run -d --name mysql-local -p 3306:3306 -e MYSQL_ROOT_PASSWORD=admin123 -e MYSQL_DATABASE=bestiary_db mysql:8.0
```

---

### Langkah 2: Jalankan Backend API
Buka terminal baru di direktori `backend/`:
```powershell
cd backend
# Jalankan backend api server (berjalan di http://localhost:5000)
npm.cmd run dev
```

*Catatan: Pastikan database MongoDB dan MySQL sudah aktif sebelum menyalakan backend.*

---

### Langkah 3: Jalankan Frontend
Buka terminal baru di direktori `frontend/`:
```powershell
cd frontend
# Jalankan server pengembangan Vite (berjalan di http://localhost:5173)
npm.cmd run dev
```

Buka browser dan buka **`http://localhost:5173`**.

---

### Langkah 4: Setup Skema Tabel SQL & Semai Data Pertama Kali
Setelah membuka aplikasi di browser:
1. Navigasi ke tab **⚡ Performance Testbench**.
2. Klik tombol **`🔄 Reset & Seed 5 Monster Default`**.
   - Backend akan otomatis membuat tabel MySQL yang diperlukan (`monsters`, `monster_stats`, `monster_elements`, `monster_abilities`) dan memasukkan 5 monster awal ke MongoDB dan MySQL secara sinkron.
3. Database sekarang sudah siap digunakan untuk CRUD maupun benchmark!
