# Wednesday - Modern İş Yönetim Platformu

![Wednesday Logo](frontend/public/logo192.png)

Wednesday, işletmelerin müşteri ilişkileri, proje yönetimi, finansal operasyonlar ve iş süreçlerini tek bir platformda yönetmelerini sağlayan modern bir iş yönetim çözümüdür.

## 🚀 Özellikler

### 💼 CRM (Müşteri İlişkileri Yönetimi)
- Müşteri bilgi yönetimi
- Müşteri etkileşim takibi
- Fatura ve ödeme yönetimi
- Müşteri paylaşımı ve yetkilendirme
- Finansal raporlama

### 📊 Proje Yönetimi
- Görev oluşturma ve atama
- Alt görev yönetimi
- Proje takibi
- Dosya yönetimi
- İlerleme raporları

### 💰 Finansal Yönetim
- Fatura oluşturma
- Ödeme takibi
- Vadesi geçmiş ödemeler
- Tahsilat yönetimi
- Finansal özet ve raporlar

### 👥 Kullanıcı Yönetimi
- Rol tabanlı yetkilendirme
- Kullanıcı paylaşımı
- Aktivite logları
- Güvenli oturum yönetimi

## 🛠 Teknoloji Yığını

### Backend
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication

### Frontend
- React.js
- TypeScript
- Material-UI (MUI)
- Context API
- React Router
- Axios

## 🚀 Kurulum

### Gereksinimler
- Node.js (v14+)
- PostgreSQL
- npm veya yarn

### Backend Kurulumu
```bash
cd backend
npm install
cp .env.example .env  # .env dosyasını düzenleyin
npx prisma migrate dev
npm run dev
```

### Frontend Kurulumu
```bash
cd frontend
npm install
cp .env.example .env  # .env dosyasını düzenleyin
npm start
```

## 📚 API Dokümantasyonu

API endpoint'leri ve kullanımları hakkında detaylı bilgi için [API.md](backend/API.md) dosyasını inceleyebilirsiniz.

## 🔒 Güvenlik

- JWT tabanlı kimlik doğrulama
- Rol tabanlı yetkilendirme
- Şifrelenmiş veri iletişimi
- Güvenli oturum yönetimi

## 🤝 Katkıda Bulunma

1. Bu depoyu fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Bir Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasını inceleyebilirsiniz.

## 📞 İletişim

Furkan İğsiz - [@furkanigsiz](https://www.linkedin.com/in/furkan-i%C4%9Fsiz-2b0467254/)

Proje Linki: [https://github.com/furkanigsiz/wednesday](https://github.com/furkanigsiz/wednesday)

## 🙏 Teşekkürler

- [Material-UI](https://mui.com/)
- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [Prisma](https://www.prisma.io/)
- Ve diğer tüm açık kaynak projeleri...