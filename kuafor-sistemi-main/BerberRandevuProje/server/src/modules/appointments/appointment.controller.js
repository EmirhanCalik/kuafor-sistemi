// server/src/modules/appointments/appointment.controller.js

import express from 'express';
import * as appointmentService from './appointment.service.js'; 
import authMiddleware from '../../middleware/auth.middleware.js';

const router = express.Router();

// ------------------------------------------------------------------
// 1. Müsaitlik Rotası (Auth gerekmez)
// ------------------------------------------------------------------
router.get('/availability', async (req, res) => {
    try {
        const { staffId, date, serviceId } = req.query;

        if (!staffId || !date || !serviceId) {
            return res.status(400).json({ message: 'staffId, date ve serviceId gereklidir.' });
        }
        
        const availability = await appointmentService.calculateAvailability(
            Number(staffId), date, Number(serviceId)
        );

        res.status(200).json({ slots: availability });

    } catch (error) {
        console.error("[AVAILABILITY HATASI]:", error.message);
        res.status(500).json({ 
            message: 'Müsaitlik hesaplanırken bir hata oluştu.',
            details: error.message
        });
    }
});


// ------------------------------------------------------------------
// 2. RANDEVU OLUŞTURMA (AUTH ZORUNLU)
// ------------------------------------------------------------------
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;   // ← TOKEN'DAN GELEN USER ID
        
        const { staffId, serviceId, salonId, startTime, endTime } = req.body;

        console.log("[RANDEVU OLUŞTURMA İSTEĞİ]", {
            userId,
            staffId,
            serviceId,
            salonId,
            startTime,
            endTime
        });

        if (!userId || !staffId || !serviceId || !salonId || !startTime || !endTime) {
            return res.status(400).json({ message: 'Tüm randevu alanları gereklidir.' });
        }

        const newAppointment = await appointmentService.bookAppointment({
            userId, 
            staffId, 
            serviceId,
            salonId,
            startTime, 
            endTime
        });

        console.log("[RANDEVU OLUŞTURULDU]", newAppointment);

        res.status(201).json({
            message: 'Randevunuz başarıyla oluşturuldu.',
            appointment: newAppointment
        });

    } catch (error) {
        console.error("[RANDEVU OLUŞTURMA HATASI]:", error);
        res.status(500).json({ message: error.message || 'Randevu oluşturulurken hata oluştu.' });
    }
});

export default router;
