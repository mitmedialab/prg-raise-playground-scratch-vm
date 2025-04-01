const {
    Application,
    Assets,
    Sprite,
    Texture,
    Renderer,
    Container,
    Graphics,
  } = require("@pixi/webworker");
  const {
    CameraOrbitControl,
    LightingEnvironment,
    ImageBasedLighting,
    Model,
    Light,
    LightType,
    ShadowCastingLight,
    ShadowQuality,
    StandardMaterial,
    Mesh3D,
    Camera,
    Color,
    StandardMaterialTexture,
    Quaternion,
  } = require("pixi3d/pixi7");

  class Pixi3D {
    constructor(gl) {
        this.gl = gl;
    }

    

    createApplication() {
        this.pixiApp = new Application({
            context: this.gl,
            backgroundColor: 0xffffff,
            backgroundAlpha: 0,
            antialias: true,
            preserveDrawingBuffer: false
        });
        
        let directionalLight = new Light();
        directionalLight.intensity = 10;
        directionalLight.type = LightType.directional;
        directionalLight.rotationQuaternion.setEulerAngles(25, 120, 0);
        LightingEnvironment.main.lights.push(directionalLight);

        this.shadowCastingLight = new ShadowCastingLight(
            this.pixiApp.renderer,
            directionalLight,
            { shadowTextureSize: 1024, quality: ShadowQuality.medium },
        );
        this.shadowCastingLight.softness = 2;
        this.shadowCastingLight.shadowArea = 15;

        this.pipeline = this.pixiApp.renderer.plugins.pipeline;
        

        // function animate() {
        //     cube.rotationQuaternion = this.multiplyQuaternions(cube.rotationQuaternion, Quaternion.fromEuler(0.5, 0.5, 0));
        //     pixiApp.renderer.render(pixiApp.stage); // Force Pixi3D to render
        //     requestAnimationFrame(animate);
        // }
        // animate();
    }

    createCube(position, scale, color, animated) {
         //Add a 3D cube using Pixi3D
         const cube = Mesh3D.createCube();
         cube.position.set(position[0], position[1], position[2]);
         cube.material.baseColor = new Color(color[0], color[1], color[2]);
         cube.scale.set(scale, scale, scale);
         this.pixiApp.stage.addChild(cube);
         this.pipeline.enableShadows(cube, this.shadowCastingLight);
         if (animated) {
            const animate = () => {
                function multiplyQuaternions(q1, q2) {
                    const result = {
                        x: q1.w * q2.x + q1.x * q2.w + q1.y * q2.z - q1.z * q2.y,
                        y: q1.w * q2.y + q1.y * q2.w + q1.z * q2.x - q1.x * q2.z,
                        z: q1.w * q2.z + q1.z * q2.w + q1.x * q2.y - q1.y * q2.x,
                        w: q1.w * q2.w - q1.x * q2.x - q1.y * q2.y - q1.z * q2.z,
                    };
                    const res = new Quaternion(result.x, result.y, result.z, result.w);
                    return res;
                }
                cube.rotationQuaternion = multiplyQuaternions(cube.rotationQuaternion, Quaternion.fromEuler(0.5, 0.5, 0));
                this.pixiApp.renderer.render(this.pixiApp.stage); // Force Pixi3D to render
                requestAnimationFrame(animate);
            }
            animate();
         }
    }


    createPlane(position, scale, color) {
        const plane = Mesh3D.createPlane();
        plane.material = new StandardMaterial();
        plane.material.baseColor = new Color(color[0], color[1], color[2]); // Red color
        plane.position.set(position[0], position[1], position[2]);
        plane.scale.set(scale, scale, scale);
        //plane.scale.set(0.1, 0.1, 0.1);
        plane.rotationQuaternion = Quaternion.fromEuler(90, 0, 0);
        this.pixiApp.stage.addChild(plane);

        this.pipeline.enableShadows(plane, this.shadowCastingLight);
    }

    createSphere(position, scale, color) {
        const sphere = Mesh3D.createSphere();
        sphere.material = new StandardMaterial();
        sphere.material.baseColor = new Color(color[0], color[1], color[2]); // Red color
        sphere.position.set(position[0], position[1], position[2]);
        sphere.scale.set(scale, scale, scale);
        //plane.scale.set(0.1, 0.1, 0.1);
        sphere.rotationQuaternion = Quaternion.fromEuler(90, 0, 0);
        this.pixiApp.stage.addChild(sphere);

        this.pipeline.enableShadows(sphere, this.shadowCastingLight);
    }

    // createCylinder(position, color, radius, height) {
    //     const cylinder = Mesh3D.createCylinder();
    //     // new StandardMaterial(), {radiusTop: radius, radiusBottom: radius, height: height}
    //     cylinder.material.baseColor = new Color(color[0], color[1], color[2]); // Red color
    //     cylinder.position.set(position[0], position[1], position[2]);
    //     //plane.scale.set(0.1, 0.1, 0.1);
    //     cylinder.rotationQuaternion = Quaternion.fromEuler(90, 0, 0);
    //     this.pixiApp.stage.addChild(cylinder);

    //     this.pipeline.enableShadows(cylinder, this.shadowCastingLight);
    //     if (true) {
    //         const animate = () => {
    //             function multiplyQuaternions(q1, q2) {
    //                 const result = {
    //                     x: q1.w * q2.x + q1.x * q2.w + q1.y * q2.z - q1.z * q2.y,
    //                     y: q1.w * q2.y + q1.y * q2.w + q1.z * q2.x - q1.x * q2.z,
    //                     z: q1.w * q2.z + q1.z * q2.w + q1.x * q2.y - q1.y * q2.x,
    //                     w: q1.w * q2.w - q1.x * q2.x - q1.y * q2.y - q1.z * q2.z,
    //                 };
    //                 const res = new Quaternion(result.x, result.y, result.z, result.w);
    //                 return res;
    //             }
    //             cylinder.rotationQuaternion = multiplyQuaternions(cylinder.rotationQuaternion, Quaternion.fromEuler(0.5, 0.5, 0));
    //             this.pixiApp.renderer.render(this.pixiApp.stage); // Force Pixi3D to render
    //             requestAnimationFrame(animate);
    //         }
    //         animate();
    //      }
    // }
  }

  module.exports = Pixi3D;