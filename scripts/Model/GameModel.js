/*
* The 'type' of the field describes which directions the road leads at that specific field
* It is represented by an array containing two or more of the following characters: 'T', 'R', 'B', 'L'
* They stand for: 'T'=top; 'R'=right; 'B'=bottom; 'L'=left;
* E.g.: type = ['T', 'L'] === `road that leads from top of the field to it's left side (a turn)`
* The order of the characters in the array doesn't matter, since the roads are bi-directional.
* */
export class FieldFactory {
    constructor() {
        // a function, that compares the type arrays, knowing that the ordering doesn't matter
        this.areTypesEqual = (a, b) => a.length === b.length && a.every(value => b.includes(value)) && b.every(value => a.includes(value));
        this.findTypeIndex = (array, type) => array.findIndex(arr => this.areTypesEqual(type, arr));

        // possible fields of every type, it is ordered so:
        // for every i in [0..TYPE_ARRAY.length-1]:
        //     the road type at (i+1) mod (TYPE_ARRAY.length-1) is:
        //          the road type at (i) rotated by (360/TYPE_ARRAY.length)deg clockwise
        this.FIELD_TYPES = {
            STRAIGHT: [ ['T','B'], ['L','R'] ],
            TURN: [ ['T','R'], ['R','B'], ['B','L'], ['L','T'] ],
            CROSS: [ ['L','T','R'], ['T','R','B'], ['L','B','R'], ['T','L','B'] ]
        }

        // "imageFor" property represents the id of the type array in the related FIELD_TYPES property, the image is for
        this.FIELD_IMAGES = {
            STRAIGHT: { "imageFor": 0, "imageURL": "straight"},
            TURN: { "imageFor": 0, "imageURL": "turn"},
            CROSS: { "imageFor": 0, "imageURL": "cross"}
        }
    }

    // returns the image and the necessary rotation to represent the given road
    getFieldOfType(type) {
        for (const [key, value] of Object.entries(this.FIELD_TYPES)) {
            const id = this.findTypeIndex(value, type);
            if (id !== -1) {
                const rotationDegree = 360 / 4;
                const rotationCount = id - this.FIELD_IMAGES[key].imageFor;
                return {"type": type, "imageURL": this.FIELD_IMAGES[key].imageURL, "rotate": rotationDegree * rotationCount};
            }
        }
    }

    // returns the image and the necessary rotation to represent the given road rotated by 'degrees' (divisible by 90) degree
    rotateFieldOfType(type, degrees = 90) {
        if (degrees % 90 !== 0)
            throw new Error("The rotation degree must be multiple of 90.");

        for (const [key, value] of Object.entries(this.FIELD_TYPES)) {
            const id = this.findTypeIndex(value, type);
            if (id !== -1) {
                let newTypeIndex = (id + (degrees / 90)) % value.length;
                newTypeIndex += (newTypeIndex < -1) ? value.length : 0;
                const rotationDegree = 360 / 4;
                const rotationCount = newTypeIndex - this.FIELD_IMAGES[key].imageFor;
                return {"type": value[newTypeIndex], "imageURL": this.FIELD_IMAGES[key].imageURL, "rotate": rotationDegree * rotationCount};
            }
        }
    }
}

const random = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

export class GameModel {
    table = [];
    players = [];
    currentPlayer = undefined;
    extraField = undefined;
    recentShift = undefined;
    _eventListeners = []  // event listeners of the element

    _fixedFields = [
        {"row": 0, "column": 0, "type": "RB"}, {"row": 0, "column": 2, "type": "LRB"}, {"row": 0, "column": 4, "type": "LRB"},
        {"row": 0, "column": 6, "type": "LB"}, {"row": 2, "column": 0, "type": "TRB"}, {"row": 2, "column": 2, "type": "TRB"},
        {"row": 2, "column": 4, "type": "LRB"}, {"row": 2, "column": 6, "type": "TLB"}, {"row": 4, "column": 0, "type": "TRB"},
        {"row": 4, "column": 2, "type": "TLR"}, {"row": 4, "column": 4, "type": "TLB"}, {"row": 4, "column": 6, "type": "TLB"},
        {"row": 6, "column": 0, "type": "TR"}, {"row": 6, "column": 2, "type": "LTR"}, {"row": 6, "column": 4, "type": "LTR"},
        {"row": 6, "column": 6, "type": "LT"}
    ]
    _toGenerateFields = [
        {"count": 13, "possible": ["TB", "LR"]}, // straight
        {"count": 15, "possible": ["TR", "RB", "BL", "LT"]}, // turn
        {"count": 6, "possible": ["LTR", "TRB", "LBR", "TLB"]} // cross
    ]
    _playerIcons = [
        {"figureURL": "figure_red", "treasureURL": "treasure_red"},
        {"figureURL": "figure_green", "treasureURL": "treasure_green"},
        {"figureURL": "figure_blue", "treasureURL": "treasure_blue"},
        {"figureURL": "figure_purple", "treasureURL": "treasure_purple"}
    ]

