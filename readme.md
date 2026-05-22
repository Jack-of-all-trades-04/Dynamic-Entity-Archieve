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

### Testbench
<img width="689" height="572" alt="Compare 3" src="https://github.com/user-attachments/assets/131692da-da89-48e8-b7f4-d08fc9ff0d4f" />
<img width="671" height="609" alt="Compare 2" src="https://github.com/user-attachments/assets/e181707d-28aa-4671-a5b0-b7f3b88079c2" />
<img width="694" height="658" alt="Compare 1" src="https://github.com/user-attachments/assets/2eca411c-3f70-4249-8370-c704da901b08" />

Bukti Bahwa Indexing Berjalan Sempurna (Latensi Flat)
Latensi kueri MongoDB dan MySQL hampir tidak berubah (flat/datar) meskipun jumlah datanya melonjak dari 1.000 menjadi 40.000 data. Ini adalah bukti konkret bahwa keduanya telah menggunakan Indexing secara tepat. Pencarian terindeks memiliki kompleksitas O(logN) atau O(1), sehingga waktu pencarian di RAM database tetap konstan berapapun jumlah datanya.

Mengapa MySQL Tetap Lebih Cepat di Angka Latensinya?
Meskipun keduanya menggunakan indeks, MySQL mencatatkan waktu ~0.4ms sementara MongoDB ~0.7ms karena dua alasan ini:
Perbedaan Struktur Data yang Diproses (Beban Kerja):
- Kueri MongoDB mengambil seluruh dokumen monster secara utuh (termasuk objek bersarang media, stats_base, array elements, seluruh sub-dokumen array abilities, dan loot_table). Driver database harus men-deserialisasi format BSON yang tebal ini menjadi struktur objek Javascript bersarang.
- Kueri MySQL di benchmark hanya melakukan kueri gabungan sederhana antara tabel monsters dan monster_stats (tidak menarik data array abilities atau elements). Hasilnya berupa satu baris data datar (flat row) yang sangat tipis dan cepat diproses.
