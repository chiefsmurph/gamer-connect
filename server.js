console.log('DB URL!!! ' + process.env.DATABASE_URL);

var uuid = require('uuid');
var pg = require('pg');
var fs = require('fs');
var express = require('express');
var app = express();


// var options = {
//   key: fs.readFileSync('/etc/letsencrypt/live/chiefsmurph.com/privkey.pem', 'utf8'),
//   cert: fs.readFileSync('/etc/letsencrypt/live/chiefsmurph.com/cert.pem', 'utf8'),
//   ca: fs.readFileSync('/etc/letsencrypt/live/chiefsmurph.com/chain.pem', 'utf8')
// };


var port = process.env.PORT || 443; // Use the port that Heroku

// const server = require('http').Server(app)


const server = app.listen(port);

var io = require('socket.io')(server);


console.log('listening on ' + port);

var bodyParser = require('body-parser')
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())


app.use(express.static(__dirname + '/public'));

// app.get('*', function(req, res){
//     res.set('Content-Type', 'text/html')
//         .sendfile(__dirname + '/public/index.html');
// });





//
//
// pg.connect(process.env.DATABASE_URL, function(err, client) {
//   var query = client.query('CREATE  ');
//   console.log('adding pledge col');
//   query.on('row', function(row) {
//     console.log('row: ' + JSON.stringify(row));
//   });
// });


//
// pg.connect(process.env.DATABASE_URL, function(err, client) {
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



async function makeTables() {
  const queries = [
    `CREATE TABLE cities_distance (cityId serial primary key, cityName VARCHAR(70) not null, country VARCHAR(70), adminCode VARCHAR(70), population integer, lat float not null, long float not null)`,
    `CREATE TABLE city_people (playerId serial primary key, username VARCHAR(70) not null, hashcode VARCHAR(70) not null, joinDate timestamp without time zone default (now() at time zone 'utc'), points integer default 0, isBanned boolean default false, lat float not null, long float not null, nearestCity varchar(70) not null)`,
    `CREATE TABLE land_claims (claimId serial primary key, cityId integer not null, cityName VARCHAR(70) not null, leadername VARCHAR(70) not null, leaderid integer not null, claimDate timestamp without time zone default (now() at time zone 'utc'), points integer default 0, isActive boolean default true)`,
  ];
  for (q of queries) {
    console.log(`starting: ${q}`);
    // await new Promise(resolve =>
    //   pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    //     client.query(q, function(err, result) {
    //       done();
    //       console.log(`done: ${q}`);
    //       resolve();
    //     });
    //   })
    // );
  }
}



// var cities = require('cities');



