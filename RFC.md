RFC (Request for Comments)

1. Giriş

Bu RFC, proje yönetim platformunun mimarisi, veri yapısı ve kullanılacak teknolojilere dair geri bildirim almak amacıyla hazırlanmıştır.

2. Teknoloji Seçimi

Frontend: React.js + Next.js + TypeScript + Tailwind CSS

Backend: Node.js (Express.js veya NestJS)

Database: PostgreSQL + Prisma ORM

Authentication: JWT, OAuth (NextAuth.js)

Storage: AWS S3 veya Firebase Storage (dosya yükleme için)

Gerçek Zamanlı: WebSockets (Socket.io)

Önbellekleme: Redis

Job Scheduling: BullMQ (CRON Jobs)

3. API Bitiş Noktaları (Endpoints)

3.1. Kullanıcı İşlemleri

POST /auth/register: Kullanıcı kaydı

POST /auth/login: Kullanıcı girişi

GET /users: Kullanıcı listesini getir

GET /users/{id}: Belirtilen kullanıcıyı getir

3.2. Proje İşlemleri

POST /projects: Yeni proje oluştur

GET /projects: Projeleri listele

GET /projects/{id}: Belirli projeyi getir

DELETE /projects/{id}: Projeyi sil

3.3. Görev İşlemleri

POST /tasks: Yeni görev oluştur

GET /tasks: Görevleri listele

GET /tasks/{id}: Belirli görevi getir

PUT /tasks/{id}: Görevi güncelle

DELETE /tasks/{id}: Görevi sil

3.4. Dashboard

GET /dashboard: Admin için özet verileri getir  