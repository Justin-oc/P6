const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config')
const bookCtrl = require('../controllers/book');


router.get('/', auth, bookCtrl.getAllBooks);
router.get('/bestrating', bookCtrl.getBestRating);
router.post('/:id/rating', auth, bookCtrl.addRating);
router.post('/', auth, multer, bookCtrl.createBook);
router.get('/:id', auth, bookCtrl.getOneBook);
router.put('/:id', auth, multer, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);

module.exports = router;