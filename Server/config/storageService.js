const path = require('path');
const crypto = require('crypto');
const { bucket, storageBucket } = require('./firebase');

function sanitizeFileName(fileName) {
  return String(fileName || 'file')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '');
}

function ensureFile(file) {
  if (!file) {
    const error = new Error('No file received for upload.');
    error.statusCode = 400;
    throw error;
  }

  if (!file.buffer || !file.buffer.length) {
    const error = new Error('Uploaded file is empty.');
    error.statusCode = 400;
    throw error;
  }
}

async function generateSignedUrl(file) {
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: '03-23-2036',
  });

  return url;
}

async function uploadFile(file, folder = 'students') {
  ensureFile(file);

  if (!storageBucket) {
    const error = new Error(
      'Firebase Storage bucket is not configured. Set FIREBASE_STORAGE_BUCKET in Server/.env.'
    );
    error.statusCode = 500;
    throw error;
  }

  const safeFileName = sanitizeFileName(file.originalname);
  const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
  const filePath = `${folder}/${uniqueSuffix}-${safeFileName}`;
  const firebaseFile = bucket.file(filePath);

  await firebaseFile.save(file.buffer, {
    metadata: {
      contentType: file.mimetype || 'application/octet-stream',
    },
    resumable: false,
    validation: 'md5',
  });

  const signedUrl = await generateSignedUrl(firebaseFile);

  return {
    fileName: safeFileName,
    filePath,
    contentType: file.mimetype || 'application/octet-stream',
    bucket: storageBucket,
    url: signedUrl,
  };
}

module.exports = {
  uploadFile,
};