// var dbFunctions = {
//   executeQuery: function(q, callback) {
//     pg.connect(process.env.DATABASE_URL, function(err, client, done) {
//       //CREATE TABLE pointss (dbId serial primary key, username VARCHAR(30) not null, points INT, handshake VARCHAR(60))
//       var query = client.query(q, function(err, result) {
//         done();
//         if (err) {
//           console.log(err);
//           return callback(null);
//         }
//         //console.log('executed query ' + q);
//         return callback((result && result.rows) ? result.rows : null);
//       });
//     });
//   },
//   addNewCity: function(cityName, lat, long, cb) {
//
//     console.log('creating new city ' + cityName);
//     // insert
//     pg.connect(process.env.DATABASE_URL, function(err, client, done) {
//       var queryText = 'INSERT INTO cities_distance (cityName, lat, long) VALUES($1, $2, $3)';
//       client.query(queryText, [cityName, lat, long], function(err, result) {
//
//         done();
//         if (err) console.log(err);
//         console.log('successfully created new city ' + cityName);
//         cb();
//
//       });
//     });
//
//   },
//   getAllCities: function(callback) {
//     pg.connect(process.env.DATABASE_URL, function(err, client, done) {
//       client.query('SELECT * FROM cities_distance', function(err, result) {
//
//         done();
//         if (err) console.log(err);
//
//         callback(result.rows);
//
//       });
//     });
//   },
//   getCitiesNearby: function(lat, long, callback) {
//     var addDistance = function(cities) {
//       return cities.map(function(city) {
//         city.distance = Math.sqrt(Math.pow(city.lat - lat, 2) + Math.pow(city.long - long, 2));
//         return city;
//       }).sort(function(a, b) {
//         return a.distance - b.distance;
//       });
//     };
//     console.log('getting cities near ' + lat + ', ' + long);
//     pg.connect(process.env.DATABASE_URL , function(err, client, done) {
//       //client.query('SELECT * FROM cities_distance WHERE power(lat - ' + lat + ', 2) + power(long - ' + long +', 2) < 1000', function(err, result) {
//       client.query('SELECT * FROM cities_distance WHERE earth_box(ll_to_earth(' + lat + ', ' + long + '), 50000) @> ll_to_earth(lat, long)', function(err, result) {
//         done();
//         if (err) console.log(err);
//         var returnResult = addDistance(result.rows);
//         console.log('found near ' + returnResult[0].cityname);
//         callback(returnResult);
//
//       });
//     });
//   },
//   checkUsernameAvailable: function(username, callback) {
//     this.executeQuery('SELECT * FROM city_people WHERE username = \'' + username + '\'', function(response) {
//       console.log('response', response);
//       callback(!response.length);
//     });
//   },
//   createNewUser: function(username, lat, long, nearestCity, callback) {
//
//     var handshake = uuid.v1();
//
//     pg.connect(process.env.DATABASE_URL, function(err, client, done) {
//       var queryText = 'INSERT INTO city_people (username, hashcode, lat, long, nearestCity) VALUES($1, $2, $3, $4, $5) RETURNING *';
//       client.query(queryText, [username, handshake, lat, long, nearestCity], function(err, result) {
//
//         if (err)  console.error(err);
//
//         done();
//         console.log('created new user ' + JSON.stringify(result.rows[0], null, 2));
//         callback((result && result.rows && result.rows[0]) ? result.rows[0] : null);
//
//       });
//     });
//
//   },
//   verifyUser: function(playerid, hashcode, callback) {
//     pg.connect(process.env.DATABASE_URL , function(err, client, done) {
//       //client.query('SELECT * FROM cities_distance WHERE power(lat - ' + lat + ', 2) + power(long - ' + long +', 2) < 1000', function(err, result) {
//       client.query('SELECT * FROM city_people WHERE playerid = ' + playerid + ' AND hashcode = \'' + hashcode + '\'', function(err, result) {
//         done();
//         if (err) console.log(err);
//         callback((result && result.rows && result.rows[0]) ? result.rows[0] : false);
//
//       });
//     });
//   },
//   getCurrentLeader: function(cityid, callback) {
//     pg.connect(process.env.DATABASE_URL , function(err, client, done) {
//       //client.query('SELECT * FROM cities_distance WHERE power(lat - ' + lat + ', 2) + power(long - ' + long +', 2) < 1000', function(err, result) {
//       client.query('SELECT * FROM land_claims WHERE cityid = ' +cityid + ' AND isActive = true ORDER BY claimDate DESC LIMIT 1', function(err, result) {
//         done();
//         if (err) console.log(err);
//         callback((result && result.rows && result.rows[0]) ? {
//           leaderid: result.rows[0].leaderid,
//           username: result.rows[0].leadername
//         } : null);
//
//       });
//     });
//   },
//   getAllPlayers: function(callback) {
//     pg.connect(process.env.DATABASE_URL , function(err, client, done) {
//       //client.query('SELECT * FROM cities_distance WHERE power(lat - ' + lat + ', 2) + power(long - ' + long +', 2) < 1000', function(err, result) {
//       client.query('SELECT * FROM city_people', function(err, result) {
//         done();
//         if (err) console.log(err);
//         if (!(result && result.rows && result.rows.length)) {
//           return callback(null);
//         }
//         callback(result.rows.map(function(row) {
//           return {
//             playerid: row.playerid,
//             points: row.points,
//             username: row.username
//           };
//         }));
//       });
//     });
//   },
//   incrementPlayer: function(playerid, callback) {
//     this.executeQuery('UPDATE city_people SET points = points + 10 WHERE playerid = ' + playerid + ' RETURNING *', function(result) {
//       //console.log(result);
//       callback(result[0]);
//     });
//   },
//   incrementLandClaim: function(claimid, callback) {
//     this.executeQuery('UPDATE land_claims SET points = points + 10 WHERE claimid = ' + claimid + ' RETURNING *', function(result) {
//       //console.log(result);
//       callback(result[0]);
//     });
//   },
//   claimLand: function(cityid, cityname, username, userid, callback) {
//     //console.log(cityid, cityname, username, userid, lat, long);
//     pg.connect(process.env.DATABASE_URL, function(err, client, done) {
//       var queryText = 'INSERT INTO land_claims (cityid, cityname, leadername, leaderid) VALUES($1, $2, $3, $4) RETURNING *';
//       client.query(queryText, [cityid, cityname, username, userid], function(err, result) {
//
//         if (err)  console.error(err);
//
//         done();
//         console.log('created new land claim ' + JSON.stringify(result.rows[0], null, 2));
//         callback((result && result.rows && result.rows[0]) ? result.rows[0] : null);
//
//       });
//     });
//   },
//   getAllLandClaims: function(callback) {
//     this.executeQuery('SELECT * FROM land_claims WHERE isActive = true', callback);
//   },
//   getAllLandClaimsForPlayer: function(playerid, callback) {
//     this.executeQuery('SELECT * FROM land_claims WHERE leaderid = \'' + playerid + '\' AND isActive = true', function(claims) {
//       if (!claims) { return callback(false); }
//       callback(claims.map(function(city) {
//         return city.cityname;
//       }));
//     });
//   },
//   makeLandClaimInactive: function(claimid, callback) {
//     this.executeQuery('UPDATE land_claims SET isActive = false WHERE claimid = ' + claimid + ' RETURNING *', function(result) {
//       console.log(!!result, 'update land claim?');
//       callback(!!result);
//     });
//   }
// };



//CREATE TABLE land_claims (claimId serial primary key, cityId integer not null, cityName VARCHAR(70) not null, leadername VARCHAR(70) not null, leaderid integer not null, claimDate timestamp without time zone default (now() at time zone 'utc'), points integer default 0, isActive boolean default true)


