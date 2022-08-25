// Configs
const EDGE = 30, RISE = 26, RUN = 15

// Canvas management
const canvas = document.querySelector("canvas")
const ctx = canvas.getContext("2d")

function resize() {
    canvas.width = innerWidth
    canvas.height = innerHeight    
}


resize()

addEventListener("resize", (event) => {
    resize()
})

function drawDots(initX, initY, step) {
    for (let x = initX; x < canvas.width + step; x += step) {
        for (let y = initY; y < canvas.height + step; y += step) {
            ctx.fillStyle = "#FFB000"
            ctx.beginPath()
            ctx.arc(x, y, 2, 0, 2 * Math.PI, false)
            ctx.fill()
        }
    }
}

// Mouse movement
const mouseLoc = {
    x: null,
    y: null
}

canvas.addEventListener("mousemove", (event) => {
    mouseLoc.x = event.clientX
    mouseLoc.y = event.clientY
})

canvas.addEventListener("mouseenter", (event) => {
    mouseLoc.x = event.clientX
    mouseLoc.y = event.clientY
})

canvas.addEventListener("mouseleave", (event) => {
    mouseLoc.x = null
    mouseLoc.y = null
})

// Font management
function getFontScale() {
    ctx.font = "100px serif"
    let m = ctx.measureText("█")
    let h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
    return 100 / Math.ceil(h)
}

function getCorrectSize(height) {
    return Math.floor(height * FONT_SCALE)
}

const FONT_SCALE = getFontScale()

// Spriting
class Hexagon {
    constructor(x = 0, y = 0, fill = "#0A3300", edge = EDGE, rise = RISE, run = RUN) {
        this.x = x
        this.y = y
        this.fill = fill
        this.edge = edge
        this.rise = rise
        this.run = run

        this.parent = null
    }

    render() {    
        let absX = this.x + (this.parent?.absX ?? 0)
        let absY = this.y + (this.parent?.absY ?? 0)
        ctx.fillStyle = this.fill
        ctx.strokeStyle = "#33FF00"
        ctx.beginPath()
        // ctx.moveTo(absX - (this.edge / 2 + this.run), absY)
        // ctx.lineTo(absX - this.edge / 2, absY + this.rise)
        // ctx.lineTo(absX + this.edge / 2, absY + this.rise)
        // ctx.lineTo(absX + (this.edge / 2 + this.run), absY)
        // ctx.lineTo(absX + this.edge / 2, absY - this.rise)
        // ctx.lineTo(absX - this.edge / 2, absY - this.rise)
        ctx.moveTo(absX, absY + this.rise)
        ctx.lineTo(absX + this.run, absY + 2 * this.rise)
        ctx.lineTo(absX + this.edge + this.run, absY + 2 * this.rise)
        ctx.lineTo(absX + this.edge + 2* this.run, absY + this.rise)
        ctx.lineTo(absX + this.edge + this.run, absY)
        ctx.lineTo(absX + this.run, absY)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
    }
}

class TextSprite {
    constructor(text, x = 0, y = 0, fill = "#33FF00") {
        this.text = text
        this.x = x
        this.y = y
        this.fill = fill

        this.parent = null
    }

    render() {
        let absX = this.x + (this.parent?.absX ?? 0)
        let absY = this.y + (this.parent?.absY ?? 0)

        ctx.fillStyle = this.fill
        ctx.textBaseline = "middle"
        ctx.textAlign = "center"

        ctx.font = `${getCorrectSize(1.8 * RISE)}px serif`

        ctx.fillText(this.text, absX, absY)
    }
}

class HexGrid {
    constructor(widthRows, heightCols, x, y, parity = 0) {
        this.numRows = widthRows
        this.numCols = heightCols

        this.x = x
        this.y = y
        this.absX = this.x
        this.absY = this.y

        this.parent = null

        this.parity = parity

        this.rows = []
        for(let row = 0; row < this.numRows; row++) {
            let hexRow = []
            for(let col = (row + this.parity) % 2; col < this.numCols; col += 2) {
                // let hex = new Hexagon(col * (EDGE + RUN), row * RISE)
                // hex.parent = this
                hexRow.push(null)
            }
            this.rows.push(hexRow)
        }
    }

    render() {
        this.absX = this.x + (this.parent?.absX ?? 0)
        this.absY = this.y + (this.parent?.absY ?? 0)
        for(let row of this.rows) {
            for(let hex of row) {
                hex?.render()
            }
        }
    }

    set(row, col, sprite) {
        if ((row + col) % 2 !== this.parity) {
            console.log(`No cell at (${row}, ${col})`)
            return
        }

        let i = row
        let j = Math.floor(col / 2)

        this.rows[i][j] = sprite
        sprite.x = col * (EDGE + RUN)
        sprite.y = row * RISE
        sprite.parent = this
    }

    get(row, col) {
        if ((row + col) % 2 !== this.parity) {
            console.log(`No cell at (${row}, ${col})`)
            return
        }

        let i = row
        let j = Math.floor(col / 2)

        return this.rows[i][j]
    }
}

