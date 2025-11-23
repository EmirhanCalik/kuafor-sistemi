// server/src/middleware/auth.middleware.js

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export default (req, res, next) => {
    // 1. Header'dan Token'ı Çek
    // Token genellikle "Bearer <token_string>" formatında gelir.
    const authHeader = req.headers.authorization; 

    if (!authHeader) {
        return res.status(401).json({ message: 'Yetkilendirme tokeni bulunamadı.' });
    }

    const token = authHeader.split(' ')[1]; // "Bearer" kısmını atla

    try {
        // 2. Token'ı Doğrula ve Çözümle
        const decoded = jwt.verify(token, JWT_SECRET);

        // 3. Kullanıcı ID'sini isteğe ekle (Sonraki rotalar kullanacak)
        // userId artık req.user.id olarak erişilebilir.
        req.user = { id: decoded.userId, phone: decoded.phone }; 
        
        // 4. Sonraki Middleware veya Controller'a geç
        next();

    } catch (error) {
        // Token geçersizse, süresi dolmuşsa vb.
        console.error("JWT doğrulama hatası:", error.message);
        return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token.' });
    }
};