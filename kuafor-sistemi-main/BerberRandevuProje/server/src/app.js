// server/src/app.js

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import userRoutes from './modules/users/user.controller.js';
import appointmentRoutes from './modules/appointments/appointment.controller.js';
import './database/db.js'; // Veritabanı bağlantı testini başlatmak için

// .env dosyasındaki değişkenleri yükle
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000; 

// ------------------------------------------------------------------
// Middleware'ler
// ------------------------------------------------------------------

// CORS middleware'ini etkinleştirme
app.use(cors()); 

// Gelen JSON isteklerini parse etmek için
app.use(express.json()); 

// ------------------------------------------------------------------
// Rotalar (Routes)
// ------------------------------------------------------------------

// Ana test rotası
app.get('/', (req, res) => {
    res.send('Berber Randevu Sistemi Backend API çalışıyor!');
});

// Kullanıcı modülünü rota olarak ekle (Auth: /api/users)
app.use('/api/users', userRoutes); 

// Randevu modülünü rota olarak ekle (Randevu: /api/appointments)
app.use('/api/appointments', appointmentRoutes); 

// ------------------------------------------------------------------
// Sunucuyu başlat
// ------------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
});