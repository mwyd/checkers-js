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

class Field {
    constructor(options) {
        this.id = options.id
        this.isDark = options.isDark
        this.html = options.html
        this.pawnOn = options.pawnOn
        this.pawn = options.pawn
        this.checkersRef = options.checkersRef

        if(this.pawn) {
            this.html.appendChild(this.pawn.html)
            this.initEvents()
        }
    }

    initEvents() {
        this.pawn.html.addEventListener('click', e => {this.showMoves(e.target)})
    }

    showMoves(target) {
        const pawn = this.checkersRef.getPawnByElement(target)
        if(this.checkersRef.darkTurn != pawn.isDark) return
        const moves = this.getMoves(pawn)

        this.checkersRef.setFieldsIdle()

        for(let i = 0; i < moves.length; i++) {
            moves[i].toField.setActive()
            moves[i].toField.html.onclick = () => {
                this.checkersRef.move(moves[i])
            }
        }
    }

    getMoves(pawn) {
        let modifier = this.checkersRef.darkTurn ? -1 : 1
        const rawMoves = []
        const moves = {priority: [], standard: []}

        rawMoves.push(this.getMove(pawn, modifier, -1))
        rawMoves.push(this.getMove(pawn, modifier, 1))
        
        if(pawn.queen) {
            rawMoves.push(this.getMove(pawn, modifier * -1, -1))
            rawMoves.push(this.getMove(pawn, modifier * -1, 1))
        }

        for(let move of rawMoves) {
            if(move.available) move.takedown ? moves.priority.push(move) : moves.standard.push(move)
        }

        return moves.priority.length > 0 ? moves.priority : moves.standard 
    }

    getMove(pawn, upDown, leftRight) {
        let move = {
            available: false,
            takedown: false,
            promotion: false,
            takedownField: this.checkersRef.getFieldById([pawn.fieldId[0] + upDown / 2, pawn.fieldId[1] + leftRight / 2]),
            fromField: this.checkersRef.getFieldById(pawn.fieldId),
            toField: this.checkersRef.getFieldById([pawn.fieldId[0] + upDown, pawn.fieldId[1] + leftRight]) 
        }

        if(move.toField) {
            if(move.toField.empty()) {
                move.available = true
                if(move.takedownField) move.takedown = true
                if((pawn.isDark && move.toField.id[0] == 1) || (!pawn.isDark && move.toField.id[0] == 8)) move.promotion = true
            }
            else if(move.toField.getPawn().isDark != pawn.isDark) {
                if(Math.abs(upDown) < 2 && Math.abs(leftRight) < 2) move = this.getMove(pawn, upDown * 2, leftRight * 2)     
            }
        }

        return move
    }

    getPawn() {
        return this.pawn
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
}

class Checkers {
    constructor() {
        this.board = document.querySelector('#board')
        this.darkTurn = Math.floor(Math.random() * Math.floor(2)) == 1 ? true : false
        this.fields = []

        this.initBoard()
    }

    initBoard() {
        for(let i = 8; i > 0; i--) {
            const boardRow = createBoardRow()
            for(let j = 1; j < 9; j++) {
                const fieldId = [i, j]
                const isDark = (i % 2 == 0 && j % 2 == 0) || (i % 2 != 0 && j % 2 != 0)
                const pawnOn = (i < 4 || i > 5)
                //create field obj
                const field = new Field({
                    id: fieldId,
                    isDark: isDark,
                    html: createBoardField(isDark),
                    pawnOn: pawnOn,
                    pawn: !pawnOn || !isDark ? null : {
                        isDark: i > 5,
                        html: createBoardPawn(i > 5),
                        queen: false,
                        fieldId: fieldId
                    },
                    checkersRef: this
                })
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

    move(move) {
        move.toField.pawnOn = true
        move.toField.pawn = move.fromField.pawn
        move.toField.pawn.fieldId = move.toField.id
        move.toField.html.appendChild(move.toField.pawn.html)

        move.fromField.pawnOn = false
        move.fromField.pawn = null

        if(move.takedown) {
            move.takedownField.pawnOn = false
            move.takedownField.pawn.html.remove()
            move.takedownField.pawn = null
        }

        if(move.promotion) {
            move.toField.pawn.html.innerText = 'Q'
            move.toField.pawn.queen = true
        }

        this.darkTurn = !this.darkTurn
        this.setFieldsIdle()
    }
}

const checkers = new Checkers()