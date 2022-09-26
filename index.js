//---------------------------------//
//----- Globals and utilities -----//
//---------------------------------//

// Configs
const EDGE = 30, RISE = 26, RUN = 15

const COLORS = {
    "terminal black": "#282828",
    "terminal green": "#33FF00",
    "dark terminal green": "#0A3300",
    "terminal amber": "#FFB000",
    "dark terminal amber": "#664600",
    "flourescent blue": "#15f4ee",
    "dark flourescent blue": "#034947",
    "neon red": "#FF3131", // Not happy with this one
    "dark neon red": "#990000"
}

// Body
const bodyHTML = document.querySelector("body")

// Timing
let currTime = 0, prevTime = 0

// Canvas management
const canvas = document.querySelector("canvas")
const ctx = canvas.getContext("2d")

function resize() {
    canvas.width = innerWidth
    canvas.height = innerHeight    
}

// SFX and music
const bkgMusic = document.getElementById("background_music")
const errorSFX = document.getElementById("error_sound")
const bumpSFX = document.getElementById("bump_sound")
const thudSFX = document.getElementById("thud_sound")
const spellSFX = document.getElementById("spell_sound")

function playError() {
    if (errorSFX.paused) {
        errorSFX.play()
    } else {
        errorSFX.currentTime = 0
    }
}

function playBump() {
    if (bumpSFX.paused) {
        bumpSFX.play()
    } else {
        bumpSFX.currentTime = 0
    }
}

function playThud() {
    if (thudSFX.paused) {
        thudSFX.play()
    } else {
        thudSFX.currentTime = 0
    }
}

function playSpell() {
    if (spellSFX.paused) {
        spellSFX.play()
    } else {
        spellSFX.currentTime = 0
    }
}

// Initialization pane
const pane = document.getElementById("pane")

// Mouse movement
const mouseLoc = {
    x: null,
    y: null
}

// Font management
function getFontScale() {
    ctx.font = "100px serif"
    let m = ctx.measureText("█")
    let h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
    return 100 / Math.ceil(h)
}

function converTextMeasurement(textMeasurement) {
    let box = {
        "up": textMeasurement.actualBoundingBoxAscent,
        "down": textMeasurement.actualBoundingBoxDescent,
        "left": textMeasurement.actualBoundingBoxLeft,
        "right": textMeasurement.actualBoundingBoxRight
    }

    return box
}

function getCorrectSize(height) {
    return Math.floor(height * FONT_SCALE)
}

const FONT_SCALE = getFontScale()

// Miscellania

function shuffle(arr) {
    for (let ind = arr.length - 1; ind > 0; ind--) {
        let swap = Math.floor(Math.random() * (ind + 1))
        let temp = arr[ind]
        arr[ind] = arr[swap]
        arr[swap] = temp
    }
}

function getCoveringAlpha(coverX, coverY, coverBox, baseX, baseY, baseBox) {
    let interMinX = Math.max(coverX - coverBox.left, baseX - baseBox.left)
    let interMaxX = Math.min(coverX + coverBox.right, baseX + baseBox.right)
    let interMinY = Math.max(coverY - coverBox.up, baseY - baseBox.up)
    let interMaxY = Math.min(coverY + coverBox.down, baseY + baseBox.down)
    
    // if (interMinX < interMaxX && interMinY < interMaxY) {
    //     let coverMidX = coverX + coverWidth / 2
    //     let coverMidY = coverY + coverHeight / 2
    //     let baseMidX = baseX + baseWidth / 2
    //     let baseMidY = baseY + baseHeight / 2

    //     let distX = Math.abs(coverMidX - baseMidX)
    //     let distY = Math.abs(coverMidY - baseMidY)

    //     let ratioX = distX / ((coverWidth + baseWidth) / 2)
    //     let ratioY = distY / ((coverHeight + baseHeight) / 2)

    //     return Math.max(ratioX, ratioY)
    // }

    let boxAlpha = 1
    
    if (interMinX < interMaxX && interMinY < interMaxY) {
        let interX = interMaxX - interMinX
        let interY = interMaxY - interMinY

        let coverWidth = coverBox.left + coverBox.right
        let coverHeight = coverBox.up + coverBox.down
        let baseWidth = baseBox.left + baseBox.right
        let baseHeight = baseBox.up + baseBox.down

        let ratioX = 1 - interX / Math.min(coverWidth, baseWidth)
        let ratioY = 1 - interY / Math.min(coverHeight, baseHeight)

        boxAlpha = Math.max(ratioX, ratioY)
    }

    let dist = Math.hypot(coverX - baseX, coverY - baseY)
    let scaledDist = (dist - 0.4 * RISE) / (0.4 * RISE)
    let distAlpha = Math.min(1, Math.max(0, scaledDist))

    return Math.min(boxAlpha, distAlpha)
}

//---------------------------//
//----- Event listeners -----//
//---------------------------//

resize()

addEventListener("resize", (event) => {
    resize()
})

let userHasInteracted = false

function firstInteraction() {
    console.log("User interaction!")
    userHasInteracted = true
    bodyHTML.classList.add("no-cursor")
    // bodyHTML.style.cursor = "none"
    bkgMusic.volume = 0.2
    bkgMusic.loop = true
    bkgMusic.play()
    pane.remove()
    requestAnimationFrame(initialize)
}

pane.addEventListener("click", (event) => {
    firstInteraction()
})

document.addEventListener("keydown", (event) => {
    if (!userHasInteracted && event.code === "Space") firstInteraction()
    console.log(`Document keydown: ${event.code}!`)
})

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

//-------------------//
//----- Sprites -----//
//-------------------//

class ColorManager {
    constructor(fill, stroke) {
        this.snapFill = null
        this.snapStroke = null

        this.fillQueue = [{"id": "default", "color": fill}]
        this.strokeQueue = [{"id": "default", "color": stroke}]
    }

    addFill(id, fill) {
        this.fillQueue.push({"id": id, "color": fill})
    }

    removeFill(id) {
        let ind = this.fillQueue.findIndex((elt) => (elt.id === id))
        console.assert(ind > -1, `Error! id ${id} not in fillQueue`)
        this.fillQueue.splice(ind, 1)
    }

    getFill() {
        return this.snapFill ?? this.fillQueue[this.fillQueue.length - 1].color
    }

