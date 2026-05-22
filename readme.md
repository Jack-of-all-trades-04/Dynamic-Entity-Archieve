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
| No. Uji | Sumber Berkas (Gambar) | Tipe Kueri / Skenario | Jumlah Data di DB | Volume & Tipe Beban Kueri | Rata-Rata Latensi MongoDB | Rata-Rata Latensi MySQL | Throughput MongoDB (QPS) | Throughput MySQL (QPS) | Pemenang (Speedup) |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | <img width="694" height="658" alt="Compare 1" src="https://github.com/user-attachments/assets/3e3e6dc7-8e24-44aa-9c32-2516bd1f836a" />| Single Lookup & Sequential Batch | 1.110 | 1 kueri & 2.000 batch | 5.9549 ms (Single)<br>0.7434 ms (Batch) | 2.5431 ms (Single)<br>0.3866 ms (Batch) | 1.343,95 | 2.583,36 | **MySQL (2.3x Single / 1.9x Batch)** |
| **2** | <img width="671" height="609" alt="Compare 2" src="https://github.com/user-attachments/assets/f27ec9c4-6fe2-48f2-8c0c-242990402d72" />| Single Lookup & Sequential Batch | 20.000 | 1 kueri & 2.000 batch | 8.7517 ms (Single)<br>0.7520 ms (Batch) | 3.3160 ms (Single)<br>0.4154 ms (Batch) | 1.328,35 | 2.484,81 | **MySQL (2.6x Single / 1.8x Batch)** |
| **3** | <img width="917" height="563" alt="Compare 4" src="https://github.com/user-attachments/assets/966de389-5870-4527-bae3-0add337505d8" />| Single Lookup & Sequential Batch | 40.000 | 1 kueri & 2.000 batch | 4.1458 ms (Single)<br>0.7430 ms (Batch) | 1.5456 ms (Single)<br>0.4214 ms (Batch) | 1.344,36 | 2.370,20 | **MySQL (2.7x Single / 1.7x Batch)** |
| **4** | <img width="917" height="563" alt="Compare 4" src="https://github.com/user-attachments/assets/3ac55b0b-0cd0-4f69-bc47-596765a05854" /> | Bulk Concurrent Batch Load Test | 40.200 | 40.000 kueri | 11.240,80 ms | 4.099,39 ms | 2.021,12 | 4.899,56 | **MySQL (2.7x Lebih Cepat)** |
| **5** | <img width="1023" height="652" alt="Compare 7" src="https://github.com/user-attachments/assets/338cbbe3-9679-45f7-bf84-1985a9832c35" />| Bulk Sequential Batch Load Test | 5 | 40.000 kueri | 0.5833 ms | 0.3807 ms | 1.712,83 | 2.623,56 | **MySQL (1.5x Lebih Cepat)** |

### Analisis Penyebab Teknis MySQL Selalu Menang

Berdasarkan implementasi kode pada proyek, terdapat **4 faktor teknis utama** mengapa NoSQL (MongoDB) kalah cepat dibanding SQL (MySQL):