    constructor(playerCount = 2, treasurePerPlayer = 2, size = 7) {
        this._playerCount = playerCount;
        this._treasurePerPlayer = treasurePerPlayer;
        this._size = size;
        this._fieldFactory = new FieldFactory();
    }

    get getPlayerCount() {
        return this._playerCount;
    }

    set setPlayerCount(value) {
        this._playerCount = value;
    }

    get getTreasurePerPlayer() {
        return this._treasurePerPlayer;
    }

    set setTreasurePerPlayer(value) {
        this._treasurePerPlayer = value;
    }

    get getSize() {
        return this._size;
    }

    set setSize(value) {
        this._size = value;
    }

    newGame(playerCount = 2, treasurePerPlayer = 2, size = 7) {
        this._playerCount = playerCount;
        this._treasurePerPlayer = treasurePerPlayer;
        this._size = size;

        // initialize fields
        this.table = [];
        this.players = [];
        this.currentPlayer = undefined;
        this.extraField = undefined;
        this.recentShift = undefined;

        // generate the players and the treasures for each player
        const possiblePlayerPos = [[0,0], [0,size-1], [size-1,0], [size-1,size-1]];
        const possibleTreasurePos = [];
        for (let i = 0; i < size; i++)
            for (let j = 0; j < size; j++)
                if (!possiblePlayerPos.some(arr => String(arr) === String([i, j])))
                    possibleTreasurePos.push([i, j]);

        for (let i = 0; i < this._playerCount; i++) {
            const randomPosInd = random(0, possiblePlayerPos.length - 1);
            const playerPosArr = possiblePlayerPos[randomPosInd];
            const player = {"id": i, "iconURL": this._playerIcons[i].figureURL,
                "row": playerPosArr[0], "column": playerPosArr[1], // current position (change by stepping)
                "initRow": playerPosArr[0], "initColumn": playerPosArr[1], // initial position
            };
            possiblePlayerPos.splice(randomPosInd, 1);

            // treasures
            player.remainingTreasures = [];
            player.pickedTreasures = [];
            for (let j = 0; j < treasurePerPlayer; j++) {
                const randomPosInd = random(0, possibleTreasurePos.length - 1);
                const treasurePosArr = possibleTreasurePos[randomPosInd];
                player.remainingTreasures.push({"id": j + 1, "playerId": player.id, "iconURL": this._playerIcons[i].treasureURL,
                "row": treasurePosArr[0], "column": treasurePosArr[1]});
                possibleTreasurePos.splice(randomPosInd, 1);
            }

            this.players.push(player);
        }

        // generate fields specified in toGenerateFields
        let generatedFields = [];
        for (const field of this._toGenerateFields) {
            for (let i = 0; i < field.count; i++) {
                generatedFields.push(field.possible[random(0, field.possible.length - 1)]);
            }
        }

        this.table = [];
        for (let i = 0; i < this._size; i++) {
            this.table[i] = [];
            for (let j = 0; j < this._size; j++) {
                const fixedValue = this._fixedFields.find(f => f.row === i && f.column === j);
                if (fixedValue !== undefined) { // the field is fixed
                    this.table[i][j] = this._fieldFactory.getFieldOfType(fixedValue.type.split(""));
                } else { // the field will be randomized
                    const generated = generatedFields.splice(random(0, generatedFields.length - 1), 1)[0];
                    this.table[i][j] = this._fieldFactory.getFieldOfType(generated.split(""));
                }
            }
        }

        // place the first treasure for each player on the board
        for (const player of this.players) {
            const treasure = player.remainingTreasures.shift();
            this.table[treasure.row][treasure.column].treasure = treasure;
            player.currentTreasure = treasure;
        }

        // assign the last generated to the extra field
        this.extraField = this._fieldFactory.getFieldOfType(generatedFields.pop().split(""));
        this.onExtraFieldChanged(this.extraField);

        // trigger new game generated event
        this.onNewGame();

        // set the current player to the first player in the array
        // hasAlreadyShifted tells, that the player has already inserted the extra room somewhere, and it's following step
        // is the optional stepping on the board
        this.currentPlayer = {"player": this.players[0], "hasAlreadyShifted": false};
        this.onPlayerStateChanged(this.currentPlayer);
    }

