import {TableView} from './TableView.js'
import {ImageButton} from "./ImageButton.js";

// A subclass of 'TableView'. It adds support to draw the players on top of the table, and animate their movements.
export class GameTable extends TableView {
    draw() {
        super.draw();

        // draw the players
        for (const controlItem of this._controlItems) {
            if (controlItem.playerElements !== undefined) {
                for (let i = 0; i < controlItem.playerElements.length; i++){
                    const player = controlItem.playerElements[i];
                    const parent = controlItem.control;
                    const playerWidth = parent.getWidth / 2;
                    const playerHeight = parent.getHeight / 2;
                    player.icon.setPosition = {"x": parent.getX + (i % 2) * playerWidth,
                                               "y": parent.getY + Math.trunc(i / 2) * playerHeight};
                    player.icon.setSize = {"width": playerWidth, "height": playerHeight};
                    this._context.globalAlpha = parent.isEnabled ? 1 : 0.5;
                    player.icon.draw(this._context);
                    this._context.globalAlpha = 1;
                }
            }
        }
    }

    // overridden to be able to move the players on the field to the opposite side
    shift(index, shiftType, newControl, skipFirst = true, skipLast = true, animate = true) {
        if (newControl === undefined)
            throw new Error("The GameTable should get a new field item to keep the table populated with fields.")

        // newControl.playerElements = removedElement.playerElements;
        const { removed, added, moved } = super.shift(index, shiftType, newControl, skipFirst, skipLast, animate);

        // place the removed players back
        added.playerElements = removed.playerElements;

        // filter out the players, who have been moved
        const changedPlayers = moved.concat([added])
                            .filter(c => c !== removed && c.playerElements !== undefined && c.playerElements.length > 0)
                            .flatMap(c => c.playerElements.map( p => ({"id": p.id, "row": c.row, "col": c.column})));

        // return only the changed players
        return changedPlayers;
    }

    addPlayer(id, image, row, column) {
        const icon = new ImageButton({"image": image});
        const elementToAttachTo = this.getControlInfosAt(row, column);
        if (elementToAttachTo.playerElements === undefined)
            elementToAttachTo.playerElements = [];
        elementToAttachTo.playerElements.push({"id": id, "icon": icon});
    }

    movePlayer(id, newRow, newColumn, animate = false) {
        if (!animate) {
            for (const controlItem of this._controlItems) {
                if (controlItem.playerElements !== undefined){
                    const index = controlItem.playerElements.findIndex(p => p.id === id);

                    if (index > -1) {
                        const elementToAttachTo = this.getControlInfosAt(newRow, newColumn);
                        if (elementToAttachTo !== undefined){
                            if (elementToAttachTo.playerElements === undefined)
                                elementToAttachTo.playerElements = [];
                            elementToAttachTo.playerElements.push(controlItem.playerElements.splice(index, 1)[0]);
                        }
                    }
                }
            }
        } else {
        }
    }

    addTreasure(treasureText, treasureImage, row, column, isVisible = true) {
        this.getControlAt(row,column).addTreasure(treasureImage, treasureText, isVisible);
    }

    removeTreasure(row, column, animate = true) {
        this.getControlAt(row,column).removeTreasure(animate);
    }
}