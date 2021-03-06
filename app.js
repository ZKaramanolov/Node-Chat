const express = require('express'),
    app = express(),
    path = require('path'),
    server = require('http').createServer(app),
    io = require('socket.io')(server),
    fs = require('fs'),
    session = require('client-sessions'),
    bodyParser = require('body-parser'),
    port = process.env.PORT || 8000;

let msg = JSON.parse(fs.readFileSync(path.join(__dirname, '/data/messages.json')));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    cookieName: 'session',
    secret: 'henlo',
    duration: 60 * 60 * 1000,
}));

app.get('/', function (req, res) {
    if(req.session && req.session.user){
        res.redirect('/chat');
    } else {
        res.redirect('/login');
    }
});

app.get('/login', function (req, res) {
    if(req.session && req.session.user){
        res.redirect('/chat');
    } else {
        res.sendFile(path.join(__dirname, 'templates/login.html'));
    }
});

app.post('/login', function (req, res) {
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, '/data/users.json')));
    const data = req.body;

    if (users[data.username]) {
        if(users[data.username].password == data.password) {
            req.session.user = {
                id: users[data.username].id,
                username: data.username,
            };
        }
    }

    res.redirect('/login');
});

app.get('/register', function (req, res) {
    if(req.session && req.session.user){
        res.redirect('/chat');
    } else {
        res.sendFile(path.join(__dirname, 'templates/register.html'));
    }
});

app.post('/register', function(req, res) {
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, '/data/users.json')));
    const data = req.body;

    let error = false;

    if (!req.body.username || !req.body.password) {
        error = true;
    }

    let idNext = 0;
    for (const index in users) {
        if (index == data.username) {
            error = true;
            break;
        }
        if (users[index].id > idNext) {
            idNext = users[index].id;
        }
    }
    idNext++;

    if(!error) {
        users[data.username] = {
            id: idNext,
            password: data.password,
        }

        fs.writeFile('data/users.json', JSON.stringify(users), (err) => {
            if (err) err;
        });

        req.session.user = {
            id: idNext,
            username: data.username,
        };

        res.redirect('/chat');
    } else {
        res.redirect('/register');
    }
});

app.get('/logout', function (req, res) {
    req.session.reset();
    res.redirect('/');
});

app.get('/chat', function (req, res) {
    if(req.session && req.session.user) {
        res.sendFile(path.join(__dirname, 'templates/chat.html'));
    } else {
        res.redirect('/login');
    }
});

app.get('/get_session', function (req, res) {
    if(req.session && req.session.user) {
        res.send(JSON.stringify(req.session.user));
    } else {
        res.redirect('/login');
    }
});

app.get('/clear/:key', function (req, res) {
    if(req.params.key == 'musaka') {
        msg = [];
        fs.writeFile('data/messages.json', JSON.stringify(msg), (err) => {
            if (err) err;
        });
    }

    res.redirect('/chat');
});

io.on('connection', function (socket) {
  console.log('a user connected');

  io.sockets.emit('messages', msg);

  socket.on('new message', function (message) {
    msg.push({
        user: message.user,
        message: message.msg
    });
    
    fs.writeFile('data/messages.json', JSON.stringify(msg), (err) => {
        if (err) err;
    });

    io.sockets.emit('messages', msg);
  });
});

server.listen(port, '0.0.0.0', function () {
  console.log('Server started on port ' + port)
});