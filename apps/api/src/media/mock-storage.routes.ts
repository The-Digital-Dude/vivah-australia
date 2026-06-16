import fs from 'fs';
import path from 'path';
import { Router, type Request, type Response } from 'express';

export function createMockStorageRouter(): Router {
  const router = Router();
  const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

  // Ensure uploads directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // Mock GCS PUT upload
  router.put('/*', (req: Request, res: Response) => {
    const storageKey = req.params[0];
    if (!storageKey) {
      res.status(400).send('Missing storage key');
      return;
    }

    const filePath = path.join(UPLOADS_DIR, storageKey);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const writeStream = fs.createWriteStream(filePath);
    req.pipe(writeStream);

    req.on('end', () => {
      res.status(200).send();
    });

    req.on('error', (err) => {
      console.error('Upload error:', err);
      res.status(500).send('Upload failed');
    });
  });

  // Serve static files for GET
  router.get('/*', (req: Request, res: Response) => {
    const storageKey = req.params[0];
    if (!storageKey) {
      res.status(400).send('Missing storage key');
      return;
    }

    const filePath = path.join(UPLOADS_DIR, storageKey);
    if (!fs.existsSync(filePath)) {
      res.status(404).send('Not found');
      return;
    }

    res.sendFile(filePath);
  });

  return router;
}
