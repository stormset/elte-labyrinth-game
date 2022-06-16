import {ImageButton} from "./ImageButton.js";

// A subclass of 'ImageButton'. It adds support to draw the treasures on the fields.
export class GameField extends ImageButton {
    _treasureImage = undefined;
    _treasureText = "";
    _isTreasureVisible = false;

    update(dt = performance.now()) {
        super.update(dt);

        // treasure hide animation
        if (this._treasureAnimation !== undefined) {
            this._treasureAnimation();
        }
    }

    draw(context) {
        super.draw(context);

        if (this._treasureImage !== undefined && this._isTreasureVisible){
            const scale = this._treasureImage.scale;
            const width = (this.getWidth / 2) * scale; // treasure width
            const height = (this.getHeight / 2) * scale; // treasure height

            // treasure
            context.globalAlpha = this.isEnabled ? 1 : 0.5;
            context.drawImage(this._treasureImage.image, this.getX + width / 2, this.getY + height / 2, width, height);

            //number and circle background
            context.beginPath();
            context.arc(this.getX + width, this.getY + height + width/4, width / 5, 0, 2 * Math.PI);
            context.fillStyle = 'white';
            context.fill();
            context.stroke();
            context.fillStyle = 'black';
            context.textAlign = "center";
            context.font = `bold ${width/3}px Arial`;
            context.fillText(this._treasureText, this.getX + width, this.getY + height + width/2.6);
            context.globalAlpha = 1;
        }
    }

    addTreasure(image, treasureText="", isTreasureVisible = true) {
        this._treasureImage = {"image":image, "scale": 1};
        this._treasureText = treasureText;
        this._isTreasureVisible = isTreasureVisible;
    }

    removeTreasure(animate = true) {
        if (this._treasureImage !== undefined) {
            const removeCallback = function () {
                this._treasureImage = undefined;
                this._treasureText = "";
                this._isTreasureVisible = false;
                delete this._treasureAnimation;
            }.bind(this);

            const animationLoop = function () {
                this._treasureImage.scale -= 0.05;
                if (this._treasureImage.scale <= 0){
                    removeCallback();
                }
            }.bind(this);

            if (!animate){
                removeCallback();
            } else {
                this._treasureAnimation = animationLoop;
            }
        }
    }

    setTreasureVisibility(isVisible) {
        this._isTreasureVisible = isVisible;
    }
}