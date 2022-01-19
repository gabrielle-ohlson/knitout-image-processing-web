var Picture = class Picture {
	constructor(width, height, pixels) {
		this.width = width;
		this.height = height;
		this.pixels = pixels;
	}

	static empty(width, height, color) {
		let pixels = new Array(width * height).fill(color);
		return new Picture(width, height, pixels);
	}

	pixel(x, y) {
		return this.pixels[x + y * this.width];
	}

	draw(pixels) {
		let copy = this.pixels.slice();
		for (let {x, y, color} of pixels) {
			copy[x + y * this.width] = color;
		}
		return new Picture(this.width, this.height, copy);
	}
}


function updateState(state, action) {
	return Object.assign({}, state, action);
}


function elt(type, props, ...children) {
	let dom = document.createElement(type);
	if (props) Object.assign(dom, props);
	for (let child of children) {
		if (typeof child != "string") dom.appendChild(child);
		else dom.appendChild(document.createTextNode(child));
	}
	return dom;
}


// var scale = 2;


var PictureCanvas = class PictureCanvas {
	constructor(picture, pointerDown) {
		this.dom = elt("canvas", {
			onmousedown: event => this.mouse(event, pointerDown),
			ontouchstart: event => this.touch(event, pointerDown)
		});

		this.syncState(picture);
	}
	syncState(picture) {
		if (this.picture == picture) return;
		this.picture = picture;
		drawPicture(this.picture, this.dom, scale);
	}
}


function drawPicture(picture, canvas, scale) {
	canvas.width = picture.width * scale;
	canvas.height = picture.height * scale;
	let cx = canvas.getContext("2d");

	for (let y = 0; y < picture.height; y++) {
		for (let x = 0; x < picture.width; x++) {
			cx.fillStyle = picture.pixel(x, y);
			cx.fillRect(x * scale, y * scale, scale, scale);
		}
	}
}


PictureCanvas.prototype.mouse = function(downEvent, onDown) {
	if (downEvent.button != 0) return;
	let pos = pointerPosition(downEvent, this.dom);
	let onMove = onDown(pos);
	if (!onMove) return;
	let move = moveEvent => {
		if (moveEvent.buttons == 0) {
			this.dom.removeEventListener("mousemove", move);
		} else {
			let newPos = pointerPosition(moveEvent, this.dom);
			if (newPos.x == pos.x && newPos.y == pos.y) return;
			pos = newPos;
			onMove(newPos);
		}
	};
	this.dom.addEventListener("mousemove", move);
};


function pointerPosition(pos, domNode) {
	let rect = domNode.getBoundingClientRect();
	return {x: Math.floor((pos.clientX - rect.left) / scale),
					y: Math.floor((pos.clientY - rect.top) / scale)};
}


PictureCanvas.prototype.touch = function(startEvent, onDown) {
	let pos = pointerPosition(startEvent.touches[0], this.dom);
	let onMove = onDown(pos);
	startEvent.preventDefault();
	if (!onMove) return;
	let move = moveEvent => {
		let newPos = pointerPosition(moveEvent.touches[0],
																 this.dom);
		if (newPos.x == pos.x && newPos.y == pos.y) return;
		pos = newPos;
		onMove(newPos);
	};
	let end = () => {
		this.dom.removeEventListener("touchmove", move);
		this.dom.removeEventListener("touchend", end);
	};
	this.dom.addEventListener("touchmove", move);
	this.dom.addEventListener("touchend", end);
};


var PixelEditor = class PixelEditor {
	constructor(state, config) {
		let {tools, controls, dispatch} = config;
		this.state = state;

		// if (state.picture instanceof Blob) state.picture = imageFromDataURL(state.picture);

		this.canvas = new PictureCanvas(state.picture, pos => {
			let tool = tools[this.state.tool];
			let onMove = tool(pos, this.state, dispatch);
			if (onMove) return pos => onMove(pos, this.state);
		});
		this.controls = controls.map(
			Control => new Control(state, config));
		this.dom = elt("div", {}, this.canvas.dom, elt("br"),
									 ...this.controls.reduce(
										 (a, c) => a.concat(" ", c.dom), []));

		if (state.bgPic) imageLoad(state.bgPic, dispatch); //remove //debug
	}
	syncState(state) {
		this.state = state;
		this.canvas.syncState(state.picture);
		for (let ctrl of this.controls) ctrl.syncState(state);
	}
}


