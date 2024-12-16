const path = require('path');
const fs = require('fs');
const ensureUploadDirExists = (uploadPath) => {
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }
};

// 在文件上传处理前调用
const uploadPath = path.join(__dirname, '../../public/uploads');
ensureUploadDirExists(uploadPath);
