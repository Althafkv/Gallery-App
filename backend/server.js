const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const streamifier = require("streamifier");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    return {
      folder: "uploads",
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
      transformation: [{ width: 1000, height: 1000, crop: "limit" }],
      public_id: Date.now() + '-' + Math.round(Math.random() * 1e9) // Ensure unique public_id
    };
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://Althafkv:Althafkv123@cluster0.1h0tmcp.mongodb.net/images?retryWrites=true&w=majority&appName=Cluster0";

// MongoDB connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Image Schema - Updated for Cloudinary
const imageSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  mimetype: String,
  size: Number,
  path: String, // This will now store Cloudinary URL
  public_id: String, // Cloudinary public ID
  uploadDate: {
    type: Date,
    default: Date.now,
  },
});

const Image = mongoose.model("Image", imageSchema);

// Routes

// Upload multiple images
app.post("/api/upload", upload.array("images", 10), async (req, res) => {
  try {
    const imagePromises = req.files.map((file) => {
      const newImage = new Image({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path, // Cloudinary URL
        public_id: file.public_id, // Use file.public_id instead of file.filename
      });
      return newImage.save();
    });

    const savedImages = await Promise.all(imagePromises);
    res.status(201).json({
      message: "Images uploaded successfully",
      images: savedImages,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload images" });
  }
});

// Get all images
app.get("/api/images", async (req, res) => {
  try {
    const images = await Image.find().sort({ uploadDate: -1 });
    const imagesWithUrl = images.map((image) => ({
      ...image.toObject(),
      url: image.path, // Already contains Cloudinary URL
    }));
    res.json(imagesWithUrl);
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Failed to fetch images" });
  }
});

// Download image by ID - Now redirects to Cloudinary URL
app.get("/api/download/:id", async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Redirect to Cloudinary URL
    res.redirect(image.path);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Failed to download image" });
  }
});

// Alternative download route by filename
app.get("/api/download/file/:filename", async (req, res) => {
  try {
    const image = await Image.findOne({ filename: req.params.filename });
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Redirect to Cloudinary URL
    res.redirect(image.path);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Failed to download image" });
  }
});

// Delete image - Now deletes from both Cloudinary and MongoDB
app.delete("/api/images/:id", async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    let publicId = image.public_id;
    
    // If public_id doesn't exist in DB, try to extract it from the URL
    if (!publicId && image.path) {
      const urlParts = image.path.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      publicId = publicIdWithExtension.split('.')[0];
    }

    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error("Cloudinary deletion error:", cloudinaryError);
      }
    }

    // Delete from database
    await Image.findByIdAndDelete(req.params.id);

    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete image" });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large" });
    }
  }
  res.status(500).json({ error: error.message });
});

app.get('/',(req,res)=>{
  res.send({
    activeStatus:true,
    error:false
  })
})

app.listen(PORT, () => {
  console.log(`Server running on porttttt ${PORT}`);
});