    addStroke(id, stroke) {
        this.strokeQueue.push({"id": id, "color": stroke})
    }

    removeStroke(id) {
        let ind = this.strokeQueue.findIndex((elt) => (elt.id === id))
        console.assert(ind > -1, `Error! id ${id} not in strokeQueue`)
        this.strokeQueue.splice(ind, 1)
    }

    getStroke() {
        return this.snapStroke ?? this.strokeQueue[this.strokeQueue.length - 1].color
    }

    update() {
        this.snapFill = null
        this.snapStroke = null
    }
}

class HexagonSprite {
    constructor(x = 0, y = 0, fill = COLORS["dark terminal green"], edge = EDGE, rise = RISE, run = RUN) {
        this.x = x
        this.y = y
        // this.fill = fill

        this.colormanager = new ColorManager(fill, COLORS["terminal green"])

        this.edge = edge
        this.rise = rise
        this.run = run

        this.parent = null
        // this.snapFill = null
    }

    render() {
        let absX = this.x + (this.parent?.absX ?? 0)
        let absY = this.y + (this.parent?.absY ?? 0)
        ctx.globalAlpha = 1
        ctx.fillStyle = this.colormanager.getFill() // this.snapFill ?? this.fill
        ctx.strokeStyle = COLORS["terminal green"]
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

        // this.snapFill = null
        this.colormanager.update()
    }
}

class TextSprite {
    constructor(text, x = 0, y = 0, fill = COLORS["terminal green"]) {
        this.text = text
        this.x = x
        this.y = y
        this.fill = fill

        this.parent = null
        this.alpha = 1
        this.snapAlpha = null

        ctx.fillStyle = this.fill
        ctx.textBaseline = "middle"
        ctx.textAlign = "center"

        ctx.font = `${getCorrectSize(1.8 * RISE)}px serif`

        this.measure = ctx.measureText(this.text)
    }

    render() {
        let absX = this.x + (this.parent?.absX ?? 0)
        let absY = this.y + (this.parent?.absY ?? 0)

        ctx.globalAlpha = this.snapAlpha ?? this.alpha
        ctx.fillStyle = this.fill
        ctx.textBaseline = "middle"
        ctx.textAlign = "center"

        ctx.font = `${getCorrectSize(1.8 * RISE)}px serif`

        // if (this.measure === null) this.measure = ctx.measureText(this.text)
        ctx.fillText(this.text, absX, absY)
        // ctx.strokeRect(absX - this.measure.actualBoundingBoxLeft,
        //                absY - this.measure.actualBoundingBoxAscent,
        //                this.measure.actualBoundingBoxLeft + this.measure.actualBoundingBoxRight,
        //                this.measure.actualBoundingBoxAscent + this.measure.actualBoundingBoxDescent)

        ctx.globalAlpha = 1


        this.snapAlpha = null
    }
}

//---------------------------------//
//----- Hexagonal coordinates -----//
//---------------------------------//

function makeCoordinate(row, col) {
    let coordinate = {
        "row": row,
        "col": col
    }

    return coordinate
}

function validCoordinates(row, col, numRows, numCols, parity) {
    let isValid = ((row + col) % 2 === parity)
    isValid &&= (0 <= row && row < numRows)
    isValid &&= (0 <= col || col < numCols)
    
    return isValid
}

const HEX_DIRS = {
    "N": makeCoordinate(-2, 0),
    "NE": makeCoordinate(-1, 1),
    "SE": makeCoordinate(1, 1),
    "S": makeCoordinate(2, 0),
    "SW": makeCoordinate(1, -1),
    "NW": makeCoordinate(-1, -1),
}

