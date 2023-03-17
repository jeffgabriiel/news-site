const express = require('express');

const mongoose = require('mongoose');

const bodyParser = require("body-parser");

const path = require('path');

const app = express();

var posts = require('./Posts.js');
const Posts = require('./Posts.js');

mongoose.connect('mongodb+srv://root:IggMv0g0qAKh3Oqa@cluster0.igiwpog.mongodb.net/news-site?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true}).then(function(){
    console.log('conectado com sucesso');
}).catch(function(err){
    console.log(err.message)
});

app.use(bodyParser.json());             // to support JSON-encoded bodies
app. use(bodyParser.urlencoded({       // to support URL-encoded bodies
    extended: true
}));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, '/views'));

app.listen(5000,() => {
    console.log("servindo");
});

app.get('/', (req, res) => {
    //res.send('home');  //reenderizar

    if(req.query.busca == null){
        Posts.find({}).sort({'_id': -1}).exec(function(err, posts){

            posts = posts.map(function(val){
                return {
                    title: val.title,
                    image: val.image,           
                    categotia: val.categotia,  //dados do mongoDB
                    conteudo: val.conteudo,
                    slug: val.slug,
                    
                    views: val.views,
                    
                    descricaoCurta: val.conteudo.substring(0,100), //dados adicionais:
                }
            })

            Posts.find({}).sort({'views': -1}).limit(3).exec(function(err,postsTop){ //reinderizar a Home com os posts contados

                // console.log(posts[0]);

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

        Posts.find({title: {$regex: req.query.busca, $options:"i"}}, function(err, posts){
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
    //res.send(req.params.slug);

    Posts.findOneAndUpdate(
        {slug: req.params.slug},
        {$inc: {views: 1}},
        {new: true},
        function(err, resposta){
            // console.log(resposta);
            // res.render('single',{noticia:resposta});
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
        }
    );

})