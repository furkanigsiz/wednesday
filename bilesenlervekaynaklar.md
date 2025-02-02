Gerekli Bileşenler ve Kaynaklar

1. Kimlik Doğrulama

JWT tabanlı authentication

OAuth ile Google girişi (opsiyonel)

2. Yetkilendirme

RBAC (Role-Based Access Control) kullanılacak

Admin ve kullanıcı rolleri olacak

3. Database Tasarımı

Users

id

name

email

password

role

1

Ali

ali@mail.com

hashed_pw

admin

Projects

id

name

owner_id

is_private

1

Proje A

1

true

Tasks

id

name

project_id

assigned_to

status

priority

due_date

1

Görev 1

1

2

Başlanmadı

Kritik

2025-02-15