import {GameTable} from './View/GameTable.js';
import {GameField} from './View/GameField.js';
import {ImageButton} from './View/ImageButton.js';
import {GameModel} from './Model/GameModel.js';
import {Resources} from './Utils/Resources.js';


const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const gameState = document.querySelector("#game-state");
const modal = document.querySelector("#modal");
const modalContent = document.querySelector("#modal #dynamic");
let alreadyPlayed = false;

const imageSrc = ['./img/straight.png', './img/cross.png', './img/turn.png', './img/arrow.png', './img/fixed.png',
                  './img/figure_red.png', './img/figure_green.png', './img/figure_blue.png', './img/figure_purple.png',
                  './img/treasure_red.png', './img/treasure_green.png', './img/treasure_blue.png', './img/treasure_purple.png'];
imageSrc.forEach(src => Resources.addResource( src.split("/").pop().split(".")[0], Image,
              {"src": src} ));


const table = new GameTable(canvas, ctx,  ctx.canvas.width,  ctx.canvas.height);
const gameModel = new GameModel();

// helper function to create the views (buttons, fields) in the table
const makeField = (image, rotate, interactive = false, addCallback = true, treasure = undefined) => {
    const field =  new GameField({"image": image, "rotate": rotate, "interactive": interactive});
    if (addCallback)
        field.addEventListener("click", onItemClicked);
    if (treasure !==  undefined) {
        field.addTreasure(Resources.getResource(treasure.iconURL), treasure.id);
    }
    return field;
}

const showInfoPopup = (title, text) => {
    modal.dismissible = true;
    modal.querySelector("span").style.display = "block";

    modalContent.innerHTML = "";
    const h2 = document.createElement("h2");
    h2.innerHTML = title;
    const p = document.createElement("p");
    p.innerHTML = text;
    modalContent.appendChild(h2);
    modalContent.appendChild(p);
    modal.style.display = "block";
}

const showActionPopup = (title, elements, dismissible = true) => {
    modal.dismissible = dismissible;
    if (!dismissible)
        modal.querySelector("span").style.display = "none"; // hide x (Close)
    else
        modal.querySelector("span").style.display = "block"; // show x (Close)

    modalContent.innerHTML = "";
    const h2 = document.createElement("h2");
    h2.innerHTML = title;
    modalContent.appendChild(h2);

    for (const element of elements) {
        const e = document.createElement(element.tagName);
        Object.assign(e, element.properties);
        if (element.eventListeners !== undefined) {
            for (const eListener of element.eventListeners) {
                e.addEventListener(eListener.name, eListener.callback);
            }
        }
        modalContent.appendChild(e);
    }

    modal.style.display = "block";
}

// action buttons event listeners

// info
document.querySelector("#actions #info").addEventListener("click", function () {
    showInfoPopup("About", "The <em>purpose</em> of the game is to reach <em>all the treasures</em> having same color, " +
        "as your <em>figure</em>. Only <b>one</b> treasure will show up on the table for each player at once.<br><br>" +
        "The game <b>ends</b>, when you picked up <em>all</em> the treasues, belonging to you, and you went back to " +
        "your <b>starting position</b>, which is symbolised by the figures in the corners. The first player who does " +
        "it, wins the game.<br><br><b>Good luck!</b>");
});

