// server/src/modules/appointments/appointment.service.js

import { 
    getStaffWorkingHours, 
    getStaffBookingsForDay, 
    getServiceDuration, 
    createAppointment 
} from './appointment.model.js';

import { 
    addMinutes, 
    format, 
    isAfter, 
    parseISO, 
    setHours, 
    setMinutes, 
    isEqual 
} from 'date-fns';

const SLOT_INTERVAL = 30; // Dakika

function ensureISODateString(value, fieldName) {
    // Null veya undefined kontrolü
    if (value === null || value === undefined) {
        throw new Error(`${fieldName} null veya undefined: ${value}`);
    }
    
    // Zaten string ise döndür
    if (typeof value === 'string') {
        return value;
    }
    
    // Date nesnesi ise ISO string'e çevir
    if (value instanceof Date) {
        return value.toISOString();
    }
    
    // toISOString metodu varsa kullan
    if (value && typeof value.toISOString === 'function') {
        return value.toISOString();
    }
    
    // PostgreSQL'den gelen özel tarih nesneleri için
    if (value && typeof value.toString === 'function') {
        const str = value.toString();
        // Eğer geçerli bir tarih string'i ise kullan
        if (str && str.length > 0) {
            return str;
        }
    }
    
    // Son çare: String'e çevir
    const strValue = String(value);
    if (strValue && strValue !== 'null' && strValue !== 'undefined') {
        return strValue;
    }
    
    throw new Error(`${fieldName} geçersiz formatta: ${JSON.stringify(value)} (tip: ${typeof value})`);
}
// ----------------------------------------------------------
// 1) MÜSAİTLİK HESAPLAMA
// ----------------------------------------------------------
export async function calculateAvailability(staffId, dateString, serviceId) {

    // 1) — Tarihi güvenli şekilde string'e çevir
    const safeDate = String(dateString).trim();

    // 2) — YYYY-MM-DD format kontrolü
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(safeDate)) {
        throw new Error(`Geçersiz tarih formatı alındı: ${safeDate}`);
    }

    // 3) — ISO hale getirip parse et
    const targetDate = parseISO(safeDate + "T00:00:00.000Z");

    // 4) — DB verilerini çek
    const workingHoursData = await getStaffWorkingHours(staffId);
    const bookings = await getStaffBookingsForDay(staffId, safeDate);
    const durationData = await getServiceDuration(serviceId);

    if (!workingHoursData) {
        throw new Error(`Personel çalışma saatleri bulunamadı (ID:${staffId})`);
    }
    if (!durationData || !durationData.duration_minutes) {
        throw new Error(`Hizmet süresi bulunamadı (ID:${serviceId})`);
    }

    const duration = durationData.duration_minutes;

    // Haftanın günü (1=Mon → 7=Sun)
    const dayOfWeek = format(targetDate, 'i');
    const daySchedule = workingHoursData[dayOfWeek];

    // O gün çalışmıyorsa boş döner
    if (!daySchedule) return [];

    if (typeof daySchedule.start !== "string" || typeof daySchedule.end !== "string") {
        throw new Error(`Çalışma saat formatı hatalı: ${JSON.stringify(daySchedule)}`);
    }

    // Saatleri ayır
    const [startHour, startMinute] = daySchedule.start.split(':').map(Number);
    const [endHour, endMinute] = daySchedule.end.split(':').map(Number);

    let currentTime = setMinutes(setHours(targetDate, startHour), startMinute);
    let endTime = setMinutes(setHours(targetDate, endHour), endMinute);

    let availableSlots = [];

    // ----------------------------------------------------------
    // Slot Hesaplama Döngüsü
    // ----------------------------------------------------------
    while (isAfter(endTime, currentTime)) {

        const slotEnd = addMinutes(currentTime, duration);

        // Süre çalışma saatini aşıyorsa dur
        if (isAfter(slotEnd, endTime) || isEqual(slotEnd, endTime)) {
            break;
        }

        // Bu slot dolu mu kontrol et
        const isBooked = bookings.some(b => {
            const bStartISO = ensureISODateString(b.start_time, 'start_time');
            const bEndISO = ensureISODateString(b.end_time, 'end_time');

            // parseISO'ya göndermeden önce string olduğundan emin ol
            if (typeof bStartISO !== 'string' || typeof bEndISO !== 'string') {
                console.error('[HATA] Tarih değerleri string değil:', {
                    start_time: b.start_time,
                    start_time_type: typeof b.start_time,
                    bStartISO: bStartISO,
                    bStartISO_type: typeof bStartISO,
                    end_time: b.end_time,
                    end_time_type: typeof b.end_time,
                    bEndISO: bEndISO,
                    bEndISO_type: typeof bEndISO
                });
                throw new Error(`Tarih değerleri string formatında değil: start=${typeof bStartISO}, end=${typeof bEndISO}`);
            }

            let bStart, bEnd;
            try {
                bStart = parseISO(bStartISO);
                bEnd = parseISO(bEndISO);
            } catch (parseError) {
                console.error('[HATA] parseISO hatası:', {
                    error: parseError.message,
                    bStartISO: bStartISO,
                    bEndISO: bEndISO,
                    booking: b
                });
                throw new Error(`Tarih parse hatası: ${parseError.message}`);
            }

            // Slot ile randevu çakışıyor mu kontrol et
            // Slot'lar bağımsız olmalı: Sadece slot başlangıcı randevu başlangıcına eşitse çakışma var
            // Yani: currentTime == bStart ise çakışma var
            // Bu şekilde 10:00'a randevu alınırsa sadece 10:00 slot'u dolu olur, 10:30 slot'u müsait kalır
            
            // Slot başlangıcı randevu başlangıcına eşitse, çakışma var
            if (isEqual(currentTime, bStart)) {
                return true;
            }
            
            // Diğer durumlarda çakışma yok
            return false;
        });

        if (!isBooked) {
            availableSlots.push(format(currentTime, 'HH:mm'));
        }

        // Sonraki zaman dilimine geç (30 dk)
        currentTime = addMinutes(currentTime, SLOT_INTERVAL);
    }

    return availableSlots;
}



// ----------------------------------------------------------
// 2) RANDEVU OLUŞTURMA
// ----------------------------------------------------------
export async function bookAppointment(data) {
    console.log("[SERVICE] Randevu oluşturuluyor:", data);
    const appointment = await createAppointment(data);
    console.log("[SERVICE] Randevu oluşturuldu:", appointment);
    return appointment;
}