function SQL(tableName, fieldObj) {
  this.tableName = tableName;

  var delimitedVals = function(mappings, del) {
    var stringVal = function(val) {
      return JSON.stringify(val).replace(/"/g, "'")
    };
    return Object.keys(mappings).map(function(field) {
      var valFormatted = (fieldObj[field][0].indexOf('varchar') !== -1) ? stringVal(mappings[field]) : mappings[field];
      return field + ' = ' + valFormatted;
    }).join(del);
  };

  this.create = function() {
    var fieldObj = this.fieldObj;
    return 'CREATE TABLE ' + tableName + ' (' + Object.keys(fieldObj).map(function(field) {
      return field + ' ' + fieldObj[field][0] + ' ' + fieldObj[field][1];
    }).join(', ') + ')';
  };
  this.select = function(options) {
    options = options || {};
    var parts = ['SELECT', options.what || '*', 'FROM', this.tableName];
    if (options.where) {
      parts.push('WHERE');
      parts.push(delimitedVals(options.where, ' AND '));
    }
    if (options.orderBy) {
      parts.push('ORDER BY');
      parts.push(options.orderBy);
    }
    if (options.extra) {
      parts.push(options.extra);
    }
    return parts.join(' ');
  };
  this.update = function(options) {
    var parts = ['UPDATE', this.tableName, 'SET'];
    if (!options || !options.data) {
      return console.error('SQL.update needs options.data');
    }
    parts.push(delimitedVals(options.data, ', '));
    if (options.where) {
      parts.push('WHERE');
      parts.push(delimitedVals(options.where, ' AND '));
    }
    if (options.extra) {
      parts.push(options.extra);
    }
    parts.push('RETURNING *');
    return parts.join(' ');
  };
  this.insert = function(fields) {
    var parts = ['INSERT INTO', this.tableName, '('];
    parts.push(fields.join(', '));
    parts.push(') VALUES (');
    parts.push(new Array(fields.length).fill(undefined).map(function(val, index) {
      return '$' + (index + 1);
    }).join(', '));
    parts.push(')');
    parts.push('RETURNING *');
    console.log(parts.join(' '));
    return parts.join(' ');
  };
}

function TableInterface(pg, databaseUrl, tableName, fieldObj, methods) {

  var sql = new SQL(tableName, fieldObj);

  this.executeQuery = function() {
    var args = Array.prototype.slice.call(arguments);
    var callback = (typeof args[args.length - 1] === 'function') ? args.pop() : function() {};
    pg.connect(databaseUrl, function(err, client, done) {
      if (err) return console.error(err);
      var query = client.query.apply(client, args.concat([function(err, result) {
        done();
        if (err) {
          return console.log(err);
        }
        // console.log('executed query ' + args[0]);
        return callback((result && result.rows) ? result.rows : null);
      }]));
    });
  },

  this.create = function(callback) {
    this.executeQuery(sql.create(), function(data) {
      console.log('created table ' + tableName);
      if (callback) callback(data);
    });
  };

  this.select = function(options, callback) {
    console.log('selecting ', JSON.stringify(options));
    var query = sql.select(options);
    console.log(query);
    this.executeQuery(query, function(response) {
      console.log('selected table ' + tableName);
      if (callback) callback(response);
    });
  };

  this.update = function(options, callback) {
    this.executeQuery(sql.update(options), function(response) {
      if (callback) callback(response);
    });
  };

  this.insert = function(data, callback) {
    console.log(JSON.stringify(data));
    var vals = Object.keys(data).map(function(key) {
      return data[key];
    });
    this.executeQuery(sql.insert(Object.keys(data)), vals, function(response) {
      console.log('inserted to  ' + tableName);
      if (callback) callback(response[0]);
    });
  };

  if (methods) {
    methods.call(this);
  }

}


var LandClaims = new TableInterface(pg, process.env.DATABASE_URL, 'land_claims', {
  claimid: ['serial', 'primary key'],
  cityid: ['integer', 'not null'],
  cityname: ['varchar(70)', 'not null'],
  leadername: ['varchar(70)', 'not null'],
  leaderid: ['integer', 'not null'],
  claimdate: ['timestamp', 'without time zone default (now() at time zone \'utc\')'],
  points: ['integer', 'default 0'],
  isactive: ['boolean', 'default true']
}, function() {
  this.getCurrentLeader = function(cityId, cb) {
    return LandClaims.select({
      where: {
        cityid: cityId,
        isactive: true
      }
    }, function(response) {
      if (!response.length) { return cb(null); }
      var leader = response[0];
      cb({
        leaderid: leader.leaderid,
        username: leader.leadername
      });
    });
  };
  this.incrementLandClaim = function(claimid, cb) {
    return LandClaims.update({
      data: {
        points: 'points + 10'
      },
      where: {
        claimid: claimid
      }
    }, function(response) {
      if (!response.length) { return cb(null); }
      cb(response[0]);
    });
  };
  this.claimLand = function(cityid, cityname, username, userid, cb) {
    console.log(cityid, cityname, username, userid, 'turkey');
    return LandClaims.insert({
      cityid: cityid,
      cityname: cityname,
      leadername: username,
      leaderid: userid
    }, function(response) {
      console.log('created new land claim ' + JSON.stringify(response, null, 2));
      cb(response);
    });
  };
  this.getAllLandClaims = function(cb) {
    return LandClaims.select({
      where: {
        isactive: true
      }
    }, cb);
  };
  this.getAllLandClaimsForPlayer = function(playerid, cb) {
    return LandClaims.select({
      where: {
        leaderid: playerid,
        isactive: true
      }
    }, function(response) {
      if (!response) { return callback(false); }
      cb(response.map(function(claim) {
        return claim.cityname;
      }));
    });
  };
  this.makeLandClaimInactive = function(claimid, cb) {
    return LandClaims.update({
      data: {
        isactive: false
      },
      where: {
        claimid: claimid
      }
    }, function(response) {
      cb(response[0]);
    });
  };
});


var CitiesDistance = new TableInterface(pg, process.env.DATABASE_URL, 'cities_distance', {
  cityid: ['serial', 'primary key'],
  cityname: ['varchar(70)', 'not null'],
  country: ['varchar(70)'],
  admincode: ['varchar(70)'],
  population: ['integer'],
  lat: ['float', 'not null'],
  long: ['float', 'not null']
}, function() {
  this.addNewCity = function(city, cb) {
    const { name: cityName, lat, long } = city;
    console.log('creating new city ' + cityName);
    return this.insert({
      cityname: cityName,
      lat, lat,
      long, long
    }, cb);
  };
  this.getAllCities = function(cb) {
    return this.select(null, cb)
  };
  this.getCitiesNearby = function(lat, long, cb) {
    return this.select({
      extra: 'WHERE earth_box(ll_to_earth(' + lat + ', ' + long + '), 50000) @> ll_to_earth(lat, long)'
    }, function(response) {
      response = (function addDistance() {
        return response.map(function(city) {
          city.distance = Math.sqrt(Math.pow(city.lat - lat, 2) + Math.pow(city.long - long, 2));
          return city;
        }).sort(function(a, b) {
          return a.distance - b.distance;
        });
      })();
      console.log('found near ' + response[0].cityname);
      cb(response);
    });
  };
});

//dbFunctions.executeQuery('CREATE TABLE cities_distance (cityId serial primary key, cityName VARCHAR(70) not null, country VARCHAR(70), adminCode VARCHAR(70), population integer, lat float not null, long float not null)');
//CREATE TABLE city_people (playerId serial primary key, username VARCHAR(70) not null, hashcode VARCHAR(70) not null, joinDate timestamp without time zone default (now() at time zone 'utc'), points integer default 0, isBanned boolean default false, lat float not null, long float not null, nearestCity varchar(70) not null)


var CityPeople = new TableInterface(pg, process.env.DATABASE_URL, 'city_people', {
  playerid: ['serial', 'primary key'],
  username: ['varchar(70)', 'not null'],
  hashcode: ['varchar(70)', 'not null'],
  joinDate: ['timestamp', 'without time zone default (now() at time zone \'utc\')'],
  points: ['integer', 'default 0'],
  dayswon: ['integer', 'default 0'],
  isbanned: ['boolean', 'default false'],
  lat: ['float', 'not null'],
  long: ['float', 'not null'],
  nearestcity: ['varchar(70)', 'not null'],
}, function() {
  this.getAllPlayers = function(cb) {
    return this.select(null, function(response) {
      cb(response.map(function(row) {
        return {
          playerid: row.playerid,
          points: row.points,
          username: row.username
        };
      }));
    });
  };
  this.checkUsernameAvailable = function(username, cb) {
    return CityPeople.select({
      where: {
        username: username
      }
    }, function(response) {
      cb(!response.length);
    });
  };
  this.createNewUser = function(username, hashcode, lat, long, nearestCity, cb) {
    return CityPeople.insert({
      username: username,
      hashcode: hashcode,
      lat: lat,
      long: long,
      nearestcity: nearestCity
    }, function(response) {
      console.log('created new user ' + JSON.stringify(response, null, 2));
      cb(response);
    });
  };
  this.verifyUser = function(playerid, hashcode, cb) {
    return CityPeople.select({
      where: {
        playerid: playerid,
        hashcode: hashcode
      }
    }, function(response) {
      console.log(JSON.stringify(response), 'verify user response')
      cb(response[0]);
    });
  };
  this.incrementPlayer = function(playerid, cb) {
    return CityPeople.update({
      data: {
        points: 'points + 10'
      },
      where: {
        playerid: playerid
      }
    }, function(response) {
      if (!response.length) { return cb(null); }
      cb(response[0]);
    });
  };
});


//
const cities = require("all-the-cities");
console.log(cities.length)


// var converter = require('json-2-csv');

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

// var documents = cities;

// var json2csvCallback = function (err, csv) {
//     if (err) throw err;
//     console.log(csv);
// };

// converter.json2csv(documents, json2csvCallback, options);




// console.log(JSON.stringify(cities, null, 2));

var i = 0;
var async = require('async');

(async () => {
  await makeTables();
  async.forEachSeries(cities, (city, cityCallback) => {
    CitiesDistance.addNewCity(city, () => {
      console.log('woo hoo, its #' + i);
      i++;
      cityCallback();
    });
  });  
})(); 


// function Inserts(template, data) {
//     if (!(this instanceof Inserts)) {
//         return new Inserts(template, data);
//     }
//     this._rawDBType = true;
//     this.formatDBType = function () {
//         return data.map(d=>'(' + pgp.as.format(template, d) + ')').join(',');
//     };
// }

// var pgp = require('pg-promise')();
// var db = pgp(process.env.DATABASE_URL);

// //

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
// var fs = require('fs');
// var pg = require('pg');
// var copyFrom = require('pg-copy-streams').from;
// var Readable = require('stream').Readable;
//
// pg.connect(process.env.DATABASE_URL, function(err, client, done) {
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

  var user = {};

  console.log('new connection');
  // user stuff

  socket.on('newUser', function(data) {

    var checkForBadWords = function(name) {
      var includesBad = false;
      var badWords = ['fuck', 'cock', 'pus', 'dick', 'bastard', 'cunt', 'ass', 'nig', 'bitch'];
      var numToLetters = {
        1: 'i',
        0: 'o',
        5: 's',
        8: 'b'
      };
      for (var i = 0; i < badWords.length; i++) {
        if (data.username.toLowerCase().indexOf(badWords[i]) !== -1) {
          includesBad = true;
        }
      }
      return includesBad;
    };

    //console.log(JSON.stringify(data), 'newuserdata');
    //console.log(JSON.stringify(user));
    if (data.lat != user.lat && data.long != user.long) {
      return socket.emit('SUCK it HACKz0r');
    } else if (!(data.username.length >= 3 && data.username.length <= 14)) {
      return socket.emit('createUserError', 'Username must be between 3 & 14 characters in length');
    } else if (checkForBadWords(data.username)) {
      return socket.emit('createUserError', 'Don\'t be a dumbass.  No swearing.');
    }
    CityPeople.checkUsernameAvailable(data.username, function(available) {
      console.log('av', available);
      if (!available) { return socket.emit('createUserError', 'Username taken.  Try a different one.'); }
      var hashcode = uuid.v1();
      CityPeople.createNewUser(data.username, hashcode, data.lat, data.long, data.nearestCity, function(result) {
        //console.log('res' + result);
        if (!result) { return socket.emit('createUserError', 'Error creating user'); }
        user = Object.assign({}, result, {
          loggedIn: true
        });
        pointsManager.registerNewPlayer(result.playerid, user.username, socket);
        return socket.emit('createUserSuccess', {
          playerid: result.playerid,
          username: result.username,
          hashcode: result.hashcode,
          points: result.points
        });
      });
    });
  });

  socket.on('verifyUser', function(data) {
    //console.log('verifying ' + JSON.stringify(data) );
    CityPeople.verifyUser(data.playerid, data.hashcode, function(response) {
      if (!response) { return socket.emit('userResponse', false); }
      console.log('about to login ' + data.playerid);
      LandClaims.getAllLandClaimsForPlayer(data.playerid, function(cities) {
        console.log('all land claims', cities);
        console.log('about to login ' + data.playerid);
        var activeEvents = pointsManager.loginUser(data.playerid, socket);
        user = Object.assign({}, response, {
          loggedIn: true
        });

        console.log('user ', JSON.stringify(user));
        socket.emit('userResponse', Object.assign({}, {
          points: response.points,
          cities: cities
        }, activeEvents));
      });
    });
  });

  // city stuff

  socket.on('citiesNearby', function(input) {
    var lat = input.lat;
    var long = input.long;
    user.lat = lat;
    user.long = long;

    CitiesDistance.getCitiesNearby(lat, long, function(cities) {
      socket.emit('citiesNearbyResults', cities);
    });
  });

  socket.on('getCurrentLeader', function(cityid) {
    console.log('getting leader of ' + cityid);
    LandClaims.getCurrentLeader(cityid, function(response) {
      console.log('found ' + JSON.stringify(response));
      socket.emit('currentLeaderFeedback', response);
    });
  });

  socket.on('conquerCity', function(cityObj) {
    // for when cities do not already have a leader "conquer-type: usurp"
    LandClaims.getCurrentLeader(cityObj.cityid, function(response) {
      if (response) {
        console.log('aready found', response);
        return socket.emit('conquerResponse', null);
      }
      pointsManager.registerNewLeader(cityObj, user.playerid, user.username, function(response) {
        if (!response) { return socket.emit('conquerResponse', null); }
        return socket.emit('conquerResponse', response);
      });
    });
  });


  socket.on('getfullleaderboard', function() {
    socket.emit('top10', pointsManager.leaderboard.getTop10WithCities());
  });


  socket.on('attackCity', function(data) {
    console.log(JSON.stringify(data), 'attack');
    var cityObj = data.city;
    var attackingid = data.leader;
    if (!cityObj || !attackingid) {
      return console.log('NOT enough info provided to attackcity');
    }
    LandClaims.getCurrentLeader(cityObj.cityid, function(response) {
      if (response.leaderid !== attackingid || response.leaderid === user.playerid) {
        socket.emit('attackError', 'Attack error: the leader has changed since you loaded the page.');
        return console.log('HACKER', JSON.stringify(response), attackingid);
      }
      console.log('user obj ' + JSON.stringify(user), attackingid, cityObj);
      var attackid = pointsManager.newAttack(user.playerid, user.username, attackingid, cityObj);
      if (!attackid) {
        return socket.emit('attackError', 'Attack error: ' + response.username + ' already under attack from another player.');
      }
      socket.emit('attackConfirm', attackid);
      console.log('')
    });
  });

  socket.on('blockAttack', function(attackid) {
    pointsManager.attackBlock(attackid);
  });


  socket.on('disconnect', function() {
    pointsManager.handleDisconnect(user.playerid);
  });

});


