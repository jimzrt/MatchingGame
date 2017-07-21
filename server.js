var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var mysql = require('promise-mysql');
var Promise = require("bluebird");
//var path = require('path'); //express middleware für static files, benötigt um in node js css zu laden


connections = [];
var id;
var room;
var rcount = 0;
var matches = []
var score = 1000;

var factor;
var factorq1;
var factorq2;
var highscorelist = [];

var dbconnect = mysql.createPool({
    host: 'w00feb69.kasserver.com',
    user: 'd02720cc',
    password: 'W92rq5oNdyVWNxbt',
    database: 'd02720cc'
});

// dbconnect.connect(function(error){
//     if(!!error){
//         console.log('Error while connecting to DB')
//     }else{
//         console.log('Connected to DB');
//     }
// });

server.listen(process.env.PORT || 3000);
console.log('Server running...');

//app.use(express.static(path.join(__dirname, 'public')));    ////benötigt um in node js css zu laden; im public ordner
app.use('/css', express.static('css')) //jeder /css request an middleware wird mit ordner css verlinkt; stellt static files bereit

app.get('/', function(req, res) { //middleware: '/' request wird gemacht und result als ergebnis ausgeführt
    res.sendFile(__dirname + '/index.html');
    //mysql
});

//title Array Shufflen
function swap(array, pos1, pos2) {
    var temp = array[pos1];
    array[pos1] = array[pos2];
    array[pos2] = temp;
}

function shuffle(array) {

    for (var i = array.length - 1; i >= 1; i--) {
        swap(array, Math.floor(Math.random() * i), i);
    }
}

function getShuffledArray(array) {
    var temp = array.slice();
    shuffle(temp);
    return temp;
}

var isArray = Array.isArray || function(value) {
    return {}.toString.call(value) !== "[object Array]"
};

function shuffleMultiple() {
    var arrLength = 0;
    var argsLength = arguments.length;
    var rnd, tmp;

    for (var index = 0; index < argsLength; index += 1) {
        if (!isArray(arguments[index])) {
            throw new TypeError("Argument is not an array.");
        }

        if (index === 0) {
            arrLength = arguments[0].length;
        }

        if (arrLength !== arguments[index].length) {
            throw new RangeError("Array lengths do not match.");
        }
    }

    while (arrLength) {
        rnd = Math.floor(Math.random() * arrLength);
        arrLength -= 1;
        for (argsIndex = 0; argsIndex < argsLength; argsIndex += 1) {
            tmp = arguments[argsIndex][arrLength];
            arguments[argsIndex][arrLength] = arguments[argsIndex][rnd];
            arguments[argsIndex][rnd] = tmp;
        }
    }
}



function rndFaktor(roomt, titles, factorlist, actors) {
    var temptitles = [];
    var posters = [];
    var infos = [];
    if (factorlist.includes(factor == true)) {
        factor = Math.floor((Math.random() * 20) + 3);
    } else {
        factorlist.push(factor);
        dbconnect.query("SELECT m.movielens_id, m.title_de, m.title, m.original_title, m.poster_link From movies AS m, item_factor_values AS i WHERE i.item_id = m.movielens_id AND i.factor_index NOT IN (0,1,2) AND i.factor_index = ? ORDER BY i.value DESC LIMIT 5", [factor]).then(results => {

            console.log('Successful query');

            for (var i = 0; i < 5; i++) {

                //infos
                //infos.push(getInfo(results[i].movielens_id));

                if (results[i].title_de !== null) {
                    temptitles.push(results[i].title_de);

                } else if (results[i].title !== null) {
                    temptitles.push(results[i].title);
                } else {
                    temptitles.push(results[i].original_title);
                } // posters.push(results[i].poster_link);

                posters.push(results[i].poster_link);
                infos.push(getInfo(results[i].movielens_id));

            }
            console.log('Pre-shuffle: ' + temptitles + ' new factor:' + factor + ' list:' + factorlist);
            shuffleMultiple(temptitles, posters, infos);

            temptitles = temptitles.slice(0, 3);
            posters = posters.slice(0, 3);
            infos.slice = infos.slice(0, 3);

            // titles = getShuffledArray(temptitles);
            // //Poster links in ein Array, reihenfolge entspricht dem geshufflten Array
            // for (var i = 0; i < 3; i++) {
            //     for (var j =0; j < titles.length ; j++) {
            //         if(titles[i]== results[j].title_de || titles[i]== results[j].title ||titles[i]== results[j].original_title){
            //              posters.push(results[j].poster_link);
            //              infos.push(getInfo(results[j].movielens_id));

            //         }
            //      }
            // }
            io.sockets.in(roomt).emit('title', temptitles);
            io.sockets.in(roomt).emit('poster', posters);
            // console.log(infos);
            Promise.all(infos).then(values => {
                console.log("yea yea");
                //  console.log(values);
                io.sockets.in(roomt).emit('infos', values); //console.log(values); // [3, 1337, "foo"] 
            });
            //  io.sockets.in(roomt).emit('infos', infos);

            console.log(titles + ' new factor:' + factor + ' list:' + factorlist);
            factor = Math.floor((Math.random() * 20) + 3);

        });

    }
}
//     //Infos zu Filmen auf Datenbank laden : Funktioniert nicht 
// function extraInfo(titles, roomt){
//     var directors=[];
//     factorq2= dbconnect.query("SELECT a.id,a.name AS actor, mc.character_name,d.name AS director,m.movielens_id,m.original_title, m.title, m.title_de,m.release_date, mc.importance From movies AS m, actors AS a, movies_cast AS mc, directors AS d, movies_directors AS md WHERE mc.movie_movielens_id = m.movielens_id AND mc.actor_id=a.id AND md.movie_movielens_id = m.movielens_id AND md.director_id=d.id ORDER BY mc.importance ASC", function (err, results){
//         if(err){
//             console.log(err);
//         }else{
//             for (var i = 0; i < 3; i++) {
//                 for (var j =0; j < titles.length ; j++) {
//                     if(titles[i]== results[j].title_de || titles[i]== results[j].title ||titles[i]== results[j].original_title){
//                              directors.push(results[0].director);
//                         }

