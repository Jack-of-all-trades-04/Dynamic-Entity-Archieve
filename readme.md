Detroit Bestiary: Dynamic Entity Archive
A Cloud-Native, Document-Oriented Game Encyclopedia System
Detroit Bestiary: Dynamic Entity Archive adalah sistem manajemen entitas game berbasis cloud yang dirancang untuk menangani data yang sangat dinamis dan heterogen secara real-time. Proyek ini mengintegrasikan fleksibilitas MongoDB, keamanan Cloudflare, dan skalabilitas Kubernetes untuk menciptakan ensiklopedia monster (Bestiary) yang dapat diperbarui secara instan tanpa memerlukan pembaruan aplikasi (update patch) di sisi pemain. 
📑 Daftar Isi
•	Gambaran Umum
•	Tech Stack
•	Arsitektur Sistem
•	Model Data (NoSQL)
•	Fitur Unggulan
•	Struktur Tim
🧐 Gambaran Umum
Masalah utama dalam pengembangan game tradisional adalah data entitas (seperti monster atau item) sering kali di-hardcode, sehingga perubahan status seperti nerf atau buff memerlukan update aplikasi yang merepotkan. 
Proyek ini mengadopsi strategi Live-Ops yang terinspirasi dari EA Sports, menggunakan database NoSQL untuk memungkinkan perubahan atribut secara real-time langsung melalui backend. 
🛠 Tech Stack
Sistem ini dibangun menggunakan kombinasi teknologi modern:
•	Frontend & Client: Godot Engine (GDScript) untuk performa visual dan manipulasi objek 3D/2D yang mulus. 
•	Database: MongoDB (Document-Oriented) untuk penyimpanan data polymorphic yang fleksibel. 
•	Infrastructure: Kubernetes (K8s) untuk hosting cluster database dan API backend dengan kemampuan Zero Downtime Deployment. 
•	Security & Networking: Cloudflare (Tunnel, WAF, DNS) untuk mengamankan API backend dan enkripsi koneksi (SSL/TLS). 
🏗 Arsitektur Sistem
Alur komunikasi data dirancang untuk mengutamakan keamanan dengan tidak menghubungkan client secara langsung ke database: 
1.	Godot Client: Melakukan HTTPRequest ke URL aman yang disediakan Cloudflare. 
2.	Cloudflare: Menyaring trafik melalui WAF dan meneruskannya melalui Cloudflare Tunnel ke dalam cluster internal. 
3.	Kubernetes API Gateway: Menangani logika aplikasi dan mengonversi data BSON dari MongoDB menjadi JSON untuk dikirim ke Godot. 
4.	MongoDB Cluster: Berjalan sebagai StatefulSet di Kubernetes, menyimpan jutaan dokumen entitas dalam beberapa shards untuk skalabilitas horizontal. 
📊 Model Data (NoSQL)
Kami menggunakan pendekatan Data Locality, di mana data yang sering diakses bersama disimpan dalam satu dokumen JSON besar untuk menghindari operasi JOIN yang berat. 
Contoh Dokumen Monster:
JSON
{
  "id": "MSTR-7721",
  "display_name": "Ignis Drake",
  "class": "Elite / World Boss",
  "elements": ["Fire", "Flying"],
  "stats_base": {
    "health": 15000,
    "attack_power": 450,
    "resistances": { "fire": 1.0, "ice": -0.5 }
  },
  "abilities": [
    {
      "name": "Inferno Breath",
      "type": "Active",
      "damage_type": "Magical",
      "base_damage": 1200
    }
  ],
  "loot_table": {
    "exp_reward": 5500,
    "drops": [{ "item_id": "ITM-DRG-SCALE", "drop_chance": 0.15 }]
  }
}
Struktur ini memungkinkan penambahan atribut unik (seperti "limited_edition") tanpa merusak skema data monster lainnya. 
🌟 Fitur Unggulan
•	Schema-less Flexibility: Menambah monster baru dengan atribut unik kini semudah mengunggah dokumen JSON baru. 
•	Global Scaling: Melalui fitur native sharding MongoDB, data dapat didistribusikan ke berbagai region secara horizontal. 
•	Zero Downtime: Melakukan pembaruan konten atau patching backend tanpa perlu mematikan server game (maintenance). 
•	Cross-Platform Consistency: Godot memastikan tampilan UI Bestiary tetap konsisten di Android, iOS, Windows, maupun Web. 
👥 Struktur Tim
Nama	Peran	Tanggung Jawab
Jonathan Christopher	Backend & Database Engineer	Mengelola cluster MongoDB di K8s dan membangun API Gateway.
Novan Agung Wicaksono	Godot Integration Developer	Menangani HTTPRequest dan parsing JSON menjadi objek Resource di Godot.
Qais Ismail	Cloud & Security Architect	Mengonfigurasi Cloudflare Tunnel dan memastikan keamanan SSL/TLS.
Proyek ini merupakan bagian dari NoSQL Mini Project Research yang menganalisis efisiensi Document Store pada skala industri game modern. 

