var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var postSchema = new Schema({
    title: String,
    image: String,
    categotia: String,
    conteudo: String,
    slug: String,
    autor: String,
    views: Number,
}, {collection:'posts'});

var Posts = mongoose.model("Posts", postSchema);

module.exports = Posts;