### 1. Ketidakseimbangan Payload Data yang Diambil (Apple vs Orange)
Ini adalah faktor paling krusial. Beban kerja kueri yang dijalankan oleh kedua database di backend sangatlah tidak seimbang:
* **Kueri MySQL** di berkas [index.js](file:///c:/Kuliah/SBD/Dynamic-Entity-Archieve/backend/src/index.js#L264-L268):
  ```sql
  SELECT m.*, s.health, s.attack_power, s.defense, s.speed 
  FROM monsters m 
  JOIN monster_stats s ON m.id = s.m_id 
  WHERE m.monster_id = ?
  ```
  Kueri ini **hanya mengambil data kolom dasar monster dan 4 stat murni** (hasil *JOIN* datar antara 2 tabel). Kolom-kolom ini bertipe data primitif (angka, string pendek). Kueri ini **mengabaikan** data kemampuan (*abilities*), elemen (*elements*), serta daftar *drop loot* monster. Ukuran baris data MySQL sangat kecil (~150 Bytes).
  
* **Kueri MongoDB** di berkas [index.js](file:///c:/Kuliah/SBD/Dynamic-Entity-Archieve/backend/src/index.js#L255):
  ```javascript
  const dataNoSQL = await Monster.findOne({ monster_id: monsterId }).lean();
  ```
  MongoDB mengambil **dokumen monster secara lengkap dan utuh**. Hal ini mencakup seluruh array `elements` (string), array sub-dokumen bersarang `abilities` (nama, jenis damage, base damage, cooldown, deskripsi, vfx path), serta sub-dokumen `loot_table` bersarang dengan array `drops` di dalamnya. Ukuran payload dokumen MongoDB ini jauh lebih besar dan kompleks (~2 KiloBytes).
  
> [!IMPORTANT]
> **Mengapa ini membuat MongoDB lebih lambat?**
> MongoDB harus membaca, mentransfer, mendeserialisasi (BSON ke JS Object), dan mengalokasikan memori untuk seluruh struktur JSON bersarang yang besar tersebut. MySQL hanya mentransfer 1 baris data datar (*flat row*) yang sangat kecil. Jika MySQL dipaksa untuk melakukan `JOIN` ke tabel `monster_abilities`, `monster_elements`, dan `monster_drops` lalu merekonstruksinya menjadi objek bersarang yang setara di backend Node.js, kinerja MySQL dipastikan akan turun drastis di bawah MongoDB karena tingginya biaya *multi-relation JOIN*.

---

### 2. Overhead Deserialisasi BSON & Alokasi Objek di Node.js (Event Loop Blocking)
* **MongoDB Driver (Mongoose)**: Walaupun sudah dioptimalkan menggunakan fungsi `.lean()` (yang mengembalikan objek JS biasa, bukan instansi kelas Mongoose Document), driver MongoDB tetap harus membangun objek berstruktur dalam (*deeply nested*) dengan array dan objek bersarang. Alokasi memori yang intensif untuk puluhan ribu objek bersarang ini memicu pembersihan memori (*Garbage Collection* / GC) secara berulang di V8 Engine Node.js.
* **MySQL Driver (`mysql2`)**: Driver MySQL memproses protokol biner tabular yang sangat sederhana. Ia hanya memetakan kolom-kolom datar langsung menjadi properti objek JavaScript datar tingkat tunggal (*flat single-level object*). Hal ini membuat proses pengolahan data di sisi CPU backend menjadi instan dan sangat hemat memori.

---

### 3. Degradasi Performa pada Beban Konkuren (Queueing di Connection Pool)
Pada uji load test konkuren dengan **40.000 kueri serentak** (Compare 4):
* Kode pengujian menggunakan `Promise.all` untuk mengirimkan 40.000 janji kueri asinkron sekaligus:
  ```javascript
  await Promise.all(randomIds.map(async (id) => { ... }));
  ```
* **MySQL Connection Pool**: Dibatasi hanya `connectionLimit: 10` di berkas [mysql.js](file:///c:/Kuliah/SBD/Dynamic-Entity-Archieve/backend/src/config/mysql.js#L10). Antrean 40.000 permintaan dikelola dengan sangat rapi oleh antrean internal driver Node.js. Karena eksekusi SQL per kueri sangat cepat (kurang dari 0.1ms di RAM) dan overhead-nya kecil, 10 koneksi MySQL tersebut mampu melayani antrean secara stabil tanpa membebani sistem.
* **MongoDB Connection Pool**: Mongoose memiliki batas default `maxPoolSize: 100`. Di bawah tekanan 40.000 janji asinkron, MongoDB mencoba memproses 100 kueri secara paralel pada database server. Hal ini memicu perebutan kunci (*lock contention*) pada mesin penyimpanan database (WiredTiger) serta konsumsi CPU yang sangat tinggi untuk serialization BSON. Akibatnya, latensi asinkron menumpuk di antrean Node.js, menaikkan latensi rata-rata menjadi **11,2 detik**.

---

### 4. Bukti Suksesnya Indexing pada Kedua Database
Satu hal yang menarik dari data pengujian:
* Di skenario sekuensial (2.000 kueri), latensi rata-rata MongoDB **tetap stabil di angka ~0,74 ms** baik saat database berisi 1.110 data, 20.000 data, maupun 40.000 data!
* Begitu pula dengan MySQL yang latensinya **tetap stabil di angka ~0,40 ms** di semua ukuran database.

> [!TIP]
> Hal ini membuktikan bahwa **indeks pencarian bekerja dengan sempurna** pada kedua database. 
> * MongoDB menggunakan indeks unik pada properti `monster_id` (Kompleksitas $O(1)$ Hash / B-Tree).
> * MySQL menggunakan indeks B-Tree primer/unik pada kolom `monster_id`.
> 
> Latensi tidak meningkat seiring bertambahnya data dari 1.000 ke 40.000 karena database tidak melakukan pemindaian seluruh tabel (*Full Table/Collection Scan*). Perbedaan konstan antara 0,4ms vs 0,7ms murni berasal dari perbedaan ukuran payload data dan protokol komunikasi driver di atas.

---