// landing page
function showLandingPage() {
    let newPlayerCount = gameModel.getPlayerCount;
    let newTreasureCount = gameModel.getTreasurePerPlayer;
    const savedElementList = gameModel.getSavedGames().map(e => `<option value=${e}>${e}</option>`).join("");
    let pageElements = [];

    if (savedElementList !== "") { // there are saved games
        pageElements = [
            {
                tagName: "h3",
                properties: {innerHTML: "Continue, where you left"}
            },
            {
                tagName: "select",
                properties: {innerHTML: savedElementList, style: "display: block; margin: 0 auto"}
            },
            {
                tagName: "button",
                properties: {innerHTML: "Load"},
                eventListeners: [{
                    name: "click",
                    callback: function () {
                        const selectedId = this.parentElement.querySelector("select").value;
                        if (selectedId !== "") {
                            gameModel.loadGame(selectedId);
                            modal.style.display = "none";
                        }
                    }
                }]
            }]
    }

    pageElements.push(
        {
            tagName: "h3",
            properties: {innerHTML: (savedElementList !== "" ? "or " : "") + "Start a New Game"}
        },
        {
            tagName: "label",
            properties: {innerHTML: "Player count: ", for: "playerCount"},
        },
        {tagName: "br"},
        {
            tagName: "input",
            properties: {type: "range", id: "playerCount", min: 1, max: 4, value: newPlayerCount},
            eventListeners: [{
                name: "input",
                callback: function (event) {
                    newPlayerCount = this.value;
                    this.nextElementSibling.value = this.value;
                    const treasureSlider = this.parentElement.querySelector("#treasureCount");
                    treasureSlider.max = 24 / newPlayerCount;
                    treasureSlider.dispatchEvent(new Event("input"));
                }
            }]
        },
        {
            tagName: "output",
            properties: {innerHTML: newPlayerCount},
        },
        {tagName: "br"},
        {
            tagName: "label",
            properties: {innerHTML: "Treasure per player: ", for: "treasureCount"},
        },
        {tagName: "br"},
        {
            tagName: "input",
            properties: {type: "range", id: "treasureCount", min: 1, max: 24 / newPlayerCount, value: newTreasureCount},
            eventListeners: [{
                name: "input",
                callback: function (event) {
                    newTreasureCount = this.value;
                    this.nextElementSibling.value = this.value;
                }
            }]
        },
        {
            tagName: "output",
            properties: {innerHTML: newTreasureCount},
        },
        {
            tagName: "button",
            properties: {innerHTML: "New Game"},
            eventListeners: [{
                name: "click",
                callback: function () {
                    gameModel.setPlayerCount = Number(newPlayerCount);
                    gameModel.setTreasurePerPlayer = Number(newTreasureCount);
                    gameModel.newGame(gameModel.getPlayerCount, gameModel.getTreasurePerPlayer);
                    modal.style.display = "none";
                }
            }]
        });

    showActionPopup("Welcome" + (savedElementList !== "" ? " Back" : "") + "!", pageElements, false);
}

// settings
document.querySelector("#actions #settings").addEventListener("click", function () {
    let newPlayerCount = gameModel.getPlayerCount;
    let newTreasureCount = gameModel.getTreasurePerPlayer;
    showActionPopup("Settings",
        [
            {
                tagName: "label",
                properties: {innerHTML:"Player count: ", for: "playerCount"},
            },
            {tagName: "br"},
            {
                tagName: "input",
                properties: {type: "range", id: "playerCount", min: 1, max: 4, value: newPlayerCount},
                eventListeners: [{
                    name: "input",
                    callback: function (event) {
                        newPlayerCount = this.value;
                        this.nextElementSibling.value = this.value;
                        const treasureSlider = this.parentElement.querySelector("#treasureCount");
                        treasureSlider.max = 24/newPlayerCount;
                        treasureSlider.dispatchEvent(new Event("input"));
                    }
                }]
            },
            {
                tagName: "output",
                properties: {innerHTML: newPlayerCount},
            },
            {tagName: "br"},
            {
                tagName: "label",
                properties: {innerHTML:"Treasure per player: ", for: "treasureCount"},
            },
            {tagName: "br"},
            {
                tagName: "input",
                properties: {type: "range", id: "treasureCount", min: 1, max: 24/newPlayerCount, value: newTreasureCount},
                eventListeners: [{
                    name: "input",
                    callback: function (event) {
                        newTreasureCount = this.value;
                        this.nextElementSibling.value = this.value;
                    }
                }]
            },
            {
                tagName: "output",
                properties: {innerHTML: newTreasureCount},
            },
            {
                tagName: "button",
                properties: {innerHTML: "Save & New Game"},
                eventListeners: [{
                    name: "click",
                    callback: function () {
                        gameModel.setPlayerCount = Number(newPlayerCount);
                        gameModel.setTreasurePerPlayer = Number(newTreasureCount);
                        gameModel.newGame(gameModel.getPlayerCount, gameModel.getTreasurePerPlayer);
                        modal.style.display = "none";
                    }
                }]
            },
            {
                tagName: "button",
                properties: {innerHTML: "Cancel"},
                eventListeners: [{
                    name: "click",
                    callback: function () {
                        modal.style.display = "none";
                    }
                }]
            }
        ],
        false);
});