var ToolSelect = class ToolSelect {
	constructor(state, {tools, dispatch}) {
		this.select = elt("select", {
			onchange: () => dispatch({tool: this.select.value})
		}, ...Object.keys(tools).map(name => elt("option", {
			selected: name == state.tool
		}, name)));
		this.dom = elt("label", null, "🖌 Tool: ", this.select);
	}
	syncState(state) { this.select.value = state.tool; }
}

var ColorSelect = class ColorSelect {
	constructor(state, {dispatch}) {
		this.input = elt("input", {
			type: "color",
			value: state.color,
			onchange: () => dispatch({color: this.input.value})
		});
		this.dom = elt("label", null, "🎨 Color: ", this.input);
	}
	syncState(state) { this.input.value = state.color; }
}


function draw(pos, state, dispatch) {
	function drawPixel({x, y}, state) {
		let drawn = {x, y, color: state.color};
		dispatch({picture: state.picture.draw([drawn])});
	}
	drawPixel(pos, state);
	return drawPixel;
}


function rectangle(start, state, dispatch) {
	function drawRectangle(pos) {
		let xStart = Math.min(start.x, pos.x);
		let yStart = Math.min(start.y, pos.y);
		let xEnd = Math.max(start.x, pos.x);
		let yEnd = Math.max(start.y, pos.y);
		let drawn = [];
		for (let y = yStart; y <= yEnd; y++) {
			for (let x = xStart; x <= xEnd; x++) {
				drawn.push({x, y, color: state.color});
			}
		}
		dispatch({picture: state.picture.draw(drawn)});
	}
	drawRectangle(start);
	return drawRectangle;
}


var around = [{dx: -1, dy: 0}, {dx: 1, dy: 0},
								{dx: 0, dy: -1}, {dx: 0, dy: 1}];

function fill({x, y}, state, dispatch) {
	let targetColor = state.picture.pixel(x, y);
	let drawn = [{x, y, color: state.color}];
	for (let done = 0; done < drawn.length; done++) {
		for (let {dx, dy} of around) {
			let x = drawn[done].x + dx, y = drawn[done].y + dy;
			if (x >= 0 && x < state.picture.width &&
					y >= 0 && y < state.picture.height &&
					state.picture.pixel(x, y) == targetColor &&
					!drawn.some(p => p.x == x && p.y == y)) {
				drawn.push({x, y, color: state.color});
			}
		}
	}
	dispatch({picture: state.picture.draw(drawn)});
}


function pick(pos, state, dispatch) {
	dispatch({color: state.picture.pixel(pos.x, pos.y)});
}


// function postFile(data) {
// 	var xhr = new XMLHttpRequest();
// 	xhr.open("POST", yourUrl, true);
// 	xhr.setRequestHeader('Content-Type', 'application/json');
// 	xhr.send(JSON.stringify({
// 		value: canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");  // here is the most important part because if you dont replace you will get a DOM 18 exception.
// 	}));


// 	// define data and connections
// 	var blob = new Blob([JSON.stringify(data)]);
// 	var url = URL.createObjectURL(blob);
// 	var xhr = new XMLHttpRequest();
// 	xhr.open('POST', '/download', true);

// 		// define new form
// 	var formData = new FormData();
// 	formData.append('someUploadIdentifier', blob, 'someFileName.json');
		
// 		// action after uploading happens
// 	xhr.onload = function(e) {
// 		console.log("File uploading completed!");
// 	};

// 		// do the uploading
// 	console.log("File uploading started!");
// 	xhr.send(formData);
// }