function randomCell(numRows, numCols, parity) {
    while (true) {
        let row = Math.floor(Math.random() * numRows)
        let tog = (row + parity + 1) % 2
        let rowLength = Math.floor((numCols + tog) / 2)
        if (rowLength > 0) {
            let colIndex = Math.floor(Math.random() * rowLength)
            let col = 2 * colIndex + (row + parity) % 2

            return makeCoordinate(row, col)
        }
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
                // let hex = new HexagonSprite(col * (EDGE + RUN), row * RISE)
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
        let isValid = validCoordinates(row, col, this.numRows, this.numCols, this.parity)
        console.assert(isValid,
            `No cell at (${row}, ${col})`)
        if (!isValid) return

        let i = row
        let j = Math.floor(col / 2)

        this.rows[i][j] = sprite

        if (sprite !== null) {
            sprite.x = col * (EDGE + RUN)
            sprite.y = row * RISE
            sprite.parent = this

            if ("row" in sprite) sprite.row = row
            if ("col" in sprite) sprite.col = col
        }
    }

    get(row, col) {
        let isValid = validCoordinates(row, col, this.numRows, this.numCols, this.parity)
        console.assert(isValid,
            `No cell at (${row}, ${col})`)
        if (!isValid) return null

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
        this.grids["ENTITY"] = new HexGrid(widthRows, heightCols, EDGE / 2 + RUN, RISE, parity)
        this.grids["ENTITY"].parent = this
        
        this.entities = []
    }

    getCell(x, y) {
        let relX = x - this.x
        let relY = y - this.y

        if (relX < 0 || relX > this.pxWidth || relY < 0 || relY > this.pxHeight) {
            return makeCoordinate(null, null)
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
            return makeCoordinate(null, null)
        }

        return makeCoordinate(row, col)
    }

    getCells(x, y, w, h) {
        let minX = x, minY = y
        let maxX = x + w, maxY = y + h


        let minCol = Math.max(Math.floor(minX / (EDGE + RUN)) - 1, 0)
        let maxCol = Math.min(Math.floor(maxX / (EDGE + RUN)), this.numRows - 1)

        let minRowBlock = Math.floor(minY / RISE)
        let maxRowBlock = Math.floor(maxY / RISE)

        let cells = []

        for (let col = minCol; col <= maxCol; col++) {
            let minTog = (this.parity + minRowBlock + col) % 2
            let maxTog = (this.parity + maxRowBlock + col) % 2

            let rowMin = minRowBlock - minTog
            let rowMax = maxRowBlock - maxTog

            for (let row = rowMin; row <= rowMax; row += 2) {
                if (0 <= row && row < this.numRows) cells.push(makeCoordinate(row, col))
            }
        }

        return cells
    }

    get(layer, row, col) {
        return this.grids[layer].get(row, col)
    }

    set(layer, row, col, val, erase = false) {
        if (erase && layer == "ENTITY") {
            let oldval = this.grids[layer].get(row, col)
            if (oldval instanceof Entity) {
                let index = this.entities.indexOf(oldval)
                if (index > -1) this.entities.splice(index, 1)
            }
        }

        this.grids[layer].set(row, col, val)

        if (layer == "ENTITY" && val instanceof Entity) {
            if (this.entities.indexOf(val) == -1) this.entities.push(val)
        }
    }

    isEmpty(row, col) {
        if (0 > row || row >= this.numRows) return false
        if (0 > col || col >= this.numCols) return false
        return (this.get("ENTITY", row, col) === null)
    }

    makeHexGraph() {
        let graph = new HexGraph(this.numRows, this.numCols, this.parity)
        
        for(let row = 0; row < this.numRows; row++) {
            for(let col = (row + this.parity) % 2; col < this.numCols; col += 2) {
                let vertex = new HexVertex(row, col)
                for (let dir in HEX_DIRS) {
                    let adjRow = row + HEX_DIRS[dir].row
                    let adjCol = col + HEX_DIRS[dir].col
                    if (this.isEmpty(adjRow, adjCol)) {
                        vertex.edges[dir] = 1
                    } else {
                        vertex.edges[dir] = null
                    }
                }
                graph.set(row, col, vertex)
            }
        }

        return graph
    }

    prerender() {
        for (let row = 0; row < this.numRows; row++) {
            let off = (row + this.parity) % 2
            for (let col = off; col < this.numCols; col += 2) {
                let entity = this.grids["ENTITY"].get(row, col)
                if (entity !== null && "sprite" in entity) {                    
                    if (entity.animation !== null) {
                        let x = entity.x + EDGE / 2 + RUN
                        let y = entity.y + RISE
                        let entityBox = converTextMeasurement(entity.sprite.measure)
                        let cells = this.getCells(x - entityBox.left,
                                                  y - entityBox.up,
                                                  entityBox.left + entityBox.right,
                                                  entityBox.up + entityBox.down)
                        for (let cell of cells) {
                            let hex = this.grids["GROUND"].get(cell.row, cell.col)
                            let text = this.grids["TEXT"].get(cell.row, cell.col)
                            let textX = text.x + EDGE / 2 + RUN
                            let textY = text.y + RISE
                            let textBox = converTextMeasurement(text.measure)

                            let alpha = getCoveringAlpha(x, y, entityBox, textX, textY, textBox)

                            // hex.snapFill = "#664600"
                            text.snapAlpha = Math.min(text.snapAlpha ?? 1, alpha)
                        }
                    } else {
                        let text = this.grids["TEXT"].get(row, col)
                        text.snapAlpha = 0
                    }
                }
            }
        }
    }

    render() {
        this.absX = this.x + (this.parent?.absX ?? 0)
        this.absY = this.y + (this.parent?.absY ?? 0)

        this.grids["GROUND"].render()
        this.grids["TEXT"].render()
        this.grids["ENTITY"].render()
    }
}

//-----------------------------//
//----- Pathfinding logic -----//
//-----------------------------//

class HexVertex {
    constructor(row, col) {
        this.row = row
        this.col = col

        this.distance = Infinity
        this.finalized = false

        this.edges = {}
    }
}

class HexGraph {
    constructor(numRows, numCols, parity = 0) {
        this.numRows = numRows
        this.numCols = numCols
        this.parity = parity

        this.rows = []
        for(let row = 0; row < this.numRows; row++) {
            let hexRow = []
            for(let col = (row + this.parity) % 2; col < this.numCols; col += 2) {
                hexRow.push(null)
            }
            this.rows.push(hexRow)
        }

        this.queue = []
    }

    get(row, col) {
        let isValid = validCoordinates(row, col, this.numRows, this.numCols, this.parity)
        console.assert(isValid,
            `No cell at (${row}, ${col})`)
        if (!isValid) return null

        let i = row
        let j = Math.floor(col / 2)

        return this.rows[i][j]
    }

    set(row, col, val) {
        let isValid = validCoordinates(row, col, this.numRows, this.numCols, this.parity)
        console.assert(isValid,
            `No cell at (${row}, ${col})`)
        if (!isValid) return

        let i = row
        let j = Math.floor(col / 2)

        this.rows[i][j] = val
    }

    sortQueue() {
        this.queue.sort((aVertex, bVertex) => {
            if (!Number.isFinite(bVertex.distance)) {
                return Number.isFinite(aVertex.distance) ? -1 : 0
            }
            return aVertex.distance - bVertex.distance
        })
    }

    buildQueue() {
        for (let row = 0; row < this.numRows; row++) {
            let off = (row + this.parity) % 2
            for (let col = off; col < this.numCols; col += 2) {
                let vertex = this.get(row, col)
                if (vertex !== null && !vertex.finalized) {
                    this.queue.push(vertex)
                }
            }
        }

        this.sortQueue()
    }

    stepDistances(destRow, destCol) {
        console.assert(this.queue.length > 0, "Pathfinding error: empty queue!")
        let currVertex = this.queue.shift()
        console.assert(Number.isFinite(currVertex.distance),
            "Pathfinding error: top of queue has infinite distance")
        
        for (let dir in HEX_DIRS) {
            if (currVertex.edges[dir] !== null) {
                let adjRow = currVertex.row + HEX_DIRS[dir].row
                let adjCol = currVertex.col + HEX_DIRS[dir].col
                let adjVertex = this.get(adjRow, adjCol)

                adjVertex.distance = Math.min(currVertex.distance + currVertex.edges[dir],
                                              adjVertex.distance)
            }
        }

        currVertex.finalized = true
        this.sortQueue()

        if (currVertex.row === destRow && currVertex.col === destCol) return false
        if (this.queue.length === 0) return false

        return Number.isFinite(this.queue[0].distance)
    }

    calculateDistances(startRow, startCol, destRow = null, destCol = null) {
        console.assert(this.rows[startRow][startCol] !== null,
            `Invalid graph position (${startRow}, ${startCol}) has no vertex!`)

        this.get(startRow, startCol).distance = 0
        this.buildQueue()

        let continueStep = true
        while (continueStep) {
            continueStep = this.stepDistances(destRow, destCol)
        }

        if (this.queue.length === 0 || !Number.isFinite(this.queue[0].distance)) return false

        return true
    }