//                 }   
//             }
//             io.sockets.in(roomt).emit('infos', directors);
//             console.log(results[0].director);
//         }
//     })
// }

function getInfo(movielens_id) {
    return dbconnect.query("SELECT directors.name, directors.image_link from directors inner join movies_directors on directors.id = movies_directors.director_id where movies_directors.movie_movielens_id = ?", [movielens_id]);
}



io.sockets.on('connection', function(socket) {
    connections.push(socket);
    console.log('Connected: %s sockets connected', connections.length);
    id = socket.id;
    var roomt;
    console.log(id);
    var tmsg; //temp message
    var timeleft = 4;
    var time = 0;
    var Countdown;
    var Timer;
    var temptimer;
    var currentscore;


    var actors = [];
    var titles = [];
    var factorlist = [];
    // rcount=connections.length+1;
    if (rcount == 1) {
        socket.join(room);
        rcount = 0;

        //10 sec Countdown
        Countdown = setInterval(function() {
            timeleft--;
            io.sockets.in(roomt).emit('partner joined', timeleft);
            factor = Math.floor((Math.random() * 20) + 3);
            if (timeleft <= 0) {
                clearInterval(Countdown);
            }
        }, 1000);

    } else if (rcount == 0) {
        room = Math.floor((Math.random() * 100) + 1);
        socket.join(room);
        rcount = 1;
        //socket.emit('new room', rcount);
    }
    roomt = room;

    console.log(room);






    socket.on('ingame Timer', function() {
        // extraInfo(titles, roomt);
        rndFaktor(roomt, titles, factorlist);

        //Timer ingame
        if (timeleft == 0) {
            Timer = setInterval(function() {
                time++;
                var mins = Math.floor(time / 60);
                var secs = Math.floor(time % 60); // % : verwendet übertrag um nur bis 60 zu zählen


                if (mins < 10) {
                    mins = "0" + mins;
                }
                if (secs < 10) {
                    secs = "0" + secs;
                }

                io.sockets.in(roomt).emit('timer ausgeben', mins, secs);

            }, 1000);
        }
        //score

        temptimer = setInterval(function() {

            if (score !== 0) {
                score = score - 50;
            }
        }, 10000);

    })


    //Disconnect
    socket.on('disconnect', function(data) {
        connections.splice(connections.indexOf(socket), 1);
        titles.splice(0, 3);
        console.log('Disconnect: %s sockets connected', connections.length);
        io.sockets.in(roomt).emit('partner left', data);
        //    factorlist.splice(0);
    });
    //Send Message
    socket.on('send message', function(data) { //Abfangen von Client
        tmsg = data;
        socket.emit('new message', {
            msg: data
        }); //emit new message und sende message in form von data
        console.log('send in Room:' + roomt);
        console.log('Found Matches:' + matches + score);
    });


    socket.on('eingaben', function(data) {
        console.log(data);
        socket.broadcast.to(roomt).emit('überprüfe', tmsg);

    });
    socket.on('current score', function(data) {
        currentscore = data;
        dbconnect.query("insert into highscore(Points) Values (?)", [currentscore]);
        dbconnect.query("SELECT points FROM highscore ORDER BY Points DESC LIMIT 10").then(results => {
            for (var i = 0; i < 5; i++) {
                highscorelist.push(results[i].points);
            }

        });
        io.sockets.emit('add to highscore', highscorelist);
        highscorelist.length = 0;
    });
    //falls Partner während des countdowns spiel verlässt wird countdown abgebrochen
    socket.on('countdown abbrechen', function() {
        clearInterval(Countdown);

    })
    socket.on('timer abbrechen', function() {
        clearInterval(Timer);
        clearInterval(temptimer);
    })

    socket.on('save match', function(data) {

        matches.push(data);
        io.sockets.in(roomt).emit('match found');
        io.sockets.in(roomt).emit('points', score);
        score = 1000;
        factorq1 = dbconnect.query("insert into testbez(factor_index, Bezeichnung) Values (?,?)", [factor, data], function(err, results) {}); //Match word in DB einfügen
        if (factorlist.length == 2) { //5+1 da erster bei beiden drinne
            io.sockets.in(roomt).emit('Runde Ende');

        }
        //   rndFaktor(roomt, titles, factorlist);
        //extraInfo(titles, roomt);
        // io.sockets.in(roomt).emit('title', titles);
        titles.splice(0, 3);
    })
});