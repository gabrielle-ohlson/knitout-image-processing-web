const express = require('express');
const fileUpload = require('express-fileupload');

const path = require('path');
const PORT = process.env.PORT || 5000;

// const knitify = require('./public/src/knitify/knitify'); //new

// const fs = require('fs');

const app = express();

app.use(fileUpload());

// app.use(express.static(path.join(__dirname, 'public')), function(req, res) {
// 	res.render();
// });
// app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: false }));

// // parse application/json
// app.use(bodyParser.json())

app.use(express.static(path.join(__dirname, 'public')));


const knitify = require('./public/src/knitify/knitify'); //new

const shapeify = require('./public/src/shapeify/shapeify'); //new

const shape = require('./public/src/shapeify/shape');


// let motif_path = '/images/out-colorwork-images/knit_motif.png';

const chalk = require('./public/src/utils/chalk');

const webify = require('./public/src/utils/webify');


app.locals.shape_knitout = undefined;
app.locals.logMessages = [];

app.use(function(req, res, next) {
	// app.locals.picPath = '/images/out-shape-images/shape_code.png';
	// app.locals.motifPath = '/images/out-colorwork-images/knit_motif.png';
	

	res.locals.knitify = knitify;
	// res.locals.picPath = '';
	// res.locals.motif = motif_path;
	next();
})


app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'ejs');

// let logMessages = [];

// const {logger} = require('./public/src/utils/webify');
// app.use('/download', logger);

let colorwork_knitout, shape_knitout; //new location

let shape_img, shape_info;

let colorwork_img, needle_count, row_count, machine = 'kniterate', max_colors = 4, dithering = false, palette_opt, stitch_number, speed_number, caston_carrier, wasteSettings, back_style = 'Secure', rib_info, st_pat_img, stitchPatterns = [];

let inc_method = 'xfer', xfer_speed_number = 300;

class StitchPattern {
	constructor(name, rgb, carrier, options) {
		this.name = name;
		this.color = rgb;
		this.carrier = carrier;
		this.options = options;
	}
	// constructor(name, hex, carrier, options) {
	// 	this.name = name;
	// 	this.color = hex;
	// 	this.carrier = carrier;
	// 	this.options = options;
	// }
}


			/*
			Colorwork Image:
			- colorwork_img,
			- back_style,
			- needle_count,
			- row_count,
			- max_colors,
			- dithering,
			- palette_opt

			Extensions & Specs:
			- machine,
			- stitch_number,
			- speed_number,
			- caston_carrier
			- wasteSettings

			Rib:
			- rib_info

			Stitch Patterns:
			- st_pat_img
			- stitchPatterns

			*/

