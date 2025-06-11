const {
    Application,
    Assets,
    Sprite,
    Texture,
    Renderer,
    Container,
    Graphics,
    WRAP_MODES
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
    glTFAsset,
  } = require("pixi3d/pixi7");

  class Pixi3D {
    constructor(gl) {
        this.gl = gl;
        this.applicationCreated = false;
    }

    

    async createApplication() {
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
        directionalLight.rotationQuaternion.setEulerAngles(75, 0, 0);
        LightingEnvironment.main.lights.push(directionalLight);

        this.shadowCastingLight = new ShadowCastingLight(
            this.pixiApp.renderer,
            directionalLight,
            { shadowTextureSize: 1024, quality: ShadowQuality.medium },
        );
        this.shadowCastingLight.softness = 2;
        this.shadowCastingLight.shadowArea = 15;
        //ImageBasedLighting.fromHDR("https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/assets/environment/environmentSpecular.env");


        this.pipeline = this.pixiApp.renderer.plugins.pipeline;

        this.applicationCreated = true;

        const plane = Mesh3D.createPlane();

        // Set its size (width and height)
        plane.scale.set(10, 1, 10); // wide and flat

        // Move it down so your model is above it
        //plane.y = 1; // Just below model (avoid Z-fighting)

        // Optional: make it a neutral gray material
        // plane.material = new StandardMaterial();
        // plane.material.baseColor = new Color(0.4, 0.4, 0.4); // light gray
        const material = new StandardMaterial();
        const texture = await Assets.load("./static/assets/10008.jpg");
        
        
        texture.baseTexture.wrapMode = WRAP_MODES.REPEAT;
        material.baseColorTexture = texture;

        material.doubleSided = true;
        material.roughness = 1.0;
        material.metallic = 0.0;
        material.emissiveColor = new Color(0.2, 0.2, 0.2);
        
        // ✅ Optional: tile the texture more clearly

        plane.material = material;

        const quad1 = Quaternion.fromEuler(20, 0, 0);
        const quad2 = Quaternion.fromEuler(0, 90, 0);
        // Then rotate around the y-axis
        const permanentQuad = this.multiplyQuaternions(quad1, quad2);
        // Now rotate to bird's eye view
        const birdEye = Quaternion.fromEuler(0, 0, -90);
        const finalQuat = this.multiplyQuaternions(permanentQuad, birdEye);
        plane.rotationQuaternion = finalQuat;

        plane.position.set(0, 0, 0);
        plane.material.roughness = 1.0; // matte surface
        plane.material.metallic = 0.0;
        
        this.pixiApp.stage.addChild(plane);
        this.pipeline.enableShadows(plane, this.shadowCastingLight);

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

    multiplyQuaternions(q1, q2) {
        const result = {
            x: q1.w * q2.x + q1.x * q2.w + q1.y * q2.z - q1.z * q2.y,
            y: q1.w * q2.y + q1.y * q2.w + q1.z * q2.x - q1.x * q2.z,
            z: q1.w * q2.z + q1.z * q2.w + q1.x * q2.y - q1.y * q2.x,
            w: q1.w * q2.w - q1.x * q2.x - q1.y * q2.y - q1.z * q2.z,
        };
        const res = new Quaternion(result.x, result.y, result.z, result.w);
        return res;
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

    async loadGLBModel(arrayBuffer) {
        const dataView = new DataView(arrayBuffer);
      
        const magic = dataView.getUint32(0, true);
        if (magic !== 0x46546C67) throw new Error("Not a valid GLB file");
      
        const version = dataView.getUint32(4, true);
        if (version !== 2) throw new Error("Unsupported GLB version");
      
        const totalLength = dataView.getUint32(8, true);
      
        // --- First chunk: JSON ---
        const jsonChunkLength = dataView.getUint32(12, true);
        const jsonChunkType = dataView.getUint32(16, true);
        if (jsonChunkType !== 0x4E4F534A) throw new Error("Expected JSON chunk");
      
        const jsonText = new TextDecoder().decode(
          new Uint8Array(arrayBuffer, 20, jsonChunkLength)
        );
        const descriptor = JSON.parse(jsonText);
      
        // --- Second chunk: BIN ---
        const binChunkHeader = 20 + jsonChunkLength;
        const binChunkLength = dataView.getUint32(binChunkHeader, true);
        const binChunkType = dataView.getUint32(binChunkHeader + 4, true);
        if (binChunkType !== 0x004E4942) throw new Error("Expected BIN chunk");
      
        const binChunkOffset = binChunkHeader + 8;
        const binBuffer = arrayBuffer.slice(binChunkOffset, binChunkOffset + binChunkLength);
      
        // --- Images ---
        const images = [];
        if (descriptor.images && descriptor.bufferViews) {
          for (const image of descriptor.images) {
            const view = descriptor.bufferViews[image.bufferView];
            const mimeType = image.mimeType || "image/png";
      
            const byteOffset = view.byteOffset || 0;
            const byteLength = view.byteLength;
            if (byteOffset + byteLength > binBuffer.byteLength) {
              console.warn("Image buffer view out of bounds:", image);
              images.push(undefined);
              continue;
            }
      
            const imageData = new Uint8Array(binBuffer, byteOffset, byteLength);
            const blob = new Blob([imageData], { type: mimeType });
      
            try {
              const bitmap = await createImageBitmap(blob);
              const texture = Texture.from(bitmap);
              images.push(texture);
            } catch (e) {
              console.error("Image decode failed", e);
              images.push(undefined); // Keep index alignment
            }
          }
        }
      
        const asset = new glTFAsset(descriptor, [binBuffer], images);
        const model = Model.from(asset);
        return model;
      }

      setXY(model, x, y) {
        console.log("model", model);
        console.log("model position", model.position)
        model.position.set(x*0.01, y*0.01, model.position.z);
        console.log("model position", model.position)
      }
      
      

    async importGltf(url, position, scale) {
        const model = await this.loadGLBModel(url);
        // Set position
        model.position.set(position[0], position[1], position[2]);
        
        // Set scale (uniform scaling for simplicity)
        model.scale.set(scale, scale, scale);

        const quad1 = Quaternion.fromEuler(20, 0, 0);
        const quad2 = Quaternion.fromEuler(0, 90, 0);
        // Then rotate around the y-axis
        const permanentQuad = this.multiplyQuaternions(quad1, quad2);
        // Now rotate to bird's eye view
        const birdEye = Quaternion.fromEuler(0, 0, -90);
        const finalQuat = this.multiplyQuaternions(permanentQuad, birdEye);
        model.rotationQuaternion = finalQuat;
        model.position.set(0, 0, 0);
        model.scale.set(0.5, 0.5);
        
        // Optionally set rotation if needed
        // model.rotationQuaternion = Quaternion.fromEuler(0, 0, 0);

        // Add model to the scene
        this.pixiApp.stage.addChild(model);
        
        console.log(this.pixiApp);
        const camera = new Camera(this.pixiApp.renderer);
        // camera.position.set(0, -10, 0); // 10 units above the origin
        // camera.rotationQuaternion.setEulerAngles(-90, 0, 0); // Look straight down

        // 2. Set it as the main camera
        Camera.main = camera;

        // 3. Add it to the stage
        this.pixiApp.stage.addChild(camera);

        // 4. OPTIONAL: Disable orbit control (if it's interfering)
        if (CameraOrbitControl.main) {
          CameraOrbitControl.main.enabled = false;
        }

        // const orbit = new CameraOrbitControl(camera);
        // orbit.enabled = false;

        let angle = 0;
        const radius = 10;   // distance from model
        const height = -5;    // camera height above model
        
        this.pixiApp.ticker.add(() => {
          //angle += 0.01; // adjust speed here
          console.log(angle);
        
          // set camera position in a circle around model
          camera.position.set(
            model.position.x + 0,
            model.position.y,
            model.position.z - radius * Math.cos(angle)
          );
        
          // rotate camera to look at model
          const dx = model.position.x - camera.position.x;
          const dy = model.position.y - camera.position.y;
          const dz = model.position.z - camera.position.z;
        
          // Calculate yaw (rotation around Y axis)
          const yaw = Math.atan2(dx, dz);
        
          // Set camera rotationQuaternion to face the model
          camera.rotationQuaternion.setEulerAngles(0, -yaw , 0);
          console.log(this.pixiApp);
          console.log("Camera pos", camera.position.array);
          console.log("Model pos", model.position.array);
        // console.log("Camera rot", camera.rotationQuaternion.array);
        // console.log("Model rot", model.rotationQuaternion.array);
        });

        //CameraOrbitControl.main.enabled = true;
        // CameraOrbitControl.main.enabled = false;

        // this.pixiApp.ticker.addOnce(() => {
        //   const camera = new Camera();
        //   camera.position.set(0, 10, 0);
        //   camera.rotationQuaternion.setEulerAngles(-90, 0, 0);
        //   this.pixiApp.stage.addChild(camera);
        //   this.pixiApp.stage.camera = camera;
        // });

        // OPTIONAL: Follow the model if it moves
        // this.pixiApp.ticker.add(() => {
        //   console.log(this.pixiApp);
        //   camera.position.set(model.position.x, model.position.y + 10, model.position.z);
        // });

        console.log("Camera pos", camera.position.array);
        console.log("Model pos", model.position.array);
        console.log("Camera rot", camera.rotationQuaternion.array);
        console.log("Model rot", model.rotationQuaternion.array);
        

        // Enable shadows for the model
        this.pipeline.enableShadows(model, this.shadowCastingLight);
        return model;
    }

  }

  // EVENT_TARGET_VISUAL_CHANGE
  // setXY - x/y change
  // setDirection - this.direction
  // setVisible - this.visible
  // setSize - this.size
  // setEffect - ?
  // setCostume - this.getCostumes()[this.currentCostume];
  // setRotationStyle - this.rotationStyle
  // EVENT_TARGET_MOVED
  // setXY - this.x/this.y


  module.exports = Pixi3D;