    getPath(destRow, destCol) {
        console.assert(this.get(destRow, destCol).finalized,
            `Graph position (${destRow}, ${destRow}) is not finalied!`)
        
        let currVertex = this.get(destRow, destCol)
        let path = [makeCoordinate(currVertex.row, currVertex.col)]

        while (currVertex.distance !== 0) {
            let minDistance = currVertex.distance
            let candidates = []

            for (let dir in HEX_DIRS) {
                let adjRow = currVertex.row + HEX_DIRS[dir].row
                let adjCol = currVertex.col + HEX_DIRS[dir].col
                let adjVertex = this.get(adjRow, adjCol)
                if (adjVertex.finalized) {
                    if (adjVertex.distance < minDistance) {
                        candidates.splice(0, candidates.length, adjVertex)
                        minDistance = adjVertex.distance
                    } else if (adjVertex.distance == minDistance) {
                        candidates.push(adjVertex)
                    }
                }
            }

            let nextVertex = candidates[Math.floor(Math.random() * candidates.length)]
            path.unshift(makeCoordinate(nextVertex.row, nextVertex.col))
            currVertex = nextVertex
        }

        return path
    }
}

//-----------------------------------//
//----- Entities and Components -----//
//-----------------------------------//

class Component {
    constructor(name, entity = null) {
        this.name = name
        this.entity = entity
        if (this.entity !== null) this.entity.addComponent(this)
    }
}

class PlayerComponent extends Component {
    constructor() {
        super("player", null)
        this.isRandomWalking = false
        // this.lastMoveCollision = null
    }
}

class EnemyComponent extends Component {
    constructor() {
        super("enemy", null)
    }
}

class SummonerComponent extends Component {
    constructor(limit) {
        super("summoner", null)
        this.limit = limit
        this.maxMana = 10
        this.mana = 10
        this.children = []
    }

    addMana(inc) {
        this.mana = Math.min(this.maxMana, this.mana + inc)
    }

    subMana(dec) {
        this.mana = Math.max(0, this.mana - dec)
    }

    addChild(child) {
        this.children.push(child)
    }

    removeChild(child) {
        let index = this.children.indexOf(child)
        if (index > -1) this.children.splice(index, 1)
    }
}

class SummonsComponent extends Component {
    constructor(summoner) {
        super("summons", null)
        console.assert(summoner.hasComponent("summoner"),
            "Errors!  Tried to create summons with invalid summoner!")
        this.summoner = summoner
    }
}

class Entity {
    constructor(sprite, x = 0, y = 0) {
        this.sprite = sprite
        sprite.parent = this

        this.x = x
        this.y = y
        this.absX = this.x
        this.absY = this.y

        this.animation = null

        this.components = {}
    }

    addComponent(component) {
        this.components[component.name] = component
        component.entity = this
    }

    removeComponent(name) {
        delete this.components[name]
    }

    hasComponent(name) {
        return (name in this.components)
    }

    isAll(...names) {
        for (let name in names) {
            if (!this.hasComponent(name)) return false
        }
        return true
    }

    isOne(...names) {
        for (let name in names) {
            if (this.hasComponent(name)) return true
        }
        return false
    }

    getComponent(name) {
        return this.components[name]
    }

    render() {
        this.absX = this.x + (this.parent?.absX ?? 0)
        this.absY = this.y + (this.parent?.absY ?? 0)

        this.sprite.render()
    }
}

class TextEntity extends Entity {
    constructor(char, x = 0, y = 0) {
        let sprite = new TextSprite(char, 0, 0)
        super(sprite, x, y)
        this.row = null
        this.col = null
    }
}

//----------------------//
//----- Animations -----//
//----------------------//

class KeyFrame {
    constructor(timestamp, update = null) {
        this.timestamp = timestamp
        this.update = update
    }

    execute() {
        if (this.update !== null) this.update()
    }
}

class Tween {
    constructor(duration, tweenFn) {
        this.duration = duration
        this.tweenFn = tweenFn
        this.elapsedTime = 0
    }

    updateDelta(delta) {
        this.elapsedTime += delta
        this.tweenFn((this.elapsedTime > this.duration) ? this.duration : this.elapsedTime)

        return this.duration - this.elapsedTime
    }

    updateTimestamp(timestamp) {
        this.elapsedTime = timestamp
        this.tweenFn((this.elapsedTime > this.duration) ? this.duration : this.elapsedTime)

        return this.duration - this.elapsedTime
    }
}

class KeyframeAnimation {
    static checkInputs(keyframes, tweens) {
        console.assert(keyframes.length === tweens.length + 1,
            `Animation consists of ${keyframes.length} keyframes and ${tweens.length} tweens!`)
        console.assert(keyframes[0].timestamp === 0,
            `Animation's initial keyframe is at ${keyframes[0].timestamp} ms!`)

        let runningDuration = 0
        for (let i = 0; i < tweens.length; i++) {
            console.assert(Number.isInteger(tweens[i].duration),
                `Animation's tween has noniteger duration ${tweens[i].duration} ms!`)
            runningDuration += tweens[i].duration
            console.assert(keyframes[i + 1].timestamp === runningDuration,
                `Animation's keyframe is at ${keyframes[i + 1].timestamp} ms (should be ${runningDuration} ms)!`)
        }
    }

    constructor(keyframes, tweens, loops = false) {
        KeyframeAnimation.checkInputs(keyframes, tweens)

        this.keyframes = keyframes
        this.tweens = tweens
        this.duration = this.keyframes[this.keyframes.length - 1].timestamp
        this.loops = loops
        this.elapsedTime = 0
        this.lastKeyframeIndex = -1
    }

    start() {
        let firstKeyframe = this.keyframes[0]

        firstKeyframe.execute()

        this.lastKeyframeIndex = 0
    }

    updateLogic(delta) {
        this.elapsedTime += delta

        do {
            for (let i = this.lastKeyframeIndex + 1; i < this.keyframes.length && this.keyframes[i].timestamp <= this.elapsedTime; i++) {
                this.keyframes[i].execute()
                this.lastKeyframeIndex = i
            }
            if (this.lastKeyframeIndex >= this.tweens.length) {
                if (this.loops) {
                    this.elapsedTime -= this.duration
                    this.start()
                } else {
                    break
                }
            }
        } while (this.elapsedTime >= this.duration)

        return this.duration - this.elapsedTime
    }