app.post('/download', function(req, res, next) {
	console.log('post to download...'); //debug
	// let sampleFile;
  // let uploadPath;

  // if ((!req.files && !req.body) || (Object.keys(req.files).length === 0 && Object.keys(req.body).length === 0)) {
	// 	return res.status(400).send(`${Object.keys(req.body)}`); //  ${Object.keys(req.query)}
  //   // return res.status(400).send('No files were uploaded.');
  // }
	function processShape(img) {
		// if (img) {
		const promise = new Promise((resolve) => {
			if (img) {
				shapeify.process(img, true, needle_count, row_count)
				.then((result) => {
					// let shape_info = result;
					resolve(result);
					return result;
				});
			} else resolve();
		});
		return promise;
		// } else return;
	}


	if (req.app.locals.colorwork_knitout) { //already processed knitout, but alteration was made to shape (or need to process shape now)
		if (req.files && 'drawing' in req.files) {
			shape_img = req.files.drawing.data;

			processShape(shape_img)
				.then((result) => {
					shape_info = result;
				});
		}

		let in_file = colorwork_knitout
			.toString()
			.split(';r');

		let shape_code = shape_info[0],
			shape_code_reverse = shape_info[1],
			shortrow_code = shape_info[2],
			short_row_section = shape_info[3],
			first_short_row = shape_info[4],
			last_short_row = shape_info[5],
			section_count = shape_info[6],
			shape_error = shape_info[7],
			shape_err_row = shape_info[8];


		function getShapeKnitout() {
			return new Promise((resolve) => {
				let k = shape.generateKnitout(in_file, shape_code, shape_code_reverse, shortrow_code, short_row_section, first_short_row, last_short_row, section_count, shape_error, shape_err_row, inc_method, xfer_speed_number, webify.console, chalk);

				resolve(k);
				// return k;
			});
			// let k = await knitify.process(colorwork_img, needle_count, row_count, machine, max_colors, dithering, palette_opt, stitch_number, speed_number, caston_carrier, wasteSettings, back_style, rib_info, st_pat_img, stitchPatterns)
			
		}

		// shape_knitout = shape.generateKnitout(in_file, shape_code, shape_code_reverse, shortrow_code, short_row_section, first_short_row, last_short_row, section_count, shape_error, shape_err_row, inc_method, xfer_speed_number, webify.console, chalk);

		getShapeKnitout()
			.then((result) => {
				shape_knitout = result;
				
				app.locals.shape_knitout = shape_knitout;

				// return res.redirect('/download');
				// next();
				// return next();
				// return res.render('pages/download');
			}).then(() => {
				return next();
			})

		// res.app.locals.shape_knitout = shape_knitout;

		// return next();

		// res.render('pages/download', {colorwork_knitout:colorwork_knitout, shape_knitout:shape_knitout, logMessages:logMessages});
		
		// return res.render('pages/download');

		// return res.render('pages/download', {colorwork_knitout:colorwork_knitout, shape_knitout:shape_knitout, logMessages:logMessages});
	} else {
		console.log('initial processing of input imgs...'); //remove //debug
		if (req.files) {
			// console.log(req.files, req.files.colFile); //remove //debug
			if ('colFile' in req.files) colorwork_img = req.files.colFile.data;
			
			if ('stFile' in req.files) {
				st_pat_img = req.files.stFile.data;
				// let stFile = req.files.stFile;
				// st_pat_img = `./public/images/${stFile.name}`;
				// stFile.mv(st_pat_img, function(err) {
				// 	if (err) return res.status(500).send(err);
				// });
			}

			if ('shapeFile' in req.files) shape_img = req.files.shapeFile.data;
		}

		if (req.body) {
			Object.keys(req.body).forEach(key => {
				if (req.body[key] === '') {
					delete req.body[key];
				}
			});

			if ('BackStyle' in req.body) back_style = req.body.BackStyle;
			if ('NeedleCount' in req.body) needle_count = req.body.NeedleCount;
			if ('RowCount' in req.body) row_count = req.body.RowCount;
			if ('MaxColors' in req.body) max_colors = req.body.MaxColors;
			if ('Dithering' in req.body) dithering = req.body.Dithering;
			if ('Palette' in req.body) palette_opt = req.body.Palette;

			if ('Machine' in req.body) machine = req.body.Machine.toLowerCase();
			if ('StitchNumber' in req.body) stitch_number = req.body.StitchNumber;
			if ('SpeedNumber' in req.body) speed_number = req.body.SpeedNumber;
			if ('CastonCarrier' in req.body) caston_carrier = req.body.CastonCarrier;

			if ('IncMethod' in req.body) inc_method = req.body.IncMethod;
			if ('XferSpeed' in req.body) xfer_speed_number = req.body.XferSpeed;


			// if ('WasteSettings' in req.body) wasteSettings = req.body.WasteSettings; //TODO: make sure this stays as an object

			let rib_top = req.body.RibTop,
				rib_bottom = req.body.RibBot;

			if (rib_top || rib_bottom) {
				rib_info = {
					'rib_top': (rib_top === '' ? null : rib_top),
					'ribT_rows': req.body.RibTRows,
					'rib_bottom': (rib_bottom === '' ? null : rib_bottom),
					'ribB_rows': req.body.RibBRows
				}
			}

			if (st_pat_img) {
				// let stitchNames = Object.keys(req.body).filter(el => el.includes('StitchPatternName'));
				let stitchNames = Object.keys(req.body).filter(el => el.includes('stitch-pattern-name'));
				let stitchMapCols = Object.keys(req.body).filter(el => el.includes('mapped-color'));
				let stitchCarriers = Object.keys(req.body).filter(el => el.includes('carrier'));

				let stitchOptions = JSON.parse(req.body.stitchOptions);

				console.log(stitchMapCols); //remove //debug

				for (let s = 0; s < stitchNames.length; ++s) {
					console.log((req.body[stitchMapCols[s]])); //remove //debug
					let options = {};
					if (`${s+1}` in stitchOptions) options = stitchOptions[`${s+1}`]; //new //*
					stitchPatterns.push(new StitchPattern(req.body[stitchNames[s]], JSON.parse(req.body[stitchMapCols[s]]), req.body[stitchCarriers[s]], options));
				}
			}
		}

		// let knitout = colorwork.process(colorwork_img, needle_count, row_count, machine, max_colors, dithering, palette_opt, stitch_number, speed_number, caston_carrier, wasteSettings, back_style, rib_info, st_pat_img, stitchPatterns);
		// let colorwork_knitout, shape_knitout;

		async function getKnitout() {
			let k = await knitify.process(colorwork_img, needle_count, row_count, machine, max_colors, dithering, palette_opt, stitch_number, speed_number, caston_carrier, wasteSettings, back_style, rib_info, st_pat_img, stitchPatterns)
			.then((result) => {
				colorwork_knitout = result[0];
				needle_count = result[1];
				row_count = result[2];
			});
		}


		// function processShape() {
		// 	if (shape_img) {
		// 		const promise = new Promise((resolve) => {
		// 			shapeify.process(shape_img, true, needle_count, row_count)
		// 			.then((result) => {
		// 				let shape_info = result;
		// 				resolve(shape_info);
		// 				return shape_info;
		// 			});
		// 		});
		// 		return promise;
		// 	} else return;
		// }

		// async function processShape() {
		// 	if (shape_img) { // function process(img_path, crop_img, needle_count, row_count) { //crop_img is bool
		// 		// let k = await shapeify.process(colorwork_knitout, shape_img, needle_count, row_count, inc_method, xfer_speed_number)
		// 		let k = await shapeify.process(shape_img, true, needle_count, row_count)
		// 		.then((result) => {
		// 			let shape_info = result;

		// 			// shape_knitout = result;
		// 		});
		// 	}
		// }


		// async function getShapeKnitout() {
		// 	if (shape_img) { // function process(img_path, crop_img, needle_count, row_count) { //crop_img is bool
		// 		// let k = await shapeify.process(colorwork_knitout, shape_img, needle_count, row_count, inc_method, xfer_speed_number)
		// 		let k = await shapeify.process(shape_img, true, needle_count, row_count)
		// 		.then((result) => {
		// 			let shape_info = result;

		// 			// shape_knitout = result;
		// 		});
		// 	}
		// }

		getKnitout()
			.then(() => {
				app.locals.colorwork_knitout = colorwork_knitout;

				app.locals.motifPath = '/images/out-colorwork-images/knit_motif.png';

				processShape(shape_img)
				// getShapeKnitout()
					.then((result) => {
						shape_info = result;

						app.locals.picPath = '/images/out-shape-images/shape_code.png';

						if (shape_info) return res.redirect('/draw');
						// if (shape_info) return res.redirect('pages/draw', {picPath:'/images/out-shape-images/shape_code.png', motif:motif_path});
						else return res.redirect('/download');
						// {
						// 	// req.app.locals.colorwork_knitout = colorwork_knitout;
						// 	// req.colorwork_knitout = colorwork_knitout;
						// 	return next();
						// }

						// else return res.render('pages/download', {colorwork_knitout:colorwork_knitout, shape_knitout:shape_knitout, logMessages:logMessages});
					});
			});

		// getKnitout()
		// 	.then(() => {
		// 		processShape()
		// 		// getShapeKnitout()
		// 		.then(() => {
		// 			return res.render('pages/download', {colorwork_knitout:colorwork_knitout, shape_knitout:shape_knitout, logMessages:logMessages});
		// 		});
		// 	});

			// getKnitout().then(() => {
			// 	if (shape_img) {
			// 		getShapeKnitout(); //TODO: check
			// 	}

			// 	return res.render('pages/download', {knitout:colorwork_knitout});
			// 	// return res.status(400).send(`!${knitout}!`);
			// 	// return res.status(400).send(`!${knitout}!`);
			// });
	}
});

