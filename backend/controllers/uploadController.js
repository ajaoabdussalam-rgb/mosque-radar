/**
 * @desc    Upload image(s) for a mosque
 * @route   POST /api/upload
 * @access  Public
 */
const uploadImage = (req, res) => {
  const files = req.files && req.files.length > 0 ? req.files : (req.file ? [req.file] : []);

  if (files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No image file uploaded. Please provide an image file under field name "image" or "images".'
    });
  }

  const urls = files.map((f) => `/uploads/${f.filename}`);

  return res.status(201).json({
    success: true,
    count: urls.length,
    url: urls[0],
    urls: urls,
    file: {
      filename: files[0].filename,
      url: urls[0],
      size: files[0].size,
      mimetype: files[0].mimetype
    },
    files: files.map((f, i) => ({
      filename: f.filename,
      url: urls[i],
      size: f.size,
      mimetype: f.mimetype
    }))
  });
};

module.exports = {
  uploadImage
};
