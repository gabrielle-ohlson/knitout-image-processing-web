const Jimp = require('jimp');
// const fs = require('fs');

//  "shapeify": "node shape-cropper.js && node shape-writer.js && node shape-processor.js && node shapeify.js",
const processor = require('./shape-processor');
// const shape = require('./shape');

const chalk = require('../utils/chalk');
const {console, true_console_log} = require('../utils/webify');

// let shape_info;

let cropX_left;
let cropX_right;
let cropY_top;
let cropY_bot;


function cropImg(img, needle_count, row_count) {
	const cropped = new Promise((resolve) => {
		let cropped_shape_path = './public/images/out-shape-images/cropped_shape.png';
		// img buffer

		needle_count ? needle_count = Number(needle_count) : needle_count = Jimp.AUTO;
		row_count ? row_count = Number(row_count): row_count = Jimp.AUTO;

		if (img) {
			////Create two-dimensional pixels rgb array based on image
			Jimp.read(img)
			.then((image) => {
				let width = image.bitmap.width;
				let height = image.bitmap.height;
				for (let y = 0; y < height; ++y) {
					for (let x = 0; x < width; ++x) {
						let pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
						// HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
						let hsp = Math.sqrt(0.299 * (pixel.r * pixel.r) + 0.587 * (pixel.g * pixel.g) + 0.114 * (pixel.b * pixel.b));
						// Using the HSP value, determine whether the color is light or dark
						if (hsp < 127.5) {
							if (x < cropX_left || cropX_left === undefined) {
								cropX_left = x;
							}
							if (x > cropX_right || cropX_right === undefined) {
								cropX_right = x;
							}
							if (cropY_bot === undefined) {
								cropY_bot = y;
							}
							if (y > cropY_top || cropY_top === undefined) {
								cropY_top = y;
							}
						}
					}
				}
				let crop_width = cropX_right - cropX_left + 1;
				let crop_height = cropY_top - cropY_bot + 1;
				if (row_count === 0) {
					row_count = Jimp.AUTO;
				}
				image.crop(cropX_left, cropY_bot, crop_width, crop_height).resize(needle_count, row_count).write(cropped_shape_path);
				// return image;
				resolve(image);
			})
			.catch((err) => {
				throw err;
			});
		}
	});

	return cropped;
}


function getData(img) {
	let pixels;

	const processImage = new Promise((resolve) => {
		Jimp.read(img)
		.then((image) => {
			let width = image.bitmap.width;
			let height = image.bitmap.height;
			pixels = [];
			for (let y = 0; y < height; ++y) {
				let rowPixels = [];
				for (let x = 0; x < width; ++x) {
					let pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
					rowPixels.push(`${pixel.r};${pixel.g};${pixel.b};${x};${y}`);
				}
				pixels.push(rowPixels);
			}
			// fs.writeFile('INPUT_DATA.json', JSON.stringify(pixels), 'utf8', (err) => {
			// 	if (err) {
			// 		throw err;
			// 	}
			// });

			resolve(pixels);
		})
		.catch((err) => {
			throw err;
		});
	});
	return processImage;
}


let pixels;

// function resolvePromises(img, needle_count, row_count) {
// 	const crop = new Promise((resolve, reject) => {
// 		cropImg(img, needle_count, row_count).then((result) => {
// 			resolve(result);
// 			return result; //?
// 		});
// 	});

// 	const promises = new Promise((resolve) => {
// 		crop.then((cropped_img) => {
// 			getData(cropped_img).then((result) => {
// 				pixels = result;
// 			}).then(() => {
// 				shape_info = processor.process(pixels);
				
// 				resolve(shape_info);
// 			});
// 		});
// 	});
// 	return promises;
// }

function resolvePromises(cropped_img) {
	const promises = new Promise((resolve) => {
		getData(cropped_img).then((result) => {
			pixels = result;
		}).then(() => {
			let shape_info = processor.process(pixels);
			
			resolve(shape_info);
			return shape_info;
		});
	});
	return promises;
}


// function process(colorwork_knitout, img_path, needle_count, row_count, inc_method, xfer_speed_number) {
function process(img_path, crop_img, needle_count, row_count) { //crop_img is bool
	return new Promise((resolve) => {
		// let knitout;

		// let in_file = colorwork_knitout
		// .toString()
		// .split(';r');

		const crop = new Promise((resolve, reject) => { //new location
			if (crop_img) {
				cropImg(img_path, needle_count, row_count).then((result) => {
					resolve(result);
					return result; //?
				});
			} else {
				resolve(img_path);
				return img_path;
			}
		});

		crop.then((processed_img) => {
			resolvePromises(processed_img)
			.then((shape_info) => {
				resolve(shape_info);
				return shape_info;
				// let shape_code = shape_info[0],
				// 	shape_code_reverse = shape_info[1],
				// 	shortrow_code = shape_info[2],
				// 	short_row_section = shape_info[3],
				// 	first_short_row = shape_info[4],
				// 	last_short_row = shape_info[5],
				// 	section_count = shape_info[6],
				// 	shape_error = shape_info[7],
				// 	shape_err_row = shape_info[8];
	
	
				// knitout = shape.generateKnitout(in_file, shape_code, shape_code_reverse, shortrow_code, short_row_section, first_short_row, last_short_row, section_count, shape_error, shape_err_row, inc_method, xfer_speed_number, console, chalk);
			});
		});
	});
}



// function process(colorwork_knitout, img_path, needle_count, row_count, inc_method, xfer_speed_number) {
// 	return new Promise((resolve) => {
// 		let knitout;

// 		let in_file = colorwork_knitout
// 		.toString()
// 		.split(';r');

// 		const crop = new Promise((resolve, reject) => { //new location
// 			cropImg(img_path, needle_count, row_count).then((result) => {
// 				resolve(result);
// 				return result; //?
// 			});
// 		});

// 		crop.then((cropped_img) => {
// 			resolvePromises(cropped_img)
// 			.then(() => {
// 				let shape_code = shape_info[0],
// 					shape_code_reverse = shape_info[1],
// 					shortrow_code = shape_info[2],
// 					short_row_section = shape_info[3],
// 					first_short_row = shape_info[4],
// 					last_short_row = shape_info[5],
// 					section_count = shape_info[6],
// 					shape_error = shape_info[7],
// 					shape_err_row = shape_info[8];
	
	
// 				knitout = shape.generateKnitout(in_file, shape_code, shape_code_reverse, shortrow_code, short_row_section, first_short_row, last_short_row, section_count, shape_error, shape_err_row, inc_method, xfer_speed_number, console, chalk);
// 			}).finally(() => {
// 				resolve(knitout);
// 				return knitout;
// 			});
// 		});

// 		/*
// 		resolvePromises(img_path, needle_count, row_count)
// 		.then(() => {
// 			let shape_code = shape_info[0],
// 				shape_code_reverse = shape_info[1],
// 				shortrow_code = shape_info[2],
// 				short_row_section = shape_info[3],
// 				first_short_row = shape_info[4],
// 				last_short_row = shape_info[5],
// 				section_count = shape_info[6],
// 				shape_error = shape_info[7],
// 				shape_err_row = shape_info[8];


// 			knitout = shape.generateKnitout(in_file, shape_code, shape_code_reverse, shortrow_code, short_row_section, first_short_row, last_short_row, section_count, shape_error, shape_err_row, inc_method, xfer_speed_number, console, chalk);
// 		}).finally(() => {
// 			resolve(knitout);
// 			return knitout;
// 		});
// 		*/
// 	});
// }


module.exports = {process};