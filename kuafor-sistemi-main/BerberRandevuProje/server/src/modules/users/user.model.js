// server/src/modules/users/user.model.js

import { query } from '../../database/db.js'; 

// --- Kullanıcı Kayıt Fonksiyonu (INSERT) ---
export async function saveUserToDB(data) {
    const { name, surname, email, phone_number, password_hash, email_verified, phone_verified } = data;
    
    try {
        const result = await query(
            // SQL sorgusunda $1, $2, ... parametrelerini kullanmak güvenlidir.
            `INSERT INTO "Users" (name, surname, email, phone_number, password_hash, email_verified, phone_verified) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING id, name, surname, email, phone_number, email_verified, phone_verified`, 
            [name, surname || null, email || null, phone_number, password_hash, email_verified || false, phone_verified || false]
        );
        console.log(`[DB MODEL] Yeni kullanıcı PostgreSQL'e kaydedildi: ${email || phone_number}`);
        return result.rows[0]; 
    } catch (error) {
        // Hata ayıklama için detaylı log
        console.error("Kayıt sırasında veritabanı hatası:", error.message);
        throw new Error(`Kayıt sırasında veritabanı hatası: ${error.message}`);
    }
}

// --- Telefon Numarası ile Bulma Fonksiyonu (SELECT) ---
export async function findUserByPhoneNumber(phone) {
    try {
        const result = await query(
            `SELECT id, name, surname, email, phone_number, password_hash, email_verified, phone_verified 
             FROM "Users" 
             WHERE phone_number = $1`,
            [phone]
        );
        
        if (result.rows.length > 0) {
            console.log(`[DB MODEL] Kullanıcı PostgreSQL'de bulundu: ${phone}`);
            return result.rows[0];
        }
        
        return null; 
    } catch (error) {
        console.error("Kullanıcı bulma sırasında veritabanı hatası:", error.message);
        throw new Error(`Kullanıcı bulma sırasında veritabanı hatası: ${error.message}`);
    }
}

// --- Email ile Bulma Fonksiyonu (SELECT) ---
export async function findUserByEmail(email) {
    try {
        const result = await query(
            `SELECT id, name, surname, email, phone_number, password_hash, email_verified, phone_verified 
             FROM "Users" 
             WHERE email = $1`,
            [email]
        );
        
        if (result.rows.length > 0) {
            console.log(`[DB MODEL] Kullanıcı PostgreSQL'de bulundu: ${email}`);
            return result.rows[0];
        }
        
        return null; 
    } catch (error) {
        console.error("Kullanıcı bulma sırasında veritabanı hatası:", error.message);
        throw new Error(`Kullanıcı bulma sırasında veritabanı hatası: ${error.message}`);
    }
}

// --- Email veya Telefon ile Bulma Fonksiyonu (SELECT) ---
export async function findUserByEmailOrPhone(emailOrPhone) {
    try {
        const result = await query(
            `SELECT id, name, surname, email, phone_number, password_hash, email_verified, phone_verified 
             FROM "Users" 
             WHERE email = $1 OR phone_number = $1`,
            [emailOrPhone]
        );
        
        if (result.rows.length > 0) {
            console.log(`[DB MODEL] Kullanıcı PostgreSQL'de bulundu: ${emailOrPhone}`);
            return result.rows[0];
        }
        
        return null; 
    } catch (error) {
        console.error("Kullanıcı bulma sırasında veritabanı hatası:", error.message);
        throw new Error(`Kullanıcı bulma sırasında veritabanı hatası: ${error.message}`);
    }
}

// --- Email veya Telefon Doğrulama Güncelleme ---
export async function updateUserVerification(userId, field, value) {
    try {
        const result = await query(
            `UPDATE "Users" 
             SET ${field} = $1 
             WHERE id = $2 
             RETURNING id, name, surname, email, phone_number, email_verified, phone_verified`,
            [value, userId]
        );
        
        return result.rows[0];
    } catch (error) {
        console.error("Doğrulama güncelleme hatası:", error.message);
        throw new Error(`Doğrulama güncelleme hatası: ${error.message}`);
    }
}