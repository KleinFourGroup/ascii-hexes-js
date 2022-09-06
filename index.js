// Configs
const EDGE = 30, RISE = 26, RUN = 15

// Timing
let currTime = 0, prevTime = 0

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

// SFX and music
let bkgMusic = document.getElementById("background_music")

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

function getCoveringAlpha(coverX, coverY, coverWidth, coverHeight, baseX, baseY, baseWidth, baseHeight) {
    let interMinX = Math.max(coverX, baseX)
    let interMaxX = Math.min(coverX + coverWidth, baseX + baseWidth)
    let interMinY = Math.max(coverY, baseY)
    let interMaxY = Math.min(coverY + coverHeight, baseY + baseHeight)
    
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
    
    if (interMinX < interMaxX && interMinY < interMaxY) {
        let interX = interMaxX - interMinX
        let interY = interMaxY - interMinY

        let ratioX = 1 - interX / Math.min(coverWidth, baseWidth)
        let ratioY = 1 - interY / Math.min(coverHeight, baseHeight)

        return Math.max(ratioX, ratioY)
    }

    return 1
}

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
        this.snapFill = null
    }

    render() {
        let absX = this.x + (this.parent?.absX ?? 0)
        let absY = this.y + (this.parent?.absY ?? 0)
        ctx.globalAlpha = 1
        ctx.fillStyle = this.snapFill ?? this.fill
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

        this.snapFill = null
    }
}

