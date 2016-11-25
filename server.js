//lets require/import the mongodb native drivers.
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
//var url = 'mongodb://localhost:27017/DartyDataBase';

var url = "mongodb://OlivierMedec:123456789@ds163677.mlab.com:63677/dartydatabase";
//Tocheck The database

//Connexion to the server
MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    console.log('Connection established to', url);

    // // Get collection
    var collection = db.collection('Product');

    app.listen(3000, function() {
	  //console.log('listening on 3000');
	});

	app.get('/', function(req, res) {
	  //res.send('Hello World');
      //res.sendFile(__dirname + '/Test/formAddProductTest.html');
      var cursor = collection.find().toArray(function(err, results) {
          console.log(results);
          res.render('index.ejs', {quotes: results});
          // send HTML file populated with quotes here
        });
    });

	app.post('/addProduct', function(req, res) {
	 collection.save(req.body, function(err, result) {
        if (err) return console.log(err);

        console.log(req.body);
        console.log('saved to database');
        res.redirect('/');
      });
	});
  }
});