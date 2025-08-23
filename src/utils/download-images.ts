import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const galleryBaseUrl = 'https://gallery.scaneats.app/images/';
const downloadDirectory = path.join(process.cwd(), 'public', 'images', 'gallery');

// List of image files to download
const imageFiles = [
  'ScanEatsLogo.png',
  'ScanEatsLogo_192.png',
  'ScanEatsLogo_512.png',
  'Personal%20Pic.png',
  'ScanFoodNEW.webm',
  'MealPlannerPage.webm',
  'LandingPageSignup&SigninPage.webm',
];

async function downloadImage(imageUrl: string, filePath: string) {
  return new Promise((resolve, reject) => {
    https.get(imageUrl, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download image: Status code: ${res.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(filePath);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve(void 0);
      });

      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => reject(err)); // Delete the file if error occurs
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function ensureDirectoryExists(directory: string) {
  try {
    await fs.promises.mkdir(directory, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

async function downloadAllImages() {
  await ensureDirectoryExists(downloadDirectory);

  for (const imageFile of imageFiles) {
    const imageUrl = galleryBaseUrl + imageFile;
    const filePath = path.join(downloadDirectory, imageFile);

    try {
      await downloadImage(imageUrl, filePath);
      console.log(`Downloaded ${imageFile} to ${filePath}`);
    } catch (err) {
      console.error(`Failed to download ${imageFile}: ${err}`);
    }
  }

  console.log('All images downloaded!');
}

downloadAllImages();