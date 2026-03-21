const cloudinary = require('cloudinary').v2;
require('dotenv').config();

function getCloudinaryConfig() {
  return {
    cloud_name: process.env.CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.API_KEY || process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.API_SECRET || process.env.CLOUDINARY_API_SECRET,
  };
}

const cloudinaryConfig = getCloudinaryConfig();

cloudinary.config(cloudinaryConfig);

function validateCloudinaryConfig() {
  const missingFields = Object.entries(cloudinaryConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    const error = new Error(
      `Missing Cloudinary configuration: ${missingFields.join(', ')}`
    );
    error.code = 'CLOUDINARY_CONFIG_MISSING';
    throw error;
  }

  if (!/^\d+$/.test(String(cloudinaryConfig.api_key))) {
    const error = new Error(
      'Invalid Cloudinary API key format. Use the numeric API key from your Cloudinary dashboard.'
    );
    error.code = 'CLOUDINARY_CONFIG_INVALID';
    throw error;
  }
}

async function uploadFile(filePath, folder = 'students') {
  validateCloudinaryConfig();

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',
    });

    return result.secure_url;
  } catch (error) {
    if (error?.http_code === 401 || /invalid api_key/i.test(error?.message || '')) {
      const credentialError = new Error(
        'Cloudinary credentials are invalid. Update CLOUD_NAME, API_KEY, and API_SECRET in Server/.env.'
      );
      credentialError.code = 'CLOUDINARY_AUTH_FAILED';
      throw credentialError;
    }

    throw error;
  }
}

module.exports = { uploadFile };
