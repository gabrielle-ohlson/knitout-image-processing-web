const Jimp = require('jimp');
const RgbQuant = require('rgbquant');
const fs = require('fs');

const colorwork = require('./colorwork');

const chalk = require('../utils/chalk');
const {console, true_console_log} = require('../utils/webify');


// let height, width, data;
// let palette, reduced;
let colors_arr = [];
let stitchOnly = false;
let stData;
// let pal_hist = [];
// let background = [];
// let colors_data = [];


const hexToRGB = (hex) => {
	let alpha = false,
		h = hex.slice(hex.startsWith('#') ? 1 : 0);
	if (h.length === 3) h = [...h].map((x) => x + x).join('');
	else if (h.length === 8) alpha = true;
	h = parseInt(h, 16);
	return [
		Number((alpha ? a : '') + (h >>> (alpha ? 24 : 16))),
		Number((h & (alpha ? 0x00ff0000 : 0x00ff00)) >>> (alpha ? 16 : 8)),
		Number(((h & (alpha ? 0x0000ff00 : 0x0000ff)) >>> (alpha ? 8 : 0)) + (alpha ? h & 0x000000ff : '')),
	];
};


function getData(img, opts) {
	let height, width, data;
	let palette, reduced;
	let pal_hist = [], background = [], colors_data = [];

	const processImage = new Promise((resolve) => {
		Jimp.read(img).then((image) => { //*
			width = image.bitmap.width;
			height = image.bitmap.height;
			data = image.bitmap.data;
			let q = new RgbQuant(opts);
			q.sample(data, width);
			// palette = q.palette(true);
			palette = q.palette(true, true);
			q.idxi32.forEach(function (i32) {
				////return array of palette color occurrences
				pal_hist.push({ color: q.i32rgb[i32], count: q.histogram[i32] });
				// pal_hist.push(q.histogram[i32]);
			});
			// sort it yourself
			pal_hist.sort(function (a, b) {
				return a.count == b.count ? 0 : a.count < b.count ? 1 : -1;
			});
			
			opts.palette = pal_hist.map((el) => (el = el.color));
			pal_hist = pal_hist.map((el) => (el = el.count));
			q = new RgbQuant(opts);
			q.sample(data, width);
			palette = q.palette(true, true);
			
			let hex_arr = [];
			const RGBToHex = (r, g, b) => ((r << 16) + (g << 8) + b).toString(16).padStart(6, '0');
			for (let h = 0; h < palette.length; ++h) {
				hex_arr.push(Jimp.rgbaToInt(palette[h][0], palette[h][1], palette[h][2], 255)); //255 bc hex
				colors_data.push(RGBToHex(palette[h][0], palette[h][1], palette[h][2]));
			}
			
			reduced = q.reduce(data, 2); ////indexed array
			let motif_path = './public/images/out-colorwork-images/knit_motif.png';
			if (fs.existsSync(motif_path)) {
				rename: for (let i = 1; i < 100; ++i) {
					if (!fs.existsSync(`./public/images/out-colorwork-images/knit_motif${i}.png`)) {
						fs.renameSync(motif_path, `./public/images/out-colorwork-images/knit_motif${i}.png`);
						break rename;
					}
				}
			}
			new Jimp(width, height, (err, img) => {
				if (err) throw err;
				for (let y = 0; y < height; ++y) {
					let px_arr = reduced.splice(0, width);
					background.push(px_arr[0], px_arr[px_arr.length - 1]); ////push edge colors to background array
					let px_map = [...px_arr];
					px_map = px_map.map((el) => (el += 1)); ////so starting from 1
					colors_arr.push(px_map); ////make it into an array with rows
					for (let x = 0; x < width; ++x) {
						let hex = hex_arr[px_arr[x]];
						img.setPixelColor(hex, x, y);
					}
				}
				////assign edge colors higher carrier numbers to prevent pockets
				function sortByFrequency(array) {
					let frequency = {};
					array.forEach(function (value) {
						frequency[value] = 0;
					});
					let uniques = array.filter(function (value) {
						return ++frequency[value] == 1;
					});
					return uniques.sort(function (a, b) {
						return frequency[b] - frequency[a];
					});
				}
				let edge_colors = sortByFrequency(background);
				edge_colors = edge_colors.map((el) => (el += 1)); ////so starting from 1
				background = edge_colors[0];
				if (!(pal_hist[background] > 0.1 * pal_hist.reduce((a, b) => a + b, 0))) {
					background = 1; ////most common color according to sorting, +1 (so not strarting from 0)
				}
				
				for (let i = 1; i <= colors_data.length; ++i) {
					if (!edge_colors.includes(i)) {
						edge_colors.push(i);
					}
				}
				
				if (edge_colors.length > 0) {
					let new_colors_data = [];
					for (let i = 0; i < edge_colors.length; ++i) {
						new_colors_data.unshift(colors_data[edge_colors[i] - 1]);
					}

					let replaced_bg = false;
					for (let i = 0; i < edge_colors.length; ++i) {
						edge_colors[i] = [edge_colors[i], edge_colors.length - i];
						if (edge_colors[i][0] === background && !replaced_bg) {
							background = edge_colors[i][1];
							replaced_bg = true;
						}
					}
					colors_data = [...new_colors_data];

					for (let r = 0; r < colors_arr.length; ++r) {
						for (let i = edge_colors.length - 1; i >= 0; --i) {
							colors_arr[r] = colors_arr[r].map((c) => {
								if (c === edge_colors[i][0]) {
									return (c = `${edge_colors[i][1]}`); //turn into string so doesn't get replaced later
								} else {
									return c;
								}
							});
						}
					}
					for (let r = 0; r < colors_arr.length; ++r) {
						colors_arr[r] = colors_arr[r].map((c) => (c = Number(c)));
					}
				}

				let colorsDataFile = '';
				for (let h = 1; h <= colors_data.length; ++h) {
					colorsDataFile += `\nCarrier ${h}: #${colors_data[h - 1]}`;
					colors_data[h - 1] = `x-vis-color #${colors_data[h - 1]} ${h}`;
				}
				fs.writeFileSync('colorsData.txt', colorsDataFile);

				// colors_arr.push(palette, machine, background, colors_data);
				colors_arr.push(palette, background, colors_data);
				img.write(motif_path);
				resolve(colors_arr);
			});
		});
	});
	return processImage;
}


