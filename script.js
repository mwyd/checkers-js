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

class Pawn {
    constructor(options) {
        this.isDark = options.isDark
        this.fieldId = options.fieldId
        this.checkersRef = options.checkersRef

        this.html = createBoardPawn(this.isDark)
        this.queen = false

        this.init()
    }

    init() {
        this.html.onclick = () => {this.showMoves()}
    }

    showMoves() {
        if(this.checkersRef.darkTurn != this.isDark) return
        let moves = this.getMoves()
        moves = moves.priority.length > 0 ? moves.priority : moves.standard

        this.checkersRef.setFieldsIdle()

        for(let i = 0; i < moves.length; i++) {
            moves[i].toField.setActive()
            moves[i].toField.html.onclick = () => {this.move(moves[i])}
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

        if(move.takedown) {
            move.takedownField.pawn.html.remove()
            move.takedownField.pawn = null
        }

        if(move.promotion) {
            this.html.innerText = 'Q'
            this.queen = true
        }

        const nextMoves = this.getMoves()
        if(nextMoves.priority.length == 0 || !move.takedown) this.checkersRef.darkTurn = !this.checkersRef.darkTurn
        this.checkersRef.setFieldsIdle()
    }
}

class Field {
    constructor(options) {
        this.id = options.id
        this.isDark = options.isDark
        this.html = createBoardField(this.isDark)
        this.pawn = options.pawn
        this.checkersRef = options.checkersRef
    }

    setActive() {
        this.html.classList.replace('field-idle', 'field-active')
    }

    setIdle() {
        this.html.classList.replace('field-active', 'field-idle')
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
        this.darkTurn = Math.floor(Math.random() * Math.floor(2)) == 1 ? true : false
        this.fields = []
        this.lightPawns = []
        this.darkPawns = []

        this.initBoard()
    }

    initBoard() {
        for(let i = 8; i > 0; i--) {
            const boardRow = createBoardRow()
            for(let j = 1; j < 9; j++) {
                const fieldId = [i, j]
                const isDark = (i % 2 == 0 && j % 2 == 0) || (i % 2 != 0 && j % 2 != 0)
                const pawnOn = (i < 4 || i > 5) && isDark
                
                //create field obj
                const field = new Field({
                    id: fieldId,
                    isDark: isDark,
                    pawn: null,
                })

                //create pawn obj
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
                
                //update html
                boardRow.appendChild(field.html)
            }
            
            //update html
            this.board.appendChild(boardRow)
        }
    }

    getFieldById(id) {
        for(let field of this.fields) {
            if(field.id[0] + '' + field.id[1] == id[0] + '' + id[1]) return field
        }

        return null
    }

    getPawnByElement(el) {
        for(let field of this.fields) {
            if(field.pawn == null) continue
            if(field.pawn.html == el) return field.pawn
        }

        return null
    }

    setFieldsIdle() {
        for(let field of this.fields) field.setIdle()
    }
}

const checkers = new Checkers()