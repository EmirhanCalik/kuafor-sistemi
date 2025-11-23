// server/src/services/sms.service.js

// SMS doğrulama kodu gönder (gerçek uygulamada Twilio gibi bir servis kullanılmalı)
export async function sendVerificationSMS(phone, verificationCode) {
    try {
        // TODO: Gerçek SMS servisi entegrasyonu (Twilio, AWS SNS, vb.)
        // Şimdilik console'a yazdırıyoruz
        console.log(`[SMS] Doğrulama kodu gönderildi: ${phone}`);
        console.log(`[SMS] Kod: ${verificationCode}`);
        
        // Gerçek SMS gönderme kodu buraya eklenecek
        // Örnek Twilio:
        // const client = require('twilio')(accountSid, authToken);
        // await client.messages.create({
        //     body: `Doğrulama kodunuz: ${verificationCode}`,
        //     from: '+1234567890',
        //     to: phone
        // });
        
        return true;
    } catch (error) {
        console.error('[SMS HATASI]:', error);
        throw new Error('SMS gönderilemedi: ' + error.message);
    }
}

