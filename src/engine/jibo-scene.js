const animationUtilities = require("../../../../PRG-Virtual_Jibo/src/index.js");

const {
    visualize,
    JiboConfig,
    RobotInfo,
    THREE
} = animationUtilities;

class JiboSceneManager {
    constructor(gl, renderer) {
        this.gl = gl;
        this.renderer = renderer;
        this.robotRenderer = null;
        this.robotInfo = null;
        this.initialized = false;
        this.pendingInitPromise = null;
        this.resizeObserver = null;
    }

    isReady() {
        return this.initialized;
    }

    async initialize() {
        if (this.initialized) return;
        if (this.pendingInitPromise) return this.pendingInitPromise;
        this.pendingInitPromise = this._initializeInternal();
        await this.pendingInitPromise;
    }

    async _initializeInternal() {
        const config = new JiboConfig();
        this.robotInfo = await new Promise((resolve, reject) => {
            RobotInfo.createInfo(config, info => {
                if (!info) {
                    reject(new Error("Failed to load Jibo robot configuration"));
                } else {
                    resolve(info);
                }
            });
        });

        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.top = "0";
        container.style.left = "0";
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.pointerEvents = "none";
        container.style.zIndex = "1000";

        const scratchCanvas = this.renderer.canvas;
        if (scratchCanvas.parentElement) {
            scratchCanvas.parentElement.appendChild(container);
        }

        await new Promise((resolve, reject) => {
            visualize.createRobotRenderer(
                this.robotInfo,
                container,
                visualize.DisplayType.BODY,
                renderer => {
                    if (!renderer) {
                        reject(new Error("Could not create Jibo renderer"));
                        return;
                    }
                    this.robotRenderer = renderer;
                    renderer.setCamera(
                        new THREE.Vector3(0.50, 0.0, 0.37), 
                        new THREE.Vector3(0, 0, 0.17), 
                        45
                    );
                    renderer.setBackgroundColor(0.5, 0.5, 0.5, 1);
                    resolve(renderer);
                }
            );
        });

        this.initialized = true;
    }

    draw() {
        if (!this.initialized || !this.robotRenderer) return;
        this.robotRenderer.scene.render();
    }

    resetPose() {
        if (!this.robotRenderer || !this.robotInfo) return;
        const pose = this.robotInfo.getDefaultDOFValues();
        this.robotRenderer.display(pose);
        this.draw();
    }

    rotateBody(degrees) {
        if (!this.robotRenderer) return;
        const delta = degrees * Math.PI / 180;
        const pose = {
            bottomSection_r: delta,
            middleSection_r: 0,
            topSection_r: 0
        };
        this.robotRenderer.display(pose);
        this.draw();
    }

    setEyeColor(r, g, b) {
        if (!this.robotRenderer) return;
        const pose = {
            eye_redChannelBn_r: r,
            eye_greenChannelBn_r: g,
            eye_blueChannelBn_r: b,
            eye_alphaChannelBn_r: 1
        };
        this.robotRenderer.display(pose);
        this.draw();
    }
}

module.exports = JiboSceneManager;
