const animationUtilities = require("../../../../PRG-Virtual_Jibo/src/index.js");

const {
    visualize,
    JiboConfig,
    RobotInfo,
    THREE,
    TimelineBuilder,
    animate
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
        this.motionTimeline = null;
        this.animUtils = null;
        this.currentAnimation = null;
        this.currentRotation = 0;
        this.currentEyeColor = { r: 1, g: 1, b: 1 };
        this.lookAtEnabled = false;
        this.lookatInstance = null;
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

        this.motionTimeline = TimelineBuilder.createTimeline(this.robotInfo, null, 30);
        TimelineBuilder.connectRenderer(this.motionTimeline, this.robotRenderer);
        this.animUtils = animate.createAnimationUtilities();
        this.animUtils.init(this.motionTimeline, this.robotInfo);

        const initialPose = {
            eye_redChannelBn_r: 1,
            eye_greenChannelBn_r: 1,
            eye_blueChannelBn_r: 1,
            eye_alphaChannelBn_r: 1
        };
        this.robotRenderer.display(initialPose);

        this.addGroundPlane();
        this.adjustMaterialAmbient();
        this.debugScene();

        this.initialized = true;
    }

    draw() {
        if (!this.initialized || !this.robotRenderer) return;
        this.robotRenderer.scene.render();
    }

    resetPose() {
        if (!this.animUtils || !this.robotInfo) return;
        
        this.currentRotation = 0;
        this.currentEyeColor = { r: 1, g: 1, b: 1 };
        
        if (this.currentAnimation) {
            this.currentAnimation.stop();
            this.currentAnimation = null;
        }
        
        const defaultPose = this.robotInfo.getDefaultDOFValues();
        const pose = {
            ...defaultPose,
            bottomSection_r: 0,
            middleSection_r: 0,
            topSection_r: 0,
            eye_redChannelBn_r: 1,
            eye_greenChannelBn_r: 1,
            eye_blueChannelBn_r: 1,
            eye_alphaChannelBn_r: 1,
            eyeVisibilityBn_r: 1
        };
        
        const builder = this.animUtils.createAnimationBuilderFromPose('reset', pose);
        builder.setTransitionIn(this.animUtils.createLinearTransitionBuilder().setTransitionTime(0.5));
        builder.play();
    }

    rotateBody(degrees) {
        if (!this.animUtils || !this.robotInfo) return;
        
        this.currentRotation = degrees * Math.PI / 180;
        
        if (this.currentAnimation) {
            this.currentAnimation.stop();
            this.currentAnimation = null;
        }
        
        const pose = {
            bottomSection_r: this.currentRotation,
            middleSection_r: 0,
            topSection_r: 0
        };
        
        const builder = this.animUtils.createAnimationBuilderFromPose('rotate', pose);
        builder.setTransitionIn(this.animUtils.createLinearTransitionBuilder().setTransitionTime(0.5));
        this.currentAnimation = builder.play();
    }

    setEyeColor(r, g, b) {
        if (!this.animUtils) return;
        
        this.currentEyeColor = { r, g, b };
        
        if (this.currentAnimation) {
            this.currentAnimation.stop();
            this.currentAnimation = null;
        }
        
        const pose = {
            eye_redChannelBn_r: r,
            eye_greenChannelBn_r: g,
            eye_blueChannelBn_r: b,
            eye_alphaChannelBn_r: 1
        };
        
        const builder = this.animUtils.createAnimationBuilderFromPose('eyeColor', pose);
        builder.setTransitionIn(this.animUtils.createLinearTransitionBuilder().setTransitionTime(0.3));
        this.currentAnimation = builder.play();
    }

    restoreState() {
        if (!this.animUtils) return;
        
        const pose = {
            eye_redChannelBn_r: this.currentEyeColor.r,
            eye_greenChannelBn_r: this.currentEyeColor.g,
            eye_blueChannelBn_r: this.currentEyeColor.b,
            eye_alphaChannelBn_r: 1,
            eyeVisibilityBn_r: 1
        };
        
        const builder = this.animUtils.createAnimationBuilderFromPose('restoreState', pose);
        builder.setTransitionIn(this.animUtils.createLinearTransitionBuilder().setTransitionTime(0.3));
        builder.play();
    }

    blink() {
        return new Promise((resolve) => {
            if (!this.animUtils) {
                resolve();
                return;
            }
            
            this.animUtils.createAnimationBuilder('res/geometry-config/P1.0/jibo_blink.anim', (builder) => {
                if (builder) {
                    const currentDOFs = builder.getDOFs();
                    const filteredDOFs = currentDOFs.filter(dof => 
                        !dof.includes('eyeTexture') &&
                        !dof.includes('eye_redChannel') &&
                        !dof.includes('eye_greenChannel') &&
                        !dof.includes('eye_blueChannel')
                    );
                    builder.setDOFs(filteredDOFs);
                    
                    builder.on(animate.AnimationEventType.STOPPED, () => {
                        this.restoreState();
                        resolve();
                    });
                    builder.on(animate.AnimationEventType.CANCELLED, () => {
                        this.restoreState();
                        resolve();
                    });
                    builder.play();
                } else {
                    resolve();
                }
            });
        });
    }

    playAnimation(animPath) {
        return new Promise((resolve) => {
            if (!this.animUtils) {
                resolve();
                return;
            }
            
            if (this.currentAnimation) {
                this.currentAnimation.stop();
                this.currentAnimation = null;
            }

            this.animUtils.createAnimationBuilder(animPath, (builder) => {
                if (builder) {
                    const eyeDOFs = this.robotInfo.getEyeDOFNames();
                    const currentDOFs = builder.getDOFs();
                    const filteredDOFs = currentDOFs.filter(dof => {
                        return !dof.includes('eyeTexture') && 
                               !dof.includes('eye_redChannel') && 
                               !dof.includes('eye_greenChannel') && 
                               !dof.includes('eye_blueChannel') &&
                               !dof.includes('eye_alphaChannel');
                    });
                    builder.setDOFs(filteredDOFs);
                    
                    builder.on(animate.AnimationEventType.STOPPED, () => {
                        this.currentAnimation = null;
                        this.restoreState();
                        resolve();
                    });
                    builder.on(animate.AnimationEventType.CANCELLED, () => {
                        this.currentAnimation = null;
                        this.restoreState();
                        resolve();
                    });
                    this.currentAnimation = builder.play();
                } else {
                    resolve();
                }
            });
        });
    }

    async playEmotionAnimation(emotion) {
        if (emotion === 'neutral' || emotion === 'calm') {
            this.resetPose();
            return;
        }

        const animations = {
            happy: [
                'static/animations/emotions/happy/happy_01.anim',
                'static/animations/emotions/happy/happy_02.anim',
                'static/animations/emotions/happy/happy_03.anim',
                'static/animations/emotions/happy/happy_04.anim',
                'static/animations/emotions/happy/happy_05.anim',
                'static/animations/emotions/happy/happy_06.anim',
                'static/animations/emotions/happy/happy_07.anim'
            ],
            sad: [
                'static/animations/emotions/sad/sad_01.anim',
                'static/animations/emotions/sad/sad_02.anim',
                'static/animations/emotions/sad/sad_03.anim',
                'static/animations/emotions/sad/sad_04.anim',
                'static/animations/emotions/sad/sad_05.anim',
                'static/animations/emotions/sad/sad_06.anim'
            ],
            surprised: [
                'static/animations/emotions/surprised/surprised_00.anim',
                'static/animations/emotions/surprised/surprised_01.anim',
                'static/animations/emotions/surprised/surprised_02.anim',
                'static/animations/emotions/surprised/surprised_03.anim',
                'static/animations/emotions/surprised/surprised_04.anim',
                'static/animations/emotions/surprised/surprised_05.anim',
                'static/animations/emotions/surprised/surprised_06.anim',
                'static/animations/emotions/surprised/surprised_07.anim'
            ],
            confused: [
                'static/animations/emotions/confused/confused_00.anim',
                'static/animations/emotions/confused/confused_01.anim',
                'static/animations/emotions/confused/confused_02.anim',
                'static/animations/emotions/confused/confused_03.anim',
                'static/animations/emotions/confused/confused_04.anim',
                'static/animations/emotions/confused/confused_05.anim'
            ],
            excited: [
                'static/animations/emotions/excited/excited_00.anim',
                'static/animations/emotions/excited/excited_05.anim'
            ],
            worried: [
                'static/animations/emotions/worried/worried_01.anim',
                'static/animations/emotions/worried/worried_02.anim',
                'static/animations/emotions/worried/worried_03.anim',
                'static/animations/emotions/worried/worried_04.anim'
            ],
            scared: [
                'static/animations/emotions/scared/scared_00.anim',
                'static/animations/emotions/scared/scared_01.anim',
                'static/animations/emotions/scared/scared_02.anim',
                'static/animations/emotions/scared/scared_03.anim'
            ],
            proud: [
                'static/animations/emotions/proud/confident_01.anim',
                'static/animations/emotions/proud/confident_02.anim',
                'static/animations/emotions/proud/confident_03.anim',
                'static/animations/emotions/proud/confident_04.anim',
                'static/animations/emotions/proud/confident_05.anim'
            ]
        };

        const emotionAnims = animations[emotion];
        if (!emotionAnims || emotionAnims.length === 0) {
            await this.blink();
            return;
        }

        const randomAnim = emotionAnims[Math.floor(Math.random() * emotionAnims.length)];
        await this.playAnimation(randomAnim);
    }

    addGroundPlane() {
        if (!this.robotRenderer) return;
        
        const scene = this.robotRenderer.scene.getScene();
        
        const circleGeometry = new THREE.CircleGeometry(0.3, 32);
        const circleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x303030,
            side: THREE.DoubleSide
        });
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        
        const quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
        circle.quaternion.copy(quaternion);
        circle.position.set(0, 0, 0.005);
        scene.add(circle);
        
        console.log('Ground circle added at:', circle.position);
    }

    adjustMaterialAmbient() {
        if (!this.robotRenderer) return;
        
        const scene = this.robotRenderer.scene.getScene();
        scene.traverse((object) => {
            if (object.material && object.material.ambient) {
                object.material.ambient.r = 0.4;
                object.material.ambient.g = 0.4;
                object.material.ambient.b = 0.4;
            }
        });
    }

    setBodyColor(r, g, b) {
        if (!this.robotRenderer) return;
        
        const scene = this.robotRenderer.scene.getScene();
        scene.traverse((object) => {
            if (object.material && object.material.color) {
                if (object.material.ambient) {
                    object.material.ambient.r = 0.5;
                    object.material.ambient.g = 0.5;
                    object.material.ambient.b = 0.5;
                }
                object.material.color.setRGB(r / 255, g / 255, b / 255);
            }
        });
    }

    debugScene() {
        if (!this.robotRenderer) return;
        const scene = this.robotRenderer.scene.getScene();
        console.log('Scene hierarchy:');
        scene.traverse((obj) => {
            console.log(`- ${obj.name || 'unnamed'} at position:`, obj.position, 'type:', obj.type);
        });
    }

    setLookAtMouse(enabled) {
        if (!this.animUtils) return;
        
        if (enabled) {
            if (this.lookatInstance) return;
            
            const lookatBuilder = this.animUtils.createLookatBuilder();
            lookatBuilder.setContinuousMode(true);
            
            const initialTarget = new THREE.Vector3(0, 0, 0.25);
            this.lookatInstance = lookatBuilder.startLookat(initialTarget);
            
            this.mouseHandler = (mouseData) => {
                if (!this.lookatInstance) return;
                
                const normalizedX = (mouseData.x / mouseData.canvasWidth) * 2 - 1;
                const normalizedY = -((mouseData.y / mouseData.canvasHeight) * 2 - 1);
                
                const distance = 0.5;
                const x = normalizedX * 0.12;
                const y = normalizedY * 0.12;
                const z = 0.2 + (normalizedY * 0.05);
                
                const target = new THREE.Vector3(x, y, z);
                this.lookatInstance.updateTarget(target);
            };
            
            this.lookAtEnabled = true;
        } else {
            if (this.lookatInstance) {
                this.lookatInstance.stop();
                this.lookatInstance = null;
            }
            
            this.mouseHandler = null;
            this.lookAtEnabled = false;
        }
    }

    updateMousePosition(mouseData) {
        if (this.lookAtEnabled && this.mouseHandler) {
            this.mouseHandler(mouseData);
        }
    }
}

module.exports = JiboSceneManager;