var pointsManager = (function() {
  var playerDb = {};
  var citiesTaken = [];
  var activeAttacks = {};

  return {
    leaderboard: (function() {
      var forTheDay = [];
      var overall = [];

      return {
        getPositionOfPlayer: function(playerid) {
          var index = (function getRelatedIndex() {
            for (var i = 0; i < forTheDay.length; i++) {
              if (forTheDay[i].playerid === playerid) {
                return i;
              }
            }
            return -1;
          })();
          return index;
        },
        update: function(playerid, dataUpdate) {
          console.log(playerid, JSON.stringify(dataUpdate));

          //console.log('top10 gotten', top10[top10.length - 1].points, newscore);

          if (dataUpdate.points) {

            var beforeTop10Pos = this.getPositionOfPlayer(playerid);
            if (dataUpdate.points) playerDb[playerid].points = dataUpdate.points;
            var newscore = playerDb[playerid].points;

            //console.log('updated ');
            //console.log(data);
            this.refreshLeaderboard();
            var afterTop10Pos = this.getPositionOfPlayer(playerid);

            if (afterTop10Pos > 9) { return console.log('not in top 10'); }

            var toPass = {
              username: playerDb[playerid].username,
              points: dataUpdate.points
            };
            if (beforeTop10Pos > 9) {
              // include cities if just breaking into top 10
              console.log(beforeTop10Pos, afterTop10Pos);
              console.log('including playerDb[playerid].cities because new to the leaderboard')
              console.log('playerdb[playerid].cities', JSON.stringify(playerDb[playerid].cities));
              toPass.cities = playerDb[playerid].cities;
            }
            io.sockets.emit('top10update', toPass);
          } else if (dataUpdate.cities) {

            console.log('sending dataupdate.cities');
            playerDb[playerid].cities = dataUpdate.cities;

            if (this.getPositionOfPlayer(playerid) > 9) { return; }

            io.sockets.emit('top10update', {
              username: playerDb[playerid].username,
              cities: playerDb[playerid].cities
            });
            console.log('JSON')
          }
        },
        refreshLeaderboard: function() {
          forTheDay = Object.keys(playerDb).map(function(id) {
            return {
              playerid: Number(id),
              points: playerDb[id].points,
              username: playerDb[id].username
            };
          }).sort(function(a, b) {
            return b.points - a.points;
          }).filter(function(player) {
            return player.points > 0;
          });
        },
        refreshOverallLeaderboard: function() {
          overall = Object.keys(playerDb).map(function(id) {
            return {
              playerid: Number(id),
              dayswon: playerDb[id].dayswon,
              username: playerDb[id].username
            };
          }).filter(function(player) {
            return player.dayswon;
          }).sort(function(a, b) {
            return b.dayswon - a.dayswon;
          });
          return overall;
        },
        getOverall: function() {
          return overall;
        },
        getTop10: function() {
          return forTheDay.slice(0, 10);
        },
        getTop10WithCities: function() {
          return forTheDay
            .slice(0, 10)
            .map(function(player) {
              return Object.assign({}, player, {
                cities: playerDb[player.playerid].cities
              });
            });
        },
        getCurrentWinner: function() {
          return forTheDay[0];
        }
      }
    })(),
    addScoreIncrease: function(claimid, cityid, playerid) {
      console.log(claimid, cityid, playerid);
      playerDb[playerid].timeouts = playerDb[playerid].timeouts || [];
      playerDb[playerid].timeouts.push({
        claimid: claimid,
        cityid: cityid,
        timeout: new setInterval(function() {

          //console.log('incrementing points for ' + playerid);
          // increment city_people.points
          CityPeople.incrementPlayer(playerid, function(data) {
            if (!data) { return console.log('uh oh error updating player'); }
            var newUserpoints = data.points;
            // increment land_claims.points
            LandClaims.incrementLandClaim(claimid, function(data) {
              if (!data) { return console.log('uh oh error updating land claim'); }
              // socket emit points increase
              pointsManager.sendTo(playerid, 'pointsUpdate', newUserpoints);
              pointsManager.leaderboard.update(playerid, {
                points: newUserpoints
              });
              // console.log('succesfully updated points for player ' + playerid);
            });
          });
        }, 10000),
      });
    },
    init: function() {
      console.log('initting');

      // clear all pointIncrease interval
      Object.keys(playerDb).forEach(function(playerid) {
        var player = playerDb[playerid];
        console.log('deleting player ' + player.username);
        if (!player.timeouts) { return; }
        player.timeouts.forEach(function(timeoutObj) {
          console.log('stopping point increase for ' + player.username);
          clearInterval(timeoutObj.timeout);
        });
      });

      // clear out any past activeAttacks timeouts
      Object.keys(activeAttacks).forEach(function(attackid) {
        console.log('deleting attack ' + attackid);
        var attack = activeAttacks[attackid];
        clearTimeout(attack.timeout);
        activeAttacks[attackid] = null;
        delete activeAttacks[attackid];
      });

      CityPeople.getAllPlayers(function(players) {
        console.log('all players: ');
        console.log(JSON.stringify(players, null, 2));
        // need playerid and points, username
        if (!players) return;
        players.forEach(function(player) {
          playerDb[player.playerid] = playerDb[player.playerid] || {};
          playerDb[player.playerid].dayswon = player.dayswon;
          playerDb[player.playerid].points = player.points;
          playerDb[player.playerid].username = player.username;
          playerDb[player.playerid].attacksLeft = 3;
          playerDb[player.playerid].cities = [];
          playerDb[player.playerid].dayswon = [];
        });

        citiesTaken = [];
        LandClaims.getAllLandClaims(function(claims) {
          console.log(claims);
          claims.forEach(function(claim) {
            pointsManager.addScoreIncrease(claim.claimid, claim.cityid, claim.leaderid);
            playerDb[claim.leaderid].cities.push(claim.cityname);
            citiesTaken.push(claim.cityid);
          });

          pointsManager.leaderboard.refreshLeaderboard();
          pointsManager.leaderboard.refreshOverallLeaderboard();

        });

      });
    },
    incrementDaysWon: function(playerid, cb) {
      console.log('updating database with dayswon ...')
      CityPeople.update({
        data: {
          dayswon: dayswon + 1
        },
        where: {
          playerid: playerid
        }
      }, function() {
        console.log('updating playerdb...')
        playerDb[playerid].dayswon = (playerDb[playerid].dayswon) ? playerDb[playerid].dayswon + 1 : 1;
        console.log('refreshing overall leaderboard');
        io.sockets.emit('overallLeaderboard', pointsManager.leaderboard.refreshOverallLeaderboard());
        if (cb) cb();
      });

    },
    registerNewPlayer: function(playerid, username, socket) {
      playerDb[playerid] = {
        username: username,
        socket: socket,
        cities: [],
        points: 0,
        attacksLeft: 3
      };
    },
    loginUser: function(playerid, socket) {
      if (!playerDb[playerid]) {
        return console.log('we have a problem.  user ' + playerid + ' tried to login but we have no account of them');
      }

      //console.log('logged in ' + playerid + 'socket', socket);
      playerDb[playerid].socket = socket;
      return {
        missedAttacks: playerDb[playerid].missedAttacks,
        activeAttacksIncoming: Object.keys(activeAttacks).filter(function(attackid) {
          return activeAttacks[attackid].attacking === playerid;
        }).map(function(attackid) {
          return {
            city: activeAttacks[attackid].cityObj,
            attackid: attackid,
            attacker: activeAttacks[attackid].attacker
          };
        }),
        activeAttacksOutgoing: Object.keys(activeAttacks).filter(function(attackid) {
          return activeAttacks[attackid].attacker === playerid;
        }).map(function(attackid) {
          return {
            attacking: playerDb[activeAttacks[attackid].attacking].username,
            cityname: activeAttacks[attackid].cityObj.cityname
          };
        }),
        overallLeaderboard: pointsManager.leaderboard.getOverall(),
        attacksLeft: playerDb[playerid].attacksLeft
      };
    },
    registerNewLeader(cityObj, playerid, username, cb) {
      console.log('registering new leader ', cityObj.cityname, playerid);

      if (!username || !playerid || !cityObj) { return cb(null); }
      if (citiesTaken.indexOf(cityObj.cityid) !== -1) { return cb(null); }
      LandClaims.claimLand(cityObj.cityid, cityObj.cityname, username, playerid, function(response) {
        // when land_claims db has been updated and there was no previous leader
        pointsManager.addToCitiesAndUpdate(playerid, cityObj.cityname);
        pointsManager.addScoreIncrease(response.claimid, cityObj.cityid, playerid);
        citiesTaken.push(cityObj.cityid);
        cb({ cityname: cityObj.cityname });
      });

    },
    handleDisconnect: function(playerid) {
      if (playerDb[playerid]) playerDb[playerid].socket = null;
    },
    addToCitiesAndUpdate: function(id, cityname) {
      pointsManager.leaderboard.update(id, {
        cities: playerDb[id].cities.concat([cityname])
      });
    },
    newAttack: function(playerid, playerusername, attackingid, cityObj) {

      if (Object.keys(activeAttacks).filter(function(attackid) {
        return activeAttacks[attackid].attacking === attackingid;
      }).length) {
        // someone already attacking this user
        return null;
      }

      if (playerDb[playerid].attacksLeft === 0) {
        return null;
      }
      playerDb[playerid].attacksLeft--;

      var attackid = uuid.v1();
      activeAttacks[attackid] = {
        attacker: playerid,
        attacking: attackingid,
        cityObj: cityObj,
        timeout: new setTimeout(function() {
          console.log('attack won, ' + playerid + ' took ' + cityObj.cityname + ' from ' + attackingid);

          var claimLandAndUpdate = function() {
            LandClaims.claimLand(cityObj.cityid, cityObj.cityname, playerusername, playerid, function(response) {
              if (!response) { return console.log('error making land claim inactive '); }
              pointsManager.addScoreIncrease(response.claimid, cityObj.cityid, playerid);
              pointsManager.sendTo(playerid, 'tookControl', cityObj);
              // remove from city from attackingid's cities

              pointsManager.leaderboard.update(attackingid, {
                cities: playerDb[attackingid].cities.filter(function(city) {
                  city !== cityObj.cityname;
                })
              });

              pointsManager.leaderboard.update(playerid, {
                cities: playerDb[playerid].cities.concat([cityObj.cityname])
              });

              var receivedNotice = pointsManager.sendTo(attackingid, 'dethroned', {
                thief: playerusername,
                cityName: cityObj.cityname
              });
              if (!receivedNotice) {
                console.log('no did not receive notice')
                playerDb[attackingid].missedAttacks = playerDb[attackingid].missedAttacks || [];
                playerDb[attackingid].missedAttacks.push({
                  thief: playerusername,
                  cityName: cityObj.cityname
                });
              }
              activeAttacks[attackid] = null;
              delete activeAttacks[attackid];
            });
          };

          (function makeRelatedClaimInactive() {
            var relatedClaimId;
            // remove score increment timeout from attackers' timeouts
            for (var i=0 ; i<playerDb[attackingid].timeouts.length; i++) {
                if (playerDb[attackingid].timeouts[i].cityid === cityObj.cityid) {
                  relatedClaimId = playerDb[attackingid].timeouts[i].claimid;
                  clearInterval(playerDb[attackingid].timeouts[i].timeout); // stop interval
                  playerDb[attackingid].timeouts.splice(i);                 // remove timeout object
                }
            }
            console.log(relatedClaimId);

            if (!relatedClaimId) {
              console.log('unable to find related landclaim...but moving on....');
              return claimLandAndUpdate();
            } else {
              LandClaims.makeLandClaimInactive(relatedClaimId, function(response) {
                if (!response) { return console.log('error making land claim inactive '); }
                return claimLandAndUpdate();
              });
            }
          })();

        }, 60000)
      };

      console.log('set up new attack', attackid);

      pointsManager.sendTo(attackingid, 'beingAttacked', {
        city: cityObj,
        attackid: attackid,
        attacker: playerusername
      });

      return attackid;

    },
    attackBlock: function(attackid) {
      if (!activeAttacks[attackid]) {
        return console.log('WOAH THERE someone is attacking ' + attackid + ' and it doesn\'t exist');
      }

      pointsManager.sendTo(activeAttacks[attackid].attacker, 'attackFailed');
      pointsManager.sendTo(activeAttacks[attackid].attacking, 'attackBlockSuccess');

      clearTimeout(activeAttacks[attackid].timeout);
      activeAttacks[attackid] = null;
      delete activeAttacks[attackid];
    },
    sendTo: function(playerid, evt, obj) {
      // console.log('sending ' + evt + ' and ' + JSON.stringify(obj) + ' to ' + playerid);
      if (playerDb[playerid].socket) {
        playerDb[playerid].socket.emit(evt, obj);
        return true;
      }
      // console.log('couldnt get through')
      return false;
    }
  };
})();

