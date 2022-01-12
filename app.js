const express = require('express');
const fileUpload = require('express-fileupload');

const path = require('path');
const PORT = process.env.PORT || 5000;

// const knitify = require('./public/src/knitify/knitify'); //new

const fs = require('fs');

console.log('1!!!!');

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

app.use(function(req, res, next) {
	res.locals.knitify = knitify;
	next();
})
// app.locals.colorwork = colorwork;

// app.use(express.json());

// app.use(express.urlencoded())

console.log('2!!!!');

// other code
// express()
// 	.use(express.static(path.join(__dirname, 'public')))
// 	.set('views', path.join(__dirname, 'views'))
// 	.set('view engine', 'ejs')
// 	.get('/', (req, res) => res.render('pages/knitify'))
// 	// .get('/', (req, res) => res.render('pages/index'))
// 	.listen(PORT, () => console.log(`Listening on ${ PORT }`))


app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'ejs');

// app.get('/', (req, res) => res.render('pages/knitify'));
// app.get('/', (req, res) => res.render('pages/knitify', {knitify:knitify, test:test}));

// exports.app = function(req, res) {
// 	res.render('pages/knitify', {test: test});
// }

let colorwork_img, needle_count = 'AUTO', row_count = 'AUTO', machine = 'kniterate', max_colors = 4, dithering = false, palette_opt, stitch_number, speed_number, caston_carrier, wasteSettings, back_style = 'Secure', rib_info, st_pat_img, stitchPatterns = [];

class StitchPattern {
	constructor(name, hex, carrier) {
		this.name = name;
		this.color = hex;
		this.carrier = carrier;
		this.options = {};
	}
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

app.post('/download', function(req, res) {
	// let sampleFile;
  // let uploadPath;

  // if ((!req.files && !req.body) || (Object.keys(req.files).length === 0 && Object.keys(req.body).length === 0)) {
	// 	return res.status(400).send(`${Object.keys(req.body)}`); //  ${Object.keys(req.query)}
  //   // return res.status(400).send('No files were uploaded.');
  // }


	if (req.files) {
		console.log(req.files);
		if ('colFile' in req.files) {
			colorwork_img = req.files.colFile.data;
			console.log('!!!!!!', colorwork_img);
			// let colFile = req.files.colFile;
			// colorwork_image = `./public/images/${colFile.name}`;
			// colFile.mv(colorwork_image, function(err) {
			// 	if (err) return res.status(500).send(err);
		
			// 	// res.send('File uploaded!');
			// });
			// colorwork_img = req.files.colFile;
		}
		if ('stFile' in req.files) {
			let stFile = req.files.stFile;
			st_pat_img = `./public/images/${st_pat_img.name}`;
			stFile.mv(st_pat_img, function(err) {
				if (err) return res.status(500).send(err);
		
				// res.send('File uploaded!');
			});
			// req.files.stFile;
		}
	}

	// return res.status(400).send(`!${colorwork_img}!`);

	if (req.body) {
		if ('BackStyle' in req.body) back_style = req.body.BackStyle;
		if ('NeedleCount' in req.body) needle_count = req.body.NeedleCount;
		if ('RowCount' in req.body) row_count = req.body.RowCount;
		if ('MaxColors' in req.body) max_colors = req.body.MaxColors;
		if ('Dithering' in req.body) dithering = req.body.Dithering;
		if ('Palette' in req.body) palette_opt = req.body.Palette;

		if ('Machine' in req.body) machine = req.body.Machine;
		if ('StitchNumber' in req.body) stitch_number = req.body.StitchNumber;
		if ('SpeedNumber' in req.body) speed_number = req.body.SpeedNumber;
		if ('CastonCarrier' in req.body) caston_carrier = req.body.CastonCarrier;
		if ('WasteSettings' in req.body) wasteSettings = req.body.WasteSettings; //TODO: make sure this stays as an object

		if ('Rib' in req.body) rib_info = req.body.Rib;

		if (st_pat_img) {
			let stitchNames = Object.keys(req.body).filter(el => el.includes('StitchPatternName'));
			let stitchMapCols = Object.keys(req.body).filter(el => el.includes('MappedColor'));
			let stitchCarriers = Object.keys(req.body).filter(el => el.includes('Carrier'));

			for (let s = 0; s < stitchNames.length; ++s) {
				stitchPatterns.push(StitchPattern(req.body[stitchNames[s]], req.body[stitchMapCols[s]], req.body[stitchCarriers[s]]));
			}
		}
	}

	// let knitout = colorwork.process(colorwork_img, needle_count, row_count, machine, max_colors, dithering, palette_opt, stitch_number, speed_number, caston_carrier, wasteSettings, back_style, rib_info, st_pat_img, stitchPatterns);
	let knitout;

	async function getKnitout() {
		// function process(img_path, needle_count, row_count, machine, max_colors, dithering, palette_opt, stitch_number, speed_number, caston_carrier, wasteSettings, back_style, rib_info, stImg, stitchPats)

		let k = await knitify.process(colorwork_img, needle_count, row_count, machine, max_colors, dithering, palette_opt, stitch_number, speed_number, caston_carrier, wasteSettings, back_style, rib_info, st_pat_img, stitchPatterns)
		// let k = await knitify.process(colorwork_img, 100, 100, 'kniterate', 4, false, undefined, undefined, undefined, undefined, undefined, back_style, undefined, undefined, [])
		.then((result) => {
			knitout = result;
			console.log('!', knitout);
			// return result;
		});
		
		// return k;
	}

	getKnitout().then(() => {
		// URL.createObjectURL(new Blob([knitout]))
		// const blob = new Blob([knitout]);
		// const href = URL.createObjectURL(blob);
		// <%= knitout %>
		return res.render('pages/download', {knitout:knitout});
		// return res.status(400).send(`!${knitout}!`);
		// return res.status(400).send(`!${knitout}!`);
	});

	// console.log('!!', knitout);

	// let knitout = colorwork.process(colorwork_img, 100, 100, 'kniterate', 4, false, undefined, undefined, undefined, undefined, undefined, back_style, undefined, undefined, []);

	// console.log('!!', knitout);

	// return res.status(400).send(`!${knitout}!`);



	// for (let file in req.files) {
	// 	res.send(`${file}, ${req.files[file]}`);
	// }
  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  // sampleFile = req.files.colFile;
  // uploadPath = __dirname + '/public/files/' + sampleFile.name;

	// Use the mv() method to place the file somewhere on your server
	// sampleFile.mv(uploadPath, function(err) {
	//   if (err)
	//     return res.status(500).send(err);

	//   res.send('File uploaded!');
	// });

	// let img = req.query.colFileInput;

	// let imgTxt = JSON.stringify(img);

	// fs.writeFileSync('img.txt', imgTxt);

	// if (img !== '') res.send('!!!!!!!!!!!!!!!!!');
	// else res.send('!');
})


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


console.log('5!!!!');
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

console.log('6!!!!');