// save
document.querySelector("#actions #save").addEventListener("click", function () {
    showActionPopup("Save Game",
        [
            {
                tagName: "input",
                properties: {type: "text", placeholder: "Name", style: "display: block; margin: 0 auto"}
            },
            {
                tagName: "button",
                properties: {innerHTML: "Save"},
                eventListeners: [{
                    name: "click",
                    callback: function () {
                        const name = this.previousElementSibling.value;
                        if (name.trim() !== "" && name.split(" ").length === 1){
                            try {
                                gameModel.saveGame(name);
                                modal.style.display = "none";
                            } catch {
                                alert("Name already exists!");
                                this.previousElementSibling.value = "";
                            }
                        } else {
                            alert("Name should not be empty and should only contain one word!");
                            this.previousElementSibling.value = "";
                        }
                    }
                }]
            }
        ]);
});

// load
document.querySelector("#actions #load").addEventListener("click", function () {
    const getSavedElementList = () => gameModel.getSavedGames().map(e => `<option value=${e}>${e}</option>`).join("");
    showActionPopup("Load Game",
        [
            {
                tagName: "select",
                properties: {innerHTML: getSavedElementList(), style: "display: block; margin: 0 auto"}
            },
            {
                tagName: "button",
                properties: {innerHTML: "Load"},
                eventListeners: [{
                    name: "click",
                    callback: function () {
                        const selectedId = this.parentElement.querySelector("select").value;
                        if (selectedId !== ""){
                            gameModel.loadGame(selectedId);
                            modal.style.display = "none";
                        }
                    }
                }]
            },
            {
                tagName: "button",
                properties: {innerHTML: "Delete"},
                eventListeners: [{
                    name: "click",
                    callback: function () {
                        const select = this.parentElement.querySelector("select");
                        const selectedId = select.value;
                        if (selectedId !== ""){
                            gameModel.deleteGame(selectedId);
                            select.innerHTML = getSavedElementList();
                        }
                    }
                }]
            }
        ]);
});

// Initialize the table layout

function init() {
    const size = gameModel.getSize;
    // initialize the table
    table.addRow(36, GameTable.SIZE_TYPE.ABSOLUTE); // top arrows
    table.addRow(100/size, GameTable.SIZE_TYPE.RELATIVE, size); // game table
    table.addRow(36, GameTable.SIZE_TYPE.ABSOLUTE); // bottom arrows

    table.addColumn(36, GameTable.SIZE_TYPE.ABSOLUTE); // left arrows
    table.addColumn(100/size, GameTable.SIZE_TYPE.RELATIVE, size); // game table
    table.addColumn(36, GameTable.SIZE_TYPE.ABSOLUTE); // right arrows

    // attach event listeners
    gameModel.addEventListener("newgame", onNewGame);
    gameModel.addEventListener("gameover", onGameOver);
    gameModel.addEventListener("playerchanged", onPlayerStateChanged);
    gameModel.addEventListener("treasureadded", onTreasureAdded);
    gameModel.addEventListener("treasurepicked", onTreasurePicked);
    gameModel.addEventListener("extrafieldchanged", onExtraFieldChanged);

    // start a new game (to make the background before showing the blurred landing page)
    gameModel.newGame(4, 4);

    // show landing page
    showLandingPage();
}

// game event handlers

function onNewGame() {
    const size = gameModel.getSize;

    // clear table
    table.clearAll();

    // draw table
    const arrow = Resources.getResource("arrow");
    const fixed = Resources.getResource("fixed");
    for (let i = 0; i <= size + 1; i++) {
        for (let j = 0; j <= size + 1; j++) {
            let item;
            let treasure;

            if (i === 0 && 0 < j && j < size + 1) // top arrows
                item = makeField((j % 2 === 0 ? arrow : fixed), 90, (j % 2 === 0), (j % 2 === 0));

            else if (j === 0 && 0 < i && i < size + 1) // left arrows
                item = makeField((i % 2 === 0 ? arrow : fixed), 0, (i % 2 === 0), (i % 2 === 0));

            else if (i === size + 1 && 0 < j && j < size + 1) // bottom arrows
                item = makeField((j % 2 === 0 ? arrow : fixed), -90, (j % 2 === 0), (j % 2 === 0));

            else if (j === size + 1 && 0 < i && i < size + 1) // right arrows
                item = makeField((i % 2 === 0 ? arrow : fixed), 180, (i % 2 === 0), (i % 2 === 0));

            else if (0 < i && i < size + 1 && 0 < j && j < size + 1) { // table
                treasure = gameModel.table[i - 1][j - 1].treasure;
                item = makeField(Resources.getResource(gameModel.table[i - 1][j - 1].imageURL), gameModel.table[i - 1][j - 1].rotate,
                    false, true, treasure);
            }

            if (item !== undefined)
                table.addControl(item, i,j);
        }
    }

    // draw players
    for (const player of gameModel.players) {
        table.addPlayer(player.id, Resources.getResource(player.iconURL), player.row + 1, player.column + 1);

        // draw player start position markers in the corners
        const icon = new ImageButton({"image": Resources.getResource(player.iconURL)});
        if (player.initRow === 0 && player.initColumn === 0)
            table.addControl(icon, 0,0);
        else if (player.initRow === gameModel.getSize - 1 && player.initColumn === 0)
            table.addControl(icon, table.RowCount - 1,0);
        else if (player.initRow === 0 && player.initColumn === gameModel.getSize - 1)
            table.addControl(icon, 0,table.ColumnCount - 1);
        else
            table.addControl(icon, table.RowCount - 1,table.ColumnCount - 1);
    }
}

