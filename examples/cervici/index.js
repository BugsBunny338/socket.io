var server = require('http').createServer();
var port = process.env.PORT || 3003;

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

var io = require('../..')(server);

var counterId = 1;
var width = 600;
var height = 300;

var Consts = {};

Consts.COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
];

Consts.USER_STATE = {
    IDLE: 'IDLE',
    READY: 'READY',
    PLAYING: 'PLAYING'
};

Consts.GAME_STATE = {
    IDLE: 'IDLE',
    COUNTDOWN: 'COUNTDOWN',
    PLAYING: 'PLAYING'
};

var appState = {
    users: [],
    game: {
        width: width,
        height: height,
        state: Consts.GAME_STATE.IDLE,
        board: (function() {
            var arr = [];
            for (var i = 0; i < width * height; i++) {
                arr[i] = null;
            }
            return arr;
        }())
    }
};

io.on('connection', function(socket) {
    // console.log('someone connected!!!');
    // socket.emit('welcome message', { foo: 'bar' });
    // socket.broadcast.emit('welcome message (broadcast)', { foo: 'bar' });

    socket.emit('CONNECTED', {
        users: appState.users
    });

    socket.on('LOGIN', function (username) {
        if (socket.userId) return;

        console.log(username + ' logged in!');

        // we store the userId in the socket session for this client
        socket.userId = getUniqueId();

        appState.users.push({
            id: socket.userId,
            username: username,
            color: Consts.COLORS[appState.users.length],
            state: Consts.USER_STATE.IDLE
        });

        console.log('number of users: ' + appState.users.length);

        // echo total number of users to the client
        socket.emit('USER_LOGGED', {
            id: appState.users[appState.users.length - 1].id,
            users: appState.users
        });

        // echo globally (all clients) that a person has connected
        io.emit('USER_JOINED', {
            users: appState.users
        });
    });

    socket.on('USER_STATE', function(newState) {
        var user = getUserById(socket.userId);

        if (user.state === newState) return;

        console.log(user.username + ' changing state to ' + newState + '!');

        updateUserById(socket.userId, {
            state: Consts.USER_STATE.READY
        });

        io.emit('USER_STATE_CHANGED', {
            users: appState.users
        });

        if (isUserGlobalStateReady()) {
            console.log('everybody ready!')
            io.emit('GAME_STATE_CHANGED', appState.game);
        }
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', logoutFn);
    socket.on('LOGOUT', logoutFn);

    function logoutFn() {
        if (socket.userId) {

            console.log(socket.userId);
            console.log(getUserById(socket.userId) + ' logged out!');

            appState.users = appState.users.filter(function(user) {
                return user.id !== socket.userId
            });

            console.log('number of users: ' + appState.users.length);

            // echo globally that this client has left
            io.emit('USER_LEFT', {
                id: socket.userId,
                users: appState.users
            });

            delete socket.userId;
        }
    }
});

function getUserById(id) {
    return appState.users.find(function(user) {
        return user.id === id;
    });
}

function updateUserById(id, obj) {
    appState.users = appState.users.map(function(user) {
        if (user.id === id) {
            for (key in obj) {
                user[key] = obj[key];
            }
            return user;
        }
        return user;
    });
}

function isUserGlobalStateReady() {
    return appState.users.every(function(user) {
        return user.state === Consts.USER_STATE.READY;
    });
}

function getUniqueId() {
    return counterId++;
}
