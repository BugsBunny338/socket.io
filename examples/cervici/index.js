var server = require('http').createServer();
var port = process.env.PORT || 3003;

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

var io = require('../..')(server);

var appState = {
    users: [] // {id, nick, color}
};

var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
];

io.on('connection', function (socket) {
    // console.log('someone connected!!!');
    // socket.emit('welcome message', { foo: 'bar' });
    // socket.broadcast.emit('welcome message (broadcast)', { foo: 'bar' });

    var addedUser = false;

    socket.on('login', function (username) {
        if (addedUser) return;

        console.log(username + ' logged in!');

        // we store the id in the socket session for this client
        socket.id = Date.now();

        addedUser = true;

        appState.users.push({
            id: socket.id,
            username: username,
            color: COLORS[appState.users.length - 1]
        })

        console.log('number of users: ' + appState.users.length);

        // echo total number of users to the client
        socket.emit('USER_LOGGED', {
            id: appState.users[appState.users.length - 1].id,
            users: appState.users
        });

        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('USER_JOINED', {
            id: appState.users[appState.users.length - 1].id,
            users: appState.users
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        if (addedUser) {

            console.log(getUserById(socket.id) + ' logged out!');

            appState.users = appState.users.filter(function(user) {
                return user.id !== socket.id
            });

            console.log('number of users: ' + appState.users.length);

            // echo globally that this client has left
            socket.broadcast.emit('USER_LEFT', {
                id: socket.id,
                users: appState.users
            });
        }
    });
});

function getUserById(id) {
    return appState.users.find(function(user) {
        user.id === id;
    });
}
