var server = require('http').createServer();
var port = process.env.PORT || 3003;

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

var io = require('../..')(server);

var counterId = 1; // id

var appState = {
    users: [] // {id, nick, color}
};

var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
];

io.on('connection', function(socket) {
    // console.log('someone connected!!!');
    // socket.emit('welcome message', { foo: 'bar' });
    // socket.broadcast.emit('welcome message (broadcast)', { foo: 'bar' });

    var addedUser = false;

    socket.emit('CONNECTED', {
        users: appState.users
        // , id: socket.userId
    });

    socket.on('LOGIN', function (username) {
        if (addedUser) return;

        console.log(username + ' logged in!');

        // we store the id in the socket session for this client
        // socket.id = getUniqueId();

        addedUser = true;
        socket.userId = getUniqueId();

        appState.users.push({
            id: socket.userId,
            username: username,
            color: COLORS[appState.users.length]
        });

        console.log('number of users: ' + appState.users.length);

        // echo total number of users to the client
        socket.emit('USER_LOGGED', {
            id: appState.users[appState.users.length - 1].id,
            users: appState.users
        });

        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('USER_JOINED', {
            users: appState.users
        });
    });

    // when the user disconnects.. perform this
    socket.on('LOGOUT', function () {
        if (addedUser) {

            console.log(socket.userId);
            console.log(getUserById(socket.userId) + ' logged out!');

            appState.users = appState.users.filter(function(user) {
                return user.id !== socket.userId
            });

            console.log('number of users: ' + appState.users.length);

            // echo globally that this client has left
            socket.broadcast.emit('USER_LEFT', {
                id: socket.userId,
                users: appState.users
            });

            addedUser = false;
            // delete socket.userId;
        }
    });
});

function getUserById(id) {
    return appState.users.find(function(user) {
        console.log(user.id);
        user.id === id;
    });
}

function getUniqueId() {
    return counterId++;
}
