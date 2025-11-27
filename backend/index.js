require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const app = express();

// Enable CORS so your frontend (localhost:5173) can communicate with this backend
app.use(cors()); 

// 1. Configure AWS S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// 2. Configure Upload Strategy (Multer + S3)
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE, // Automatically detect file type (png, pdf, etc.)
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            // Use the original file name for storage
            cb(null, file.originalname); 
        }
    })
});

// --- ROUTES ---

// Upload Route
app.post('/api/upload', upload.single('file'), (req, res) => {
    // If we reach here, Multer-S3 has already uploaded the file to AWS
    res.json({ 
        message: 'File uploaded successfully', 
        location: req.file.location 
    });
});

// List Files Route
app.get('/api/list', async (req, res) => {
    try {
        const command = new ListObjectsV2Command({ Bucket: process.env.S3_BUCKET_NAME });
        const data = await s3.send(command);
        
        // Transform AWS data into a cleaner format for our frontend
        const items = (data.Contents || []).map(item => ({
            Key: item.Key,
            Size: item.Size,
            LastModified: item.LastModified
        }));
        
        res.json({ items });
    } catch (error) {
        console.error("Error listing files:", error);
        res.status(500).json({ error: 'Failed to list files' });
    }
});

// Delete Route
app.delete('/api/delete', async (req, res) => {
    const fileKey = req.query.key;
    if (!fileKey) return res.status(400).json({ error: "Missing file key" });

    try {
        const command = new DeleteObjectCommand({ 
            Bucket: process.env.S3_BUCKET_NAME, 
            Key: fileKey 
        });
        await s3.send(command);
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error("Error deleting file:", error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));