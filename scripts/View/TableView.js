import {ViewBase} from './ViewBase.js'

const SIZE_TYPE = {
    ABSOLUTE: "absolute",
    RELATIVE: "relative", // 1..100 percentage
};

const SHIFT_TYPE = {
    ROW_LEFT: "row-left",
    ROW_RIGHT: "row-right",
    COLUMN_UP: "column-up",
    COLUMN_DOWN: "column-down",
    isRowRelated: (type) => type === SHIFT_TYPE.ROW_LEFT || type === SHIFT_TYPE.ROW_RIGHT,
    isColumnRelated: (type) => !SHIFT_TYPE.isRowRelated(type)
};

// A basic table that supports shifting its rows / columns and animation.
export class TableView extends ViewBase {
    // the speed of the animation (px/sec)
    _animationSpeed = 200;
    // stores the elements (called 'controls') added to the table
    _controlItems = [];
    // stores the dimensions (relative or absolute) of the table rows and columns
    _table = {
        "rows": [],
        "columns": []
    }

    constructor(canvas, context, width, height) {
        super();

        this._width = width;
        this._height = height;

        this._canvas = canvas;
        this._context = context;

        this.init();
    }

    get RowCount() {
        return this._table.rows.length;
    }

    get ColumnCount() {
        return this._table.columns.length;
    }

    get getAnimationSpeed() {
        return this._animationSpeed;
    }

    set setAnimationSpeed(value) {
        this._animationSpeed = value;
    }

    static get SIZE_TYPE() {
        return SIZE_TYPE;
    }

    static get SHIFT_TYPE() {
        return SHIFT_TYPE;
    }

    // attaches the event listeners and starts the drawing cycle
    init() {
        const dispatchToControl = (function (event) {
            const rect = this._canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            // gets the currently hovered element in the table, and calls 'onmouseleave' if it's not hovered, but was before
            let controlInfo = undefined;
            for (const cI of this._controlItems) {
                const c = cI.control;
                if ((c.getX <= x && x < c.getX + c.getWidth) && (c.getY <= y && y < c.getY + c.getHeight)) {
                    controlInfo = cI;
                } else if (c.isHovered) {
                    c.onmouseleave(event);
                }
            }

            if (controlInfo === undefined || controlInfo.control === undefined)
                return;

            // dispatches the event
            event.row = controlInfo.row;
            event.column = controlInfo.column;
            switch (event.type) {
                case 'mousemove':
                {
                    controlInfo.control.onmouseenter(event);
                    break;
                }
                case 'click':
                {
                    controlInfo.control.onclick(event);
                    break;
                }
            }
        }).bind(this);

        // starts the drawing cycle
        let lastTime = performance.now();
        const loop = (function (now = performance.now()) {
            window.requestAnimationFrame(loop)
            const dt = (now - lastTime) / 1000
            lastTime = now

            this.update(dt)
            this.draw()
        }).bind(this);

        this._canvas.addEventListener('mousemove', dispatchToControl);
        this._canvas.addEventListener('click', dispatchToControl);
        this._canvas.addEventListener('mouseleave', function (event) {
            // if the mouse leaves the canvas area
            this._controlItems.forEach(cI => cI.control.onmouseleave(event));
        }.bind(this));

        loop();
    }

    // updates the position of the controls that are currently animated and calls update on the embedded elements
    update(dt = performance.now()) {
        for (const controlInfo of this._controlItems) {
            const { control, animation } = controlInfo;

            if (animation !== undefined){
                if (animation.vx !== undefined && animation.targetX !== undefined){
                    if ((animation.vx > 0 && controlInfo.control.getX >= animation.targetX) ||
                        (animation.vx < 0 && controlInfo.control.getX <= animation.targetX)){ // if the target value is reached
                        if (animation.animationEnd !== undefined)
                            animation.animationEnd();
                        delete controlInfo.animation; // stop animation
                    } else {
                        control.setX = control.getX + animation.vx * dt;
                    }
                }
                if (animation.vy !== undefined && animation.targetY !== undefined){
                    if ((animation.vy > 0 && controlInfo.control.getY >= animation.targetY) ||
                        (animation.vy < 0 && controlInfo.control.getY <= animation.targetY)){ // if the target value is reached
                        if (animation.animationEnd !== undefined)
                            animation.animationEnd();
                        delete controlInfo.animation; // stop animation
                    } else {
                        control.setY = control.getY + animation.vy * dt;
                    }
                }

            }
            // update the embedded controls also
            control.update(dt);
        }
    }

