const mongoose = require('mongoose');

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;
    console.log(`[DB] Mencoba koneksi ke: ${mongoUri}`);

    const options = {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
    };

    try {
        const conn = await mongoose.connect(mongoUri, options);
        console.log(`--- MongoDB Connected: ${conn.connection.host} ---`);
        console.log(`--- Database Name: ${conn.connection.name} ---`);
    } catch (err) {
        console.error(`!!! Gagal Koneksi DB: ${err.message}`);
        console.log("[DB] Mencoba menyambung kembali dalam 5 detik...");
        setTimeout(connectDB, 5000);
    }
};

module.exports = connectDB;