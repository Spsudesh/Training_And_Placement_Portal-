const path = require('path');
const { db } = require('../config/db');
const { cloudinary, getCloudinaryConfig } = require('../config/storageService');

function query(sql, values = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });
  });
}

function parseCloudinaryAsset(url) {
  const match = String(url || '').match(
    /^https:\/\/res\.cloudinary\.com\/[^/]+\/(image|raw|video)\/upload\/(?:v\d+\/)?([^?]+)$/
  );

  if (!match) {
    return null;
  }

  const resourceType = match[1];
  let publicId = match[2];

  if (resourceType !== 'raw') {
    const extension = path.posix.extname(publicId);
    if (extension) {
      publicId = publicId.slice(0, -extension.length);
    }
  }

  return {
    resourceType,
    publicId,
  };
}

async function collectDocumentUrls() {
  const [educationRows, experienceRows, certificationRows] = await Promise.all([
    query(`
      SELECT tenth_marksheet_url, twelfth_marksheet_url, diploma_marksheet_url, gap_certificate_url
      FROM student_education
    `),
    query(`
      SELECT certificate_url
      FROM student_experience
    `),
    query(`
      SELECT certificate_url
      FROM student_certifications
    `),
  ]);

  return [
    ...educationRows.flatMap((row) => [
      row.tenth_marksheet_url,
      row.twelfth_marksheet_url,
      row.diploma_marksheet_url,
      row.gap_certificate_url,
    ]),
    ...experienceRows.map((row) => row.certificate_url),
    ...certificationRows.map((row) => row.certificate_url),
  ].filter(Boolean);
}

async function updateAccessMode(resourceType, publicIds) {
  if (!publicIds.length) {
    return;
  }

  const chunkSize = 100;

  for (let index = 0; index < publicIds.length; index += chunkSize) {
    const chunk = publicIds.slice(index, index + chunkSize);

    await cloudinary.api.update_resources(chunk, {
      resource_type: resourceType,
      type: 'upload',
      access_mode: 'public',
    });
  }
}

async function main() {
  const config = getCloudinaryConfig();

  if (!config.cloud_name || !config.api_key || !config.api_secret) {
    throw new Error('Missing Cloudinary configuration in Server/.env');
  }

  const urls = await collectDocumentUrls();
  const groupedAssets = {
    image: new Set(),
    raw: new Set(),
  };

  urls.forEach((url) => {
    const asset = parseCloudinaryAsset(url);

    if (!asset) {
      return;
    }

    if (asset.resourceType === 'image' || asset.resourceType === 'raw') {
      groupedAssets[asset.resourceType].add(asset.publicId);
    }
  });

  const imagePublicIds = [...groupedAssets.image];
  const rawPublicIds = [...groupedAssets.raw];

  console.log(`Found ${imagePublicIds.length} image assets and ${rawPublicIds.length} raw assets.`);

  await updateAccessMode('image', imagePublicIds);
  await updateAccessMode('raw', rawPublicIds);

  console.log('Cloudinary document access mode update completed.');
}

main()
  .catch((error) => {
    console.error('Failed to update Cloudinary document access:', error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    db.end();
  });
