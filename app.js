var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var request = require('request');
var sentiment = require('sentiment');
var sentimentResponses = [];
var forbidden;
var numberOfTimeouts = 0;

function getScores(var q) {
	do {
		console.log("Attempting to get body\n");
		request.get({
			url: "https://api.nytimes.com/svc/search/v2/articlesearch.json",
			qs: {
				'api-key': "bc500cd222c46649f60f333c6523236",
				'q': q,
				'fl': "lead_paragraph,abstract,headline"
			},
			/*
			qs: {
				'api-key': "bc500cd222c46649f60f333c6523236",
				'q': "trump bad",
				'begin_date': "19300101",
				'end_date': "19400101",
				'fl': "lead_paragraph,abstract,headline"
			},
			*/
		}, function(err, response, body) {
			if (body.charAt(0) == '<') {
				forbidden = true;
				numberOfTimeouts++;
				return true;	
			} else {
				forbidden = false;
			}
			
			body = JSON.parse(body);
			
			if (body.response.meta.hits == 0) {
				forbidden = true;
				numberOfTimeouts++;
				return true;
			}
			
			console.log(body);

			var result;
			var totalScore;
			var totalWords;
			
			for (var i = 0; i < 10; i++) {
				totalScore = 0;
				totalWords = 0;
				console.log("\n\t\tArticle %d\n", i + 1)
				if (body.response.docs[i].headline.main) {  
					console.log("header:%s\n", body.response.docs[i].headline.main);
					result = sentiment(body.response.docs[i].headline.main);
					totalScore += result.score;
					totalWords += WordCount(body.response.docs[i].headline.main);
					console.log("header score:%d\n", result.score);
				}
			  
				if (body.response.docs[i].lead_paragraph) {
					console.log("lead_paragraph:%s\n", body.response.docs[i].lead_paragraph);
					result = sentiment(body.response.docs[i].lead_paragraph);
					totalScore += result.score;
					totalWords += WordCount(body.response.docs[i].lead_paragraph);
					console.log("lead_paragraph score:%d\n", result.score);
				}
			  
				if (body.response.docs[i].abstract) {
					console.log("abstract:%s\n", body.response.docs[i].abstract);
					result = sentiment(body.response.docs[i].abstract);
					totalScore += result.score;
					totalWords += WordCount(body.response.docs[i].abstract);
					console.log("abstract score:%d\n", result.score);
				}
				
				totalScore /= totalWords;
				console.log("total score:%d", totalScore);
			}
		})
	} while (forbidden && numberOfTimeouts < 5);
}

function WordCount(str) { 
  return str.split(" ").length;
}


/*console.log("\nheadline:\n");
  console.log(body.response.docs[0].headline.main);
  console.log("\nlead_paragraph:\n")
  console.log(body.response.docs[0].lead_paragraph);
  console.log("\nabstract:\n")
  console.log(body.response.docs[0].abstract);*/

//var sentiment = require('sentiment');
//var result = sentiment('');
//console.dir(result);


app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

module.exports = app;