app.get('/download', function(req, res) {
	if (res.app.locals.colorwork_knitout) {
		console.log('get download page...'); //remove //debug
		webify.set_locals(app);

		return res.render('pages/download');
	} else return res.redirect('/');

	// return res.render('pages/download', {colorwork_knitout:req.app.locals.colorwork_knitout, shape_knitout:req.app.locals.shape_knitout, logMessages:req.app.locals.logMessages});
});

// 	getKnitout()
// 		.getShapeKnitout()
// 		.then(() => {
// 			return res.render('pages/download', {colorwork_knitout:colorwork_knitout, shape_knitout:shape_knitout});
// 		});

// 		// getKnitout().then(() => {
// 		// 	if (shape_img) {
// 		// 		getShapeKnitout(); //TODO: check
// 		// 	}

// 		// 	return res.render('pages/download', {knitout:colorwork_knitout});
// 		// 	// return res.status(400).send(`!${knitout}!`);
// 		// 	// return res.status(400).send(`!${knitout}!`);
// 		// });
// })


app.get('/', (req, res) => {
	res.render('pages/knitify', {knitify:knitify});

	// let img = req.body.colFileInput;

	// let imgTxt = JSON.stringify(img);

	// fs.writeFileSync('img.txt', imgTxt);

	// let img = req.body.colFileInput;


	// fs.writeFileSync('img.txt', 'img');
	// console.log(res.locals);
	// res.json({})
});

// app.get('/', (req, res) => {

// 	res.render('pages/knitify', {knitify:knitify});
// });


app.get('/draw', (req, res) => {
	console.log('get draw page...'); //remove //debug
	res.render('pages/draw');
	// res.render('pages/draw', {picPath:'/images/out-shape-images/shape_code.png', motif:motif_path});
});


// app.

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

