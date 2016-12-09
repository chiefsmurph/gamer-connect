console.log('DB URL!!! ' + process.env.DATABASE_URL + '?ssl=true');

var uuid = require('uuid');
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

app.get('*', function(req, res){
    res.set('Content-Type', 'text/html')
        .sendfile(__dirname + '/public/index.html');
});



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
  executeQuery: function(q, callback) {
    pg.connect(process.env.DATABASE_URL + '?ssl=true', function(err, client, done) {
      //CREATE TABLE pointss (dbId serial primary key, username VARCHAR(30) not null, points INT, handshake VARCHAR(60))
      var query = client.query(q, function(err, result) {
        done();
        if (err) {
          console.log(err);
          return callback(null);
        }
        //console.log('executed query ' + q);
        return callback((result && result.rows) ? result.rows : null);
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
      client.query('SELECT * FROM cities_distance WHERE earth_box(ll_to_earth(' + lat + ', ' + long + '), 50000) @> ll_to_earth(lat, long)', function(err, result) {
        done();
        if (err) console.log(err);
        var returnResult = addDistance(result.rows);
        console.log('found near ' + returnResult[0].cityname);
        callback(returnResult);

      });
    });
  },
  checkUsernameAvailable: function(username, callback) {
    this.executeQuery('SELECT * FROM city_people WHERE username = \'' + username + '\'', function(response) {
      console.log('response', response);
      callback(!response.length);
    });
  },
  createNewUser: function(username, lat, long, nearestCity, callback) {

    var handshake = uuid.v1();

    pg.connect(process.env.DATABASE_URL + "?ssl=true", function(err, client, done) {
      var queryText = 'INSERT INTO city_people (username, hashcode, lat, long, nearestCity) VALUES($1, $2, $3, $4, $5) RETURNING *';
      client.query(queryText, [username, handshake, lat, long, nearestCity], function(err, result) {

        if (err)  console.error(err);

        done();
        console.log('created new user ' + JSON.stringify(result.rows[0], null, 2));
        callback((result && result.rows && result.rows[0]) ? result.rows[0] : null);

      });
    });

  },
  verifyUser: function(playerid, hashcode, callback) {
    pg.connect(process.env.DATABASE_URL + '?ssl=true' , function(err, client, done) {
      //client.query('SELECT * FROM cities_distance WHERE power(lat - ' + lat + ', 2) + power(long - ' + long +', 2) < 1000', function(err, result) {
      client.query('SELECT * FROM city_people WHERE playerid = ' + playerid + ' AND hashcode = \'' + hashcode + '\'', function(err, result) {
        done();
        if (err) console.log(err);
        callback((result && result.rows && result.rows[0]) ? result.rows[0] : false);

      });
    });
  },
  getCurrentLeader: function(cityid, callback) {
    pg.connect(process.env.DATABASE_URL + '?ssl=true' , function(err, client, done) {
      //client.query('SELECT * FROM cities_distance WHERE power(lat - ' + lat + ', 2) + power(long - ' + long +', 2) < 1000', function(err, result) {
      client.query('SELECT * FROM land_claims WHERE cityid = ' +cityid + ' AND isActive = true ORDER BY claimDate DESC LIMIT 1', function(err, result) {
        done();
        if (err) console.log(err);
        callback((result && result.rows && result.rows[0]) ? {
          leaderid: result.rows[0].leaderid,
          username: result.rows[0].leadername
        } : null);

      });
    });
  },
  getAllPlayers: function(callback) {
    pg.connect(process.env.DATABASE_URL + '?ssl=true' , function(err, client, done) {
      //client.query('SELECT * FROM cities_distance WHERE power(lat - ' + lat + ', 2) + power(long - ' + long +', 2) < 1000', function(err, result) {
      client.query('SELECT * FROM city_people', function(err, result) {
        done();
        if (err) console.log(err);
        if (!(result && result.rows && result.rows.length)) {
          return callback(null);
        }
        callback(result.rows.map(function(row) {
          return {
            playerid: row.playerid,
            points: row.points,
            username: row.username
          };
        }));
      });
    });
  },
  incrementPlayer: function(playerid, callback) {
    this.executeQuery('UPDATE city_people SET points = points + 10 WHERE playerid = ' + playerid + ' RETURNING *', function(result) {
      //console.log(result);
      callback(result[0]);
    });
  },
  incrementLandClaim: function(claimid, callback) {
    this.executeQuery('UPDATE land_claims SET points = points + 10 WHERE claimid = ' + claimid + ' RETURNING *', function(result) {
      //console.log(result);
      callback(result[0]);
    });
  },
  claimLand: function(cityid, cityname, username, userid, callback) {
    //console.log(cityid, cityname, username, userid, lat, long);
    pg.connect(process.env.DATABASE_URL + "?ssl=true", function(err, client, done) {
      var queryText = 'INSERT INTO land_claims (cityid, cityname, leadername, leaderid) VALUES($1, $2, $3, $4) RETURNING *';
      client.query(queryText, [cityid, cityname, username, userid], function(err, result) {

        if (err)  console.error(err);

        done();
        console.log('created new land claim ' + JSON.stringify(result.rows[0], null, 2));
        callback((result && result.rows && result.rows[0]) ? result.rows[0] : null);

      });
    });
  },
  getAllLandClaims: function(callback) {
    this.executeQuery('SELECT * FROM land_claims WHERE isActive = true', callback);
  },
  getAllLandClaimsForPlayer: function(playerid, callback) {
    this.executeQuery('SELECT * FROM land_claims WHERE leaderid = \'' + playerid + '\' AND isActive = true', function(claims) {
      if (!claims) { return callback(false); }
      callback(claims.map(function(city) {
        return city.cityname;
      }));
    });
  },
  makeLandClaimInactive: function(claimid, callback) {
    this.executeQuery('UPDATE land_claims SET isActive = false WHERE claimid = ' + claimid + ' RETURNING *', function(result) {
      console.log(!!result, 'update land claim?');
      callback(!!result);
    });
  }
};

//dbFunctions.executeQuery('CREATE TABLE cities_distance (cityId serial primary key, cityName VARCHAR(70) not null, country VARCHAR(70), adminCode VARCHAR(70), population integer, lat float not null, long float not null)');
//CREATE TABLE city_people (playerId serial primary key, username VARCHAR(70) not null, hashcode VARCHAR(70) not null, joinDate timestamp without time zone default (now() at time zone 'utc'), points integer default 0, isBanned boolean default false, lat float not null, long float not null, nearestCity varchar(70) not null)

//CREATE TABLE land_claims (claimId serial primary key, cityId integer not null, cityName VARCHAR(70) not null, leadername VARCHAR(70) not null, leaderid integer not null, claimDate timestamp without time zone default (now() at time zone 'utc'), points integer default 0, isActive boolean default true)

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

  var user = {};

  console.log('new connection');
  // user stuff

  socket.on('newUser', function(data) {
    console.log(JSON.stringify(data), 'newuserdata');
    console.log(JSON.stringify(user));
    if (data.lat === user.lat && data.long === user.long) {
      if (!(data.username.length > 3 && data.username.length < 14)) {
        return socket.emit('createUserError', 'Username must be between 3 & 14 characters in length');
      }
      dbFunctions.checkUsernameAvailable(data.username, function(available) {
        console.log('av', available);
        if (!available) { return socket.emit('createUserError', 'Username taken.  Try a different one.'); }
        dbFunctions.createNewUser(data.username, data.lat, data.long, data.nearestCity, function(result) {
          console.log('res' + result);
          if (result) {
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
          } else {
            return socket.emit('createUserError', 'Error creating user');
          }
        });
      });
    }
  });

  socket.on('verifyUser', function(data) {
    console.log('verifying ' + JSON.stringify(data) );
    dbFunctions.verifyUser(data.playerid, data.hashcode, function(response) {
      if (!response) { return socket.emit('userResponse', false); }
      dbFunctions.getAllLandClaimsForPlayer(data.playerid, function(cities) {
        console.log('all land claims', cities);
        pointsManager.loginUser(data.playerid, socket);
        user = Object.assign({}, response, {
          loggedIn: true
        });
        console.log(JSON.stringify(response) + 'res');
        socket.emit('userResponse', {
          points: response.points,
          cities: cities
        });
      });
    });
  });

  // city stuff

  socket.on('citiesNearby', function(input) {
    var lat = input.lat;
    var long = input.long;
    user.lat = lat;
    user.long = long;

    dbFunctions.getCitiesNearby(lat, long, function(cities) {
      socket.emit('citiesNearbyResults', cities);
    });
  });

  socket.on('getCurrentLeader', function(cityid) {
    console.log('getting leader of ' + cityid);
    dbFunctions.getCurrentLeader(cityid, function(response) {
      console.log('found ' + JSON.stringify(response));
      socket.emit('currentLeaderFeedback', response);
    });
  });

  socket.on('conquerCity', function(cityObj) {
    // for when cities do not already have a leader "conquer-type: usurp"
    dbFunctions.getCurrentLeader(cityObj.cityid, function(response) {
      if (response) {
        return socket.emit('conquerResponse', null);
      }
      dbFunctions.claimLand(cityObj.cityid, cityObj.cityname, user.username, user.playerid, function(response) {
        if (response) {
          pointsManager.registerNewLeader(response.claimid, cityObj.cityid, user.playerid);
        }
        return socket.emit('conquerResponse', response);
      });
    });
  });


  socket.on('getfullleaderboard', function() {
    socket.emit('top10', pointsManager.leaderboard.getTop10());
  });


  socket.on('attackCity', function(data) {
    console.log(JSON.stringify(data), 'attack');
    var cityObj = data.city;
    var attackingid = data.leader;
    dbFunctions.getCurrentLeader(cityObj.cityid, function(response) {
      if (response.leaderid !== attackingid) {
        return console.log('HACKER', JSON.stringify(response), attackingid);
      }
      var attackid = pointsManager.newAttack(user.playerid, user.username, attackingid, data.city);
      socket.emit('attackConfirm', attackid);
      pointsManager.sendTo(attackingid, 'beingAttacked', {
        city: data.city,
        attackid: attackid,
        attacker: user.username
      });
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
  var activeAttacks = {};

  return {
    leaderboard: (function() {
      var data = [];
      return {
        add: function(playerObj) {
          data.push(playerObj);
          data.sort(function(a, b) {
            return b.points - a.points;
          });
        },
        update: function(playerid, newscore) {
          data.filter(function(obj) {
            return obj.playerid === playerid;
          })[0].points = newscore;
          //console.log('updated ');
          //console.log(data);

          var top10 = this.getTop10();
          //console.log('top10 gotten', top10[top10.length - 1].points, newscore);
          if (newscore >= top10[top10.length - 1].points) {
            io.sockets.emit('top10scoreupdate', {
              username: playerDb[playerid].username,
              points: newscore
            });
          }
        },
        getTop10: function() {
          return data.filter(function(data) {
            return data.points > 0;
          }).slice(0, 10);
        }
      }
    })(),
    addScoreIncrease: function(claimid, cityid, playerid) {
      //console.log(claimid, cityid, playerid);
      playerDb[playerid].timeouts.push({
        claimid: claimid,
        cityid: cityid,
        timeout: new setInterval(function() {

          console.log('incrementing points for ' + playerid);
          // increment city_people.points
          dbFunctions.incrementPlayer(playerid, function(data) {
            if (!data) { return console.log('uh oh error updating player'); }
            var newUserpoints = data.points;
            // increment land_claims.points
            dbFunctions.incrementLandClaim(claimid, function(data) {
              if (!data) { return console.log('uh oh error updating land claim'); }
              // socket emit points increase
              pointsManager.sendTo(playerid, 'pointsUpdate', newUserpoints);

              pointsManager.leaderboard.update(playerid, newUserpoints);
              console.log('succesfully updated points for player ' + playerid);
            });
          });
        }, 10000),
      });
    },
    init: function() {
      dbFunctions.getAllPlayers(function(players) {
        console.log('all players: ');
        console.log(JSON.stringify(players, null, 2));
        // need playerid and points, username
        if (!players) return;
        players.forEach(function(player) {
          playerDb[player.playerid] = {};
          playerDb[player.playerid].timeouts = [];
          playerDb[player.playerid].points = player.points;
          playerDb[player.playerid].username = player.username;

          pointsManager.leaderboard.add({
            playerid: player.playerid,
            username: player.username,
            points: player.points
          });
        });

        dbFunctions.getAllLandClaims(function(claims) {
          console.log(claims);
          claims.forEach(function(claim) {
            pointsManager.addScoreIncrease(claim.claimid, claim.cityid, claim.leaderid);
          }.bind(this));
        }.bind(this));


      });
    },
    registerNewPlayer: function(playerid, username, socket) {
      playerDb[playerid] = {
        username: username,
        socket: socket,
        points: 0,
        timeouts: []
      };
      this.leaderboard.add({
        playerid: playerid,
        username: username,
        points: 0
      });
    },
    loginUser: function(playerid, socket) {
      if (!playerDb[playerid]) {
        return console.log('we have a problem.  user ' + playerid + ' tried to login but we have no account of them');
      }
      playerDb[playerid].socket = socket;
    },
    registerNewLeader(claimid, cityid, playerid) {
      console.log('registering new leader ', cityid, playerid);
      // when land_claims db has been updated and there was no previous leader
      this.addScoreIncrease(claimid, cityid, playerid);
    },
    handleDisconnect: function(playerid) {
      if (playerDb[playerid]) playerDb[playerid].socket = null;
    },
    newAttack: function(playerid, playerusername, attackingid, cityObj) {
      var attackid = uuid.v1();
      activeAttacks[attackid] = {
        attacker: playerid,
        attacking: attackingid,
        cityObj: cityObj,
        timeout: new setTimeout(function() {
          console.log('attack won, ' + playerid + ' took ' + cityObj.cityname + ' from ' + attackingid);
          var relatedClaimId;
          // remove score increment timeout from attackers' timeouts
          for (var i=0 ; i<playerDb[attackingid].timeouts.length; i++) {
              if (playerDb[attackingid].timeouts[i].cityid === cityObj.cityid) {
                relatedClaimId = playerDb[attackingid].timeouts[i].claimid;
                clearInterval(playerDb[attackingid].timeouts[i].timeout); // stop interval
                playerDb[attackingid].timeouts.splice(i);                 // remove timeout object
              }
          }

          dbFunctions.makeLandClaimInactive(relatedClaimId, function(response) {
            if (!response) { return console.log('error making land claim inactive '); }
            dbFunctions.claimLand(cityObj.cityid, cityObj.cityname, playerusername, playerid, function(response) {
              if (!response) { return console.log('error making land claim inactive '); }
              pointsManager.addScoreIncrease(response.claimid, cityObj.cityid, playerid);
              pointsManager.sendTo(playerid, 'tookControl', cityObj);
              pointsManager.sendTo(attackingid, 'dethroned', cityObj);
            });

          });
        }, 60000)
      };

      return attackid;
      console.log('set up new attack', attackid);
    },
    attackBlock: function(attackid) {
      if (!activeAttacks[attackid]) {
        return console.log('WOAH THERE someone is attacking ' + attackid + ' and it doesn\'t exist');
      }
      clearTimeout(activeAttacks[attackid].timeout);
      pointsManager.sendTo(activeAttacks[attackid].attacker, 'attackFailed');
      pointsManager.sendTo(activeAttacks[attackid].attacking, 'attackBlockSuccess');
    },
    sendTo: function(playerid, evt, obj) {
      if (playerDb[playerid].socket) {
        console.log('sent ' + evt);
        playerDb[playerid].socket.emit(evt, obj);
      }
    }
  };
})();

pointsManager.init();