    // Save game
    saveGame(id) {
        if (localStorage.getItem(id))
            throw new Error("Name is already in storage.")

        localStorage.setItem(id, JSON.stringify({
            "playerCount": this._playerCount,
            "treasurePerPlayer": this._treasurePerPlayer,
            "size": this._size,
            "table": this.table,
            "players": this.players,
            "currentPlayer": this.currentPlayer,
            "extraField": this.extraField,
            "recentShift": this.recentShift
        }));
    }

    // Get saved ids
    getSavedGames() {
        const ids = [];
        for(let i = 0; i < localStorage.length; i++) {
            ids.push(localStorage.key(i));
        }

        return ids;
    }


    // Load game
    loadGame(id) {
        const gameState = JSON.parse(localStorage.getItem(id));

        this._playerCount = gameState.playerCount;
        this._treasurePerPlayer = gameState.treasurePerPlayer;
        this._size = gameState.size;

        this.table = gameState.table;
        this.players = gameState.players;
        this.currentPlayer = gameState.currentPlayer;
        this.extraField = gameState.extraField;
        this.recentShift = gameState.recentShift;

        this.onNewGame();
        this.onPlayerStateChanged(this.currentPlayer);
        this.onExtraFieldChanged(this.extraField);
    }

    // Delete game
    deleteGame(id) {
        localStorage.removeItem(id);
    }

    // step the player
    changePlayerPosition(id, newRow, newColumn) {
        if (this.currentPlayer.hasAlreadyShifted) {
            if (newRow !== undefined && newColumn !== undefined){
                const player = this.players.find(p => p.id === id);
                player.row = newRow;
                player.column = newColumn;

                // check if any treasure was picked
                this.checkAnyTreasurePicked();
                // check if game is over
                this.checkIfWon();

                // go to next player
                const currInd = this.players.findIndex(p => p.id === this.currentPlayer.player.id);
                this.currentPlayer = {
                    "player": this.players[(currInd + 1) % this.players.length],
                    "hasAlreadyShifted": false
                };
                this.onPlayerStateChanged(this.currentPlayer);
            }
        } else {
            throw new Error("Illegal State: Stepping is only allowed after shifting a row or column.");
        }
    }

    isShiftPossible({type, row, column, toRight, isDown}) {
        if (this.recentShift === undefined)
            return true;

        if (type === "row") {
            return !(this.recentShift.type === "row" && row === this.recentShift.row
                && toRight !== this.recentShift.toRight);
        }
        else if (type === "column") {
            return !(this.recentShift.type === "column" && column === this.recentShift.column
                && isDown !== this.recentShift.isDown);
        }
    }

    shiftRow(row, toRight = true) {
        const shift = {"type": "row", "row": row, "toRight": toRight};
        if (this.currentPlayer.hasAlreadyShifted) {
            throw new Error("The player has already shifted a row or column.")
        } else if (!this.isShiftPossible(shift)){
            throw new Error("Reverting previous shift isn't allowed.")
        } else {
            if (toRight) { // shift row to right
                this.table[row].unshift(this.extraField);
                this.extraField = this.table[row].pop();
            } else { // shift row to left
                this.table[row].push(this.extraField);
                this.extraField = this.table[row].shift();
            }
            this.onExtraFieldChanged(this.extraField);

            // shift players
            const affectedPlayers = this.players.filter(p => p.row === row);
            affectedPlayers.forEach(p => {
                let newColumn = (p.column + (toRight ? 1 : -1)) % this._size;
                newColumn += (newColumn < 0 ? this._size : 0);
                p.column = newColumn;
            });

            // save the recent shift
            this.recentShift = shift;

            // check if moving the fields caused treasure pickup
            this.checkAnyTreasurePicked();
            // check if game is over
            this.checkIfWon();

            // change current player state
            this.currentPlayer.hasAlreadyShifted = true;
            this.onPlayerStateChanged(this.currentPlayer);
        }
    }

    shiftColumn(column, isDown = true) {
        const shift = {"type": "column", "column": column, "isDown": isDown};
        if (this.currentPlayer.hasAlreadyShifted) {
            throw new Error("Illegal State: The player has already shifted a row or column.")
        } else if (!this.isShiftPossible(shift)){
            throw new Error("Illegal State: Reverting previous shift isn't allowed.")
        } else {
            if (isDown) { // shift column down
                const toInsert = this.extraField;
                this.extraField = this.table[this.table.length - 1][column];
                for (let i = this.table.length - 1; i > 0; i--) {
                    this.table[i][column] = this.table[i - 1][column];
                }
                this.table[0][column] = toInsert;
            } else { // shift column up
                const toInsert = this.extraField;
                this.extraField = this.table[0][column];
                for (let i = 0; i < this.table.length - 1; i++) {
                    this.table[i][column] = this.table[i + 1][column];
                }
                this.table[this.table.length - 1][column] = toInsert;
            }
            this.onExtraFieldChanged(this.extraField);

            // shift players
            const affectedPlayers = this.players.filter(p => p.column === column);
            affectedPlayers.forEach(p => {
                let newRow = (p.row + (isDown ? 1 : -1)) % this._size;
                newRow += (newRow < 0 ? this._size : 0);
                p.row = newRow;
            });

            // save the recent shift
            this.recentShift = shift;

            // check if moving the fields caused treasure pickup
            this.checkAnyTreasurePicked();
            // check if game is over
            this.checkIfWon();

            // change current player state
            this.currentPlayer.hasAlreadyShifted = true;
            this.onPlayerStateChanged(this.currentPlayer);
        }
    }