function onGameOver(winner) {
    showActionPopup("🎉 Congratulations! 🎉",
        [
            {
                tagName: "img",
                properties: {src: Resources.getResource(winner.iconURL).src, style: "display: block; margin: 0 auto"}
            },
            {
                tagName: "p",
                properties: {innerHTML: "You won the game!"}
            },
            {
                tagName: "button",
                properties: {innerHTML: "New Game"},
                eventListeners: [{
                    name: "click",
                    callback: function () {
                        gameModel.newGame(gameModel.getPlayerCount, gameModel.getTreasurePerPlayer);
                        modal.style.display = "none";
                    }
                }]
            }
        ],
        false);
}

function onPlayerStateChanged(newPlayer) {
    document.querySelector("#current-player").src = Resources.getResource(newPlayer.player.iconURL).src;
    if (newPlayer.hasAlreadyShifted) {
        // disable inaccessible fields
        const accessible = gameModel.getAllAccessiblePositions(newPlayer.player.row, newPlayer.player.column);
        for (let i = 1; i <= gameModel.getSize ; i++) {
            for (let j = 1; j <= gameModel.getSize ; j++) {
                if (!accessible.some(e => e.row === i - 1 && e.column === j - 1)) {
                    for (const item of table._controlItems) {
                        if (item.row === i && item.column === j){
                            item.control.isEnabled = false;
                        }
                    }
                }
            }
        }
    } else { // change back all field to enabled
        for (let i = 1; i <= gameModel.getSize ; i++) {
            for (let j = 1; j <= gameModel.getSize ; j++) {
                table.getControlAt(i, j).isEnabled = true;
            }
        }
    }

    // draw state on the state table
    const stateTable = gameState.querySelector("#treasure-table");
    stateTable.innerHTML = "";
    // numbering
    const tr = document.createElement("tr");
    tr.innerHTML = Array.from(Array(gameModel.getTreasurePerPlayer).keys()).map(n => `<td>${n + 1}</td>`).join("");
    stateTable.appendChild(tr);
    // treasures
    for (const player of gameModel.players) {
        const tr = document.createElement("tr");
        let elements = "";

        elements += player.pickedTreasures.map(t => `<td><img src="${Resources.getResource(t.iconURL).src}" style="opacity: 0.3"></td>`).join("");

        if (player.currentTreasure !== undefined) {
            elements += `<td><img src="${Resources.getResource(player.currentTreasure.iconURL).src}" style="border: 3px solid #FF0000"></td>`
        }

        elements += player.remainingTreasures.map(t => `<td><img src="${Resources.getResource(t.iconURL).src}"></td>`).join("");

        tr.innerHTML = elements;
        stateTable.appendChild(tr);
    }
    gameState.appendChild(stateTable);
}

function onTreasureAdded(event) {
    table.addTreasure(event.treasure.id, Resources.getResource(event.treasure.iconURL), event.row + 1, event.column + 1);
}

function onTreasurePicked(event) {
    table.removeTreasure(event.row + 1, event.column + 1);
}

function onExtraFieldChanged(extraField) {
    const treasure = document.querySelector("#extra-field");

    const field = new GameField({"image": Resources.getResource(extraField.imageURL),
                                 "rotate": extraField.rotate});

    if (extraField.treasure !==  undefined)
        field.addTreasure(Resources.getResource(extraField.treasure.iconURL), extraField.treasure.id);

    treasure.addEventListener("click", onExtraFieldClicked);

    const extraCtx = treasure.getContext('2d');
    extraCtx.save();
    extraCtx.translate(treasure.clientWidth/2 - field.getWidth/2, treasure.clientHeight/2-field.getHeight/2)
    field.draw(extraCtx);
    extraCtx.restore();
}

