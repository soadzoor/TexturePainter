//import {TexturePainter} from './TexturePainter.ts';

///<reference path='./TexturePainter.ts'/>

declare const dat: any;

class Scene
{
	private _canvas: HTMLCanvasElement;
	private _scene: THREE.Scene;
	private _camera: THREE.PerspectiveCamera;
	private _controls: THREE.OrbitControls;
	private _renderer: THREE.WebGLRenderer;
	private _mesh: THREE.Mesh;
	private _eventDispatcher: THREE.EventDispatcher;

	constructor()
	{
		this._canvas = <HTMLCanvasElement>document.getElementById('myCanvas');
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

	private initLights()
	{
		const light1  = new THREE.AmbientLight(0xFFFFFF, 0.1);

		const light2  = new THREE.DirectionalLight(0xFFFFFF, 0.1);
		light2.position.set(0.5, 0, 0.866); // ~60 deg

		const light3 = new THREE.HemisphereLight(0xffffff, 0x080808, 0.8);

		this._scene.add(light1, light2, light3);
	}

	private initControls()
	{
		this._controls = new THREE.OrbitControls(this._camera, this._canvas);
		this._controls.enablePan = false;
		this._controls.enableZoom = true;
		this._controls.enableDamping = true;
		this._controls.minDistance = this._camera.near*5;
		this._controls.maxDistance = this._camera.far*0.75;

		this._controls.dampingFactor = 0.07;
		this._controls.rotateSpeed = 0.2;
		this._controls.smoothZoom = true;
		this._controls.zoomDampingFactor = this._controls.dampingFactor;
		this._controls.smoothZoomSpeed = 5.0;
	}

	private initMeshes()
	{
		const geometry = new THREE.SphereGeometry(1, 64, 64);
		this._mesh     = new THREE.Mesh(geometry);
		this._scene.add(this._mesh);

		const texturePainter = new TexturePainter(this._mesh, this._canvas, this._camera, this._controls, this._eventDispatcher);

		// const url = 'assets/torus.gltf';
		//
		// THREE.DRACOLoader.setDecoderPath('libs/draco/gltf/');
		// const gltfLoader = new THREE.GLTFLoader();
		// gltfLoader.setDRACOLoader(new THREE.DRACOLoader());
		//
		// gltfLoader.load(url, this.onLoad);
	}

	private onLoad = (gltf) =>
	{
		this._mesh = gltf.scene.children[0];
		this._scene.add(this._mesh);

		const texturePainter = new TexturePainter(this._mesh, this._canvas, this._camera, this._controls, this._eventDispatcher);
	};

	private initGui()
	{
		const settings = {
			Stroke: '#000000',
			LineWidth: 1.0
		};
		const gui = new dat.GUI();
		gui.addColor(settings, 'Stroke').name('Stroke').onChange((value) =>
		{
			this._eventDispatcher.dispatchEvent({type: 'strokeColorChanged', message: value});
		});

		gui.add(settings, 'LineWidth', 1.0, 20.0).step(1).name('LineWidth').onChange((value) =>
		{
			this._eventDispatcher.dispatchEvent({type: 'lineWidthChanged', message: value});
		});
	}

	private initRenderer()
	{
		this._renderer = new THREE.WebGLRenderer({
			antialias: true,
			canvas: this._canvas
		});
		this._renderer.setPixelRatio(window.devicePixelRatio);
		this._renderer.setClearColor(0xECF8FF);
		this._renderer.gammaOutput = true;

		this._renderer.context.canvas.addEventListener('webglcontextlost', this.onContextLost);

		window.addEventListener('resize', this.onWindowResize, false);
	}

	private onWindowResize = () =>
	{
		this._canvas.width = 0;
		this._canvas.height = 0;

		const width = window.innerWidth;
		const height = window.innerHeight;

		this._renderer.setSize(width, height);
		this._camera.aspect = width / height;
		this._camera.updateProjectionMatrix();
	};

	private onContextLost = (event: Event) =>
	{
		event.preventDefault();

		alert('Unfortunately WebGL has crashed. Please reload the page to continue!');
	};

	private update = (time: number) =>
	{
		this._controls.update();
	};

	private animate = (time: number) =>
	{
		this.update(time);

		this._renderer.render(this._scene, this._camera);

		requestAnimationFrame(this.animate);
	};
}