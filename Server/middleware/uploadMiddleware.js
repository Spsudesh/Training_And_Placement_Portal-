const multer = require('multer');
const path = require('path');

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const allowedExtensions = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const isAllowedType = allowedMimeTypes.has(file.mimetype);
    const isAllowedExtension = allowedExtensions.has(extension);

    if (!isAllowedType && !isAllowedExtension) {
      const error = new Error(
        'Unsupported file type. Only PDF, images, and office documents are allowed.'
      );
      error.statusCode = 400;
      return cb(error);
    }

    cb(null, true);
  },
});

module.exports = upload;
