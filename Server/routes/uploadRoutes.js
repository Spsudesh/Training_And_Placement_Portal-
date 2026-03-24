const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const { uploadFile } = require('../config/storageService');

const router = express.Router();

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File is required. Send it as multipart/form-data with field name "file".',
      });
    }

    const uploadedFile = await uploadFile(req.file, 'students');

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully.',
      data: uploadedFile,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
