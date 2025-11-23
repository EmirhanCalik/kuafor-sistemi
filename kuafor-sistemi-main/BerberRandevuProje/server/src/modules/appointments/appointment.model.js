// server/src/modules/appointments/appointment.model.js

import { query } from '../../database/db.js';

// --- 1. Personelin Çalışma Saatlerini Çekme ---
export async function getStaffWorkingHours(staffId) {
    try {
        const result = await query(
            `SELECT working_hours 
             FROM "Staff" 
             WHERE id = $1`,
            [staffId]
        );
        return result.rows[0] ? result.rows[0].working_hours : null;
    } catch (error) {
        throw new Error(`Veritabanı hatası (Çalışma Saatleri): ${error.message}`);
    }
}

// --- 2. Personelin O Günkü Dolu Randevularını Çekme ---
export async function getStaffBookingsForDay(staffId, date) {
    try {
        const result = await query(
            `SELECT start_time, end_time 
             FROM "Appointments" 
             WHERE staff_id = $1 
             AND DATE(start_time) = DATE($2) 
             AND status IN ('confirmed', 'pending')`,
            [staffId, date]
        );
        // PostgreSQL'den gelen tarih değerlerini string'e çevir
        return result.rows.map(row => ({
            start_time: row.start_time instanceof Date 
                ? row.start_time.toISOString() 
                : (typeof row.start_time === 'string' ? row.start_time : String(row.start_time)),
            end_time: row.end_time instanceof Date 
                ? row.end_time.toISOString() 
                : (typeof row.end_time === 'string' ? row.end_time : String(row.end_time))
        }));
    } catch (error) {
        throw new Error(`Veritabanı hatası (Dolu Randevular): ${error.message}`);
    }
}

// --- 3. Hizmet Süresini Çekme ---
export async function getServiceDuration(serviceId) {
    try {
        const result = await query(
            `SELECT duration_minutes 
             FROM "Services" 
             WHERE id = $1`,
            [serviceId]
        );
        // Süre verisi bir obje içinde gelir (duration_minutes).
        return result.rows[0]; 
    } catch (error) {
        throw new Error(`Veritabanı hatası (Hizmet Süresi): ${error.message}`);
    }
}

// --- 4. Randevu Oluşturma ---
export async function createAppointment(data) {
    const { userId, staffId, serviceId, startTime, endTime } = data;
    // NOT: Salon ID'si (salonId) eksik olduğu için varsayılan 1 kullanılmıştır.
    const salonId = data.salonId || 1; 

    console.log("[MODEL] Veritabanına randevu ekleniyor:", {
        userId, salonId, staffId, serviceId, startTime, endTime
    });

    try {
        const result = await query(
            `INSERT INTO "Appointments" (user_id, salon_id, staff_id, service_id, start_time, end_time, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'confirmed') 
             RETURNING id, start_time, end_time, status`,
            [userId, salonId, staffId, serviceId, startTime, endTime]
        );
        console.log("[MODEL] Randevu veritabanına eklendi:", result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error("[MODEL] Randevu ekleme hatası:", error);
        throw new Error(`Randevunuz kaydedilirken veritabanı hatası oluştu: ${error.message}`);
    }
}