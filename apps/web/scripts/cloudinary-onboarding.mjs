/* eslint-env node */
#!/usr/bin/env node

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'YOUR_CLOUD_NAME', // <- replace this
  api_key: 'YOUR_API_KEY', // <- replace this
  api_secret: 'YOUR_API_SECRET', // <- replace this
});

const sampleImageUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';

async function main() {
  const uploadResult = await cloudinary.uploader.upload(sampleImageUrl, {
    folder: 'onboarding',
    resource_type: 'image',
  });

  console.log(`Secure URL: ${uploadResult.secure_url}`);
  console.log(`Public ID: ${uploadResult.public_id}`);

  const details = await cloudinary.api.resource(uploadResult.public_id, {
    resource_type: 'image',
  });

  console.log(`Width: ${details.width}`);
  console.log(`Height: ${details.height}`);
  console.log(`Format: ${details.format}`);
  console.log(`File size (bytes): ${details.bytes}`);

  const transformedUrl = cloudinary.url(uploadResult.public_id, {
    secure: true,
    transformation: [
      {
        fetch_format: 'auto', // f_auto chooses the best format for the viewer/browser automatically.
        quality: 'auto', // q_auto picks a good quality/compression balance automatically.
      },
    ],
  });

  console.log('Done! Click link below to see optimized version of the image. Check the size and the format.');
  console.log(`Transformed URL: ${transformedUrl}`);
}

main().catch((error) => {
  console.error('Cloudinary onboarding script failed.');
  console.error(error);
  process.exit(1);
});