function palOptions(max_colors, dithering, palette_opt) {
	let opts = {
		colors: max_colors,
		method: 2, //TODO: method: 1, //2 seems overall better, but could be good to test on more images
		minHueCols: max_colors, //TODO: test this more too
		dithKern: dithering,
		reIndex: false, //?
		//FloydSteinberg(-/+), Stucki(++), Atkinson(-), Jarvis(+?), null
	};

	if (palette_opt) {
		for (let i = 0; i < palette_opt.length; ++i) {
			palette_opt[i] = hexToRGB(palette_opt[i]);
		}

		opts.palette = palette_opt;
	}

	return opts;
	// const quantify = new Promise((resolve, reject) => {
	// });

}


function resizeImg(img, needle_count, row_count) {
	console.log(img); //TODO: check
	const resized = new Promise((resolve) => {
		let colorwork_path = './public/images/out-colorwork-images/colorwork.png'
		// img buffer
		needle_count === 'AUTO' ? needle_count = Jimp.AUTO : needle_count = Number(needle_count);
		row_count === 'AUTO' ? row_count = Jimp.AUTO : row_count = Number(row_count);

		if (img) {
			Jimp.read(img, (err, image) => {
				if (err) throw err;
				if (needle_count == -1 && row_count == -1) row_count = image.getHeight(); //if both auto (so Jimp doesn't throw an error)
				image.resize(needle_count, row_count).write(colorwork_path);

				// return image;
				resolve(image);
			});
		} else { //if just stitch pattern
			stitchOnly = true;

			new Jimp(needle_count, row_count, (err, image) => {
				if (err) throw err;
				for (let y = 0; y < row_count; ++y) {
					for (let x = 0; x < needle_count; ++x) {
						image.setPixelColor(4294967295, x, y); //set it all as white
					}
				}
				
				// return image;
				image.write(colorwork_path); //*

				resolve(image);
			});
		}
	});
	return resized;
}


