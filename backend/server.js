// server.js (diagnostic version)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

console.log('Starting server.js --- NODE', process.version);

try {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const upload = multer({ storage: multer.memoryStorage() });

  // Show what environment variables we have (non-sensitive)
  console.log('AWS_REGION=', process.env.AWS_REGION || '(not set)');
  console.log('S3_BUCKET=', process.env.S3_BUCKET || '(not set)');

  const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });

  const BUCKET = process.env.S3_BUCKET;

  // Upload file
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'no file' });
      const key = Date.now() + "-" + req.file.originalname;
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      }));
      res.json({ key });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'upload failed' });
    }
  });

  // List files
  app.get('/api/list', async (req, res) => {
    try {
      const data = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET }));
      res.json({ items: data.Contents || [] });
    } catch (err) {
      console.error('List error:', err);
      res.status(500).json({ error: 'list failed' });
    }
  });

  // Download
  app.get('/api/download', async (req, res) => {
    try {
      const key = req.query.key;
      if (!key) return res.status(400).json({ error: 'missing key' });
      const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
      const url = await getSignedUrl(s3, cmd, { expiresIn: 300 });
      res.json({ url });
    } catch (err) {
      console.error('Download error:', err);
      res.status(500).json({ error: 'download failed' });
    }
  });

  // Delete
  app.delete('/api/delete', async (req, res) => {
    try {
      const key = req.query.key;
      if (!key) return res.status(400).json({ error: 'missing key' });
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      res.json({ ok: true });
    } catch (err) {
      console.error('Delete error:', err);
      res.status(500).json({ error: 'delete failed' });
    }
  });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Backend running on ${PORT}`));
} catch (errOuter) {
  console.error('Fatal startup error:', errOuter);
  process.exit(1);
}
