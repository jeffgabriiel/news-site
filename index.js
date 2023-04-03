const express = require('express');

const mongoose = require('mongoose');

const bodyParser = require("body-parser");

const path = require('path');

const app = express();

const Posts = require('./Posts.js'); // DB

const fileupload = require('express-fileupload');

const fs = require('fs');

// ----------- DataBase ----------- 
mongoose.connect('mongodb+srv://root:IggMv0g0qAKh3Oqa@cluster0.igiwpog.mongodb.net/news-site?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true}).then(function(){
    console.log('conectado com sucesso');
}).catch(function(err){
    console.log(err.message)
});
// -------------------------------

app.use(bodyParser.json());             // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({       // to support URL-encoded bodies
    extended: true
}));

// ----------- upload de arquivos -----------
app.use(fileupload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, 'temp')
}));
// ------------------------------------------

// ----------- conectando com os arquivos /public -----------
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, '/views')); // arquivos /views
// -----------------------------------------------------------

app.listen(5000,() => {
    console.log("servindo");
});

app.get('/', (req, res) => {
    if(req.query.busca == null){ // não estiver buscando
        Posts.find({}).sort({'_id': -1}).exec(function(err, posts){

            posts = posts.map(function(val){
                return {
                    title: val.title,
                    image: val.image,           
                    categotia: val.categotia,  //dados do mongoDB
                    conteudo: val.conteudo,
                    slug: val.slug,
                    views: val.views,
                    descricaoCurta: val.conteudo.substring(0,100), //dados adicionais
                }
            })

            Posts.find({}).sort({'views': -1}).limit(3).exec(function(err,postsTop){ //reinderizar a Home com os posts contados
                 postsTop = postsTop.map(function(val){ 
                    return {
                        title: val.title,
                        conteudo: val.conteudo,
                        descricaoCurta: val.conteudo.substring(0,100),
                        image: val.image,
                        slug: val.slug,
                        categoria: val.categoria,
                        views: val.views
                    }
                 });
                 res.render('home',{posts:posts,postsTop:postsTop});
             })
        })
        
    }else{
        Posts.find({title: {$regex: req.query.busca, $options:"i"}}, function(err, posts){ // busca pelo input no header
            //console.log(posts)
            posts = posts.map(function(val){ 
                return {
                    title: val.title,
                    conteudo: val.conteudo,
                    descricaoCurta: val.conteudo.substring(0,100),
                    image: val.image,
                    slug: val.slug,
                    categoria: val.categoria,
                    views: val.views
                }
             });
            res.render('busca', {posts:posts, contagem:posts.length});
        });
    }
});

app.get('/:slug', (req,res) => {
    Posts.findOneAndUpdate(
        {slug: req.params.slug},
        {$inc: {views: 1}},
        {new: true},
        function(err, resposta){
            if(resposta != null){
                Posts.find({}).sort({'views': -1}).limit(3).exec(function(err,postsTop){ //reinderizar a Home com os posts contados
                     postsTop = postsTop.map(function(val){ 
                        return {
                            title: val.title,
                            conteudo: val.conteudo,
                            descricaoCurta: val.conteudo.substring(0,100),
                            image: val.image,
                            slug: val.slug,
                            categoria: val.categoria,
                            views: val.views
                        }
                     });
                     res.render('single',{noticia:resposta,postsTop:postsTop});
                 });
            }
        },
    );
});

// ----------- login -----------
var session = require('express-session');

app.use(session({
    secret: 'siteNoticias4539key9848h5',
    cookie: { maxAge: 60000 }
}));

var usuarios = [
    {
        login: 'Jeff',
        senha: '1234'
    }
];

app.post('/admin/login', (req, res) => {
    usuarios.map(function(val){
        if(val.login == req.body.login && val.senha == req.body.senha){
            req.session.login = "Jeff";
        }
    });

    res.redirect('/admin/login');
});

app.get('/admin/login', (req, res) => {
    if(req.session.login == null){ // logado
        res.render('admin-login');
    }else{                        // não logado
        Posts.find({}).sort({'_id': -1}).exec(function(err, posts){
            posts = posts.map(function(val){ 
                return {
                    id: val._id,
                    title: val.title,
                    conteudo: val.conteudo,
                    descricaoCurta: val.conteudo.substring(0,100),
                    image: val.image,
                    slug: val.slug,
                    categoria: val.categoria,
                    views: val.views
                }
             });
            res.render('admin-panel', {posts:posts});
        });
    }
});
// ------------------------------

// ----------- cadastro da noticia -----------
app.post('/admin/cadastro', (req, res) => {

    //Upload de arquivos dentro da variável req.files.

    var imagem = "";
    let formato = req.files.arquivo.name.split('.');
    if(formato[formato.length - 1] == "jpg"){
        imagem = new Date().getTime()+'.jpg';
        req.files.arquivo.mv(__dirname+'/public/images/'+imagem);
    }else{
        fs.unlinkSync(req.files.arquivo.tempFilePath); // excluir arquivo
    }

    Posts.create({  //inserir notícia
        title: req.body.titulo_noticia, //vindo la do form de admin-panel
        image: 'http://localhost:5000/public/images/'+imagem,
        categotia:'Nenhuma',
        conteudo: req.body.noticia,
        slug: req.body.slug,
        autor:'Admin',
        views: 0,
    })
    res.redirect('/admin/login');
});
// -------------------------------------------

// ----------- deletar noticia -----------
app.get('/admin/deletar/:id', (req, res) => {
    Posts.deleteOne({_id:req.params.id}).then(function(){
        res.redirect('/admin/login');
    });
});
// ---------------------------------------