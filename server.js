var express = require('express');
var path = require('path'); // модуль для парсинга шляху
var log = require('./libs/log')(module);
var app = express(); app.use(express.favicon()); // задаємо стандартну іконку сайту, але можна також передати власну
var config = require('./libs/config');
var ArticleModel = require('./libs/mongoose').ArticleModel;

app.use(express.logger('dev')); // вивводимо всі запитизі статусами в консоль
app.use(express.bodyParser()); // стандартный модуль для парсингу JSON в запитах
app.use(express.methodOverride()); // підтримка put и delete
app.use(app.router); // модуль для простого вказазння обробника шляхів
app.use(express.static(path.join(__dirname, "public"))); // запуск статичного файлового серверу, що диивтсья на папку public/ (в нашому випадку віддає index.html)

app.get('/api', function(req, res) {
    res.send('API is running');
});

app.listen(config.get('port'), function(){
    log.info('Express server listening on port ' + config.get('port'));
});

app.use(function(req, res, next) {
    res.status(404);
    log.debug('Not found URL: %s', req.url);
    res.send({ error: 'Not found' });
    return;
});

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    log.error('Internal error(%d): %s', res.statusCode, err.message); res.send({ error: err.message });
 	  return;
});

app.get('/ErrorExample', function(req, res, next) {
    next(new Error('Random error!'));
});

app.get('/api/articles', function(req, res) {
    return ArticleModel.find(function (err, articles) {
        if (!err) {
            return res.send(articles);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.post('/api/articles', function(req, res) {
    var article = new ArticleModel({
        title: req.body.title,
        author: req.body.author,
        description: req.body.description,
        images: req.body.images
    });

    article.save(function(err) {
        if (!err) {
            log.info("article created");
            return res.send({ status: 'OK', article:article });
        } else {
            console.log(err);
            if(err.name == 'ValidationError') {
                res.statusCode = 400;
                res.send({ error: 'Validation error' });
            } else {
                res.statusCode = 500;
                res.send({ error: 'Server error' });
            }
            log.error('Internal error(%d): %s', res.statusCode, err.message);
        }
    });
});

app.get('/api/articles/:id', function(req, res) {
    return ArticleModel.findById(req.params.id, function (err, article) {
        if(!article) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        if (!err) {
            return res.send({ status: 'OK', article:article });
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.put('/api/articles/:id', function(req, res) {
    return ArticleModel.findById(req.params.id, function (err, article) {
        if(!article) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }

        article.title = req.body.title;
        article.description = req.body.description;
        article.author = req.body.author;
        article.images = req.body.images;
        return article.save(function (err) {
            if (!err) {
                log.info("article updated");
                return res.send({ status: 'OK', article:article });
            } else {
                if(err.name == 'ValidationError') {
                    res.statusCode = 400;
                    res.send({ error: 'Validation error' });
                } else {
                    res.statusCode = 500;
                    res.send({ error: 'Server error' });
                }
                log.error('Internal error(%d): %s', res.statusCode, err.message);
            }
        });
    });
});

app.delete('/api/articles/:id', function(req, res) {
    return ArticleModel.findById(req.params.id, function(err, article) {
        if(!article) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        return article.remove(function (err) {
            if (!err) {
                log.info("article removed");
                return res.send({ status: 'OK' });
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s', res.statusCode, err.message);
                return res.send({ error: 'Server error' });
            }
        });
    });
});