    update(delta) {
        let ret = this.updateLogic(delta)

        if (this.lastKeyframeIndex >= 0 && this.lastKeyframeIndex < this.tweens.length) {
            let tweenTime = this.elapsedTime - this.keyframes[this.lastKeyframeIndex].timestamp
            this.tweens[this.lastKeyframeIndex].updateTimestamp(tweenTime)
        }

        return ret
    }
}

class IdleAnimation extends KeyframeAnimation {
    constructor(entity, magnitude, duration) {

        let startY = entity.y

        function tweenFn(timestamp) {
            // let progress = timestamp / duration
            let progress = (timestamp / duration) * 2 * Math.PI
            entity.y = startY - magnitude * Math.sin(progress)
        }

        // function endFn() {
        //     entity.y = startY
        // }

        let keyframes = [new KeyFrame(0), new KeyFrame(duration)]
        let tweens = [new Tween(duration, tweenFn)]

        super(keyframes, tweens, true)

        this.entity = entity
        this.startY = startY
        this.magnitude = magnitude
        this.duration = duration
    }
}

class HexMoveAnimation extends KeyframeAnimation {
    constructor(entity, hexgrid, destRow, destCol, duration) {
        console.assert(entity.parent === hexgrid,
            "Error! HexMoveAnimation called on entity with incorrect grid!")

        let startX = entity.x
        let startY = entity.y
        let destX = destCol * (EDGE + RUN)
        let destY = destRow * RISE

        function startFn() {
            // console.log("Beginning move!")
            blockingCounter++
        }

        function tweenFn(timestamp) {
            // let progress = timestamp / duration
            let progress = (1 - Math.cos((timestamp / duration) * Math.PI)) / 2
            entity.x = (1 - progress) * startX + (progress) * destX
            entity.y = (1 - progress) * startY + (progress) * destY
        }

        function endFn() {
            // console.log("Move ended!")
            hexgrid.set(entity.row, entity.col, null)
            hexgrid.set(destRow, destCol, entity)
            entity.animation = null
            blockingCounter--
        }

        let keyframes = [new KeyFrame(0, startFn), new KeyFrame(duration, endFn)]
        let tweens = [new Tween(duration, tweenFn)]

        super(keyframes, tweens)

        this.entity = entity
        this.startX = startX
        this.startY = startY
        this.destX = destX
        this.destY = destY
        this.duration = duration
    }
}

class HexPathAnimation extends KeyframeAnimation {
    constructor(entity, hexgrid, path, stepDuration) {
        console.assert(entity.parent === hexgrid,
            "Error! HexPathAnimation called on entity with incorrect grid!")
        console.assert(path.length > 1,
            `Error! HexPathAnimation called on path of length ${path.length}!`)
    
        function coordToPx(coordinate) {
            let x = coordinate.col * (EDGE + RUN)
            let y = coordinate.row * RISE
            let pixels = {"x": x, "y": y}
            return pixels
        }

        function tweenHelper(initX, initY, endX, endY, timestamp) {
            // let progress = timestamp / duration
            let progress = (1 - Math.cos((timestamp / stepDuration) * Math.PI)) / 2
            entity.x = (1 - progress) * initX + (progress) * endX
            entity.y = (1 - progress) * initY + (progress) * endY
        }

        function keyframeHelper(row, col) {
            hexgrid.set(entity.row, entity.col, null)
            hexgrid.set(row, col, entity)
        }

        let positions = path.map(coordToPx)
        positions[0].x = entity.x
        positions[0].y = entity.y


        function startFn() {
            // console.log("Beginning move!")
            blockingCounter++
        }

        function endFn() {
            // console.log("Move ended!")
            hexgrid.set(entity.row, entity.col, null)
            hexgrid.set(path[path.length - 1].row, path[path.length - 1].col, entity)
            hexroom.get("GROUND", path[path.length - 1].row, path[path.length - 1].col).colormanager.removeFill("dest")
            entity.animation = null
            blockingCounter--
        }

        let keyframes = [new KeyFrame(0, startFn)]

        for (let i = 1; i < path.length - 1; i++) {
            function keyFn() {
                keyframeHelper(path[i].row, path[i].col)
            }
            keyframes.push(new KeyFrame(i * stepDuration, keyFn))
        }

        keyframes.push(new KeyFrame((path.length - 1) * stepDuration, endFn))

        let tweens = []

        for (let i = 0; i < path.length - 1; i++) {
            function tweenFn(timestamp) {
                tweenHelper(positions[i].x, positions[i].y,
                            positions[i + 1].x, positions[i + 1].y,
                            timestamp)
            }
            tweens.push(new Tween(stepDuration, tweenFn))
        }

        super(keyframes, tweens)

        this.entity = entity
    }
}

class HexBumpAnimation extends KeyframeAnimation {
    constructor(entity, hexroom, destRow, destCol, duration) {
        console.assert(entity.parent.parent === hexroom,
            "Error! HexBumpAnimation called on entity with incorrect room!")

        let startX = entity.x
        let startY = entity.y
        let destX = destCol * (EDGE + RUN)
        let destY = destRow * RISE

        let dist = Math.hypot(destX - startX, destY - startY)

        destX = startX + Math.round((destX - startX) * 8 / dist)
        destY = startY + Math.round((destY - startY) * 8 / dist)

        function startFn() {
            // console.log("Beginning move!")
            blockingCounter++
        }

        function tweenOutFn(timestamp) {
            // let progress = Math.sin((timestamp / duration) * Math.PI)
            let progress = (1 - Math.cos((timestamp / duration) * 2 * Math.PI)) / 2
            entity.x = (1 - progress) * startX + (progress) * destX
            entity.y = (1 - progress) * startY + (progress) * destY
        }

        function midFn() {
            entity.x = destX
            entity.y = destY
            let blocker = hexroom.get("ENTITY", destRow, destCol)
            if (blocker instanceof Entity) {
                killEntity(blocker, hexroom)
                // blocker.animation = new HexDieAnimation(blocker, hexroom, 200)
                // blocker.animation.start()
                playBump()
            } else {
                playThud()
            }
        }

        function tweenInFn(timestamp) {
            // let progress = Math.sin((timestamp / duration) * Math.PI)
            let progress = (1 - Math.cos(((timestamp + Math.floor(duration / 2)) / duration) * 2 * Math.PI)) / 2
            entity.x = (1 - progress) * startX + (progress) * destX
            entity.y = (1 - progress) * startY + (progress) * destY
        }

        function endFn() {
            // console.log("Move ended!")
            entity.x = startX
            entity.y = startY
            entity.animation = null
            blockingCounter--
        }

        let keyframes = [new KeyFrame(0, startFn),
                         new KeyFrame(Math.floor(duration / 2), midFn),
                         new KeyFrame(duration, endFn)]
        let tweens = [new Tween(Math.floor(duration / 2), tweenOutFn), new Tween(Math.ceil(duration / 2), tweenInFn)]

        super(keyframes, tweens)

        this.entity = entity
        this.startX = startX
        this.startY = startY
        this.destX = destX
        this.destY = destY
        this.duration = duration
    }
}

