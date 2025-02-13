const Book = require('../models/book');
const fs = require('fs');

const mongoose = require('mongoose');

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;
  const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });

  book.save()
  .then(() => { res.status(201).json({message: 'Livre enregistré !'})})
  .catch(error => { res.status(400).json( { error })})
};

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file ? {
      ...JSON.parse(req.body.book),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };

  delete bookObject._userId;
  Book.findOne({_id: req.params.id})
      .then((book) => {
          if (book.userId != req.auth.userId) {
              res.status(401).json({ message : 'Not authorized'});
          } else {
              Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
              .then(() => res.status(200).json({message : 'Livre modifié!'}))
              .catch(error => res.status(401).json({ error }));
          }
      })
      .catch((error) => {
          res.status(400).json({ error });
      });
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id})
      .then(book => {
          if (book.userId != req.auth.userId) {
              res.status(401).json({message: 'Not authorized'});
          } else {
              const filename = book.imageUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, () => {
                  Book.deleteOne({_id: req.params.id})
                      .then(() => { res.status(200).json({message: 'Livre supprimé !'})})
                      .catch(error => res.status(401).json({ error }));
              });
          }
      })
      .catch( error => {
          res.status(500).json({ error });
      });
};

exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
      .then(book => res.status(200).json(book))
      .catch(error => res.status(404).json({ error }));
  };

exports.getAllBooks = (req, res, next) => {
    Book.find()
      .then(books => res.status(200).json(books))
      .catch(error => res.status(400).json({ error }));
  };

exports.getBestRating = (req, res, next) => {
    Book.find()
      .sort({ averageRating: -1 }) // tri décroissant
      .limit(3) // les 3 premiers livres les mieux notés
      .then((books) => {
        res.status(200).json(books);
      })
      .catch(error => {
        res.status(400).json({ error });
      });
};

exports.addRating = (req, res, next) => {

  const bookId = req.params.id; // récupération des données envoyée dans la requête
  const userId = req.auth.userId;
  const grade = req.body.rating;

  if (!grade || grade < 0 || grade > 5) {
    return res.status(400).json({ message: 'La note doit être entre 0 et 5.' }); // vérification de la note
  }

  Book.findOne({ _id: bookId }) // recherche du livre par id
    .then(book => {

      book.ratings.push({ userId, grade });

      const totalRatings = book.ratings.length; // calcul de la nouvelle note moyenne
      const sumRatings = book.ratings.reduce((sum, rating) => sum + rating.grade, 0); // reduce additionne toutes les notes existantes
      book.averageRating = parseFloat((sumRatings / totalRatings).toFixed(1)); // arrondi à 1 chiffre après la virgule

      book.save() // sauvegarde du livre mis à jour
        .then(() => res.status(201).json(book))
        .catch(error => { res.status(400).json({ error }) })
    })
    .catch(error => {
      console.error('DEBUG Error:', error);
      res.status(500).json({ error });
    });

}
