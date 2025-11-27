require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json()); // Essential for Stripe

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Error:', err));

// 2. Define Database Schema (The Blueprint)
const FileSchema = new mongoose.Schema({
    key: String, // S3 Filename
    size: Number,
    type: String, // image, video, etc.
    url: String,
    isTrash: { type: Boolean, default: false },
    isFavorite: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const FileModel = mongoose.model('File', FileSchema);

// 3. Configure AWS S3
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            cb(null, Date.now().toString() + "-" + file.originalname); // Unique name
        }
    })
});

// --- ROUTES ---

// A. Upload File (Save to S3 + Save Metadata to MongoDB)
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        const newFile = new FileModel({
            key: req.file.key,
            size: req.file.size,
            url: req.file.location,
            type: req.file.mimetype
        });
        await newFile.save();
        res.json({ message: 'Uploaded', file: newFile });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// B. List Files (Fetch from MongoDB instead of raw S3)
app.get('/api/list', async (req, res) => {
    try {
        const files = await FileModel.find().sort({ createdAt: -1 });
        // Format to match frontend expectation
        const items = files.map(f => ({
            Key: f.key,
            Size: f.size,
            LastModified: f.createdAt,
            isTrash: f.isTrash,
            isFavorite: f.isFavorite,
            _id: f._id // MongoDB ID
        }));
        res.json({ items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// C. Toggle Favorite / Trash (Update MongoDB)
app.put('/api/update/:id', async (req, res) => {
    try {
        const { isFavorite, isTrash } = req.body;
        const updateData = {};
        if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
        if (isTrash !== undefined) updateData.isTrash = isTrash;
        
        await FileModel.findByIdAndUpdate(req.params.id, updateData);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// D. Delete Permanently (Delete from S3 + Delete from MongoDB)
app.delete('/api/delete/:id', async (req, res) => {
    try {
        const file = await FileModel.findById(req.params.id);
        if (file) {
            // Delete from AWS
            await s3.send(new DeleteObjectCommand({ 
                Bucket: process.env.S3_BUCKET_NAME, 
                Key: file.key 
            }));
            // Delete from DB
            await FileModel.findByIdAndDelete(req.params.id);
        }
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// E. Stripe Payment Endpoint
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'CloudBox Pro Plan - 50GB' },
                    unit_amount: 900, // $9.00
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}`,
        });
        res.json({ url: session.url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend with Mongo & Stripe running on port ${PORT}`));