class HexRoom {
    constructor(widthRows, heightCols, x, y, parity = 0) {
        this.numRows = widthRows
        this.numCols = heightCols

        this.pxWidth = this.numCols * (EDGE + RUN) + RUN
        this.pxHeight = this.numRows * RISE + RISE

        this.x = x
        this.y = y
        this.absX = this.x
        this.absY = this.y

        this.parent = null

        this.parity = parity

        this.grids = {}
        this.grids["GROUND"] = new HexGrid(widthRows, heightCols, 0, 0, parity)
        this.grids["GROUND"].parent = this
        this.grids["TEXT"] = new HexGrid(widthRows, heightCols, EDGE / 2 + RUN, RISE, parity)
        this.grids["TEXT"].parent = this
    }

    getCell(x, y) {
        let relX = x - this.x
        let relY = y - this.y

        if (relX < 0 || relX > this.pxWidth || relY < 0 || relY > this.pxHeight) {
            return [null, null]
        }

        let colBlock = Math.floor(relX / (EDGE + RUN))
        let colEdge = relX % (EDGE + RUN) < RUN 

        let rowBlock = Math.floor(relY / RISE)

        let col = colBlock
        let tog = (this.parity + rowBlock + col) % 2
        let row = rowBlock - tog

        if (colEdge) {
            let sign = 2 * tog - 1
            let cornerX = col * (EDGE + RUN)
            let cornerY = (row + 1) * RISE
            // Cross product with edge vector
            let cprod = (relX - cornerX) * sign * RISE - (relY - cornerY) * RUN
            let boundary = cprod * sign
            if (boundary < 0) {
                col -= 1
                row += sign
            }
        }

        if (col < 0 || col >= this.numCols || row < 0 || row >= this.numRows) {
            return [null, null]
        }

        return [row, col]
    }

    get(layer, row, col) {
        return this.grids[layer].get(row, col)
    }

    set(layer, row, col, val) {
        this.grids[layer].set(row, col, val)
    }

    render() {
        this.absX = this.x + (this.parent?.absX ?? 0)
        this.absY = this.y + (this.parent?.absY ?? 0)

        this.grids["GROUND"].render()
        this.grids["TEXT"].render()
    }
}

function clearCanvas(bkgFill = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (bkgFill) {
        ctx.fillStyle = bkgFill
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
}

let parity = 1

let hexroom = new HexRoom(11, 7, 200, 200, parity)

// hexgrid = new HexGrid(11, 19, 200, 200)

for (let row = 0; row < hexroom.numRows; row++) {
    let off = (row + parity) % 2
    for (let col = off; col < hexroom.numCols; col += 2) {
        let hex = new Hexagon()
        hexroom.set("GROUND", row, col, hex)
    }
}

// textgrid = new HexGrid(11, 19, 200, 200)

for (let row = 0; row < hexroom.numRows; row++) {
    let off = (row + parity) % 2
    for (let col = off; col < hexroom.numCols; col += 2) {
        let hex = new TextSprite("\"")
        hexroom.set("TEXT", row, col, hex)
    }
}

for(let col = 0; col < hexroom.numCols; col++) {
    hexroom.set("TEXT", (col + parity) % 2, col, new TextSprite("█"))
    
    hexroom.set("TEXT", hexroom.numRows - 1 - ((col + parity) % 2), col, new TextSprite("█"))
}

for(let row = parity; row < hexroom.numRows; row += 2) {
    hexroom.set("TEXT", row, 0, new TextSprite("█"))
    hexroom.set("TEXT", row, hexroom.numCols - 1, new TextSprite("█"))
}



hexroom.set("TEXT", 4, 2 + parity, new TextSprite("@", 0, 0))
hexroom.set("TEXT", 6, 2 + parity, new TextSprite("我", 0, 4 * RISE))

let loc = [null, null]

function renderFrame(timestamp) {
    clearCanvas("#282828")

    hexroom.x = Math.floor((canvas.width - hexroom.pxWidth) / 2)
    hexroom.y = Math.floor((canvas.height - hexroom.pxHeight) / 2)

    hexroom.render()
    ctx.strokeRect(hexroom.x, hexroom.y, hexroom.pxWidth, hexroom.pxHeight)
    drawDots(0, 0, 50)

    if (mouseLoc.x !== null && mouseLoc.y !== null) {
        ctx.fillStyle = "#FFB000"
        ctx.beginPath()
        ctx.arc(mouseLoc.x, mouseLoc.y, 5, 0, 2 * Math.PI, false)
        ctx.fill()

        let oldloc = loc
        loc = hexroom.getCell(mouseLoc.x, mouseLoc.y)
        if (loc[0] !== oldloc[0] || loc[1] !== oldloc[1]) {
            let hex = null
            if (oldloc[0] !== null) {
                hex = hexroom.get("GROUND", oldloc[0], oldloc[1])
                hex.fill = "#0A3300"
            }
            if (loc[0] !== null) {
                hex = hexroom.get("GROUND", loc[0], loc[1])
                hex.fill = "#664600"
            }
        }
    }

    requestAnimationFrame(renderFrame)
}

// hexgrid.render()
// textgrid.render()


requestAnimationFrame(renderFrame)