    rotateExtraFieldBy90() {
        if (this.currentPlayer.hasAlreadyShifted)
            throw new Error("Illegal State: Rotating the extra field after having shifted a row or column is not allowed!")

        const treasure = this.extraField.treasure;

        this.extraField = this._fieldFactory.rotateFieldOfType(this.extraField.type);

        if (treasure !== undefined) // place back the treasure on the new field
            this.extraField.treasure = treasure;

        this.onExtraFieldChanged(this.extraField);
    }

    checkAnyTreasurePicked() {
        for (const player of this.players) {
            const field = this.table[player.row][player.column];
            if (field.treasure !== undefined && field.treasure.playerId === player.id) {
                // delete treasure
                this.onTreasurePicked({"treasure": field.treasure, "row": player.row, "column": player.column});
                player.pickedTreasures.push(player.currentTreasure);
                delete player.currentTreasure;
                delete field.treasure;

                if (player.remainingTreasures.length > 0)  {
                    // add next one
                    const treasure = player.remainingTreasures.shift();
                    this.table[treasure.row][treasure.column].treasure = treasure;
                    player.currentTreasure = treasure;
                    this.onTreasureAdded({"treasure": treasure, "row": treasure.row, "column": treasure.column});
                }
            }
        }
    }

    checkIfWon() {
        for (const player of this.players) {
            if (player.remainingTreasures.length === 0 && player.row === player.initRow && player.column === player.initColumn &&
            player.currentTreasure === undefined) {
                this.onGameOver(player);
            }
        }
    }

    // returns the surrounding fields that are accessible from a given field
    getAccessibleSurrounding(row, column) {
        const containsAt = (row, column, element) => this.table[row][column].type.includes(element);

        const result = [];
        // the field above is accessible
        if (row - 1 >= 0 && containsAt(row, column, "T") && containsAt(row - 1, column, "B"))
            result.push({"row": row - 1, "column": column});

        // the field below is accessible
        if (row + 1 < this._size && containsAt(row, column, "B") && containsAt(row + 1, column, "T"))
            result.push({"row": row + 1, "column": column});

        // the field on the left is accessible
        if (column - 1 >= 0 && containsAt(row, column, "L") && containsAt(row, column - 1, "R"))
            result.push({"row": row, "column": column - 1});

        // the field on the right is accessible
        if (column + 1 < this._size && containsAt(row, column, "R") && containsAt(row, column + 1, "L"))
            result.push({"row": row, "column": column + 1});

        return result;
    }

    getAllAccessiblePositions(row, column) {
        const result = [];
        const queue = [];

        queue.push({"row": row, "column": column});
        result.push({"row": row, "column": column});
        while (queue.length !== 0) {
            const u = queue.shift();
            for (const acc of this.getAccessibleSurrounding(u.row, u.column)) {
                if (!result.some(e => JSON.stringify(e) === JSON.stringify(acc))) {
                    result.push(acc);
                    queue.push(acc);
                }
            }
        }

        return result;
    }

    addEventListener(type, callback) {
        this._eventListeners.push({"type": type, "callback": callback});
    }

    callEventListenersOfType(type, param) {
        for (const eventListener of this._eventListeners) {
            if (eventListener.type === type)
                eventListener.callback(param);
        }
    }

    onNewGame() {
        this.callEventListenersOfType("newgame");
    }

    onGameOver(winner) {
        this.callEventListenersOfType("gameover", winner);
    }

    onPlayerStateChanged(newPlayer) {
        this.callEventListenersOfType("playerchanged", newPlayer);
    }

    onTreasurePicked(event) {
        this.callEventListenersOfType("treasurepicked", event);
    }

    onTreasureAdded(event) {
        this.callEventListenersOfType("treasureadded", event);
    }

    onExtraFieldChanged(extraField) {
        this.callEventListenersOfType("extrafieldchanged", extraField);
    }
}