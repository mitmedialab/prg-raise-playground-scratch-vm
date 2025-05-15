const MathUtil = require('../util/math-util');
const StringUtil = require('../util/string-util');
const Cast = require('../util/cast');
const Clone = require('../util/clone');
const Target = require('../engine/target');
const StageLayering = require('../engine/stage-layering');

/**
 * Rendered target: instance of a sprite (clone), or the stage.
 */
class Rendered3DTarget {
    /**
     * @param {!Sprite} sprite Reference to the parent sprite.
     * @param {Runtime} runtime Reference to the runtime.
     * @constructor
     */
    constructor(model, anchoredSprite, runtime) {

        this.anchoredSprite = anchoredSprite;

        this.x = anchoredSprite.x;
        this.y = anchoredSprite.y;
        this.direction = anchoredSprite.direction;
        this.draggable = anchoredSprite.draggable;
        this.visible = anchoredSprite.visible;
        this.size = anchoredSprite.size;
        this.currentCostume = anchoredSprite.currentCostume;
        this.rotationStyle = anchoredSprite.rotationStyle;

        console.log("sprite", anchoredSprite);
        console.log("runtime", runtime);

        anchoredSprite.on("EVENT_TARGET_VISUAL_CHANGE", (e) => {
            console.log("EVENT", e);
            if ((anchoredSprite.x != this.x) || (anchoredSprite.y != this.y)) {
                runtime.pixi3d.setXY(model, anchoredSprite.x, anchoredSprite.y);
                this.x = anchoredSprite.x;
                this.y = anchoredSprite.y;
            }
        })

    }
}

module.exports = Rendered3DTarget;
