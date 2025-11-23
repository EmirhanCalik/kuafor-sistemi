// client/pages/index.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import { addMinutes, format, parseISO, setHours, setMinutes } from "date-fns";

const API_BASE_URL = "http://localhost:5000/api";

// -------------------------------------------------
// Giriş / Kayıt Ekranı
// -------------------------------------------------
const App = () => {
  const [view, setView] = useState("login");
  const [step, setStep] = useState("form"); // form, verify-email, verify-phone
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [verificationCode, setVerificationCode] = useState(""); // Backend'den gelen kod
  const [token, setToken] = useState(null);
  const [message, setMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      // Email zorunlu kontrolü
      if (!email) {
        throw new Error("Kayıt için email adresi zorunludur.");
      }

      const response = await fetch(API_BASE_URL + "/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          surname,
          email: email,
          phone_number: phone || null,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Bir hata oluştu.");
      }

      // Kayıt başarılı, email doğrulama ekranına geç
      // Backend console'unda kodu görebilirsiniz (test modu)
      setMessage("✅ Kayıt başarılı! Email adresinize gönderilen 6 haneli kodu girin. (Email servisi ayarlanmamışsa backend terminal/console'unda kodu görebilirsiniz)");
      setStep("verify-email");
      
      // Backend console'unda kodu görmek için log
      console.log("📧 Email doğrulama kodu backend terminal/console'unda görünecektir.");
    } catch (err) {
      setMessage("HATA: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(API_BASE_URL + "/users/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: emailCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Doğrulama başarısız.");
      }

      // Email doğrulandı, kayıt tamamlandı
      setMessage("✅ Email doğrulandı! Kayıt başarıyla tamamlandı.");
      
      // 2 saniye bekle ve login ekranına geç
      setTimeout(() => {
        setView("login");
        setStep("form");
        setEmail("");
        setPhone("");
        setPassword("");
        setName("");
        setSurname("");
        setEmailCode("");
        setMessage("🎉 Kayıt tamamlandı! Giriş yapabilirsiniz.");
      }, 2000);
    } catch (err) {
      setMessage("HATA: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhone = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(API_BASE_URL + "/users/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: phoneCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Doğrulama başarısız.");
      }

      setMessage("Telefon doğrulandı!");
      setView("login");
      setStep("form");
      setMessage("Kayıt tamamlandı! Giriş yapabilirsiniz.");
    } catch (err) {
      setMessage("HATA: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(API_BASE_URL + "/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrPhone: email || phone,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Bir hata oluştu.");
      }

      setToken(data.token);
      setIsAuthenticated(true);
      setMessage("Giriş başarılı.");
    } catch (err) {
      setMessage("HATA: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated && token) {
    return <AppointmentScheduler token={token} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
         style={{
           background: "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)",
           backgroundSize: "400% 400%",
           animation: "gradient 15s ease infinite"
         }}>
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .float-animation {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
      
      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 float-animation"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 float-animation" style={{animationDelay: "2s"}}></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 float-animation" style={{animationDelay: "4s"}}></div>
      </div>

      <div className="relative bg-white/90 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20 transform transition-all duration-300 hover:scale-105">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
            ✂️ Berber Randevu
          </h1>
          <p className="text-gray-600 text-sm">Modern Randevu Sistemi</p>
        </div>

        {message && (
          <div
            className={`p-4 mb-6 rounded-2xl transform transition-all duration-300 ${
              message.startsWith("HATA")
                ? "bg-red-50 border-2 border-red-200 text-red-700"
                : "bg-green-50 border-2 border-green-200 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

        {view === "login" && step === "form" && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email veya Telefon
              </label>
              <input
                type="text"
                placeholder="email@example.com veya 5559999999"
                value={email || phone}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.includes("@")) {
                    setEmail(value);
                    setPhone("");
                  } else {
                    setPhone(value);
                    setEmail("");
                  }
                }}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Şifre
              </label>
              <input
                type="password"
                placeholder="Şifrenizi girin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white p-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Giriş yapılıyor..." : "🚀 Giriş Yap"}
            </button>
          </form>
        )}

        {view === "register" && step === "form" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ad</label>
                <input
                  type="text"
                  placeholder="Adınız"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Soyad</label>
                <input
                  type="text"
                  placeholder="Soyadınız"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Telefon</label>
              <input
                type="tel"
                placeholder="5559999999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Şifre</label>
              <input
                type="password"
                placeholder="En az 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 outline-none"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white p-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Kaydediliyor..." : "✨ Kayıt Ol"}
            </button>
          </form>
        )}

        {step === "verify-email" && (
          <form onSubmit={handleVerifyEmail} className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-5xl mb-4">📧</div>
              <h3 className="text-xl font-bold text-gray-800">Email Doğrulama</h3>
              <p className="text-gray-600 text-sm mt-2">
                <strong>{email}</strong> adresine gönderilen 6 haneli kodu girin
              </p>
            </div>
            <input
              type="text"
              placeholder="000000"
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 outline-none text-center text-2xl tracking-widest font-bold"
              required
            />
            <button
              type="submit"
              disabled={loading || emailCode.length !== 6}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Doğrulanıyor..." : "✅ Doğrula ve Kaydı Tamamla"}
            </button>
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                setMessage("");
                try {
                  const response = await fetch(API_BASE_URL + "/users/send-email-verification", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                  });
                  if (response.ok) {
                    setMessage("✅ Yeni kod gönderildi! Email'inizi kontrol edin.");
                  } else {
                    throw new Error("Kod gönderilemedi.");
                  }
                } catch (err) {
                  setMessage("HATA: " + err.message);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full text-purple-600 font-semibold hover:text-purple-800 transition-colors duration-300 disabled:opacity-50"
            >
              🔄 Kodu Tekrar Gönder
            </button>
          </form>
        )}

        {step === "verify-phone" && (
          <form onSubmit={handleVerifyPhone} className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-5xl mb-4">📱</div>
              <h3 className="text-xl font-bold text-gray-800">Telefon Doğrulama</h3>
              <p className="text-gray-600 text-sm mt-2">{phone} numarasına gönderilen SMS kodunu girin</p>
            </div>
            <input
              type="text"
              placeholder="6 haneli kod"
              value={phoneCode}
              onChange={(e) => setPhoneCode(e.target.value)}
              maxLength={6}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 outline-none text-center text-2xl tracking-widest"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Doğrulanıyor..." : "✅ Doğrula"}
            </button>
          </form>
        )}

        <button
          onClick={() => {
            setView(view === "login" ? "register" : "login");
            setStep("form");
            setMessage("");
            setEmail("");
            setPhone("");
            setPassword("");
            setName("");
            setSurname("");
          }}
          className="w-full mt-6 text-center text-purple-600 font-semibold hover:text-purple-800 transition-colors duration-300"
        >
          {view === "login"
            ? "💫 Hesabınız yok mu? Kayıt olun"
            : "🔙 Zaten hesabım var. Giriş yap"}
        </button>
      </div>
    </div>
  );
};

// -------------------------------------------------
// Randevu Ekranı
// -------------------------------------------------
const AppointmentScheduler = ({ token }) => {
  const today = format(new Date(), "yyyy-MM-dd");

  const [staffId, setStaffId] = useState("2");
  const [serviceId, setServiceId] = useState("2");
  const [date, setDate] = useState(today);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const fetchAvailability = useCallback(async () => {
    // Randevu oluşturma sırasında loading state'ini değiştirme
    if (!isSubmittingRef.current) {
      setLoading(true);
    }
    setAvailableSlots([]);
    if (!isSubmittingRef.current) {
      setBookingMessage("");
    }

    try {
      const dateString = String(date);

      const res = await fetch(
        `${API_BASE_URL}/appointments/availability?staffId=${staffId}&date=${dateString}&serviceId=${serviceId}`
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Müsaitlik hatası");

      setAvailableSlots(data.slots || []);
    } catch (err) {
      if (!isSubmittingRef.current) {
        setBookingMessage("Müsaitlik Hatası: " + err.message);
      }
    } finally {
      if (!isSubmittingRef.current) {
        setLoading(false);
      }
    }
  }, [date, staffId, serviceId]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // -------------------------------------------------
  // RANDEVU OLUŞTUR
  // -------------------------------------------------
  const handleBook = useCallback(async () => {
    // Çift tıklamayı önle - useRef ile anında kontrol
    if (isSubmittingRef.current) {
      console.log("Randevu oluşturma zaten devam ediyor, iptal edildi");
      return;
    }

    if (!selectedSlot) {
      setBookingMessage("Saat seçmelisiniz.");
      return;
    }

    // Slot'u hemen kaydet ve temizle (çift kullanımı önlemek için)
    const slotToBook = selectedSlot;
    setSelectedSlot(null);
    
    // Flag'i set et
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setLoading(true);
    setBookingMessage("");

    try {
      const [hour, minute] = slotToBook.split(":").map(Number);

      const startTimeDate = setMinutes(setHours(parseISO(date), hour), minute);
      const endTimeDate = addMinutes(startTimeDate, 45);

      const body = {
        staffId: Number(staffId),
        serviceId: Number(serviceId),
        salonId: 1,
        startTime: startTimeDate.toISOString(),
        endTime: endTimeDate.toISOString(),
      };

      console.log("Randevu oluşturuluyor:", body);

      const res = await fetch(`${API_BASE_URL}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Randevu hatası");

      console.log("Randevu başarıyla oluşturuldu:", data);

      setBookingMessage(
        "✅ Randevu oluşturuldu: " +
          format(startTimeDate, "dd/MM HH:mm")
      );
      
      // Müsaitlik listesini güncelle
      await fetchAvailability();
    } catch (err) {
      console.error("Randevu oluşturma hatası:", err);
      setBookingMessage("HATA: " + err.message);
      // Hata durumunda slot'u geri yükle
      setSelectedSlot(slotToBook);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  }, [selectedSlot, date, staffId, serviceId, token, fetchAvailability]);

  // -------------------------------------------------

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold text-indigo-800 mb-4">
        Randevu Al
      </h1>

      <p className="text-sm text-gray-500 mb-3">
        Token: {token.substring(0, 15)}...
      </p>

      <div className="bg-indigo-50 p-6 rounded-xl shadow-inner w-full max-w-lg mb-6">
        {bookingMessage && (
          <div
            className={`p-3 mb-4 rounded-xl ${
              bookingMessage.startsWith("HATA")
                ? "bg-red-200 text-red-800"
                : "bg-green-200 text-green-800"
            }`}
          >
            {bookingMessage}
          </div>
        )}

        <label className="block mb-3">
          <span className="text-sm">Tarih</span>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(String(e.target.value))}
            className="w-full p-2 border rounded-lg"
          />
        </label>
      </div>

      <h3 className="text-xl font-semibold mb-4">
        Müsait Saatler ({availableSlots.length})
      </h3>

      {loading ? (
        <div>Saatler yükleniyor...</div>
      ) : availableSlots.length ? (
        <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
          {availableSlots.map((slot) => (
            <button
              key={slot}
              onClick={() => setSelectedSlot(slot)}
              className={`p-2 rounded-xl ${
                slot === selectedSlot
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      ) : (
        <div>Müsait saat yok.</div>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleBook();
        }}
        disabled={!selectedSlot || loading || isSubmitting}
        className="w-full max-w-lg mt-6 bg-green-600 text-white p-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading || isSubmitting ? "Oluşturuluyor..." : "Randevuyu Onayla"}
      </button>
    </div>
  );
};

export default App;