    // draws the table and calls draw on the embedded elements
    draw() {
        this._context.clearRect(this.getX, this.getY, this._width, this._height);

        // divide the width/height between the rows/columns
        const absoluteRowHeightSum = this._table.rows.reduce((prev, curr) =>
            (curr.sizeType === SIZE_TYPE.ABSOLUTE ? prev + curr.height : prev), 0);
        const absoluteColumnWidthSum = this._table.columns.reduce((prev, curr) =>
            (curr.sizeType === SIZE_TYPE.ABSOLUTE ? prev + curr.width : prev), 0);

        const relativeHeightSum = this._height - absoluteRowHeightSum;
        const relativeWidthSum = this._width - absoluteColumnWidthSum;

        const columnWidths = this._table.columns.map(c => (c.sizeType === SIZE_TYPE.ABSOLUTE ? c.width : relativeWidthSum * c.width / 100));
        const rowHeights = this._table.rows.map(r => (r.sizeType === SIZE_TYPE.ABSOLUTE ? r.height : relativeHeightSum * r.height / 100));

        // draw the elements to their row/column
        let currY = 0;
        for (let i = 0; i < rowHeights.length; i++) {
            let currX = 0;
            for (let j = 0; j < columnWidths.length; j++) {
                const controlInfos = this.getControlInfosAt(i, j, true);
                for (const controlInfo of controlInfos) {
                    if (controlInfo !== undefined){ // there is a control at the given row & column
                        controlInfo.control.setSize = {width: columnWidths[j], height: rowHeights[i]};

                        // if the element is animating don't change x/y coordinates immediately
                        if (controlInfo.animation !== undefined) {
                            const anim = controlInfo.animation;
                            if (anim.vx !== undefined && anim.targetX === undefined){
                                anim.targetX = currX;
                            }
                            if (anim.vy !== undefined && anim.targetY === undefined){
                                anim.targetY = currY;
                            }

                            if (anim.vx === undefined){
                                controlInfo.control.setX = currX;
                            }

                            if (anim.vy === undefined){
                                controlInfo.control.setY = currY;
                            }

                            if (anim.startX !== undefined){
                                controlInfo.control.setX = anim.startX;
                                delete anim.startX;
                            }
                            if (anim.startY !== undefined){
                                controlInfo.control.setY = anim.startY;
                                delete anim.startY;
                            }
                        } else { // no animation, set the values
                            controlInfo.control.setX = currX;
                            controlInfo.control.setY = currY;
                        }

                        controlInfo.control.draw(this._context);
                    }
                }
                currX += columnWidths[j];
            }
            currY += rowHeights[i];
        }
    }

    addRow(height, sizeType, count = 1) {
        for (let i = 0; i < count; i++) {
            this._table.rows.push({"height": height, "sizeType": sizeType});
        }
    }

    addColumn(width, sizeType, count = 1) {
        for (let i = 0; i < count; i++) {
            this._table.columns.push({"width": width, "sizeType": sizeType});
        }
    }

    addControl(control, row, column){
        // remove if there is a cell containing the same control
        for (let i = 0; i < this._controlItems.length; i++) {
            if (this._controlItems[i].control === control)
                this._controlItems.splice(i, 1);
        }

        const newItem = {"control": control, "row": row, "column": column};
        this._controlItems.push(newItem);
        return newItem;
    }

    // returns the control's stored information at a specific row and column (e.g. row, column, animation object, ...)
    getControlInfosAt(row, column, includeAnimating = false){
        return includeAnimating ? this._controlItems.filter(c => c.row === row && c.column === column) :
            this._controlItems.find(c => c.row === row && c.column === column && c.animation === undefined);
    }

