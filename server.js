var mongodb = require('mongodb');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({extended: true}));

//Setting ejs module
app.set('view engine', 'ejs');

//MongoClient object
var MongoClient = mongodb.MongoClient;

// Connection URL
var url = 'mongodb://localhost:27017/DartyDataBase';

//var url = "mongodb://OlivierMedec:123456789@ds163677.mlab.com:63677/dartydatabase";
//To check The database : https://mlab.com/

function ModifyDocument(req, res, Collection, redirection) {
  var o_id = new mongodb.ObjectID(req.body.id);
  Collection.update({_id: o_id}, {
    $set: req.body,
    $currentDate: { lastModified: true }
  });
  res.redirect(redirection);
}

function saveDocument(req, res, Collection, redirection) {
  Collection.save(req.body, function(err, result) {
      if (err) return console.log(err);

      console.log(req.body);
      console.log('saved to database');
      res.redirect(redirection);
  });
}

function removeDocument(req, res, Collection, redirection) {
  var o_id = new mongodb.ObjectID(req.body.id);
    Collection.remove({_id: o_id}, function(err, result) {
      console.log('Object ' + req.body.id + ' deleted from database');
      res.redirect(redirection);
    });
}

function getCollection(Collection, res) {
  Collection.find().toArray(function(err, results) {
    res.writeHead(200, {"Content-Type": "application/json"});
    res.end(JSON.stringify(results));
  });
}

//Connexion to the server
MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else { //Début else
    console.log('Connection established to', url);

    // Get collection
    var Product = db.collection('Product');
    var Categorie = db.collection('Categorie');

    app.listen(3000, function() {
  	  //console.log('listening on 3000');
  	});

    // ----------------- Partie site ------------------------------

    // ----------------- Operations on product collection ---------
    //Home of application
  	app.get('/', function(req, res) {
      var cursor = Product.find().toArray(function(err, results) {
          console.log("List of products", results);
          res.render('index.ejs', {products: results});
      });
    });

    //Formulaire to modify a product
    app.post('/modifySetProductSite', function(req, res){
      var o_id = new mongodb.ObjectID(req.body.id);
      Product.find({_id: o_id}).toArray(function(err, results) {
        if (err) return console.log(err);
        console.log("Document to modify :", results);
        res.render('modifyProduct.ejs', {product: results});
      });
    });

    //Modify a product
    app.post('/modifyProductSite', function(req, res){
      console.log("Object to update", req.body);
      ModifyDocument(req, res, Product, '/');
    });

    //Add a product
  	app.post('/addProductSite', function(req, res) {
  	   saveDocument(req, res, Product, '/');
  	});

    //Delete a product
    app.post('/deleteProductSite', function(req, res) {
      console.log("Object to delete", req.body);
      removeDocument(req, res, Product, '/');
    });

    // -----------------Operations on Categorie collection --------

    //Get list of catgorie
    app.get('/getCategorieSite', function(req, res) {
      Categorie.find({}).toArray(function(err, resuslt) {
        if (err) return console.log(err);
        console.log("Collection Categorie: ", resuslt);
        res.render('getCategorie.ejs', {categories: resuslt});
      });
    });

    //Add a catégorie
    app.post('/addCategorieSite', function(req, res) {
      saveDocument(req, res, Categorie, '/getCategorieSite');
    });

    //Formulaire to modify a categorie
    app.post('/ModifyCategorieSetSite', function(req, res) {
      var o_id = new mongodb.ObjectID(req.body.id);
      Categorie.find({_id: o_id}).toArray(function(err, results) {
        if (err) return console.log(err);
        console.log("Document to modify :", results);
        res.render('modifyCategorie.ejs', {categorie: results});
      });
    });

    //Modify a category
    app.post('/modifyCategorieSite', function(req, res) {
      ModifyDocument(req, res, Categorie, '/getCategorieSite');
    });

    //Delete a categorie
    app.post('/deleteCategorieSite', function(req, res) {
      console.log("Object to delete", req.body);
      removeDocument(req, res, Categorie, '/getCategorieSite');
    });

    // ----------------- Partie API -------------------------------

    //Get list of products
    app.get('/getProducts', function(req, res) {
      getCollection(Product, res);
    });

    //Get product by id
     app.get('/getProduct', function(req, res) {
      var o_id = new mongodb.ObjectID("5838b47a68546040400835a4");
      Product.findOne({_id: o_id}, function(err, document) {
        console.log(JSON.stringify(document));
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify(document));
      });
    });

    //Get list of category
    app.get('/getCategories', function(req, res) {
      getCollection(Categorie, res);
    });

    //Get product by id
     app.get('/getCategorie', function(req, res) {
      var o_id = new mongodb.ObjectID("5838b47a68546040400835a4");
      Categorie.findOne({_id: o_id}, function(err, document) {
        console.log(JSON.stringify(document));
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify(document));
      });
    });

  } // Fin else
});