class TextSprite {
    constructor(text, x = 0, y = 0, fill = "#33FF00") {
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

// Hexagonal coordinates
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

        if (sprite !== null) {
            sprite.x = col * (EDGE + RUN)
            sprite.y = row * RISE
            sprite.parent = this

            if ("row" in sprite) sprite.row = row
            if ("col" in sprite) sprite.col = col
        }
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
        this.grids["ENTITY"] = new HexGrid(widthRows, heightCols, EDGE / 2 + RUN, RISE, parity)
        this.grids["ENTITY"].parent = this
        
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
                if (0 <= row && row < this.numRows) cells.push([row, col])
            }
        }

        return cells
    }

    get(layer, row, col) {
        return this.grids[layer].get(row, col)
    }

    set(layer, row, col, val) {
        this.grids[layer].set(row, col, val)
    }

    prerender() {

        for (let row = 0; row < this.numRows; row++) {
            let off = (row + this.parity) % 2
            for (let col = off; col < this.numCols; col += 2) {
                let entity = this.grids["ENTITY"].get(row, col)
                if (entity !== null) {
                    // let text = this.grids["TEXT"].get(row, col)
                    // text.snapAlpha = 0

                    if (entity.animation !== null && "sprite" in entity) {
                        let x = entity.x + EDGE / 2 + RUN
                        let y = entity.y + RISE
                        let entityMeasure = entity.sprite.measure
                        let cells = this.getCells(x - entityMeasure.actualBoundingBoxLeft,
                                                  y - entityMeasure.actualBoundingBoxAscent,
                                                  entityMeasure.actualBoundingBoxLeft + entityMeasure.actualBoundingBoxRight,
                                                  entityMeasure.actualBoundingBoxAscent + entityMeasure.actualBoundingBoxDescent)
                        for (let cell of cells) {
                            let hex = this.grids["GROUND"].get(cell[0], cell[1])
                            let text = this.grids["TEXT"].get(cell[0], cell[1])
                            let textX = text.x + EDGE / 2 + RUN
                            let textY = text.y + RISE
                            let textMeasure = text.measure

                            let alpha = getCoveringAlpha(x - entityMeasure.actualBoundingBoxLeft,
                                                         y - entityMeasure.actualBoundingBoxAscent,
                                                         entityMeasure.actualBoundingBoxLeft + entityMeasure.actualBoundingBoxRight,
                                                         entityMeasure.actualBoundingBoxAscent + entityMeasure.actualBoundingBoxDescent,
                                                         textX - textMeasure.actualBoundingBoxLeft,
                                                         textY - textMeasure.actualBoundingBoxAscent,
                                                         textMeasure.actualBoundingBoxLeft + textMeasure.actualBoundingBoxRight,
                                                         textMeasure.actualBoundingBoxAscent + textMeasure.actualBoundingBoxDescent)

                            // hex.snapFill = "#664600"
                            text.snapAlpha = alpha
                        }
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

// Entity
class Entity {
    constructor(sprite, x = 0, y = 0) {
        this.sprite = sprite
        sprite.parent = this

        this.x = x
        this.y = y
        this.absX = this.x
        this.absY = this.y

        this.animation = null
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

// Animations
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

    update(delta) {
        this.elapsedTime += delta
        this.tweenFn((this.elapsedTime > this.duration) ? this.duration : this.elapsedTime)

        return this.duration - this.elapsedTime
    }
}

class KeyframeAnimation {
    constructor(keyframes, tweens) {
        if (keyframes.length !== tweens.length + 1) {
            console.log(`Error!  Animation consists of ${keyframes.length} keyframes and ${tweens.length} tweens!`)
        }

        this.keyframes = keyframes
        this.tweens = tweens
        this.elapsedTime = 0
        this.lastKeyframeIndex = -1
    }

    start() {
        let firstKeyframe = this.keyframes[0]
        if (firstKeyframe.timestamp !== 0) {
            console.log(`Error!  Animation start() without initial keyframe!`)
        }

        firstKeyframe.execute()

        this.lastKeyframeIndex = 0
    }

    update(delta) {
        this.elapsedTime += delta

        for (let i = this.lastKeyframeIndex + 1; i < this.keyframes.length && this.keyframes[i].timestamp <= this.elapsedTime; i++) {
            this.keyframes[i].execute()
            this.lastKeyframeIndex = i
            delta = this.elapsedTime - this.keyframes[i].timestamp
        }

        if (this.lastKeyframeIndex < 0 || this.lastKeyframeIndex >= this.tweens.length) {
            return this.keyframes[this.tweens.length].timestamp - this.elapsedTime
        }

        this.tweens[this.lastKeyframeIndex].update(delta)

        return this.keyframes[this.tweens.length].timestamp - this.elapsedTime
    }
}

class HexMoveAnimation extends KeyframeAnimation {
    constructor(entity, hexgrid, destRow, destCol, duration) {
        if (entity.parent !== hexgrid) {
            console.log("Error! HexMove animation called on entity with incorrect grid!")
        }

        let startX = entity.x
        let startY = entity.y
        let destX = destCol * (EDGE + RUN)
        let destY = destRow * RISE

        function startFn() {
            console.log("Beginning move!")
        }

        function tweenFn(timestamp) {
            // let progress = timestamp / duration
            let progress = (1 - Math.cos((timestamp / duration) * Math.PI)) / 2
            entity.x = (1 - progress) * startX + (progress) * destX
            entity.y = (1 - progress) * startY + (progress) * destY
        }

        function endFn() {
            console.log("Move ended!")
            hexgrid.set(entity.row, entity.col, null)
            hexgrid.set(destRow, destCol, entity)
            entity.animation = null
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

class HexJiggleAnimation extends KeyframeAnimation {
    constructor(entity, hexgrid, destRow, destCol, duration) {
        if (entity.parent !== hexgrid) {
            console.log("Error! HexMove animation called on entity with incorrect grid!")
        }

        let startX = entity.x
        let startY = entity.y
        let destX = destCol * (EDGE + RUN)
        let destY = destRow * RISE

        let dist = Math.hypot(destX - startX, destY - startY)

        destX = startX + Math.round((destX - startX) * 8 / dist)
        destY = startY + Math.round((destY - startY) * 8 / dist)

        function startFn() {
            console.log("Beginning move!")
        }

        function tweenFn(timestamp) {
            // let progress = Math.sin((timestamp / duration) * Math.PI)
            let progress = (1 - Math.cos((timestamp / duration) * 2 * Math.PI)) / 2
            entity.x = (1 - progress) * startX + (progress) * destX
            entity.y = (1 - progress) * startY + (progress) * destY
        }

        function endFn() {
            console.log("Move ended!")
            entity.animation = null
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

// The main scene

function clearCanvas(bkgFill = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (bkgFill) {
        ctx.fillStyle = bkgFill
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
}

let parity = 1

let hexroom = new HexRoom(11, 7, 200, 200, parity)

function makeHexRoom(hexroom) {
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
        hexroom.set("ENTITY", (col + parity) % 2, col, new TextSprite("█"))
        hexroom.set("ENTITY", hexroom.numRows - 1 - ((col + parity) % 2), col, new TextSprite("█"))
    }

    for(let row = parity; row < hexroom.numRows; row += 2) {
        hexroom.set("ENTITY", row, 0, new TextSprite("█"))
        hexroom.set("ENTITY", row, hexroom.numCols - 1, new TextSprite("█"))
    }
}

let player = new TextEntity("@", 0, 0)

let loc = [null, null]

function renderFrame() {
    clearCanvas("#282828")

    hexroom.prerender()
    hexroom.render()
    ctx.strokeRect(hexroom.x, hexroom.y, hexroom.pxWidth, hexroom.pxHeight)
    drawDots(0, 0, 50)

    if (mouseLoc.x !== null && mouseLoc.y !== null) {
        ctx.fillStyle = "#FFB000"
        ctx.beginPath()
        ctx.arc(mouseLoc.x, mouseLoc.y, 5, 0, 2 * Math.PI, false)
        ctx.fill()
    }
}

function updateLoop(timestamp) {

    prevTime = currTime
    currTime = timestamp
    let delta = (currTime - prevTime)

    hexroom.x = Math.floor((canvas.width - hexroom.pxWidth) / 2)
    hexroom.y = Math.floor((canvas.height - hexroom.pxHeight) / 2)

    if (mouseLoc.x !== null && mouseLoc.y !== null) {

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

    player.animation.update(delta)

    function isEmpty(row, col) {
        if (0 > row || row >= hexroom.numRows) return false
        if (0 > col || col >= hexroom.numCols) return false
        return (hexroom.get("ENTITY", row, col) === null)
    }

    if (player.animation === null) {
        let destCells = [
            [player.row + 2, player.col],
            [player.row + 1, player.col + 1],
            [player.row - 1, player.col + 1],
            [player.row - 2, player.col],
            [player.row - 1, player.col - 1],
            [player.row + 1, player.col - 1]
        ]

        let dest = destCells[Math.floor(Math.random() * destCells.length)]

        if (isEmpty(dest[0], dest[1])) {
            let anim = new HexMoveAnimation(player, hexroom.grids["ENTITY"], dest[0], dest[1], 1000)
            player.animation = anim
            player.animation.start()
        } else {
            let anim = new HexJiggleAnimation(player, hexroom.grids["ENTITY"], dest[0], dest[1], 400)
            player.animation = anim
            player.animation.start()
        }
    }

    renderFrame()

    requestAnimationFrame(updateLoop)
}

function initialize(timestamp) {
    prevTime = currTime
    currTime = timestamp

    makeHexRoom(hexroom)

    hexroom.x = Math.floor((canvas.width - hexroom.pxWidth) / 2)
    hexroom.y = Math.floor((canvas.height - hexroom.pxHeight) / 2)

    hexroom.set("ENTITY", 4, 2 + parity, player)
    hexroom.set("ENTITY", 6, 2 + parity, new TextEntity("零", 0, 4 * RISE))

    let anim = new HexMoveAnimation(player, hexroom.grids["ENTITY"], 5, 3 + parity, 1.0)
    player.animation = anim
    player.animation.start()

    bkgMusic.volume = 0.2
    bkgMusic.loop = true
    bkgMusic.play()
    
    renderFrame()

    requestAnimationFrame(updateLoop)
}

// hexgrid.render()
// textgrid.render()


requestAnimationFrame(initialize)