class SaveButton {
	constructor(state) {
		this.picture = state.picture;
		this.dom = elt("button", {
			onclick: () => this.save()
		}, "💾 Save");
	}
	save() {
		let canvas = elt("canvas");
		drawPicture(this.picture, canvas, 1);

		let cx = canvas.getContext("2d");

		let imageData = cx.getImageData(0, 0, canvas.width, canvas.height);

		console.log(imageData);
		let data = imageData.data;  // ArrayBuffer
		let buffer = new ArrayBuffer(data.length);

		let binary = new Uint8Array(buffer);
		for (let i=0; i<binary.length; ++i) {
			binary[i] = data[i];
		}

		console.log(buffer);
		console.log('!');
		console.log(binary);
		// let save_form = elt("form", {
			// 	href: canvas.toDataURL(),
			// 	download: "pixelart.png"
			// });
		// document.getElementById('my_hidden').value = canvas.toDataURL('image/png');
		// document.forms["form1"].submit();

		// let dataUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"); // here is the most important part because if you dont replace you will get a DOM 18 exception.

		// let buffer = Buffer.from(dataUrl.split(",")[1], 'base64');
		let xhr = new window.XMLHttpRequest();
		// xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
		// let formData = new FormData();
		// formData.append('drawing', data);
		xhr.open('POST', '/download', true);
		// xhr.send(buffer);

		// action after uploading happens
		xhr.onload = function(e) {
			console.log("File uploading completed!");
			// Simulate an HTTP redirect:
			// Simulate a mouse click:
			window.location.href = '/download';
		};


		canvas.toBlob(function(blob) {
			const formData = new FormData();
			formData.append('drawing', blob, 'drawing.png');
		
			// Post via axios or other transport method
			xhr.send(formData);
		});
		// xhr.setRequestHeader('Content-Type', 'application/json');
		// xhr.send(formData);
		// xhr.send({drawing: data});
		
		// let link = elt("a", {
		// 	href: canvas.toDataURL(),
		// 	download: "pixelart.png"
		// });
		// document.body.appendChild(link);
		// link.click();
		// link.remove();
	}
	syncState(state) { this.picture = state.picture; }
}


 class LoadButton {
	constructor(_, {dispatch}) {
		this.dom = elt("button", {
			onclick: () => startLoad(dispatch)
		}, "📁 Load");
	}
	syncState() {}
}


function startLoad(dispatch) {
	let input = elt("input", {
		type: "file",
		onchange: () => finishLoad(input.files[0], dispatch)
	});
	document.body.appendChild(input);
	input.click();
	input.remove();
}


function finishLoad(file, dispatch) {
	if (file == null) return;
	let reader = new FileReader();
	reader.addEventListener("load", () => {
		let image = elt("img", {
			onload: () => dispatch({
				picture: pictureFromImage(image)
			}),
			src: reader.result
		});
	});
	reader.readAsDataURL(file);
}


function imageLoad(img, dispatch) {
	let image = elt("img", {
		onload: () => dispatch({
			picture: pictureFromImage(img)
		}),
		src: img.src
	});
}


function pictureFromImage(image) {
	let width = image.width;
	let height = image.height;
	console.log(width, height); //remove //debug
	// let width = Math.min(100, image.width);
	// let height = Math.min(100, image.height);
	let canvas = elt("canvas", {width, height});
	let cx = canvas.getContext("2d");
	cx.drawImage(image, 0, 0);
	let pixels = [];
	let {data} = cx.getImageData(0, 0, width, height);

	function hex(n) {
		return n.toString(16).padStart(2, "0");
	}
	for (let i = 0; i < data.length; i += 4) {
		let [r, g, b] = data.slice(i, i + 3);
		pixels.push("#" + hex(r) + hex(g) + hex(b));
	}
	return new Picture(width, height, pixels);
}


function historyUpdateState(state, action) {
	if (action.undo == true) {
		if (state.done.length == 0) return state;
		return Object.assign({}, state, {
			picture: state.done[0],
			done: state.done.slice(1),
			doneAt: 0
		});
	} else if (action.picture &&
						 state.doneAt < Date.now() - 1000) {
		return Object.assign({}, state, action, {
			done: [state.picture, ...state.done],
			doneAt: Date.now()
		});
	} else {
		return Object.assign({}, state, action);
	}
}


var UndoButton = class UndoButton {
	constructor(state, {dispatch}) {
		this.dom = elt("button", {
			onclick: () => dispatch({undo: true}),
			disabled: state.done.length == 0
		}, "⮪ Undo");
	}
	syncState(state) {
		this.dom.disabled = state.done.length == 0;
	}
}


var startState = {
	tool: "draw",
	color: "#000000",
	picture: Picture.empty(60, 30, "#f0f0f0"),
	done: [],
	doneAt: 0
};


var baseTools = {draw, fill, rectangle, pick};


var baseControls = [
	ToolSelect, ColorSelect, SaveButton, LoadButton, UndoButton
];


function startPixelEditor({state = startState, tools = baseTools, controls = baseControls}) {
	if (!state.picture) state.picture = Picture.empty(60, 30, "#f0f0f0");

	let app = new PixelEditor(state, {
		tools,
		controls,
		dispatch(action) {
			state = historyUpdateState(state, action);
			app.syncState(state);
		}
	});

	return app.dom;
}