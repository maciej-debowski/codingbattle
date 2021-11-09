const gameurl = window.location.href
const gameuuid = gameurl.split("game/")[1]

const socket = io('ws://localhost:801')
const username = prompt("Player Name: ?")
socket.emit('playerjoin', {
    username: username,
    uuid: gameuuid
})

Array.prototype.sortbyif = function(a,b,c) {
    for(let d of this) {
        let cond = `'${d[a]}' ${b} ${c}`
        if(eval(cond) == true) return d
    }
}

function randomizeArrayItems(a) {
    let old = a
    let new_ = []
    old.forEach(() => {
        while(true) {
            let j = old[Math.round(Math.random() * old.length)]
            if(new_.includes (j) || j == null || j == "null") continue
            new_.push(j)
            break
        }
    })

    return new_
}

socket.on('error', data => {
    alert(data)
    window.close()
})

class Question extends React.Component {
    render() {
        if(this.props.question == '{}') return 'question'
        console.log(this.props.question)
        if(this.props.question != 'No Questions Left') {
            console.log(this.props.question)
            const title = JSON.parse(this.props.question).title
            const questions = JSON.parse(this.props.question)
            const QuestionsArray = []
            console.log(questions)
            questions.answers.forEach((question, key) => {
                QuestionsArray.push((<div key={question.text}
                    className="question-item" id={'item' + key}
                    onClick={() => {
                        setTimeout(() => socket.emit(`userQuestionAnswered`, {
                            username: username,
                            gameuuid: gameuuid,
                            answer: question.correct
                        }), 150)

                        document.querySelector(`#item${key}`).style.background = question.correct == true ? '#32a852' : '#f22944'
                    }}
                >
                    {question.text}
                </div>))
            })

            console.log(JSON.parse(this.props.question), this.props)
            return (<div className="question-box">
                <h2>{title}</h2>
                <div className="question-container">
                    {QuestionsArray} 
                </div>
            </div>)
        }
        else {
           return (<div className="question-box">
                <h2>Zrobiłeś wszystkie pytania!</h2>
            </div>) 
        }   
    }
}

class Game extends React.Component {

    state = {
        gameStarted: false,
        currentQuestion: {},
        enemy: {},
        player: {},
        time: 0,
        over: false
    }

    componentDidMount() {
        socket.on('gamestart' + gameuuid, bool => {
            this.setState({
                ...this.state,
                gameStarted: true
            })
        })

        socket.on(`question-${username}-${gameuuid}`, data => {
            if(data == 'No Questions Left') {
                this.setState({
                    ...this.state,
                    currentQuestion: 'No Questions Left'
                })
                return
            }
            const item = data
            if(data == null) {
                socket.emit('nullQuestionRequest', {
                    username: username,
                    gameid: gameuuid
                })
                return
            }
            
            item.answers = randomizeArrayItems(item.answers)
            this.setState({
                ...this.state,
                currentQuestion: item
            })
        })

        socket.on('gameinfo' + gameuuid, data => {
            this.setState({
                ...this.state,
                over: data.over,
                time: data.time,
                enemy: data.players.sortbyif('nick', '!=', "'" + username + "'"),
                player: data.players.sortbyif('nick', '==', "'" + username + "'")
            })
        })
    }

    render() {
        return (<div className="game">
            <h1>InformatykBattle</h1>
            <div className="box-game">
                {this.state.gameStarted == true && this.state.currentQuestion != 'No Questions Left' ? <Question question={JSON.stringify(this.state.currentQuestion)} /> : <span>{this.state.gameStarted == true ? <span>Odpowiedziałeś na wszyskie pytania <br /> </span> : <span> <br /> </span> }</span>}
                <span className="gameStatus">{this.state.gameStarted == false ? <span>Stan rozgrywki: <b>oczekiwanie na przeciwnika</b></span> : (this.state.over == false ? <span className="game-started-span">Gra rozpoczęta! ({this.state.time}s)</span> : (this.state.player.lose == false ? <span className="game-ended-span">Wygrałeś! ({this.state.time}s)</span> : <span className="game-ended-span">Przegrałeś! ({this.state.time}s)</span>))}</span>
            </div>
        </div>)
    }
}

ReactDOM.render (<Game />, document.querySelector("#gameContainer"))