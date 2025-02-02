Product Requirements Document (PRD)

1. Proje Adı

Daha sonra belirleyeceğimiz bir isim.

2. Amaç

Bu platform, kullanıcıların proje ve görev yönetimini yapabilmesini sağlamak amacıyla geliştirilecektir. Kullanıcılar, projeler oluşturabilecek, görevler ekleyebilecek ve bunları durumlarına göre takip edebilecektir. Aynı zamanda adminler için bir dashboard olacak ve detaylı filtreleme seçenekleri sunulacaktır.

3. Özellikler

3.1. Görev Yönetimi (Task Management)

Kullanıcılar görev ekleyebilecek.

Görevlere alt görevler (subtasks) eklenebilecek.

Görev durumları:

Başlanmadı

Devam Ediyor

Stuck (Takıldı)

Bitti

Önem derecesi eklenebilecek:

Kritik

Çok Önemli

Önemli

Normal

Görev için bitiş tarihi (due date) eklenebilecek.

Göreve not eklenebilecek.

Göreve dosya yüklenebilecek.

Görevlere kullanıcı atanabilecek.

3.2. Proje Yönetimi (Project Management)

Kullanıcılar yeni projeler oluşturabilecek.

Özel (Private) projeler oluşturulabilecek.

3.3. Dashboard (Sadece Adminler İçin)

Toplam proje ve görev sayısı görüntülenebilecek.

Tamamlanmış ve tamamlanmamış görevlerin sayısı hem yüzde hem sayı olarak gösterilecek.

Kullanıcı bazlı görev dağılımı gösterilecek (kim kaç görev almış).

Zamanı geçmiş görevler görüntülenebilecek.

Tamamlanmış görevler listelenebilecek.

Öncelik sıralı görevler gösterilecek (Örneğin: En kritik ve tamamlanmamış 5 görev).

Görevler detaylı filtreleme seçenekleriyle görüntülenebilecek.

4. Kullanıcı Rolleri

Admin:

Tüm projeleri ve görevleri yönetebilir.

Dashboard’a erişebilir.

Kullanıcıları yönetebilir.

Kullanıcı:

Proje ve görev oluşturabilir.

Kendine atanmış görevleri görebilir.

Riskler ve Çözümler

    Performans: Task sayısı artınca DB sorguları yavaşlayabilir → Pagination veya Redis caching.

    Güvenlik: Private projelere yetkisiz erişim → Middleware’de izin kontrolü.

    Karmaşıklık: Subtask yönetimi → Recursive veri yapısı veya nested tasks.

Sitede yapacağımız her tasarımın modern ve profesyonel olması gerekiyor.
