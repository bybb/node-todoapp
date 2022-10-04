const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret : '비밀코드', resave : true, saveUninitialized : false}));
app.use(passport.initialize());
app.use(passport.session());

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

app.get('/list', function(req, res){
    db.collection('post').find().toArray(function(err, result){
        res.render('list.ejs', { posts : result });
    });
});

app.get('/detail/:id', function(req, res){
    db.collection('post').findOne({ _id : parseInt(req.params.id) }, function(err, result){
        console.log(result);
        res.render('detail.ejs', { data : result });
    });
});

app.get('/edit/:id', function(req, res){
    db.collection('post').findOne({ _id : parseInt(req.params.id) }, function(err, result){
        console.log(result);
        res.render('edit.ejs', { post : result });
    });
});

app.put('/edit', function(req, res){
    db.collection('post').updateOne({ _id : parseInt(req.body.id) }, { $set : { title : req.body.title, date : req.body.date }}, function(err, result){
        console.log('수정완료');
        res.redirect('/list');
    });
});

app.get('/login', function(req, res){
    res.render('login.ejs');
});

app.post('/login', passport.authenticate('local', {failureRedirect : '/fail'}), function(req, res){
    res.redirect('/');
});

app.get('/mypage', isLogin, function(req, res){
    res.render('mypage.ejs', { user : req.user });
});

app.get('/search', (req, res) => {
    var search = [
        {
            $search : {
                index : 'titleSearch',
                text : {
                    query : req.query.value,
                    path : ['title']
                }
            },        
        },
        { $sort : { _id : 1 } },
        { $limit : 10 },
        { $project : { title : 1, _id : 0, score : { $meta : 'searchScore' } } }
    ]

    db.collection('post').aggregate(search).toArray((err, result) => {
        result = result ? result : [];
        res.render('search.ejs', { posts : result });
    });
});

function isLogin(req, res, next){
    if (req.user) {
        next();
    } else {
        res.send('로그인안하셨는데요?');
    }
}

passport.use(new LocalStrategy({
    usernameField : 'id',
    passwordField : 'pw',
    session : true,
    passReqToCallback : false
}, function (id, pw, done) {
    db.collection('login').findOne({id : id}, function (err, result) {
        if (err) return done(err);
        if (!result) return done(null, false, {message : '존재하지 않는 아이딥니다.'});
        if (pw == result.pw) {
            return done(null, result);
        } else {
            return done(null, false, {message : '비번틀렸어요'});
        }
    });
}));

passport.serializeUser(function(user, done){
    done(null, user.id);
});

passport.deserializeUser(function(id, done){
    db.collection('login').findOne({id : id}, function(err, result){
        done(null, result);
    });
});

app.post('/register', (req, res) => {
    db.collection('login').insertOne({ id : req.body.id, pw : req.body.pw }, function(err, result){
        res.redirect('/');
    });
});

app.post('/add', function(req, res){
    db.collection('counter').findOne({ name : '게시물갯수' }, function(err, result){
        var totalCnt = result.totalPost;
        var saveData = { _id : totalCnt + 1, title : req.body.title, date : req.body.date, writer : req.user._id };
        db.collection('post').insertOne(saveData, function(err, result){
            db.collection('counter').updateOne({ name : '게시물갯수' }, { $inc : { totalPost : 1 } }, function(err, result){
                if(err) return console.log(err);
                res.send('저장완료');
            });
        });
    });
});

app.delete('/delete', function(req, res){
    req.body._id = parseInt(req.body._id);
    var removeData = { _id : req.body._id, writer : req.user._id };
    
    db.collection('post').deleteOne(removeData, function(err, result){
        console.log('삭제완료');
        res.status(200).send({ message : '성공했습니다' });
    });
});

app.use('/shop', require('./routes/shop.js'));
app.use('/board/sub', require('./routes/board.js'));

app.get('/upload', (req, res) => {
    res.render('upload.ejs');
});

let multer = require('multer');
var storage = multer.diskStorage({
    destination : function(req, file, cb){
        cb(null, './public/image');
    },
    filename : function(req, file, cb){
        cb(null, file.originalname);
    },
    filefilter : function(req, file, cb){

    },
    limits : function(req, file, cb){

    }
});

var upload = multer({ storage : storage });

app.post('/upload', upload.single('profile'), (req, res) => {
    res.send('업로드완료');
});

app.get('/image/:imageName', (req, res) => {
    res.sendFile(__dirname + '/public/image/' + req.params.imageName);
});