    // Returns a control the control at a specific row and column.
    getControlAt(row, column){
        const result = this._controlItems.filter(c => c.row === row && c.column === column);
        if (result.length > 1)
            throw new Error(`Control at (${row},${column}) is currently animating`);

        return result[0].control;
    }

    // Empties the table. (removes every control)
    clearAll(){
        this._controlItems = [];
    }

    // shifts a row/column to a given direction and returns the control that has been removed
    // it can also push in an element on the opposite side of the row/column
    // returns: an object containing the removed element information ("removed" property),
    //          the newly added element information ("added" property), if any
    //          and the information of the moved elements ("moved" property)
    shift(index, shiftType, newControl, skipFirst = true, skipLast = true, animate = true) {
        const affectedControls = this._controlItems
            .filter( c =>  (SHIFT_TYPE.isRowRelated(shiftType) ? c.row === index : c.column === index) &&
                (c.animation === undefined ||  c.animation.animationEnd === undefined)) // find the ones that aren't marked for removal
            .sort((a, b) => (SHIFT_TYPE.isRowRelated(shiftType) ? a.column - b.column : a.row - b.row));

        if (skipFirst)
            affectedControls.shift();
        if (skipLast)
            affectedControls.pop();

        if (affectedControls.length > 0){
            // find the first that isn't marked already for removal
            const shiftDirection = (shiftType === SHIFT_TYPE.COLUMN_UP || shiftType === SHIFT_TYPE.ROW_LEFT) ? -1 : 1;
            const removeIndex = (shiftDirection === -1) ? 0 : (affectedControls.length - 1);
            const toRemove = affectedControls[removeIndex];
            const removeFunction = (function () {
                this._controlItems.splice(this._controlItems.findIndex(c => c === toRemove), 1);
            }).bind(this);

            if (animate){
                if (SHIFT_TYPE.isRowRelated(shiftType)){
                    toRemove.animation = { "vx": shiftDirection * this._animationSpeed,
                        "targetX": (shiftDirection === -1 ? -toRemove.control.getWidth : this._width + toRemove.control.getWidth),
                        "animationEnd": removeFunction }; // remove only after animation
                } else {
                    toRemove.animation = { "vy": shiftDirection * this._animationSpeed,
                        "targetY": (shiftDirection === -1 ? -toRemove.control.getHeight : this._height + toRemove.control.getHeight),
                        "animationEnd": removeFunction }; // remove only after animation
                }
            } else {
                removeFunction(); // remove immediately
            }

            for (let i = (shiftDirection === -1 ? 1 : 0); i < affectedControls.length - (shiftDirection === -1 ?  0 : 1); i++) {
                // shift the ones that won't be removed
                affectedControls[i][`${SHIFT_TYPE.isRowRelated(shiftType) ? "column" : "row"}`] += (shiftDirection);
                if (animate)
                    affectedControls[i].animation = {[`${SHIFT_TYPE.isRowRelated(shiftType) ? "vx" : "vy"}`]: shiftDirection * this._animationSpeed};
            }

            // push in the new control if any
            let newControlInfo;
            if (newControl !== undefined){
                if (SHIFT_TYPE.isRowRelated(shiftType)){
                    newControlInfo = this.addControl(newControl, index,
                        shiftDirection === -1 ? (this.ColumnCount - 1 - (skipLast)) : Number(skipLast));
                    if (animate)
                        newControlInfo.animation = {"vx": shiftDirection * this._animationSpeed,
                            "startX": (shiftDirection === -1 ? this._width : -newControlInfo.control.getWidth)};
                } else {
                    newControlInfo = this.addControl(newControl,
                        shiftDirection === -1 ? (this.RowCount - 1 - (skipLast)) : Number(skipLast),
                        index);
                    if (animate)
                        newControlInfo.animation = {"vy": shiftDirection * this._animationSpeed,
                            "startY": (shiftDirection === -1 ? this._height : -newControlInfo.control.getHeight)};
                }
            }

            return {"removed": toRemove, "added": newControlInfo, "moved": affectedControls };
        }
    }

    isAnimating() {
        return this._controlItems.some(i => i.animation !== undefined);
    }
}