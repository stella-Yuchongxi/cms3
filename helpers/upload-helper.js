const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// 配置 Cloudinary
cloudinary.config({
    cloud_name: 'dvyvvrqka', // 从 Cloudinary 控制台获取
    api_key: '822968111912741',
    api_secret: 'yqg9PaDJ8OgvkjQOUxs690QIZ3Y'
});

// 配置 multer 和 Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'uploads', // 存储文件的文件夹名
        allowed_formats: ['jpg', 'png', 'gif'], // 允许的文件类型
        public_id: (req, file) => Date.now() + '-' + file.originalname // 自定义文件名
    }
});

const upload = multer({ storage: storage });

module.exports = upload;
