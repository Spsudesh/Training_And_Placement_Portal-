const path = require('path');
const admin = require('firebase-admin');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const serviceAccountPath = path.join(
  __dirname,
  'employee-gamification-1421c-firebase-adminsdk-fbsvc-32926c20fd.json'
);

const serviceAccount = require(serviceAccountPath);

function normalizeStorageBucket(bucketValue) {
  if (!bucketValue) {
    return '';
  }

  const trimmedValue = String(bucketValue).trim();

  if (!trimmedValue) {
    return '';
  }

  if (/^gs:\/\//i.test(trimmedValue)) {
    return trimmedValue
      .replace(/^gs:\/\//i, '')
      .replace(/^\/+/, '')
      .split('/')[0]
      .trim();
  }

  const firebaseApiBucketMatch = trimmedValue.match(
    /^https?:\/\/firebasestorage\.googleapis\.com\/v0\/b\/([^/]+)\/o/i
  );

  if (firebaseApiBucketMatch) {
    return firebaseApiBucketMatch[1].trim();
  }

  const googleStorageBucketMatch = trimmedValue.match(
    /^https?:\/\/storage\.googleapis\.com\/([^/]+)/i
  );

  if (googleStorageBucketMatch) {
    return googleStorageBucketMatch[1].trim();
  }

  return trimmedValue.replace(/^\/+/, '').split('/')[0].trim();
}

function resolveStorageBucket() {
  const bucketCandidates = [
    process.env.FIREBASE_STORAGE_BUCKET,
    process.env.FIREBASE_BUCKET,
    `${serviceAccount.project_id}.firebasestorage.app`,
    `${serviceAccount.project_id}.appspot.com`,
    serviceAccount.project_id,
  ];

  for (const candidate of bucketCandidates) {
    const normalizedBucket = normalizeStorageBucket(candidate);

    if (normalizedBucket) {
      return normalizedBucket;
    }
  }

  return '';
}

const storageBucket = resolveStorageBucket();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket,
  });
}

module.exports = {
  admin,
  bucket: admin.storage().bucket(),
  storageBucket,
  serviceAccountPath,
};
