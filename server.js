
const express = require('express')
const app = express()
const expressLayouts = require('express-ejs-layouts') 
const server = require('http').Server(app)
const io = require('socket.io')(server)
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const mongoose = require('mongoose')
const flash = require('connect-flash')
const session = require('express-session')
const passport = require('passport');

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.set('layout','layouts/layout')
app.use(expressLayouts)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }))

require('./config/passport')(passport)

// express session 
app.use(session({
    secret: 'kikai-secerate',
    resave: true,
    saveUninitialized: true
}));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  next();
});

app.use(passport.initialize());
app.use(passport.session());

// connect flash session
app.use(flash());

// global vars session
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
})
//db config
const db = require('./config/keys').MongoURI
mongoose.connect(db, { useNewUrlParser: true,useUnifiedTopology: true})
        .then(()=> console.log('Mongo DB Connected'))
        .catch(err => console.log(err) );

app.use('/', require('./routes/index'))

// app.get('/', (req, res) => {
//   res.redirect(`/${uuidv4()}`)
// })

// app.get('/:room',(req, res) => {
//    res.render('room',{roomId: req.params.room})
// })

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=> {
    console.log(`Server started at ${PORT}`)
})

io.on('connection', socket => {
    socket.on('join-room',(roomId, userId) => { 
        socket.join(roomId)
        socket.to(roomId).broadcast.emit('user-connected', userId)
        socket.on('message', message => {
            socket.to(roomId).emit('createMessage', message)
        })
    });

    socket.on('disconnected', () => {
        socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })
})