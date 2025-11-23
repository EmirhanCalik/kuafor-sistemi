// server/src/database/db.js

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

// PostgreSQL bağlantı havuzu (Pool) oluşturma
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Veritabanı bağlantı testi
pool.connect()
    .then(client => {
        console.log("✅ PostgreSQL veritabanı bağlantısı başarılı.");
        client.release(); // Bağlantıyı havuza geri bırak
    })
    .catch(err => {
        console.error("❌ PostgreSQL veritabanı bağlantı hatası:", err.message);
        // Hata durumunda uygulamayı durdurmak için process.exit(1); kullanabilirsiniz.
    });

// Query'leri (sorguları) tüm modüllerin kullanması için dışa aktar
export const query = (text, params) => pool.query(text, params);
