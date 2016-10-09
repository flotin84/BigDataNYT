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
var RateLimiter = require('limiter').RateLimiter;
var limiter = new RateLimiter(1, 1000);
var sentimentResponses = [];
var forbidden;
var numberOfTimeouts = 0;

var articles = 0;
var articleName = [];
var datePublished = [];
var score = [];

var q = "trump";
var begin_date = 2000;
var end_date = 2016;

callthis(q, begin_date, end_date);

function callthis(q, begin_date, end_date) {
	articles = 0;
	var differenceInDates = end_date - begin_date;
	begin_date *= 10000;
	begin_date += 101;
	end_date *= 10000;
	end_date += 1231;
	
	if (differenceInDates >= 3) {
		differenceInDates /= 3;
		differenceInDates = differenceInDates | 0;
		differenceInDates *= 10000;
		
		getScores(q, begin_date, begin_date + differenceInDates);
		getScores(q, begin_date + differenceInDates, begin_date + 2*differenceInDates);
		getScores(q, begin_date + 2*differenceInDates, end_date);
		
	} else {
		
		getScores(q, begin_date, end_date);
	}
}

function getScores(q, begin_date, end_date) {
	do {
		limiter.removeTokens(1, function() {
			console.log("Attempting to get body\n");
			request.get({
				url: "https://api.nytimes.com/svc/search/v2/articlesearch.json",
				qs: {
					'api-key': "bc500cd222c46649f60f333c6523236",
					'q': q,
					'fq': "type_of_material:(\"Addendum\", \"An Analysis\", \"Article\", \"Biography\", \"Brief\", \"Chronology\", \"Column\", \"Economic Analysis\", \"Editorial\", \"First Chapter\", \"Interview\", \"Military Analysis\", \"News\", \"News Analysis\", \"Special Report\", \"Summary\", \"Text\")",
					'begin_date': begin_date,
					'end_date': end_date,
					'fl': "lead_paragraph,abstract,headline,pub_date,type_of_material"
				},
			}, function(err, response, body) {
								
				if (body.charAt(0) == '<') {
					forbidden = true;
					numberOfTimeouts++;
					return true;	
				} else {
					forbidden = false;
				}
				
				body = JSON.parse(body);
				
				console.log(body);
				
				/*
				if (body.response.meta.hits == 0) {
					forbidden = true;
					numberOfTimeouts++;
					return true;
				}
				*/

				var result;
				var totalScore;
				var totalWords;
				
				for (var i = 0; i < 10; i++) {
					totalScore = 0;
					totalWords = 0;
					console.log("\n\t\tArticle %d\n", i + 1)
					if (body.response.docs[i].headline.main) {  
						console.log("headline:%s\n", body.response.docs[i].headline.main);
						result = sentiment(body.response.docs[i].headline.main);
						totalScore += result.score;
						totalWords += WordCount(body.response.docs[i].headline.main);
						console.log("headline score:%d\n", result.score);
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
					
					totalWords += 10;
					totalScore /= totalWords;
					console.log("total score:%d", totalScore);
					if (totalScore < -.07 || totalScore > .07) {
						articleName[articles] = body.response.docs[i].headline.main;
						datePublished[articles] = body.response.docs[i].pub_date;
						// only first 10 characters of datePublished necessary
						datePublished[articles] = datePublished[articles].substring(0,10);
						score[articles] = totalScore;
						articles++;
					}
				}
				
				for (i = 0; i < articles; i++) {
					console.log("name:%s\t\tdate published:%s\t\tscore:%d\n", articleName[i], datePublished[i], score[i]);
				}
			})
		});
	} while (forbidden && numberOfTimeouts < 5);
}

function WordCount(str) { 
  return str.split(" ").length;
}

app.listen(3000, function () {
  console.log('App listening on port 3000');
});

module.exports = app;
