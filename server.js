var mongodb = require('mongodb');
var express = require('express');
var bodyParser = require('body-parser');
var multer  = require('multer');
//var upload = multer({ dest: 'Public/images' });
var fs = require('fs');
var mongoose = require('mongoose');
var Grid = require('gridfs-stream');
var app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static(__dirname + '/Public'));

var picname = "";

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'Public/images');
    },
    filename: function (req, file, cb) {
        picname = Date.now() + '-' + file.originalname;
        cb(null, picname);
    }
});

var upload = multer({ storage: storage });

//Setting ejs module
app.set('view engine', 'ejs');

//MongoClient object
var MongoClient = mongodb.MongoClient;

// Connection URL
//var url = 'mongodb://localhost:27017/DartyDataBase';

var url = "mongodb://OlivierMedec:123456789@ds163677.mlab.com:63677/dartydatabase";
//To check The database : https://mlab.com/

app.listen(process.env.PORT, function() {});

//app.listen(3000, function () {});

//Connexion to the server
MongoClient.connect(url, function (err, db) {
    if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
    } else { //Début else
        console.log('Connection established to', url);

        // Get collection
        var Product = db.collection('Product');
        var Categorie = db.collection('Categorie');
        var SousCategorie = db.collection('SousCategorie');
        var Files = db.collection('fs.files');

        Grid.mongo = mongoose.mongo;
        var gfs = new Grid(db);

        //Db collection modifyer
        function ModifyDocument(req, res, Collection, redirection) {
            var o_id = new mongodb.ObjectID(req.body.id);
            if (req.file != undefined) {
                req.body.image = req.file.filename;
                uploadSingleImage(req);
            }
            else if (req.files != undefined){
                req.body.image = req.files;
                uploadMultipleImage(req);
            }
            Collection.update({_id: o_id}, {
                $set: req.body,
                $currentDate: { lastModified: true }
            });
            res.redirect(redirection);
        }

        //Db collection getter
        function getCollection(Collection, res) {
            Collection.find().toArray(function (err, results) {
                var collection = {results: results};
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify(collection));
            });
        }

        //Db collection saver
        function saveDocument(req, res, Collection, redirection) {
            if (req.file !== undefined) {
                console.log("Picname :: ", picname);
                req.body.image = picname;
            }

            if (req.files !== undefined) {
                console.log("Picname :: ", picname);
                req.body.image = req.files;
            }
            Collection.save(req.body, function (err, result) {
                if (err) return console.log(err);
                console.log(req.body);
                console.log('saved to database');
                res.redirect(redirection);
                uploadToDb(req);
            });
        }

        //Db collection remover
        function removeDocument(req, res, Collection, redirection) {
            var o_id = new mongodb.ObjectID(req.body.id);
            Collection.find({_id: o_id}).toArray(function(err, obj){
                Collection.remove({_id: o_id}, function(err, result) {
                    console.log('Object ' , req.body , ' deleted from database');
                    res.redirect(redirection);
                });

                Files.remove({filename: obj[0].image}, function(err, result) {
                    if (err) return console.log(err);
                    console.log('Object ' , obj[0].image , ' deleted from database');
                });
            });
        }

        function uploadSingleImage(req){
            console.log(dirname);
            var dirname = __dirname;
            console.log("Upload single file : ", req.file);
            var path = req.file.path;

            var read_stream =  fs.createReadStream(dirname + '/' + path);

            var writestream = gfs.createWriteStream({
                filename: picname
            });
            read_stream.pipe(writestream);
        }

        function uploadMultipleImage(req){
            console.log(dirname);
            var dirname = __dirname;
            console.log("Upload multiple files : ", req.files);

            for (var i = 0; i < req.files.length; i++) {
                var path = req.files[i].path;

                var read_stream =  fs.createReadStream(dirname + '/' + path);

                var writestream = gfs.createWriteStream({
                    filename: req.files[i].filename
                });
                read_stream.pipe(writestream);
            }
        }

        //File uploader in db
        function uploadToDb(req) {
            if (req.file !== undefined) {
                uploadSingleImage(req);
            }

            if (req.files !== undefined) {
                uploadMultipleImage(req);
            }
        }

        //Getter of images
        app.get('/images/:id',function (req, res) {
            var pic_id = req.params.id;
            console.log("req.params: ", req.params);

            Files.find({filename: pic_id}).toArray(function (err, files) {

                if (err) {
                    res.json(err);
                }
                if (files.length > 0) {
                    var mime = 'image/jpeg';
                    res.set('Content-Type', mime);
                    var read_stream = gfs.createReadStream({filename: pic_id});
                    read_stream.pipe(res);
                } else {
                    res.json('File Not Found');
                }
            });
        });

        // ----------------- Partie site ------------------------------

        // ----------------- Operations on product collection ---------
        //Home of application
        app.get('/', function(req, res) {
            SousCategorie.find({}).toArray(function(err, sousCategories) {
                Product.find().sort({ nom: 1 }).toArray(function(err, products) {
                    //console.log("List of products", results);
                    res.render('index.ejs', {products: products, sousCategories: sousCategories, side_bar: 1});
                });
            });
        });

        //Formulaire to modify a product
        app.post('/modifySetProductSite', function(req, res){
            var o_id = new mongodb.ObjectID(req.body.id);
            SousCategorie.find({}).sort( { sousCategorie: 1 } ).toArray(function(err, resuslt) {
                Product.find({_id: o_id}).toArray(function(err, results) {
                    if (err) return console.log(err);
                    console.log("Document to modify :", results);
                    res.render('modifyProduct.ejs', {product: results, sousCategorie: resuslt, side_bar: 1});
                });
            });
        });

        //Modify a product
        /*app.post('/modifyProductSite', upload.array('image', 4), function (req, res, next){
            console.log("Object to update", req.body);
            ModifyDocument(req, res, Product, '/');
        });

        //Add a product
        app.post('/addProductSite', upload.array('image', 4), function (req, res, next) {
            console.log("File added:", req.files);
            saveDocument(req, res, Product, '/');
        });*/

        app.post('/modifyProductSite', upload.single('image'), function (req, res, next){
            console.log("Object to update", req.body);
            ModifyDocument(req, res, Product, '/');
        });

        //Add a product
        app.post('/addProductSite', upload.single('image'), function (req, res, next) {
            console.log("File added:", req.files);
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
                //console.log("Collection Categorie: ", resuslt);
                res.render('getCategorie.ejs', {categories: resuslt, side_bar: 2});
            });
        });

        //Add a catégorie
        app.post('/addCategorieSite', upload.single('image'), function (req, res, next) {
            console.log("req file :: ", req.file);
            saveDocument(req, res, Categorie, '/getCategorieSite');
        });

        //Formulaire to modify a categorie
        app.post('/ModifyCategorieSetSite', function(req, res) {
            var o_id = new mongodb.ObjectID(req.body.id);
            Categorie.find({_id: o_id}).toArray(function(err, results) {
                if (err) return console.log(err);
                //console.log("Document to modify :", results);
                res.render('modifyCategorie.ejs', {categorie: results, side_bar: 2});
            });
        });

        //Modify a category
        app.post('/modifyCategorieSite', upload.single('image'), function (req, res, next) {
            ModifyDocument(req, res, Categorie, '/getCategorieSite');
        });

        //Delete a categorie
        app.post('/deleteCategorieSite', function(req, res) {
            //console.log("Object to delete", req.body);
            removeDocument(req, res, Categorie, '/getCategorieSite');
        });


        // ----------------- Operations on sous catégorie collection --

        //Get list of sous catgorie
        app.get('/getSousCategorieSite', function(req, res) {
            Categorie.find({}).toArray(function(err, categories){
                console.log("Categorie des sous categories :", categories);
                SousCategorie.find({}).toArray(function(err, result) {
                    if (err) return console.log(err);
                    console.log("Collection Sous categorie Categorie: ", result);
                    res.render('getSousCategorie.ejs', {sousCategories: result, categories: categories, side_bar: 3});
                });
            });
        });

        //Formulaire to modify a sous categorie
        app.post('/ModifySousCategorieSetSite', function(req, res) {
            var o_id = new mongodb.ObjectID(req.body.id);
            Categorie.find({}).toArray(function(err, categories){
                SousCategorie.find({_id: o_id}).toArray(function(err, results) {
                    if (err) return console.log(err);
                    //console.log("Document to modify :", results);
                    res.render('modifySousCategorie.ejs', {sousCategories: results, categories: categories, side_bar: 3});
                });
            });
        });

        //Add a sous catégorie
        app.post('/addSousCategorieSite', upload.single('image'), function (req, res, next) {
            saveDocument(req, res, SousCategorie, '/getSousCategorieSite');
        });

        //Modify a sub category
        app.post('/modifySousCategorieSite', upload.single('image'), function (req, res, next) {
            console.log("modifySousCategorieSite ", req.body)
            ModifyDocument(req, res, SousCategorie, '/getSousCategorieSite');
        });

        //Delete a sub categorie
        app.post('/deleteSousCategorieSite', function(req, res) {
            //console.log("Object to delete", req.body);
            removeDocument(req, res, SousCategorie, '/getSousCategorieSite');
        });

        // ----------------- Partie API -------------------------------

        //Get list of products
        app.get('/getProducts', function(req, res) {
            getCollection(Product, res);
        });

        //Get list of products by sub category
        app.get('/getProductsBySubCat/:subCat', function(req, res) {
            Product.find({sousCategorie: req.params.subCat}).toArray(function(err, result) {
                console.log(result);
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify({results: result}));
            });
        });

        //Get product by id
        app.get('/getProduct/:id', function(req, res) {
            var o_id = new mongodb.ObjectID(req.params.id);
            Product.findOne({_id: o_id}, function(err, document) {
                //console.log(JSON.stringify(document));
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify({result: document}));
            });
        });

        //Get list of category
        app.get('/getCategories', function(req, res) {
            getCollection(Categorie, res);
        });

        //Get category by id
        app.get('/getCategorie/:id', function(req, res) {
            var o_id = new mongodb.ObjectID(req.params.id);
            Categorie.findOne({_id: o_id}, function(err, document) {
                console.log(JSON.stringify(document));
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify(document));
            });
        });

        //Get list of sub category
        app.get('/getSousCategories', function(req, res) {
            getCollection(SousCategorie, res);
        });

        //Get sub catgories by id category
        app.get('/getSousCategorie/:idCat', function(req, res) {
            var o_id = new mongodb.ObjectID(req.params.idCat);
            SousCategorie.find({categorie: req.params.idCat}).toArray(function(err, document) {
                console.log(JSON.stringify(document));
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify({results: document}));
            });
        });

    } // Fin else
});
