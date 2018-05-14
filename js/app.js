var TexturePainter = /** @class */ (function () {
    function TexturePainter(mesh, canvas, camera, controls, eventDispatcher) {
        this._mesh = mesh;
        this._canvas = canvas;
        this._camera = camera;
        this._controls = controls;
        this._eventDispatcher = eventDispatcher;
        this.setupCanvasDrawing();
    }
    TexturePainter.prototype.setupCanvasDrawing = function () {
        var _this = this;
        // get canvas and context
        this._drawingCanvas = document.createElement('canvas');
        this._drawingCanvas.width = 2048;
        this._drawingCanvas.height = 2048;
        this._drawingContext = this._drawingCanvas.getContext('2d');
        this._drawingContext.strokeStyle = '#000000';
        this._drawingContext.lineWidth = 1;
        this._drawStartPos = new THREE.Vector2();
        // draw white background
        this._drawingContext.fillStyle = "#FFFFFF";
        this._drawingContext.fillRect(0, 0, this._drawingCanvas.width, this._drawingCanvas.height);
        this._eventDispatcher.addEventListener('lineWidthChanged', function (event) {
            _this._drawingContext.beginPath();
            _this._drawingContext.lineWidth = event.message;
        });
        this._eventDispatcher.addEventListener('strokeColorChanged', function (event) {
            _this._drawingContext.beginPath();
            _this._drawingContext.strokeStyle = event.message;
        });
        this._mesh.material = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        // set canvas as material.map (this could be done to any map, bump, displacement etc.)
        this._mesh.material.map = new THREE.Texture(this._drawingCanvas);
        // need to flag the map as needing updating.
        this._mesh.material.map.needsUpdate = true;
        // set the variable to keep track of when to draw
        var paint = false;
        var raycaster = new THREE.Raycaster();
        var mouse = new THREE.Vector2();
        // add canvas event listeners
        this._canvas.addEventListener('mousedown', function (event) {
            mouse.x = (event.pageX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.pageY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, _this._camera);
            var intersect = raycaster.intersectObject(_this._mesh);
            if (intersect.length > 0) {
                paint = true;
                var x = intersect[0].uv.x * _this._drawingCanvas.width;
                var y = (1 - intersect[0].uv.y) * _this._drawingCanvas.height;
                _this._drawStartPos.set(x, y);
            }
        });
        this._canvas.addEventListener('mousemove', function (event) {
            mouse.x = (event.pageX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.pageY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, _this._camera);
            var intersect = raycaster.intersectObject(_this._mesh);
            if (intersect.length > 0) {
                if (paint) {
                    _this._controls.enabled = false;
                    var x = intersect[0].uv.x * _this._drawingCanvas.width;
                    var y = (1 - intersect[0].uv.y) * _this._drawingCanvas.height;
                    _this.draw(x, y);
                }
            }
        });
        this._canvas.addEventListener('mouseup', function () {
            paint = false;
            _this._controls.enabled = true;
        });
        this._canvas.addEventListener('mouseleave', function () {
            paint = false;
            _this._controls.enabled = true;
        });
    };
    TexturePainter.prototype.linearInterpolation = function (x0, x1, y0, y1, x) {
        return (y0 + (x - x0) * (y1 - y0) / (x1 - x0));
    };
    TexturePainter.prototype.draw = function (x, y) {
        this._drawingContext.moveTo(this._drawStartPos.x, this._drawStartPos.y);
        var delta = { x: x - this._drawStartPos.x, y: y - this._drawStartPos.y };
        var conditionHorizontal = Math.abs(delta.x) > this._drawingCanvas.width * 0.2;
        var conditionVertical = Math.abs(delta.y) > this._drawingCanvas.height * 0.2;
        if (conditionHorizontal || conditionVertical) {
            if (conditionHorizontal) {
                var x0 = 0;
                var x1 = 1;
                var y0 = y;
                var y1 = this._drawStartPos.y;
                var leftToRight = this._drawStartPos.x > x;
                var quotient = (this._drawingCanvas.width - this._drawStartPos.x) + x;
                var ratio = leftToRight ? x / quotient : (this._drawingCanvas.width - this._drawStartPos.x) / quotient;
                var averagedY = this.linearInterpolation(x0, x1, y0, y1, ratio);
                this._drawingContext.moveTo(x, y);
                this._drawingContext.lineTo(leftToRight ? 0 : this._drawingCanvas.width, averagedY);
                this._drawingContext.moveTo(leftToRight ? this._drawingCanvas.width : 0, averagedY);
                this._drawingContext.lineTo(this._drawStartPos.x, this._drawStartPos.y);
                this._drawingContext.stroke();
            }
            if (conditionVertical) {
                var x0 = 0;
                var x1 = 1;
                var y0 = x;
                var y1 = this._drawStartPos.x;
                var topToBottom = this._drawStartPos.y > y;
                var quotient = (this._drawingCanvas.height - this._drawStartPos.y) + y;
                var ratio = topToBottom ? y / quotient : (this._drawingCanvas.height - this._drawStartPos.y) / quotient;
                var averagedX = this.linearInterpolation(x0, x1, y0, y1, ratio);
                this._drawingContext.moveTo(x, y);
                this._drawingContext.lineTo(averagedX, topToBottom ? 0 : this._drawingCanvas.height);
                this._drawingContext.moveTo(averagedX, topToBottom ? this._drawingCanvas.height : 0);
                this._drawingContext.lineTo(this._drawStartPos.x, this._drawStartPos.y);
                this._drawingContext.stroke();
            }
        }
        else {
            this._drawingContext.lineTo(x, y);
            this._drawingContext.stroke();
        }
        this._drawStartPos.set(x, y);
        this._mesh.material.map.needsUpdate = true;
    };
    return TexturePainter;
}());
//import {TexturePainter} from './TexturePainter.ts';
///<reference path='./TexturePainter.ts'/>
var Scene = /** @class */ (function () {
    function Scene() {
        var _this = this;
        this.onLoad = function (gltf) {
            _this._mesh = gltf.scene.children[0];
            _this._scene.add(_this._mesh);
            var texturePainter = new TexturePainter(_this._mesh, _this._canvas, _this._camera, _this._controls, _this._eventDispatcher);
        };
        this.onWindowResize = function () {
            _this._canvas.width = 0;
            _this._canvas.height = 0;
            var width = window.innerWidth;
            var height = window.innerHeight;
            _this._renderer.setSize(width, height);
            _this._camera.aspect = width / height;
            _this._camera.updateProjectionMatrix();
        };
        this.onContextLost = function (event) {
            event.preventDefault();
            alert('Unfortunately WebGL has crashed. Please reload the page to continue!');
        };
        this.update = function (time) {
            _this._controls.update();
        };
        this.animate = function (time) {
            _this.update(time);
            _this._renderer.render(_this._scene, _this._camera);
            requestAnimationFrame(_this.animate);
        };
        this._canvas = document.getElementById('myCanvas');
        this._scene = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.05, 70);
        this._camera.position.set(0, 0, 5);
        this._camera.lookAt(new THREE.Vector3(0, 0, 0));
        this._eventDispatcher = new THREE.EventDispatcher();
        this.initGui();
        this.initLights();
        this.initControls();
        this.initRenderer();
        this.initMeshes();
        this.onWindowResize();
        this.animate(0);
    }
    Scene.prototype.initLights = function () {
        var light1 = new THREE.AmbientLight(0xFFFFFF, 0.1);
        var light2 = new THREE.DirectionalLight(0xFFFFFF, 0.1);
        light2.position.set(0.5, 0, 0.866); // ~60 deg
        var light3 = new THREE.HemisphereLight(0xffffff, 0x080808, 0.8);
        this._scene.add(light1, light2, light3);
    };
    Scene.prototype.initControls = function () {
        this._controls = new THREE.OrbitControls(this._camera, this._canvas);
        this._controls.enablePan = false;
        this._controls.enableZoom = true;
        this._controls.enableDamping = true;
        this._controls.minDistance = this._camera.near * 5;
        this._controls.maxDistance = this._camera.far * 0.75;
        this._controls.dampingFactor = 0.07;
        this._controls.rotateSpeed = 0.2;
        this._controls.smoothZoom = true;
        this._controls.zoomDampingFactor = this._controls.dampingFactor;
        this._controls.smoothZoomSpeed = 5.0;
    };
    Scene.prototype.initMeshes = function () {
        var geometry = new THREE.SphereGeometry(1, 64, 64);
        this._mesh = new THREE.Mesh(geometry);
        this._scene.add(this._mesh);
        var texturePainter = new TexturePainter(this._mesh, this._canvas, this._camera, this._controls, this._eventDispatcher);
        // const url = 'assets/torus.gltf';
        //
        // THREE.DRACOLoader.setDecoderPath('libs/draco/gltf/');
        // const gltfLoader = new THREE.GLTFLoader();
        // gltfLoader.setDRACOLoader(new THREE.DRACOLoader());
        //
        // gltfLoader.load(url, this.onLoad);
    };
    Scene.prototype.initGui = function () {
        var _this = this;
        var settings = {
            Stroke: '#000000',
            LineWidth: 1.0
        };
        var gui = new dat.GUI();
        gui.addColor(settings, 'Stroke').name('Stroke').onChange(function (value) {
            _this._eventDispatcher.dispatchEvent({ type: 'strokeColorChanged', message: value });
        });
        gui.add(settings, 'LineWidth', 1.0, 20.0).step(1).name('LineWidth').onChange(function (value) {
            _this._eventDispatcher.dispatchEvent({ type: 'lineWidthChanged', message: value });
        });
    };
    Scene.prototype.initRenderer = function () {
        this._renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: this._canvas
        });
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.setClearColor(0xECF8FF);
        this._renderer.gammaOutput = true;
        this._renderer.context.canvas.addEventListener('webglcontextlost', this.onContextLost);
        window.addEventListener('resize', this.onWindowResize, false);
    };
    return Scene;
}());
var Model = /** @class */ (function () {
    function Model() {
    }
    return Model;
}());
// import {Scene} from './view/Scene.ts';
// import {Model} from './model/Model.ts';
///<reference path='./view/Scene.ts'/>
///<reference path='./model/Model.ts'/>
var Main = /** @class */ (function () {
    function Main() {
        Main.instance = this;
        this._model = new Model();
        this._scene = new Scene();
    }
    Main.getInstance = function () {
        return Main.instance || new Main();
    };
    Object.defineProperty(Main.prototype, "scene", {
        get: function () {
            return this._scene;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Main.prototype, "model", {
        get: function () {
            return this._model;
        },
        enumerable: true,
        configurable: true
    });
    return Main;
}());
//# sourceMappingURL=app.js.map