function onExtraFieldClicked(event) {
    if (gameModel.currentPlayer.hasAlreadyShifted){
        showInfoPopup("Note!", "You can't rotate the extra field after having shifted a row or column!");
    } else {
        gameModel.rotateExtraFieldBy90();
    }
}

function onItemClicked(event) {
    const {row, column} = event;

    const extraField = makeField(Resources.getResource(gameModel.extraField.imageURL), gameModel.extraField.rotate,
        false, true, gameModel.extraField.treasure);

    if (row === 0) { // top arrows
        if (gameModel.currentPlayer.hasAlreadyShifted) {
            showInfoPopup("Note!", "The player has already shifted a row or column.");
        } else if (!gameModel.isShiftPossible({type: "column", "column": column - 1, isDown: true})) {
            showInfoPopup("Note!", "Reverting previous shift isn't allowed.");
        } else {
            table.shift(column, GameTable.SHIFT_TYPE.COLUMN_DOWN, extraField);
            gameModel.shiftColumn(column - 1);
        }
    }
    else if (row === gameModel.getSize + 1) { // bottom arrows
        if (gameModel.currentPlayer.hasAlreadyShifted) {
            showInfoPopup("Note!", "The player has already shifted a row or column.");
        } else if (!gameModel.isShiftPossible({type: "column", "column": column - 1, isDown: false})) {
            showInfoPopup("Note!", "Reverting previous shift isn't allowed.");
        } else {
            table.shift(column, GameTable.SHIFT_TYPE.COLUMN_UP, extraField);
            gameModel.shiftColumn(column - 1, false);
        }
    }
    else if (column === 0) {// left arrows
        if (gameModel.currentPlayer.hasAlreadyShifted) {
            showInfoPopup("Note!", "The player has already shifted a row or column.");
        } else if (!gameModel.isShiftPossible({type: "row", "row": row - 1, toRight: true})) {
            showInfoPopup("Note!", "Reverting previous shift isn't allowed.");
        } else {
            table.shift(row, GameTable.SHIFT_TYPE.ROW_RIGHT, extraField);
            gameModel.shiftRow(row - 1);
        }
    }
    else if (column === gameModel.getSize + 1) { // right arrows
        if (gameModel.currentPlayer.hasAlreadyShifted) {
            showInfoPopup("Note!", "The player has already shifted a row or column.");
        } else if (!gameModel.isShiftPossible({type: "row", "row": row - 1, toRight: false})) {
            showInfoPopup("Note!", "Reverting previous shift isn't allowed.");
        } else {
            table.shift(row, GameTable.SHIFT_TYPE.ROW_LEFT, extraField);
            gameModel.shiftRow(row - 1, false);
        }
    }
    else { // road
        if (!table.isAnimating()) { // to prevent click on moving items
            if (!gameModel.currentPlayer.hasAlreadyShifted) {
                showInfoPopup("Note!", "Stepping is only allowed after shifting a row or column.");
            } else {
                table.movePlayer(gameModel.currentPlayer.player.id, row, column);
                gameModel.changePlayerPosition(gameModel.currentPlayer.player.id, row - 1, column - 1);
            }
        }
    }
}

// handling responsibility

window.addEventListener("load", function () {
    resize();
    init();
});
window.addEventListener('resize', resize);

function resize() {
    let newWidth, newHeight;
    let size = Math.min(window.innerWidth, window.innerHeight) * 0.8;
    newWidth = newHeight = Math.min(size, 1000);

    // set an estimated size, so the container can resize itself
    ctx.canvas.width  = newWidth;
    ctx.canvas.height = newHeight;

    // resize to the container
    const ct = document.querySelector(".container");
    size = Math.min(ct.clientWidth, ct.clientHeight);
    newWidth = newHeight = Math.min(size, 1000);

    ctx.canvas.width  = newWidth;
    ctx.canvas.height = newHeight;
    table._height = newHeight;
    table._width = newWidth;
}

// handling pop-up window behaviour

// When the user clicks on <span> (x), close the modal
modal.querySelector("span.close").addEventListener("click", function () {
    if (modal.dismissible !== undefined && modal.dismissible){
        modal.style.display = "none";
    }
});

// When the user clicks anywhere outside of the modal, close it
window.addEventListener("click", function (event) {
    if (event.target === modal && modal.dismissible !== undefined && modal.dismissible) {
        modal.style.display = "none";
    }
});