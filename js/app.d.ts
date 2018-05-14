declare class TexturePainter {
    private _canvas;
    private _camera;
    private _controls;
    private _drawingCanvas;
    private _drawingContext;
    private _drawStartPos;
    private _mesh;
    private _eventDispatcher;
    constructor(mesh: THREE.Mesh, canvas: HTMLCanvasElement, camera: THREE.PerspectiveCamera, controls: THREE.OrbitControls, eventDispatcher: THREE.EventDispatcher);
    private setupCanvasDrawing();
    private linearInterpolation(x0, x1, y0, y1, x);
    private draw(x, y);
}
declare const dat: any;
declare class Scene {
    private _canvas;
    private _scene;
    private _camera;
    private _controls;
    private _renderer;
    private _mesh;
    private _eventDispatcher;
    constructor();
    private initLights();
    private initControls();
    private initMeshes();
    private onLoad;
    private initGui();
    private initRenderer();
    private onWindowResize;
    private onContextLost;
    private update;
    private animate;
}
declare class Model {
    constructor();
}
declare class Main {
    static instance: Main;
    static getInstance(): Main;
    private _model;
    private _scene;
    constructor();
    readonly scene: Scene;
    readonly model: Model;
}
