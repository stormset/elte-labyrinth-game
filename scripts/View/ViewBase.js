export class ViewBase {
    _width = 0; // width of the element
    _height = 0; // height of the element
    _x = 0; // x coordinates of the element on the canvas
    _y = 0; // y coordinates of the element on the canvas
    _eventListeners = []  // event listeners of the element
    _enabled = true;
    _hovered = false;

    // getters and setters
    get getWidth() {
        return this._width;
    }

    set setWidth(value) {
        this._width = value;
    }

    get getHeight() {
        return this._height;
    }

    set setHeight(value) {
        this._height = value;
    }

    set setSize(value) {
        this._width = value.width;
        this._height = value.height;
    }

    get getX() {
        return this._x;
    }

    set setX(value) {
        this._x = value;
    }

    get getY() {
        return this._y;
    }

    set setY(value) {
        this._y = value;
    }

    set setPosition(value) {
        this._x = value.x;
        this._y = value.y;
    }

    get isEnabled() {
        return this._enabled;
    }

    set isEnabled(value) {
        this._enabled = value;
    }

    get isHovered() {
        return this._hovered;
    }

    // methods
    draw(context) {}; // draws the element to the canvas

    update(dt = performance.now()) {} // updates the state of the view

    addEventListener(type, callback) {
        this._eventListeners.push({"type": type, "callback": callback});
    }

    // event handlers
    onclick(event) {
        for (const eventListener of this._eventListeners) {
            if (eventListener.type === "click" && this._enabled)
                eventListener.callback(event);
        }
    }

    onmouseenter (event) {
        for (const eventListener of this._eventListeners) {
            if (eventListener.type === "mouseenter")
                eventListener.callback(event);
        }
        this._hovered = true;
    }

    onmouseleave (event) {
        for (const eventListener of this._eventListeners) {
            if (eventListener.type === "mouseleave")
                eventListener.callback(event);
        }
        this._hovered = false;
    }
}