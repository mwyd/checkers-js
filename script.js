const createBoardRow = () => {
    const el = document.createElement('div')
    el.classList.add('board-row')

    return el
}

const createBoardField = (isDark) => {
    const el = document.createElement('div')
    el.classList.add('board-field', isDark ? 'field-dark' : 'field-light', 'field-idle')

    return el
}

const createBoardPawn = (isDark) => {
    const el = document.createElement('div')
    el.classList.add('board-pawn', isDark ? 'pawn-dark' : 'pawn-light')

    return el
}

const createFieldIdDisplay = () => {
    const el = document.createElement('div')
    el.classList.add('board-field-id-display')

    return el
}

class Pawn {
    constructor(options) {
        this.isDark = options.isDark
        this.fieldId = options.fieldId
        this.checkersRef = options.checkersRef

        this.html = createBoardPawn(this.isDark)
        this.queen = false
    }

    showMoves(moves) {
        this.html.onclick = () => {
            if(this.checkersRef.darkTurn != this.isDark) return
            this.checkersRef.setFieldsIdle()

            for(let i = 0; i < moves.length; i++) {
                moves[i].toField.setActive()
                moves[i].toField.html.onclick = () => {this.move(moves[i])}
            }
        }
    }

    getMoves() {
        let modifier = this.checkersRef.darkTurn ? -1 : 1
        const rawMoves = []
        const moves = {priority: [], standard: []}

        rawMoves.push(this.getMove(modifier, -1))
        rawMoves.push(this.getMove(modifier, 1))
        
        if(this.queen) {
            rawMoves.push(this.getMove(modifier * -1, -1))
            rawMoves.push(this.getMove(modifier * -1, 1))
        }

        for(let move of rawMoves) {
            if(move.available) move.takedown ? moves.priority.push(move) : moves.standard.push(move)
        }

        return moves 
    }

    getMove(upDown, leftRight) {
        let move = {
            available: false,
            takedown: false,
            promotion: false,
            takedownField: this.checkersRef.getFieldById([this.fieldId[0] + upDown / 2, this.fieldId[1] + leftRight / 2]),
            fromField: this.checkersRef.getFieldById(this.fieldId),
            toField: this.checkersRef.getFieldById([this.fieldId[0] + upDown, this.fieldId[1] + leftRight]) 
        }

        if(move.toField) {
            if(move.toField.empty()) {
                move.available = true
                if(move.takedownField) move.takedown = true
                if((this.isDark && move.toField.id[0] == 1) || (!this.isDark && move.toField.id[0] == 8)) move.promotion = true
            }
            else if(move.toField.getPawn().isDark != this.isDark) {
                if(Math.abs(upDown) < 2 && Math.abs(leftRight) < 2) move = this.getMove(upDown * 2, leftRight * 2)     
            }
        }

        return move
    }

    move(move) {
        move.toField.pawn = this
        this.fieldId = move.toField.id
        move.toField.html.appendChild(this.html)

        move.fromField.pawn = null
        this.checkersRef.clearPawnsOnclick()
        this.checkersRef.darkTurn ? this.checkersRef.darkFreeMoves += 1 : this.checkersRef.lightFreeMoves += 1

        if(move.takedown) {
            this.checkersRef.removePawn(move.takedownField.pawn)
            this.checkersRef.darkTurn ? this.checkersRef.darkFreeMoves = 0 : this.checkersRef.lightFreeMoves = 0
            move.takedownField.pawn = null
        }

        if(move.promotion) {
            this.html.innerText = 'Q'
            this.queen = true
        }

        const nextMoves = this.getMoves()
        if(nextMoves.priority.length > 0 && move.takedown) this.showMoves(nextMoves.priority)
        else this.checkersRef.changeTurn()
        this.checkersRef.setFieldsIdle()
    }

    clearOnclick() {
        this.html.onclick = null
    }
}

class Field {
    constructor(options) {
        this.id = options.id
        this.isDark = options.isDark
        this.html = createBoardField(this.isDark)
        this.pawn = options.pawn
        this.checkersRef = options.checkersRef

        this.initEvents()
    }