pointsManager.init();


//
var async = require('async');
const { query } = require('express');
var CronJob = require('cron').CronJob;
(function scheduler() {

  var endOfDay = function() {
    // reset scores to 0 in pointsmanager and db

    console.log('running endOfDay', Date.now());

    async.waterfall([
      function(cb) {
        console.log('working out the winner of the day...')
        var winner = pointsManager.leaderboard.getCurrentWinner();
        console.log('winner: ' + winner.username + ', id: ' + winner.playerid);

        pointsManager.incrementDaysWon(winner.playerid, function() {
          console.log('done incrementing dayswon')
          cb();
        });
      },
      function(cb) {
        console.log('now resetting points to 0')
        CityPeople.update({
          data: {
            points: 0
          }
        }, function() {
          console.log('done with that')
          cb();
        });
      },
      function(cb) {
        console.log('reinniting pointsmanager and notifying connected clients')
        pointsManager.init();
        io.sockets.emit('newDay');
      }
    ]);

  };

  var endOfWeek = function() {
    // set all landclaims to inactive, notify pointsmanager

    console.log('running endOfWeek', Date.now());
    async.waterfall([
      function(cb) {
        CityPeople.update({
          data: {
            points: 0
          }
        }, function() {
          console.log('done with that')
          cb();
        });
      },
      function(cb) {
        console.log('making all land claims inactive')
        LandClaims.update({
          data: {
            isactive: false
          }
        }, function() {
          console.log('done')
          cb();
        });
      }, function(cb) {
        console.log('reinitting pointsmanager and notifying clients of newweek')
        pointsManager.init();
        io.sockets.emit('newWeek');
      }
    ]);

  };

  [{
    // every night at 12:00am
    pattern: '0 0 */6 * * *',
    fn: endOfDay
  }, {
    // every sunday night / monday morning 12:03am
    pattern: '0 0 0 * * *',
    fn: endOfWeek
  }].forEach(function(toTakePlace) {
    console.log({ toTakePlace })
    new CronJob(toTakePlace.pattern, toTakePlace.fn, null, true, "America/New_York");
  });

})();
