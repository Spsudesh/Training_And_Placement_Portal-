const cloudinary = require('cloudinary').v2;
const path = require('path');
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

function getResourceType(file) {
  const fileName = String(file?.originalname || file?.path || '').toLowerCase();
  const mimeType = String(file?.mimetype || '').toLowerCase();
  const extension = path.extname(fileName);

  if (
    mimeType === 'application/pdf' ||
    ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt'].includes(extension)
  ) {
    return 'raw';
  }

  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  return 'auto';
}

async function uploadFile(file, folder = 'students') {
  validateCloudinaryConfig();

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: getResourceType(file),
      type: 'upload',
      access_mode: 'public',
      use_filename: true,
      unique_filename: true,
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

module.exports = {
  cloudinary,
  getCloudinaryConfig,
  uploadFile,
};
