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
    glTFAsset,
  } = require("pixi3d/pixi7");

  class Pixi3D {
    constructor(gl) {
        this.gl = gl;
        this.applicationCreated = false;
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

        this.applicationCreated = true;
        

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

      getHeadingFromQuaternion(q) {
        // Extract yaw (rotation around Y axis) from quaternion
        const ysqr = q.y * q.y;
        const t3 = 2.0 * (q.w * q.y + q.z * q.x);
        const t4 = 1.0 - 2.0 * (ysqr + q.z * q.z);
        return Math.atan2(t3, t4); // returns radians
      }
      
      animateArc(angleDeg, radius, speed = 0.5) {
        const model = this.doodlebot;
        const start = performance.now();
      
        const startX = model.position.x;
        const startY = model.position.y;
      
        const arcLength = Math.abs(angleDeg) * Math.PI / 180 * radius;
        const durationMs = arcLength / speed * 1000;
      
        const isCCW = angleDeg > 0 ? 1 : -1;
      
        function easeInOutQuad(t) {
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        }
      
        let lastAngleDeg = 0;
        let initialHeading = null;
        let centerX, centerY;
      
        const update = (now) => {
          const elapsed = now - start;
          const tRaw = Math.min(elapsed / durationMs, 1);
          const t = easeInOutQuad(tRaw);
          const currentAngleDeg = t * angleDeg;
          const rad = currentAngleDeg * Math.PI / 180;
      
          // Compute heading + arc center once on first frame
          if (initialHeading === null) {
            initialHeading = -1*this.getHeadingFromQuaternion(model.rotationQuaternion);
            centerX = startX + Math.sin(initialHeading) * radius * isCCW;
            centerY = startY - Math.cos(initialHeading) * radius * isCCW;
          }
      
          const x = centerX - Math.sin(initialHeading + isCCW * rad) * radius;
          const y = centerY + Math.cos(initialHeading + isCCW * rad) * radius;
          model.position.set(x, y, model.position.z);

      
          const deltaAngleDeg = currentAngleDeg - lastAngleDeg;
          const q = Quaternion.fromEuler(0, 0, deltaAngleDeg);
          model.rotationQuaternion = this.multiplyQuaternions(q, model.rotationQuaternion);
      
          lastAngleDeg = currentAngleDeg;
      
          if (tRaw < 1) {
            requestAnimationFrame(update);
          }
        };
      
        requestAnimationFrame(update);
      }


      animateStraight(distance, speed = 0.5) {
        const model = this.doodlebot;
        const start = performance.now();
      
        const startX = model.position.x;
        const startY = model.position.y;
      
        const durationMs = Math.abs(distance) / speed * 1000;
      
        // Get the robot’s current heading **in radians**
        const heading = -1 * this.getHeadingFromQuaternion(model.rotationQuaternion);
      
        // Direction: 1 = forward, -1 = backward
        const direction = distance > 0 ? 1 : -1;
      
        const easeInOutQuad = (t) => {
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        };
      
        const update = (now) => {
          const elapsed = now - start;
          const tRaw = Math.min(elapsed / durationMs, 1);
          const t = easeInOutQuad(tRaw);
      
          const travel = t * Math.abs(distance) * direction;
      
          const x = startX + Math.sin(heading) * travel;
          const y = startY - Math.cos(heading) * travel;
      
          model.position.set(x, y, model.position.z);
      
          if (tRaw < 1) {
            requestAnimationFrame(update);
          }
        };
      
        requestAnimationFrame(update);
      }

      spin(angleDeg, speed = 90) {
        const model = this.doodlebot;
        const start = performance.now();
      
        // `speed` here is degrees per second
        const durationMs = Math.abs(angleDeg) / speed * 1000;
      
        let lastAngleDeg = 0;
      
        const easeInOutQuad = (t) => {
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        };
      
        const update = (now) => {
          const elapsed = now - start;
          const tRaw = Math.min(elapsed / durationMs, 1);
          const t = easeInOutQuad(tRaw);
      
          const currentAngleDeg = t * angleDeg;
      
          const deltaAngleDeg = currentAngleDeg - lastAngleDeg;
          const deltaRad = deltaAngleDeg * Math.PI / 180;
      
          // Rotate around Y-axis for heading change!
          const q = Quaternion.fromEuler(0, -deltaRad, 0);
          model.rotationQuaternion = this.multiplyQuaternions(q, model.rotationQuaternion);
      
          lastAngleDeg = currentAngleDeg;
      
          if (tRaw < 1) {
            requestAnimationFrame(update);
          }
        };
      
        requestAnimationFrame(update);
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
        model.rotationQuaternion = permanentQuad;
        model.position.set(0, 0, 0);
        
        // Optionally set rotation if needed
        // model.rotationQuaternion = Quaternion.fromEuler(0, 0, 0);

        // Add model to the scene
        this.pixiApp.stage.addChild(model);

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