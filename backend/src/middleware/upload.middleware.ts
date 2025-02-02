import multer from 'multer';

// Bellek tabanlı depolama kullan
const storage = multer.memoryStorage();

// Dosya yükleme limitleri ve filtreleme
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // İzin verilen dosya tipleri
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Geçersiz dosya tipi. Sadece resim, PDF, Word ve text dosyaları yüklenebilir.'));
    }
  }
});

export default upload; 