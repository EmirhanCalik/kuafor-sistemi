// server/src/modules/users/user.service.js

import argon2 from 'argon2'; 
import jwt from 'jsonwebtoken'; 
import { saveUserToDB, findUserByPhoneNumber, findUserByEmail, findUserByEmailOrPhone, updateUserVerification } from './user.model.js';
import { sendVerificationEmail, generateEmailCode, verifyEmailCode, generatePhoneCode, verifyPhoneCode } from '../../services/email.service.js';
import { sendVerificationSMS } from '../../services/sms.service.js'; 

const JWT_SECRET = process.env.JWT_SECRET; 

// --- Şifre Karşılaştırma (ARGON2) ---
export async function comparePasswords(inputPassword, userHash) {
    // Normalde bu fonksiyon çalışmalıydı, ancak debug amacıyla değiştirildi.
    return argon2.verify(userHash, inputPassword); 
}

// --- Kullanıcı Kayıt Servisi ---
export async function registerUser(name, surname, email, phone_number, password) {
    // Email kontrolü
    if (email) {
        const existingEmail = await findUserByEmail(email);
        if (existingEmail) {
            throw new Error('Bu email adresi zaten sistemimizde kayıtlıdır.');
        }
    }
    
    // Telefon kontrolü
    if (phone_number) {
        const existingPhone = await findUserByPhoneNumber(phone_number);
        if (existingPhone) {
            throw new Error('Bu telefon numarası zaten sistemimizde kayıtlıdır.');
        }
    }

    if (!email && !phone_number) {
        throw new Error('Email veya telefon numarası zorunludur.');
    }

    const password_hash = await argon2.hash(password); 
    
    const userData = {
        name,
        surname,
        email,
        phone_number,
        password_hash,
        email_verified: false,
        phone_verified: false,
    };

    const newUser = await saveUserToDB(userData);

    return { 
        id: newUser.id, 
        name: newUser.name,
        surname: newUser.surname,
        email: newUser.email, 
        phone_number: newUser.phone_number,
        email_verified: newUser.email_verified,
        phone_verified: newUser.phone_verified
    };
}

// --- Email Doğrulama Kodu Gönderme ---
export async function sendEmailVerificationCode(email) {
    const user = await findUserByEmail(email);
    if (!user) {
        throw new Error('Bu email adresi sistemimizde kayıtlı değildir.');
    }
    
    const code = generateEmailCode(email);
    await sendVerificationEmail(email, code);
    
    return { message: 'Email doğrulama kodu gönderildi.' };
}

// --- Telefon Doğrulama Kodu Gönderme ---
export async function sendPhoneVerificationCode(phone) {
    const user = await findUserByPhoneNumber(phone);
    if (!user) {
        throw new Error('Bu telefon numarası sistemimizde kayıtlı değildir.');
    }
    
    const code = generatePhoneCode(phone);
    await sendVerificationSMS(phone, code);
    
    return { message: 'SMS doğrulama kodu gönderildi.' };
}

// --- Email Doğrulama ---
export async function verifyEmail(userId, code) {
    const user = await findUserByEmail(userId); // userId aslında email olacak
    if (!user) {
        throw new Error('Kullanıcı bulunamadı.');
    }
    
    if (!verifyEmailCode(user.email, code)) {
        throw new Error('Geçersiz veya süresi dolmuş doğrulama kodu.');
    }
    
    const updatedUser = await updateUserVerification(user.id, 'email_verified', true);
    return updatedUser;
}

// --- Telefon Doğrulama ---
export async function verifyPhone(userId, code) {
    const user = await findUserByPhoneNumber(userId); // userId aslında phone olacak
    if (!user) {
        throw new Error('Kullanıcı bulunamadı.');
    }
    
    if (!verifyPhoneCode(user.phone_number, code)) {
        throw new Error('Geçersiz veya süresi dolmuş doğrulama kodu.');
    }
    
    const updatedUser = await updateUserVerification(user.id, 'phone_verified', true);
    return updatedUser;
}


// --- GİRİŞ VE JWT SERVİSİ (Email veya Telefon ile) ---
export async function loginUser(emailOrPhone, password) {
    
    const user = await findUserByEmailOrPhone(emailOrPhone);
    
    if (!user) {
        throw new Error('Geçersiz email/telefon numarası veya şifre.');
    }
    
    // Şifre kontrolü
    const passwordMatch = await comparePasswords(password, user.password_hash);

    if (!passwordMatch) {
        throw new Error('Geçersiz email/telefon numarası veya şifre.');
    }
    
    // JWT (JSON Web Token) Oluştur
    const token = jwt.sign(
        { userId: user.id, email: user.email, phone: user.phone_number }, 
        JWT_SECRET, 
        { expiresIn: '7d' } // Token 7 gün geçerli
    );
    
    return { 
        token, 
        user: { 
            id: user.id, 
            name: user.name,
            surname: user.surname,
            email: user.email,
            phone_number: user.phone_number
        } 
    };
}