    initEvents() {
        this.html.addEventListener('mouseenter', () => {
            this.checkersRef.fieldIdDisplay.innerText = String.fromCharCode(64 + this.id[1]) + this.id[0]
        })

        this.html.addEventListener('mouseleave', () => {
            this.checkersRef.fieldIdDisplay.innerText = ''
        })
    }

    setActive() {
        this.html.classList.add('field-active')
    }

    setIdle() {
        this.html.classList.remove('field-active')
        this.html.onclick = null
    }

    empty() {
        return this.pawn == null
    }

    getPawn() {
        return this.pawn
    }
}

class Checkers {
    constructor() {
        this.board = document.querySelector('#board')
        this.fieldIdDisplay = createFieldIdDisplay()

        this.init()
    }

    init() {
        this.board.innerHTML = ''
        this.board.appendChild(this.fieldIdDisplay)
        this.darkTurn = Math.floor(Math.random() * Math.floor(2)) == 1 ? true : false
        this.darkFreeMoves = 0
        this.lightFreeMoves = 0
        this.fields = []
        this.lightPawns = []
        this.darkPawns = []

        for(let i = 8; i > 0; i--) {
            const boardRow = createBoardRow()
            for(let j = 1; j < 9; j++) {
                const fieldId = [i, j]
                const isDark = (i % 2 == 0 && j % 2 == 0) || (i % 2 != 0 && j % 2 != 0)
                const pawnOn = (i < 4 || i > 5) && isDark
                
                const field = new Field({
                    id: fieldId,
                    isDark: isDark,
                    pawn: null,
                    checkersRef: this
                })

                if(pawnOn) {
                    const pawn = new Pawn({
                        isDark: i > 5,
                        fieldId: fieldId,
                        checkersRef: this
                    })
                    pawn.isDark ? this.darkPawns.push(pawn) : this.lightPawns.push(pawn)
                    field.pawn = pawn
                    field.html.appendChild(pawn.html)
                }

                this.fields.push(field)
                boardRow.appendChild(field.html)
            }
            
            this.board.appendChild(boardRow)
        }

        this.changeTurn()
    }

    getFieldById(id) {
        for(let field of this.fields) {
            if(field.id[0] + '' + field.id[1] == id[0] + '' + id[1]) return field
        }

        return null
    }

    setFieldsIdle() {
        for(let field of this.fields) field.setIdle()
    }

    changeTurn() {
        this.darkTurn = !this.darkTurn
        const playablePawns = this.darkTurn ? this.darkPawns : this.lightPawns
        const allMoves = {priority: [], standard: []}

        for(let playablePawn of playablePawns) {
            const moves = playablePawn.getMoves()
            if(moves.priority.length > 0) allMoves.priority.push({pawn: playablePawn, moves: moves.priority})
            if(moves.standard.length > 0) allMoves.standard.push({pawn: playablePawn, moves: moves.standard})
        }

        const victory = playablePawns.length == 0
        const draw = this.darkFreeMoves > 14 && this.lightFreeMoves > 14
        const noMoves = allMoves.priority.length == 0 && allMoves.standard.length == 0

        if(victory || draw || noMoves) {
            let msg = 'Draw'
            if(victory || noMoves) msg = `${this.darkTurn ? 'Light' : 'Dark'} wins`
            alert(msg)

            this.init()
            return
        }

        //console.log(allMoves)
        if(allMoves.priority.length > 0) for(let moves of allMoves.priority) moves.pawn.showMoves(moves.moves)
        else for(let moves of allMoves.standard) moves.pawn.showMoves(moves.moves)
    }

    clearPawnsOnclick() {
        const allPawns = [...this.darkPawns, ...this.lightPawns]
        for(let pawn of allPawns) pawn.clearOnclick()
    }

    removePawn(pawn) {
        pawn.html.remove()
        pawn.isDark ? this.darkPawns.splice(this.darkPawns.indexOf(pawn), 1) : this.lightPawns.splice(this.lightPawns.indexOf(pawn), 1)
    }
}

const checkers = new Checkers()