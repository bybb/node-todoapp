const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));

var db;
MongoClient.connect('mongodb+srv://ai9gle:4fkdgo@cluster0.b5db193.mongodb.net/todoapp?retryWrites=true&w=majority', { useUnifiedTopology: true }, function (err, client){
    if (err) return console.log(err);
    db = client.db('todoapp');

    app.listen(8080, function(){
        console.log('listening 8080');
    });
});

app.get('/', function(req, res){
    res.render('index.ejs');
});

app.get('/write', function(req, res){
    res.render('write.ejs');
});

app.post('/add', function(req, res){
    db.collection('counter').findOne({ name : '게시물갯수' }, function(err, result){
        var totalCnt = result.totalPost;
        db.collection('post').insertOne({ _id : totalCnt + 1, title : req.body.title, date : req.body.date }, function(err, result){
            db.collection('counter').updateOne({ name : '게시물갯수' }, { $inc : { totalPost : 1 } }, function(err, result){
                if(err) return console.log(err);
                res.send('저장완료');
            });
        });
    });
});

app.get('/list', function(req, res){
    db.collection('post').find().toArray(function(err, result){
        res.render('list.ejs', { posts : result });
    });
});

app.delete('/delete', function(req, res){
    req.body._id = parseInt(req.body._id);
    db.collection('post').deleteOne(req.body, function(err, result){
        console.log('삭제완료');
        res.status(200).send({ message : '성공했습니다' });
    });
});

app.get('/detail/:id', function(req, res){
    db.collection('post').findOne({ _id : parseInt(req.params.id) }, function(err, result){
        console.log(result);
        res.render('detail.ejs', { data : result });
    });
});