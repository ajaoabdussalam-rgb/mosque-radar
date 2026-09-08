const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadImage } = require('../controllers/uploadController');

// Support either single file ('image') or multiple files ('images', max 5)
const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 5 }
]);

const handleUpload = (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err) {
      return next(err);
    }

    // Normalize for the controller
    if (req.files && req.files.image && req.files.image[0]) {
      req.file = req.files.image[0];
    }
    if (req.files && req.files.images) {
      req.files = req.files.images;
    } else if (req.file) {
      req.files = [req.file];
    }

    uploadImage(req, res);
  });
};

router.post('/', handleUpload);

module.exports = router;
