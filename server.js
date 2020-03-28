const express = require('express');
const http = require('http');
const app = express();
const port = process.env.PORT || 4000;
const server = http.createServer(app);
const io = require('socket.io')(server);

server.listen(port);

const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');

const userRoutes = require('./api/routes/user');
const taskRoutes = require('./api/routes/task');

mongoose.connect('mongodb+srv://igLa:' + process.env.MONGO_PSW + '@cluster0-3h3ym.mongodb.net/tasker?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
})
    .then(() => console.log('DB Connected!'))
    .catch(err => {
        console.log(Error, err.message);
    });

app.use(morgan('dev'));

app.use(helmet());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
        return res.status(200).json({});
    }
    next();
});

app.use('/user', userRoutes);
app.use('/task', taskRoutes);

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    })
})


io.on('connection', socket => {
    socket.on('share-task', (from, to, task) => {
        socket.broadcast.emit('recive-shared-task', { from, to, task });
    })
});