function resolvePromises(img, needle_count, row_count, palette_opts, stImg, stitchPats) {
	const resize = new Promise((resolve, reject) => {
		resizeImg(img, needle_count, row_count).then((result) => {
			resolve(result);
			return result; //?
		});
	});

	// const quantify = new Promise((resolve, reject) => {
	// 	getData(img, palette_opts).then((result) => {
	// 		resolve(result);
	// 		return result; //?
	// 	});
	// });

	const promises = new Promise((resolve) => {
		// resizeImg(img, needle_count, row_count).then((result) => {
		// 	resolve(result);
			
		// });
		resize.then((resized_img) => {
			getData(resized_img, palette_opts).then((result) => {
				colors_arr = result;
				resolve(result);
				// return result; //?
			}).then(() => {
			// if (stitchOnly) fs.renameSync('./out-colorwork-images/stitch.png', './out-colorwork-images/colorwork.png');

				if (stitchPats.length) {
					const stitchPatterns = require('./stitch-pattern.js');
					stitchPatterns.getStitchData(stImg, stitchPats).then((data) => {
						stData = data;
						resolve(data); //?
					});
				} else resolve();
			});
		});
	});
	return promises;
}

function process(img_path, needle_count, row_count, machine, max_colors, dithering, palette_opt, stitch_number, speed_number, caston_carrier, wasteSettings, back_style, rib_info, stImg, stitchPats) {
	return new Promise((resolve) => {
		let knitout;

		console.log(stImg, stitchPats);
		console.log('processing....', img_path);
		// let resized = resizeImg(img_path, needle_count, row_count);
		let palette_opts = palOptions(max_colors, dithering, palette_opt);

		resolvePromises(img_path, needle_count, row_count, palette_opts, stImg, stitchPats)
		.then(() => {
			let colors_data = colors_arr.pop();
			let background = colors_arr.pop();
			let color_count = colors_arr.pop().length;
			colors_arr = colors_arr.reverse();

			knitout = colorwork.generateKnitout(machine, colors_data, background, color_count, colors_arr, stitch_number, speed_number, caston_carrier, wasteSettings, back_style, rib_info, stitchOnly, stData, console, chalk);
			
			// console.log(knitout);

			// return knitout;
			// function generateKnitout(info_arr, machine, stitch_number, speed_number, back_style, caston_carrier, wasteSettings, stitchOnly, stData, rib_info) {
		}).finally(() => {
			resolve(knitout);
			return knitout;
		});
	});

	// getData(img, opts).then((result) => {
	// 	colors_arr = result;

	// 	let colors_data = colors_arr.pop();
	// 	let background = colors_arr.pop();
	// 	// machine = colors_arr.pop();
	// 	let palette = colors_arr.pop();

	// 	colors_arr = colors_arr.reverse();
	// 	let color_count = palette.length;

	// 	// resolve(result);
	// 	// return result; //?
	// });
}


module.exports = {process};

/*

stitch_number = Number(promptAnswers['stitch_number']);
	main_stitch_number = stitch_number;
	speed_number = Number(promptAnswers['speed_number']);
	let wasteSettings = promptAnswers['wasteSettings']; //TODO: check about null
	if (wasteSettings.length) {
		waste_stitch = Number(wasteSettings['waste_stitch']);
		waste_speed = Number(wasteSettings['waste_speed']);
		waste_roller = Number(wasteSettings['waste_roller']);
		waste_rows = Number(wasteSettings['waste_rows']);
	}
	back_style = promptAnswers['back_style'];
	//TODO: stitch pattern answers
	stData = promptAnswers['stData']; //?
	caston_carrier = Number(promptAnswers['caston_carrier']);
	if (caston_carrier) user_specified_carriers.push(caston_carrier); //new //check

	waste_carrier = Number(promptAnswers['waste_carrier']);
	if (waste_carrier) user_specified_carriers.push(waste_carrier); //new //check
	let ribPrompt = promptAnswers['rib'];
	
	if (Object.keys(ribPrompt).length) {
		rib = true;
		// rib_top = Number(ribPrompt['rib_top']);
		rib_top = ribPrompt['rib_top'];
		ribT_rows = ribPrompt['ribT_rows'];
		// rib_bottom = Number(ribPrompt['rib_bottom']);
		rib_bottom = ribPrompt['rib_bottom']; //TODO: make sure it's a number
		ribB_rows = ribPrompt['ribB_rows'];
	}

	*/

