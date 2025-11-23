// server/src/modules/users/user.controller.js

import express from 'express';
import { 
    registerUser, 
    loginUser, 
    sendEmailVerificationCode, 
    sendPhoneVerificationCode,
    verifyEmail,
    verifyPhone
} from './user.service.js';
const router = express.Router();

// ------------------------------------------------------------------
// Kayıt Rotası: POST /api/users/register
// ------------------------------------------------------------------
router.post('/register', async (req, res) => {
    try {
        const { name, surname, email, phone_number, password } = req.body;
        
        if (!name || !password) {
            return res.status(400).json({ message: 'Ad ve şifre zorunludur.' });
        }
        if (!email) {
            return res.status(400).json({ message: 'Email adresi zorunludur.' });
        }
        if (password.length < 6) {
             return res.status(400).json({ message: 'Şifre en az 6 karakter olmalıdır.' });
        }

        const newUser = await registerUser(name, surname, email, phone_number, password);

        // Kayıt sonrası email varsa doğrulama kodu gönder
        if (email) {
            try {
                await sendEmailVerificationCode(email);
                console.log(`[KAYIT] Email doğrulama kodu gönderildi: ${email}`);
            } catch (emailError) {
                console.error('[EMAIL GÖNDERME HATASI]:', emailError.message);
                // Email gönderilemese bile kayıt başarılı, kullanıcı doğrulama ekranına geçebilir
                // Kod console'da görünecek (test modu)
            }
        }

        res.status(201).json({ 
            message: email ? 'Kayıt başarılı! Email adresinize doğrulama kodu gönderildi.' : 'Kayıt başarılı!',
            user: newUser
        });

    } catch (error) {
        // Mükerrer Kayıt Hatası (409 Conflict)
        res.status(409).json({ message: error.message || 'Kayıt işlemi sırasında bir hata oluştu.' });
    }
});

// ------------------------------------------------------------------
// Giriş Rotası: POST /api/users/login
// ------------------------------------------------------------------
router.post('/login', async (req, res) => {
    try {
        const { emailOrPhone, password } = req.body;
        
        if (!emailOrPhone || !password) {
            return res.status(400).json({ message: 'Email/telefon numarası ve şifre zorunludur.' });
        }

        const { token, user } = await loginUser(emailOrPhone, password);

        res.status(200).json({ 
            message: 'Giriş başarılı.',
            token,
            user 
        });

    } catch (error) {
        // HATA AYIKLAMA (DEBUGGING) SATIRI
        console.error("[KRİTİK LOGIN HATASI]:", error.message); 
        // Kimlik doğrulama başarısız (401 Unauthorized)
        res.status(401).json({ message: error.message || 'Kimlik doğrulama başarısız.' });
    }
});

// Email doğrulama kodu gönderme
router.post('/send-email-verification', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email zorunludur.' });
        }
        
        await sendEmailVerificationCode(email);
        res.status(200).json({ message: 'Email doğrulama kodu gönderildi.' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Telefon doğrulama kodu gönderme
router.post('/send-phone-verification', async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ message: 'Telefon numarası zorunludur.' });
        }
        
        await sendPhoneVerificationCode(phone);
        res.status(200).json({ message: 'SMS doğrulama kodu gönderildi.' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Email doğrulama
router.post('/verify-email', async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ message: 'Email ve kod zorunludur.' });
        }
        
        const user = await verifyEmail(email, code);
        res.status(200).json({ message: 'Email başarıyla doğrulandı.', user });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Telefon doğrulama
router.post('/verify-phone', async (req, res) => {
    try {
        const { phone, code } = req.body;
        if (!phone || !code) {
            return res.status(400).json({ message: 'Telefon numarası ve kod zorunludur.' });
        }
        
        const user = await verifyPhone(phone, code);
        res.status(200).json({ message: 'Telefon numarası başarıyla doğrulandı.', user });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// Test rotası
router.get('/test', (req, res) => {
    res.send('User Controller Rota Testi Başarılı!');
});


export default router;