class HexCastAnimation extends KeyframeAnimation {
    constructor(entity, midCallback, midArgs, duration) {
        let startX = entity.x
        let startY = entity.y

        function startFn() {
            // console.log("Beginning move!")
            blockingCounter++
        }

        function tweenOutFn(timestamp) {
            let progress = timestamp / duration
            let dist = 5 * Math.sin(progress * Math.PI)
            entity.x = startX + dist * Math.cos(progress * 8 * Math.PI)
            entity.y = startY - dist * Math.sin(progress * 8 * Math.PI)
        }

        function midFn() {
            entity.x = startX
            entity.y = startY - 5
            playSpell()
            midCallback(...midArgs)
        }

        function tweenInFn(timestamp) {
            let progress = (timestamp + Math.floor(duration / 2)) / duration
            let dist = 5 * Math.sin(progress * Math.PI)
            entity.x = startX + dist * Math.cos(progress * 8 * Math.PI)
            entity.y = startY - dist * Math.sin(progress * 8 * Math.PI)
        }

        function endFn() {
            // console.log("Move ended!")
            entity.x = startX
            entity.y = startY
            entity.animation = null
            blockingCounter--
        }

        let keyframes = [new KeyFrame(0, startFn),
                         new KeyFrame(Math.floor(duration / 2), midFn),
                         new KeyFrame(duration, endFn)]
        let tweens = [new Tween(Math.floor(duration / 2), tweenOutFn), new Tween(Math.ceil(duration / 2), tweenInFn)]

        super(keyframes, tweens)

        this.entity = entity
        this.startX = startX
        this.startY = startY
        this.duration = duration
    }
}

class HexShakeAnimation extends KeyframeAnimation {
    constructor(entity, duration) {
        let startX = entity.x
        let startY = entity.y

        function startFn() {
            playError()
            blockingCounter++
        }

        function tweenFn(timestamp) {
            let shake = Math.sin((timestamp / duration) * 8 * Math.PI)
            entity.x = startX - 3 * shake
        }

        function endFn() {
            entity.x = startX
            entity.y = startY
            entity.animation = null
            blockingCounter--
        }

        let keyframes = [new KeyFrame(0, startFn), new KeyFrame(duration, endFn)]
        let tweens = [new Tween(duration, tweenFn)]

        super(keyframes, tweens)

        this.entity = entity
        this.startX = startX
        this.startY = startY
        this.duration = duration
    }
}

class FadeInAnimation extends KeyframeAnimation {
    constructor(entity, duration) {
        function startFn() {
            entity.sprite.alpha = 0
            blockingCounter++
        }

        function tweenFn(timestamp) {
            let progress = timestamp / duration
            entity.sprite.alpha = progress
        }

        function endFn() {
            entity.sprite.alpha = 1
            entity.animation = new IdleAnimation(entity, 5, 6000)
            entity.animation.start()
            blockingCounter--
        }

        let keyframes = [new KeyFrame(0, startFn), new KeyFrame(duration, endFn)]
        let tweens = [new Tween(duration, tweenFn)]

        super(keyframes, tweens)

        this.entity = entity
        this.duration = duration
    }
}

class HexDieAnimation extends KeyframeAnimation {
    constructor(entity, hexroom, duration) {
        console.assert(entity.parent.parent === hexroom,
            "Error! HexDieAnimation called on entity with incorrect room!")

        function startFn() {
            entity.sprite.alpha = 1
            blockingCounter++
        }

        function tweenFn(timestamp) {
            let progress = timestamp / duration
            entity.sprite.alpha = 1 - progress
        }

        function endFn() {
            entity.sprite.alpha = 0
            entity.animation = null
            hexroom.set("ENTITY", entity.row, entity.col, null, true)
            blockingCounter--
        }

        let keyframes = [new KeyFrame(0, startFn), new KeyFrame(duration, endFn)]
        let tweens = [new Tween(duration, tweenFn)]

        super(keyframes, tweens)

        this.entity = entity
        this.duration = duration
    }
}

//--------------------------//
//----- The main scene -----//
//--------------------------//

