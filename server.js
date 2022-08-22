const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');

var db;
MongoClient.connect('mongodb+srv://ai9gle:4fkdgo@cluster0.b5db193.mongodb.net/todoapp?retryWrites=true&w=majority', { useUnifiedTopology: true }, function (err, client){
    if (err) return console.log(err);
    db = client.db('todoapp');

    app.listen(8080, function(){
        console.log('listening 8080');
    });
});

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.get('/write', function(req, res){
    res.sendFile(__dirname + '/write.html');
});

app.post('/add', function(req, res){
    db.collection('post').insertOne({ title: req.body.title, date: req.body.date }, function(err, result){
        console.log('저장완료');
    });
});

app.get('/list', function(req, res){
    res.render('list.ejs');
});