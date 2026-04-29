const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

function getEnvValue(name) {
  return String(process.env[name] || '').trim();
}

function loadServiceAccountFromEnv() {
  const rawJson = getEnvValue('FIREBASE_SERVICE_ACCOUNT_JSON');

  if (rawJson) {
    return JSON.parse(rawJson);
  }

  const serviceAccount = {
    type: getEnvValue('FIREBASE_TYPE') || 'service_account',
    project_id: getEnvValue('FIREBASE_PROJECT_ID'),
    private_key_id: getEnvValue('FIREBASE_PRIVATE_KEY_ID'),
    private_key: getEnvValue('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    client_email: getEnvValue('FIREBASE_CLIENT_EMAIL'),
    client_id: getEnvValue('FIREBASE_CLIENT_ID'),
    auth_uri: getEnvValue('FIREBASE_AUTH_URI'),
    token_uri: getEnvValue('FIREBASE_TOKEN_URI'),
    auth_provider_x509_cert_url: getEnvValue('FIREBASE_AUTH_PROVIDER_X509_CERT_URL'),
    client_x509_cert_url: getEnvValue('FIREBASE_CLIENT_X509_CERT_URL'),
    universe_domain: getEnvValue('FIREBASE_UNIVERSE_DOMAIN'),
  };

  const requiredEnvVars = [
    ['FIREBASE_PROJECT_ID', serviceAccount.project_id],
    ['FIREBASE_PRIVATE_KEY', serviceAccount.private_key],
    ['FIREBASE_CLIENT_EMAIL', serviceAccount.client_email],
  ];

  const missingEnvVars = requiredEnvVars
    .filter(([, value]) => !String(value || '').trim())
    .map(([name]) => name);

  if (missingEnvVars.length) {
    throw new Error(
      `Missing Firebase environment variables: ${missingEnvVars.join(', ')}. ` +
        'Add them to Server/.env or set FIREBASE_SERVICE_ACCOUNT_JSON.'
    );
  }

  return serviceAccount;
}

function resolveServiceAccountPath() {
  const envPath = getEnvValue('FIREBASE_SERVICE_ACCOUNT_PATH');

  if (envPath) {
    return path.resolve(__dirname, '..', envPath);
  }

  return '';
}

const serviceAccountPath = resolveServiceAccountPath();
const serviceAccount = serviceAccountPath
  ? (() => {
      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(
          `Firebase service account file not found at "${serviceAccountPath}". ` +
            'Update FIREBASE_SERVICE_ACCOUNT_PATH in Server/.env or use env-based Firebase credentials.'
        );
      }

      return require(serviceAccountPath);
    })()
  : loadServiceAccountFromEnv();

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
    getEnvValue('FIREBASE_STORAGE_BUCKET'),
    getEnvValue('FIREBASE_BUCKET'),
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