function clearCanvas(bkgFill = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (bkgFill) {
        ctx.fillStyle = bkgFill
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
}

function drawDots(step) {
    let centerX = Math.floor(canvas.width  / 2)
    let centerY = Math.floor(canvas.height / 2)

    let stepsX = Math.ceil(centerX / step)
    let stepsY = Math.ceil(centerY / step)

    for (let stepX = -stepsX; stepX <= stepsX; stepX++) {
        for (let stepY = -stepsY; stepY <= stepsY; stepY++) {
            let x = centerX + step * stepX
            let y = centerY + step * stepY

            ctx.fillStyle = "#FFB000"
            ctx.beginPath()
            ctx.arc(x, y, 2, 0, 2 * Math.PI, false)
            ctx.fill()
        }
    }
}

let parity = 1

let hexroom = new HexRoom(19, 11, 200, 200, parity)

function makeEntity(text, ...components) {
    let entity = new TextEntity(text, 0, 0)
    for (let component of components) {
        entity.addComponent(component)
    }

    return entity
}

function killEntity(entity, hexroom) {
    entity.animation = new HexDieAnimation(entity, hexroom, 200)
    entity.animation.start()

    if (entity.hasComponent("summons")) {
        let summoner = entity.getComponent("summons").summoner
        summoner.getComponent("summoner").removeChild(entity)
    }

    if (entity.hasComponent("summoner")) {
        let summons = entity.getComponent("summoner").children.slice(0)
        for (let summon of summons) {
            killEntity(summon, hexroom)
        }
    }
}

function spawnEntity(entity, hexroom, row, col, add = false) {
    if (add && entity.hasComponent("summons")) {
        let summoner = entity.getComponent("summons").summoner
        summoner.getComponent("summoner").addChild(entity)
    }

    hexroom.set("ENTITY", row, col, entity)
    entity.animation = new FadeInAnimation(entity, 200)
    entity.animation.start()
}

function isPlayerExposed() {
    let ct = 0
    for (let dir in HEX_DIRS) {
        let row = player.row + HEX_DIRS[dir].row
        let col = player.col + HEX_DIRS[dir].col
        if (hexroom.get("ENTITY", row, col) === null) {
            ct++
        }
    }

    return (ct >= 5)
}

function boxPlayerIn(summoner) {
    let summonComp = summoner.getComponent("summoner")

    summonComp.subMana(10)

    let dirs = Object.keys(HEX_DIRS)
    shuffle(dirs)

    for (let dir of dirs) {
        let row = player.row + HEX_DIRS[dir].row
        let col = player.col + HEX_DIRS[dir].col
        if (hexroom.get("ENTITY", row, col) === null && summonComp.children.length < summonComp.limit) {
            let newEntity = makeEntity("鬼", new EnemyComponent(), new SummonsComponent(summoner))
            summonComp.addChild(newEntity)
            spawnEntity(newEntity, hexroom, row, col)
        }
        // let newEntity = new TextEntity("零", 0, 0)
    }

    // while (hexroom.entities.length < numEnts + 1) {
    //     let addLoc = randomCell(hexroom.numRows, hexroom.numCols, hexroom.parity)
    //     // hexroom.get("GROUND", addLoc.row, addLoc.col).snapFill = "red"
    //     if (hexroom.get("ENTITY", addLoc.row, addLoc.col) === null) {
    //         let newEntity = new TextEntity("零", 0, 0)
    //         hexroom.set("ENTITY", addLoc.row, addLoc.col, newEntity)
    //         newEntity.animation = new IdleAnimation(newEntity, 5, 6000)
    //         newEntity.animation.start()
    //     }
    // }
}

function makeHexRoom(hexroom) {
    // hexgrid = new HexGrid(11, 19, 200, 200)

    for (let row = 0; row < hexroom.numRows; row++) {
        let off = (row + parity) % 2
        for (let col = off; col < hexroom.numCols; col += 2) {
            let hex = new HexagonSprite()
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
        hexroom.set("ENTITY", (col + parity) % 2, col, new TextSprite("█"))
        hexroom.set("ENTITY", hexroom.numRows - 1 - ((col + parity) % 2), col, new TextSprite("█"))
    }

    for(let row = parity; row < hexroom.numRows; row += 2) {
        hexroom.set("ENTITY", row, 0, new TextSprite("█"))
        hexroom.set("ENTITY", row, hexroom.numCols - 1, new TextSprite("█"))
    }
}

let player = makeEntity("@", new PlayerComponent()) // new TextEntity("@", 0, 0)

let summonerEntity = makeEntity("S", new EnemyComponent(), new SummonerComponent(20)) // new TextEntity("S", 0, 0)

let cursorLoc = makeCoordinate(null, null)
let destLoc = makeCoordinate(null, null)

let blockingCounter = 0
let playerTurn = true

let enemies = null
let enemyInd = 0

function summonerAI(enemy) {
    let summonComp = enemy.getComponent("summoner")
    let numEnts = summonComp.limit

    summonComp.addMana(1)
    console.log(`Enemy: summoner/${summonComp.children.length}/${summonComp.mana}`)

    if (isPlayerExposed() && summonComp.mana >= 10) {
        let summonAnimation = new HexCastAnimation(enemy, boxPlayerIn, [enemy], 1000)
        enemy.animation = summonAnimation
        enemy.animation.start()
        // boxPlayerIn(enemy)
    } else if (summonComp.children.length < numEnts && summonComp.mana >= 2) {
        let foundEmpty = false
        do {
            let addLoc = randomCell(hexroom.numRows, hexroom.numCols, hexroom.parity)
            if (hexroom.get("ENTITY", addLoc.row, addLoc.col) === null) {
                // let newEntity = new TextEntity("零", 0, 0)
                function summonLambda() {
                    let newEntity = makeEntity("鬼", new EnemyComponent(), new SummonsComponent(enemy))
                    summonComp.addChild(newEntity)
                    summonComp.subMana(2)
                    spawnEntity(newEntity, hexroom, addLoc.row, addLoc.col)
                }

                let summonAnimation = new HexCastAnimation(enemy, summonLambda, [], 1000)
                enemy.animation = summonAnimation
                enemy.animation.start()
                foundEmpty = true
            }
        } while (!foundEmpty)
    } else {
        let dirs = Object.keys(HEX_DIRS)
        let destDir = HEX_DIRS[dirs[Math.floor(Math.random() * dirs.length)]]
        let dest = makeCoordinate(enemy.row + destDir.row, enemy.col + destDir.col)
    
        if (hexroom.isEmpty(dest.row, dest.col)) {
            let anim = new HexMoveAnimation(enemy, hexroom.grids["ENTITY"], dest.row, dest.col, 1000)
            enemy.animation = anim
            enemy.animation.start()
        } else {
            let anim = new HexBumpAnimation(enemy, hexroom, dest.row, dest.col, 400)
            enemy.animation = anim
            enemy.animation.start()
        }
    }

    return true
}

function enemyLogic() {

    if (enemies === null) {
        enemies = hexroom.entities.filter((entity) => entity.hasComponent("enemy"))
        enemyInd = 0
    }

    let acted = false

    while (enemyInd < enemies.length && !acted) {
        console.log(`Enemy #${enemyInd}`)
        let enemy = enemies[enemyInd]

        if (enemy.hasComponent("summoner")) {
            acted = summonerAI(enemy)
        } else {
            acted = false
        }

        enemyInd++
    }

    if (enemyInd === enemies.length) {
        playerTurn = true
        enemies = null
    } else {
        playerTurn = false
    }
}

function playerLogic() {
    let comp = player.getComponent("player")
    if (comp.isRandomWalking) {
        if (destLoc.row !== null) hexroom.get("GROUND", destLoc.row, destLoc.col).colormanager.removeFill("dest")

        destLoc = makeCoordinate(null, null)

        let dirs = Object.keys(HEX_DIRS)
        let destDir = HEX_DIRS[dirs[Math.floor(Math.random() * dirs.length)]]
    
        // let dest = destCells[Math.floor(Math.random() * destCells.length)]
        let dest = makeCoordinate(player.row + destDir.row, player.col + destDir.col)
    
        if (hexroom.isEmpty(dest.row, dest.col)) {
            let anim = new HexMoveAnimation(player, hexroom.grids["ENTITY"], dest.row, dest.col, 1000)
            player.animation = anim
            player.animation.start()
            playerTurn = true
        } else {
            let anim = new HexBumpAnimation(player, hexroom, dest.row, dest.col, 400)
            player.animation = anim
            player.animation.start()

            comp.isRandomWalking = false
            playerTurn = false
        }
    } else {
        destLoc = randomCell(hexroom.numRows, hexroom.numCols, hexroom.parity)

        let graph = hexroom.makeHexGraph()
        graph.calculateDistances(player.row, player.col, destLoc.row, destLoc.col)
        let destVertex = graph.get(destLoc.row, destLoc.col)
        // console.log(`Distance to (${destLoc.row}, ${destLoc.col}): ${destVertex.distance}`)
        
        // Hacky workaround for Path animations failing when path.length == 1
        if (Number.isFinite(destVertex.distance) && destVertex.distance !== 0) {
            hexroom.get("GROUND", destLoc.row, destLoc.col).colormanager.addFill("dest", COLORS["dark flourescent blue"])

            let path = graph.getPath(destLoc.row, destLoc.col)
            
            let anim = new HexPathAnimation(player, hexroom.grids["ENTITY"], path, 1000)
            player.animation = anim
            player.animation.start()
            playerTurn = false
        } else {
            hexroom.get("GROUND", destLoc.row, destLoc.col).colormanager.addFill("dest", COLORS["dark neon red"])

            let anim = new HexShakeAnimation(player, 400)
            player.animation = anim
            player.animation.start()
            comp.isRandomWalking = true
            playerTurn = true
        }
    }
}

function processAnimations(delta) {
    for (let entity of hexroom.entities) {
        entity.animation?.update(delta)
    }

    let isBlocked = (blockingCounter > 0)
    return isBlocked
}

function gameLogic() {
    if (playerTurn) playerLogic()
    else enemyLogic()
}

function renderFrame() {
    // clearCanvas("#282828")
    clearCanvas(COLORS["terminal black"])

    hexroom.prerender()
    hexroom.render()
    ctx.strokeRect(hexroom.x, hexroom.y, hexroom.pxWidth, hexroom.pxHeight)
    drawDots(50)

    if (mouseLoc.x !== null && mouseLoc.y !== null) {
        ctx.fillStyle = COLORS["terminal amber"] // "#FFB000"
        ctx.beginPath()
        ctx.arc(mouseLoc.x, mouseLoc.y, 5, 0, 2 * Math.PI, false)
        ctx.fill()
    }
}

function updateLoop(timestamp) {
    // Get time since last frame
    prevTime = currTime
    currTime = timestamp
    let delta = (currTime - prevTime)
    
    // Increment all active animations by delta milliseconds
    let isBlocked = processAnimations(delta)

    // UI spaghetti
    hexroom.x = Math.floor((canvas.width - hexroom.pxWidth) / 2)
    hexroom.y = Math.floor((canvas.height - hexroom.pxHeight) / 2)

    if (mouseLoc.x !== null && mouseLoc.y !== null) {
        let oldloc = cursorLoc
        cursorLoc = hexroom.getCell(mouseLoc.x, mouseLoc.y)

        if (cursorLoc.row !== oldloc.row || cursorLoc.col !== oldloc.col) {
            let hex = null
            if (oldloc.row !== null) {
                hex = hexroom.get("GROUND", oldloc.row, oldloc.col)
                hex.colormanager.removeFill("select") // COLORS["dark terminal green"] // "#0A3300"
            }
            if (cursorLoc.row !== null) {
                hex = hexroom.get("GROUND", cursorLoc.row, cursorLoc.col)
                hex.colormanager.addFill("select", COLORS["dark terminal amber"]) // "#664600"
            }
        }
    }

    // If we're not being blocked by an animation, update the game logic
    if (!isBlocked) {
        gameLogic()
    }

    // Render the actual frame
    renderFrame()

    // Move on to the next frame
    requestAnimationFrame(updateLoop)
}

function initialize(timestamp) {
    prevTime = currTime
    currTime = timestamp

    makeHexRoom(hexroom)

    hexroom.x = Math.floor((canvas.width - hexroom.pxWidth) / 2)
    hexroom.y = Math.floor((canvas.height - hexroom.pxHeight) / 2)

    hexroom.set("ENTITY", 9, 4, player)

    let summonerCount = 0
    while (summonerCount < 3) {
        let addLoc = randomCell(hexroom.numRows, hexroom.numCols, hexroom.parity)
        if (hexroom.get("ENTITY", addLoc.row, addLoc.col) === null) {
            let newEntity = makeEntity("S", new EnemyComponent(), new SummonerComponent(7))
            hexroom.set("ENTITY", addLoc.row, addLoc.col, newEntity)
            summonerCount++
        }
    }

    playerTurn = false

    // hexroom.set("ENTITY", 9, 6, summonerEntity)
    // player.addComponent(new PlayerComponent())
    // hexroom.set("ENTITY", 9, 6, idleEntity)

    // let summonAnimation = new HexCastAnimation(summonerEntity, boxPlayerIn, [summonerEntity], 1000)
    // summonerEntity.animation = summonAnimation
    // summonerEntity.animation.start()

    // boxPlayerIn(summonerEntity)


    // playerLogic()

    // idleEntity.animation = new IdleAnimation(idleEntity, 5, 6000)
    // idleEntity.animation.start()

    // bkgMusic.volume = 0.2
    // bkgMusic.loop = true
    // bkgMusic.play()
    
    renderFrame()

    requestAnimationFrame(updateLoop)
}

// hexgrid.render()
// textgrid.render()
