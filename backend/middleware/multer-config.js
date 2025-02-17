const multer = require('multer');
const sharp = require('sharp')
const fs = require ('fs')

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

//configuration du stockage avec multer
const storage = multer.diskStorage({        
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(' ').join('_');
    const extension = MIME_TYPES[file.mimetype];
    callback(null, name + Date.now() + '.' + extension);
  }
});

// Ajout de la conversion WebP après l'upload
module.exports = (req, res, next) => {
  if (!req.file) return next();

  const inputPath = req.file.path;
  const outputPath = `images/${req.file.filename.split('.')[0]}.webp`;

  sharp(inputPath)
    .webp({ quality: 80 })
    .toFile(outputPath, (error) => {
      if (error) {
        return res.status(500).json({ error: 'Erreur lors de la conversion de l\'image' });
      }

      // Supprimer l'ancienne image après conversion
      fs.unlink(inputPath, (err) => {
        if (err) console.error('Erreur lors de la suppression de l\'image originale:', err);
      });

      // Mettre à jour le fichier dans la requête pour la base de données
      req.file.filename = outputPath.split('/')[1]; // Met à jour le nom du fichier
      req.file.path = outputPath; // Met à jour le chemin du fichier
      next();
    });
};

module.exports = multer({storage: storage}).single('image');