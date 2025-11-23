// server/src/services/notifications.js

const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

// E-posta göndericisini tanımlama
const transporter = nodemailer.createTransport({
    service: 'gmail', // Eğer Gmail kullanılıyorsa
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Kullanıcıya randevu bildirimi gönderir.
 * @param {string} toEmail - Alıcının e-posta adresi.
 * @param {object} appointmentDetails - Randevu detayları.
 */
export async function sendAppointmentConfirmation(toEmail, appointmentDetails) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("[Bildirim] E-posta ayarları eksik. Mail gönderilemedi.");
        return;
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: 'Randevu Onayı | Berber Randevu Sistemi',
        html: `
            <h1>Randevunuz Onaylandı!</h1>
            <p>Değerli müşterimiz, aşağıdaki randevu detaylarınız başarıyla oluşturulmuştur:</p>
            <ul>
                <li>Randevu ID: ${appointmentDetails.id}</li>
                <li>Başlangıç Saati: ${new Date(appointmentDetails.start_time).toLocaleString('tr-TR')}</li>
                <li>Hizmet: Saç Kesimi (Test amaçlı)</li>
                <li>Personel ID: ${appointmentDetails.staff_id}</li>
                <li>Lütfen randevunuzdan 5 dakika önce geliniz.</li>
            </ul>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Bildirim] E-posta gönderildi: ${info.response}`);
    } catch (error) {
        console.error("[Bildirim] E-posta gönderiminde hata oluştu:", error);
    }
}