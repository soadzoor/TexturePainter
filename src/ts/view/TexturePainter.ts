class TexturePainter
{
	private _canvas: HTMLCanvasElement;
	private _camera: THREE.PerspectiveCamera;
	private _controls: THREE.OrbitControls;
	private _drawingCanvas: HTMLCanvasElement;
	private _drawingContext: CanvasRenderingContext2D;
	private _drawStartPos: THREE.Vector2;
	private _mesh: THREE.Mesh;
	private _eventDispatcher: THREE.EventDispatcher;

	constructor(mesh: THREE.Mesh, canvas: HTMLCanvasElement, camera: THREE.PerspectiveCamera, controls: THREE.OrbitControls, eventDispatcher: THREE.EventDispatcher)
	{
		this._mesh = mesh;
		this._canvas = canvas;
		this._camera = camera;
		this._controls = controls;
		this._eventDispatcher = eventDispatcher;
		this.setupCanvasDrawing();
	}

	private setupCanvasDrawing()
	{
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


		this._eventDispatcher.addEventListener('lineWidthChanged', (event: any) =>
		{
			this._drawingContext.beginPath();
			this._drawingContext.lineWidth = event.message;
		});

		this._eventDispatcher.addEventListener('strokeColorChanged', (event: any) =>
		{
			this._drawingContext.beginPath();
			this._drawingContext.strokeStyle = event.message;
		});


		this._mesh.material = new THREE.MeshStandardMaterial({color: 0xFFFFFF});

		// set canvas as material.map (this could be done to any map, bump, displacement etc.)
		(<any>this._mesh).material.map = new THREE.Texture(this._drawingCanvas);
		// need to flag the map as needing updating.
		(<any>this._mesh).material.map.needsUpdate = true;

		// set the variable to keep track of when to draw
		let paint = false;

		const raycaster = new THREE.Raycaster();
		const mouse = new THREE.Vector2();


		// add canvas event listeners
		this._canvas.addEventListener('mousedown', (event: MouseEvent) =>
		{
			mouse.x = (event.pageX / window.innerWidth) * 2 - 1;
			mouse.y = - (event.pageY / window.innerHeight) * 2 + 1;

			raycaster.setFromCamera(mouse, this._camera);

			const intersect = raycaster.intersectObject(this._mesh);
			if (intersect.length > 0)
			{
				paint = true;
				const x = (<any>intersect[0]).uv.x * this._drawingCanvas.width;
				const y = (1 - (<any>intersect[0]).uv.y) * this._drawingCanvas.height;
				this._drawStartPos.set(x, y);
			}
		} );

		this._canvas.addEventListener('mousemove', (event: MouseEvent) =>
		{
			mouse.x = (event.pageX / window.innerWidth) * 2 - 1;
			mouse.y = - (event.pageY / window.innerHeight) * 2 + 1;

			raycaster.setFromCamera( mouse, this._camera );

			const intersect = raycaster.intersectObject(this._mesh);
			if (intersect.length > 0)
			{
				if (paint)
				{
					this._controls.enabled = false;

					const x = (<any>intersect[0]).uv.x * this._drawingCanvas.width;
					const y = (1 - (<any>intersect[0]).uv.y) * this._drawingCanvas.height;
					this.draw(x, y);
				}
			}
		});

		this._canvas.addEventListener('mouseup', () =>
		{
			paint = false;
			this._controls.enabled = true;
		} );

		this._canvas.addEventListener('mouseleave', () =>
		{
			paint = false;
			this._controls.enabled = true;
		} );
	}

	private linearInterpolation(x0: number, x1: number, y0: number, y1: number, x: number): number
	{
		return (y0 + (x - x0)*(y1 - y0)/(x1 - x0));
	}

	private draw(x: number, y: number)
	{
		this._drawingContext.moveTo(this._drawStartPos.x, this._drawStartPos.y);

		const delta = {x: x - this._drawStartPos.x, y: y - this._drawStartPos.y};
		const conditionHorizontal = Math.abs(delta.x) > this._drawingCanvas.width*0.2;
		const conditionVertical = Math.abs(delta.y) > this._drawingCanvas.height*0.2;
		if (conditionHorizontal || conditionVertical)
		{
			if (conditionHorizontal)
			{
				const x0 = 0;
				const x1 = 1;
				const y0 = y;
				const y1 = this._drawStartPos.y;

				const leftToRight = this._drawStartPos.x > x;

				const quotient = (this._drawingCanvas.width - this._drawStartPos.x) + x;
				const ratio = leftToRight ? x / quotient : (this._drawingCanvas.width - this._drawStartPos.x) / quotient;
				const averagedY = this.linearInterpolation(x0, x1, y0, y1, ratio);

				this._drawingContext.moveTo(x, y);
				this._drawingContext.lineTo(leftToRight ? 0 : this._drawingCanvas.width, averagedY);
				this._drawingContext.moveTo(leftToRight ? this._drawingCanvas.width: 0, averagedY);
				this._drawingContext.lineTo(this._drawStartPos.x, this._drawStartPos.y);
				this._drawingContext.stroke();
			}
			if (conditionVertical)
			{
				const x0 = 0;
				const x1 = 1;
				const y0 = x;
				const y1 = this._drawStartPos.x;

				const topToBottom = this._drawStartPos.y > y;

				const quotient = (this._drawingCanvas.height - this._drawStartPos.y) + y;
				const ratio = topToBottom ? y / quotient : (this._drawingCanvas.height - this._drawStartPos.y) / quotient;
				const averagedX = this.linearInterpolation(x0, x1, y0, y1, ratio);

				this._drawingContext.moveTo(x, y);
				this._drawingContext.lineTo(averagedX, topToBottom ? 0 : this._drawingCanvas.height);
				this._drawingContext.moveTo(averagedX, topToBottom ? this._drawingCanvas.height: 0);
				this._drawingContext.lineTo(this._drawStartPos.x, this._drawStartPos.y);
				this._drawingContext.stroke();
			}
		}
		else
		{
			this._drawingContext.lineTo(x, y);
			this._drawingContext.stroke();
		}

		this._drawStartPos.set(x, y);

		(<THREE.MeshStandardMaterial>this._mesh.material).map.needsUpdate = true;
	}
}