import {ViewBase} from './ViewBase.js'

// A button that is filled with an image.
export class ImageButton extends ViewBase {
    constructor({image, x = 0, y = 0, width = image.width, height = image.height,
                    rotate = 0, enabled = true, interactive = false}){
        super();

        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;

        this._image = image;
        this._rotate = rotate;
        this._enabled = enabled;
        this._interactive = interactive;
    }

    get getWidth() { return (Math.abs(this._rotate) === 90 ? this._height : this._width); }
    get getHeight() { return (Math.abs(this._rotate) === 90 ? this._width : this._height); }

    set setWidth(value) {
        if(Math.abs(this._rotate) === 90)
            this._height = value;
        else
            this._width = value;
    }

    set setHeight(value) {
        if(Math.abs(this._rotate) === 90)
            this._width = value;
        else
            this._height = value;
    }

    set setSize(value) {
        let newWidth = value.width; let newHeight = value.height;

        if (Math.abs(this._rotate) === 90){
            const tmp = newHeight;
            newHeight = newWidth;
            newWidth = tmp;
        }

        this._width = newWidth;
        this._height = newHeight;
    }

    draw(context) {
        context.save();

        if (this._height > this._width && Math.abs(this._rotate) === 90)
            context.translate(this._x + this._height / 2, this._y + this._width / 2);
        else
            context.translate(this._x + this._width / 2, this._y + this._height / 2);

        context.rotate(this._rotate * Math.PI / 180.0);
        context.drawImage(this._image, -this._width / 2, -this._height / 2, this._width, this._height);

        context.restore();

        if (!this.isEnabled) {
            context.fillStyle = 'rgba(255,255,255,0.62)';
            context.fillRect(this._x, this._y, this.getWidth, this.getHeight);
        }

        if (this._interactive && this.isHovered && this.isEnabled) {
            context.fillStyle = 'rgba(204,116,255,0.45)';
            context.fillRect(this._x, this._y, this.getWidth, this.getHeight);
        }
    }

}
