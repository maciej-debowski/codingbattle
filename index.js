const express = require('express')
const socket = require("socket.io")
const io = socket(801, {
    path: '/',
    serveClient: false,
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false,
    cors: {
        origin: "http://localhost",
        methods: ["GET", "POST"]
    }
})
const app = express()
const { uuid } = require('uuidv4')
const questions = require('./questions.json')
const games = []

Array.prototype.getWhere_ = function(a, b) {
    for(let c of this) {
        if (c[a] == b) return c
    }
}

Array.prototype.getIndex_ = function(a, b) {
    let d = 0
    for(let c of this) {
        if (c[a] == b) return d
        d++
    }
}

class Player {
    constructor (nick) {
        this.nick = nick
        this.points = 0
        this.lose = false
        this.questionsAnswered = []
    }
}

class Game {
    constructor (
        uuid
    ) {
        this.uuid = uuid
        this.players = []
        this.timeFromStart = 1
        this.over = false
    }

    checkIfCanStart() {
        if(this.players.length >= 2) this.start()
    }

    randomQuestion(nick) {
        let x = 0
        while(true) {
            x++

            if(this.players.getWhere_('nick', nick) == undefined) return {}

            if(x > 10000) {
                questions.forEach(y => {
                    if(this.players.getWhere_('nick', nick).questionsAnswered.includes (y) == false) x = 0
                })

                if(x != 0) {
                    return 'No Questions Left'
                }
            }

            let ri = questions[Math.round(Math.random() * questions.length)]
            if(this.players.getWhere_('nick', nick).questionsAnswered.includes (ri)) continue
            this.players.getWhere_('nick', nick).questionsAnswered.push(ri)
            return ri
        }
    }

    start() {
        io.emit(`gamestart${this.uuid}`, true)
        this.intervalupdate = setInterval(() => this.updateGame(this, this.uuid), 1000)

        setTimeout(() => {
            this.players.forEach(plr => {
                io.emit(`question-${plr.nick}-${this.uuid}`, this.randomQuestion(plr.nick))
            })
        }, 150)
    }

    updateGame(th, uuid) {
        if(th.over == true) clearInterval(th.intervalupdate)
        th.timeFromStart++
        io.emit("gameinfo" + uuid, {
            players: th.players,
            time: th.timeFromStart,
            over: th.over
        })
        //console.log('update')
    }
}

/* Sockets */

io.on('connection', socket => {
    console.log("Socket Connection!")

    socket.on('playerjoin', data => {
        if(games[games.getIndex_('uuid', data.uuid)].players.length >= 2) {
            socket.emit("error", "Gra jest już rozpoczęta")
            return
        }
        console.log(`Player ${data.username} connected to game ${data.uuid}`)
        // games.getWhere_('uuid', data.uuid)
        const gameIndex = games.getIndex_('uuid', data.uuid)
        games[gameIndex].players.push(new Player(data.username))
        games[gameIndex].checkIfCanStart()
    })

    socket.on('nullQuestionRequest', data => {
        io.emit(`question-${data.username}-${data.gameid}`, games.getWhere_('uuid', data.gameid).randomQuestion(data.username))
    })

    socket.on('userQuestionAnswered', data => {
        const game =  games.getWhere_('uuid', data.gameuuid)
        if(game.over == true) return
        const un = data.username
        if(data.answer == false) {
            game.players.getWhere_("nick", un).lose = true
            game.over = true

            return
        }
        
        game.players.getWhere_("nick", un).points++
        io.emit(`question-${data.username}-${data.gameuuid}`, games.getWhere_('uuid', data.gameuuid).randomQuestion(data.username))
    })
})


/* Application Server */

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
})

app.post('/api/creategame', (req, res) => {
    const gameUUID = uuid()
    games.push(new Game(gameUUID))

    app.get('/game/' + gameUUID, (req, res) => {
        res.sendFile(__dirname + '/views/game.html')
    })

    res.send(gameUUID)
})

app.listen(3000, () => console.log("Started!"))