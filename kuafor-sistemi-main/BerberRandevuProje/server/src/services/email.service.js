// server/src/services/email.service.js

import nodemailer from 'nodemailer';

// Email transporter oluştur (Gmail için örnek)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Email doğrulama kodu gönder
export async function sendVerificationEmail(email, verificationCode) {
    // Test modu: EMAIL_USER ayarlanmamışsa veya email gönderilemezse console'a yazdır
    const isTestMode = !process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com';
    
    // Önce kodu her zaman console'a yazdır (test için)
    console.log('\n========================================');
    console.log('📧 EMAIL DOĞRULAMA KODU');
    console.log('========================================');
    console.log(`Email: ${email}`);
    console.log(`Doğrulama Kodu: ${verificationCode}`);
    console.log('========================================\n');

    // Test modundaysa sadece console'a yazdır ve çık
    if (isTestMode) {
        console.log('⚠️  EMAIL SERVİSİ AYARLANMAMIŞ!');
        console.log('Kodu yukarıda görebilirsiniz.');
        console.log('Email göndermek için .env dosyasına EMAIL_USER ve EMAIL_PASS ekleyin.');
        console.log('========================================\n');
        return true;
    }

    // Email göndermeyi dene
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Email Doğrulama Kodu - Berber Randevu Sistemi',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
                    <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
                        <h1 style="color: #667eea; margin-bottom: 20px;">Email Doğrulama</h1>
                        <p style="color: #333; font-size: 16px; margin-bottom: 30px;">
                            Email adresinizi doğrulamak için aşağıdaki kodu kullanın:
                        </p>
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                            ${verificationCode}
                        </div>
                        <p style="color: #666; font-size: 14px; margin-top: 20px;">
                            Bu kod 10 dakika geçerlidir.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ [EMAIL] Doğrulama kodu başarıyla gönderildi: ${email}`);
        return true;
    } catch (error) {
        console.error('❌ [EMAIL HATASI]:', error.message);
        console.log('\n⚠️  EMAIL GÖNDERİLEMEDİ!');
        console.log('Kod yukarıda görüntülenmiştir. Lütfen backend terminalinden kodu kopyalayın.');
        console.log('\n💡 Gmail App Password almak için:');
        console.log('1. Google hesabınıza giriş yapın');
        console.log('2. Güvenlik → 2 Adımlı Doğrulama (açık olmalı)');
        console.log('3. Uygulama şifreleri → Mail seçin → Oluştur');
        console.log('4. Oluşan 16 haneli şifreyi .env dosyasına EMAIL_PASS olarak ekleyin');
        console.log('========================================\n');
        
        // Hata olsa bile kodu gösterdiğimiz için true döndür (kullanıcı console'dan görebilir)
        return true;
    }
}

// Geçici doğrulama kodları saklama (gerçek uygulamada Redis kullanılmalı)
const emailCodes = new Map();
const phoneCodes = new Map();

// Email doğrulama kodu oluştur ve sakla
export function generateEmailCode(email) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    emailCodes.set(email, {
        code,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 dakika
    });
    return code;
}

// Email doğrulama kodu kontrol et
export function verifyEmailCode(email, code) {
    const stored = emailCodes.get(email);
    if (!stored) {
        return false;
    }
    if (Date.now() > stored.expiresAt) {
        emailCodes.delete(email);
        return false;
    }
    if (stored.code !== code) {
        return false;
    }
    emailCodes.delete(email);
    return true;
}

// Telefon doğrulama kodu oluştur ve sakla
export function generatePhoneCode(phone) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    phoneCodes.set(phone, {
        code,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 dakika
    });
    return code;
}

// Telefon doğrulama kodu kontrol et
export function verifyPhoneCode(phone, code) {
    const stored = phoneCodes.get(phone);
    if (!stored) {
        return false;
    }
    if (Date.now() > stored.expiresAt) {
        phoneCodes.delete(phone);
        return false;
    }
    if (stored.code !== code) {
        return false;
    }
    phoneCodes.delete(phone);
    return true;
}

