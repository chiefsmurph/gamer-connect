console.log('DB URL!!! ' + process.env.DATABASE_URL + '?ssl=true');

var pg = require('pg');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var port = process.env.PORT || 5000; // Use the port that Heroku
server.listen(port);

console.log('listening on ' + port);

var bodyParser = require('body-parser')
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())


app.use(express.static(__dirname + '/public'));



//
//
// pg.connect(process.env.DATABASE_URL + '?ssl=true', function(err, client) {
//   var query = client.query('CREATE  ');
//   console.log('adding pledge col');
//   query.on('row', function(row) {
//     console.log('row: ' + JSON.stringify(row));
//   });
// });


//
// pg.connect(process.env.DATABASE_URL + '?ssl=true', function(err, client) {
//   console.log('about to insert');
//   var queryText = 'INSERT INTO pledges(fsname, email) VALUES($1, $2)'
//   client.query(queryText, [req.body.name, req.body.email], function(err, result) {
//     console.log('err' + err);
//     if(result) {
//       console.log('success!!!' + JSON.stringify(result));
//
//       count++;
//       res.json({response: 'thank you!  your pledge has been received.'});
//       setTimeout(function() {
//         io.sockets.emit('status', { count: count });
//       }, 1000);
//     }
//   });
// });

io.sockets.on('connection', function (socket) {
  io.sockets.emit('status', { array: []}); // note the use of io.sockets to emit but socket.on to listen
});


// var cities = require('cities');

var dbFunctions = {
  executeQuery: function(q) {
    pg.connect(process.env.DATABASE_URL + '?ssl=true', function(err, client, done) {
      //CREATE TABLE scores (dbId serial primary key, username VARCHAR(30) not null, score INT, handshake VARCHAR(60))
      var query = client.query(q);
      console.log('executed query ' + q);
      query.on('row', function(row) {
        console.log('row: ' + JSON.stringify(row));
      });
      query.on('end', function() {
        done();
      });
    });
  },
  addNewCity: function(cityName, lat, long, cb) {

    console.log('creating new city ' + cityName);
    // insert
    pg.connect(process.env.DATABASE_URL + '?ssl=true', function(err, client, done) {
      var queryText = 'INSERT INTO cities_distance (cityName, lat, long) VALUES($1, $2, $3)';
      client.query(queryText, [cityName, lat, long], function(err, result) {

        done();
        if (err) console.log(err);
        console.log('successfully created new city ' + cityName);
        cb();

      });
    });

  },
  getAllCities: function(callback) {
    pg.connect(process.env.DATABASE_URL + '?ssl=true', function(err, client, done) {
      client.query('SELECT * FROM cities_distance', function(err, result) {

        done();
        if (err) console.log(err);

        callback(result.rows);

      });
    });
  },
  getCitiesNearby: function(lat, long, callback) {


    var addDistance = function(cities) {
      return cities.map(function(city) {
        city.distance = Math.sqrt(Math.pow(city.lat - lat, 2) + Math.pow(city.long - long, 2));
        return city;
      }).sort(function(a, b) {
        return a.distance - b.distance;
      });
    };
    console.log('getting cities near ' + lat + ', ' + long);
    pg.connect(process.env.DATABASE_URL + '?ssl=true' , function(err, client, done) {
      //client.query('SELECT * FROM cities_distance WHERE power(lat - ' + lat + ', 2) + power(long - ' + long +', 2) < 1000', function(err, result) {
      client.query('SELECT * FROM cities_distance WHERE earth_box(ll_to_earth(' + lat + ', ' + long + '), 50000) @> ll_to_earth(lat, long);', function(err, result) {
        done();
        if (err) console.log(err);
        var returnResult = addDistance(result.rows);
        console.log(returnResult);
        callback(returnResult);

      });
    });
  }
};

//dbFunctions.executeQuery('CREATE TABLE cities_distance (cityId serial primary key, cityName VARCHAR(70) not null, country VARCHAR(70), adminCode VARCHAR(70), population integer, lat float not null, long float not null)');




//
const cities = require("all-the-cities");
//console.log(cities)

//
// var converter = require('json-2-csv');
//
// var options = {
//     delimiter : {
//         wrap  : '"', // Double Quote (") character
//         field : ',', // Comma field delimiter
//         array : ';', // Semicolon array value delimiter
//         eol   : '\n' // Newline delimiter
//     },
//     prependHeader    : true,
//     sortHeader       : false,
//     trimHeaderValues : true,
//     trimFieldValues  :  true,
//     keys             : ['name', 'country', 'adminCode', 'population', 'lat', 'lon']
// };
//
// var documents = cities;
//
// var json2csvCallback = function (err, csv) {
//     if (err) throw err;
//     console.log(csv);
// };
//
// converter.json2csv(documents, json2csvCallback, options);
//

//
//
// console.log(JSON.stringify(cities, null, 2));
//
// var i = 0;
// var async = require('async');
// async.forEachSeries(cities, (city, cityCallback) => {
//   dbFunctions.addNewCity(city.name, city.lat, city.lon, () => {
//     console.log('woo hoo, its #' + i);
//     i++;
//     cityCallback();
//   });
// });


// function Inserts(template, data) {
//     if (!(this instanceof Inserts)) {
//         return new Inserts(template, data);
//     }
//     this._rawDBType = true;
//     this.formatDBType = function () {
//         return data.map(d=>'(' + pgp.as.format(template, d) + ')').join(',');
//     };
// }
//
// var pgp = require('pg-promise')();
// var db = pgp(process.env.DATABASE_URL + '?ssl=true');
//
// //
//
// db.none('INSERT INTO cities_distance(cityName, country, adminCode, population, lat, long) VALUES $1', Inserts('${name}, ${country}, ${adminCode}, ${population}, ${lat}, ${lon}', cities))
//     .then(data=> {
//         // OK, all records have been inserted
//         console.log('wahooo', data)
//     })
//     .catch(error=> {
//         // Error, no records inserted
//         console.log('error', error);
//     });
//



//
// var fs = require('fs');
// var pg = require('pg');
// var copyFrom = require('pg-copy-streams').from;
// var Readable = require('stream').Readable;
//
// pg.connect(process.env.DATABASE_URL + '?ssl=true', function(err, client, done) {
//   var origDone = done;
//   done = function(err) {
//     console.log('done', err);
//     origDone();
//   }
//   var stream = client.query(copyFrom('COPY cities_distance FROM STDIN'));
//   var fileStream = fs.createReadStream('cities_data.csv')
//   fileStream.on('error', done);
//   stream.on('error', done);
//   stream.on('end', done);
//   fileStream.pipe(stream);
// });

//
io.sockets.on('connection', function (socket) {
  console.log('new connection');
  // dbFunctions.getAllCities(function(cities) {
  //   socket.emit('listOfCities', cities);
  //   console.log(JSON.stringify(cities, null, 2));
  // });
  socket.on('findCities', function(input) {
    console.log('looking up ' + input);
    var foundCities = cities.filter(function(city) {
      return (city.name.toLowerCase() + ', ' + city.adminCode.toLowerCase()).indexOf(input.toLowerCase()) !== -1;
    });
    socket.emit('citySearchResults', foundCities);
  });
  socket.on('citiesNearby', function(input) {
    var lat = input.lat;
    var long = input.long;
    dbFunctions.getCitiesNearby(lat, long, function(cities) {
      socket.emit('citiesNearbyResults', cities);
    });
  });
});
