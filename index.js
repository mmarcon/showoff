var request = require('request'),
    express = require('express'),
    marked = require('marked'),
    sass = require('node-sass'),
    highlight = require('highlight.js'),
    config = require('./config.json');

var markedRenderer = new marked.Renderer();

markedRenderer.image = function(href, title, altText){
    var html = '';
    html += '<div class="image-wrapper">';
    html += '<img src="' + href + '" ';
    if(title) {
        html += 'title="' + title + '" ';
    }
    html += 'alt="' + altText + '"/>';
    html += '</div>';
    return html;
};

marked.setOptions({
    renderer: markedRenderer,
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: false,
    highlight: function(code){
        return highlight.highlightAuto(code).value;
    }
});

var GITHUB = {
    urlTemplate: 'https://raw.githubusercontent.com/{USER}/{REPO}/master/README.md'
};

var cache = {};

var app = express();
app.engine('.html', require('ejs').__express);
app.use(sass.middleware({
    src: __dirname + '/static',
    dest: __dirname + '/static',
    debug: false,
    outputStyle: 'compressed'
}));
app.use(express.static(__dirname + '/static'));
app.set('views', __dirname + '/templates');
app.set('view engine', 'html');

app.get('/', function(req, res){
    res.send('welcome');
});

app.get('/:repo', function(req, res){
    var repoName = req.params.repo;
    if(!~config.repositories.indexOf(repoName)) {
        return res.send(404);
    }
    var url = GITHUB.urlTemplate.replace('{USER}', config.user).replace('{REPO}', repoName);
    request(url, function(error, response, body){
        if(error) {
            return res.send(503);
        }
        var repo = {
            title: repoName,
            body: marked(body),
            repo: repoName,
            user: config.user
        };
        res.render('repo', repo);
    });
});

app.listen(process.env.PORT || process.env.VCAP_APP_PORT || 3000);