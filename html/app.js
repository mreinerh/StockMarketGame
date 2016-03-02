var express 	= require('express');
var bodyParser = require('body-parser');
var mysql 	= require('mysql');
var app 	= express();
var path	= require("path");

/*app.use(bodyParser.urlencoded({
    extended: true
}));*/
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};
app.use(bodyParser.json());
app.use(allowCrossDomain);


// DATABASE CONNECTION INFO
var db = mysql.createConnection({
	host	:'localhost',
	user	:'root',
	password:'godawgs',
	database:'Stocks'
});


// CONNECTING TO THE DATABASE
db.connect(function(err){
if(!err){
	console.log("Database is connected...");
}else{
	console.log("Error connecting to database...");
}
});

/*
 * Function for handling rest api error
 */
function handleError(err, res){
  console.log(err);
  var msg = {
    'Status':'Error',
    'Message': err
  }
  res.json(msg);
  res.end();
  return;
}
function isset(obj){
  return (typeof obj == "undefined") ? false : true;
}

app.get('/', function (req, res) {
  res.sendFile('index.html', {root: path.join(__dirname, 'public')});
});
app.get('/:page', function (req, res) {
  res.sendFile(req.params.page+'.html', {root: path.join(__dirname, 'public')});
});

// GETS DATA FROM A TABLE GIVEN A WHERE CLAUSE
app.get('/api/:model/*', function(req, res){
  var query = "SELECT * FROM "+req.params.model;
  if(isset(req.params[0])){
    query += " WHERE 1";
    var parameters = req.params[0].split("/");
    for(var i = 0; i < parameters.length; i += 2){
      req.params[parameters[i]] = parameters[i+1];
      query += " AND "+parameters[i]+" = '"+parameters[i+1]+"'";
    }
  }
  db.query(query, function(err, rows, fields){
    if(err) return handleError(err, res);
    res.json(rows);
    res.end();
  });
});

// GETS ALL DATA FROM A TABLE
app.get('/api/:model', function(req, res){
  db.query("SELECT * FROM "+req.params.model, function(err, rows, fields){
    if(err) return handleError(err, res);
    res.json(rows);
    res.end();
  });
});

// INSERTS NEW RECORDS
app.post('/api/:model', function(req, res){
  var query = "INSERT INTO "+req.params.model;
  if(!isset(req.body) || req.body.length == 0) return handleError("No data given", res);

  var columns = [];
  var values  = [];
  for(var k in req.body){
    columns.push(k);
    values.push(req.body[k]);
  }

  query += " ( ";
  for(var c in columns){
    query += columns[c];
    if(c != columns.length-1) query += ", ";
  }
  query += " ) VALUES ( ";
  for(var v in values){
    query += "'"+values[v]+"'";
    if(v != values.length-1) query += ", ";
  }
  query += " ) ";

  db.query(query, function(err, rows, fields){
    if(err) return handleError(err, res);
    res.json(rows);
    res.end();
  });
});

// UPDATES RECORDS
app.put('/api/:model', function(req, res){
  var query = "UPDATE "+req.params.model+" SET ";
  if(!isset(req.body) || req.body.length == 0) return handleError("No data given", res);
  if(!isset(req.body.where)) return handleError("No where clause given.", res);

  console.log(req.body);

  var where = req.body.where;
  delete req.body.where;

  for(var k in req.body){
    query += k+"='"+req.body[k]+"', ";
  }
  // Removes the last comma and space after it
  query = query.replace(/,\s*$/, "");

  query += " WHERE 1";
  for(var i in where){
    query += " AND "+i+" = '"+where[i]+"'";
  }

  db.query(query, function(err, rows, fields){
    if(err) return handleError(err, res);
    res.json(rows);
    res.end();
  });
});

// DELETES RECORDS
app.delete('/api/:model', function(req, res){
  var query = "DELETE FROM "+req.params.model+" WHERE 1";
  if(!isset(req.body) || req.body.length == 0) return handleError("No data given", res);

  for(var i in req.body){
    query += " AND "+i+" = '"+req.body[i]+"'";
  }

  db.query(query, function(err, rows, fields){
    if(err) return handleError(err, res);
    res.json(rows);
    res.end();
  });
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Stock Market app listening at http://%s:%s', host, port);
});
