function reprocess(new_code) {
	let short_row_section = false;
	let shape_code_reverse = new_code.reverse();

	// get new first_short_row
	findNew1stShortRow: for (let r = 0; r < shape_code_reverse.length; ++r) {
		let blackpx = false, whiteMidpx = false;
		for (let p = 0; p < shape_code_reverse[r].length; ++p) {
			if (blackpx && whiteMidpx && shape_code_reverse[r][p] === 1) {
				short_row_section = true; //new
				first_short_row = r;
				break findNew1stShortRow;
			}
			if (blackpx && shape_code_reverse[r][p] === 0) whiteMidpx = true;
			if (shape_code_reverse[r][p] === 1) blackpx = true;
		}	
	}

	let shortrow_code;
	if (short_row_section) {
		shortrow_code = [...shape_code_reverse];
		shape_code_reverse = shortrow_code.splice(0, first_short_row);
	}

	let return_info = [
		// shape_code,
		shape_code_reverse,
		shortrow_code,
		short_row_section,
		first_short_row,
		last_short_row,
		// section_count,
		shape_error,
		shape_err_row
	];
	
	return return_info;
}

function process(shape_code) {
	let shape_code_reverse = [...shape_code]; //new
	shape_code_reverse = shape_code_reverse.reverse();
	let first_short_row = shape_code_reverse.length - 1 - splice_arr[splice_arr.length - 1];
	let last_short_row = shape_code_reverse.length - 1 - splice_arr[0];
	
	let new_code = [];
	let shape_code_txt = fs.readFileSync('./SHAPE-CODE.txt').toString().split('\n');
	for (let y = 0; y < shape_code_txt.length; ++y) {
		shape_code_txt[y] = shape_code_txt[y].split('');
		let shape_row = [];
		for (let x = 0; x < shape_code_txt[y].length; ++x) {
			shape_row.push(Number(shape_code_txt[y][x]));
		}
		new_code.push(shape_row);
		shape_row = [];
	}

	function arraysEqual(a, b) {
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; ++i) {
			for (let x = 0; x < a[i].length; ++x) {
				if (a[i][x] !== b[i][x]) return false;
			}
		}
		return true;
	}

	if (!arraysEqual(new_code, shape_code)) {
		console.log('processing shape code changes...'); //?
		shape_code = [...new_code];
		shape_code_reverse = shape_code.reverse();

		// get new first_short_row
		findNew1stShortRow: for (let r = 0; r < shape_code_reverse.length; ++r) {
			let blackpx = false, whiteMidpx = false;
			for (let p = 0; p < shape_code_reverse[r].length; ++p) {
				if (blackpx && whiteMidpx && shape_code_reverse[r][p] === 1) {
					first_short_row = r;
					break findNew1stShortRow;
				}
				if (blackpx && shape_code_reverse[r][p] === 0) whiteMidpx = true;
				if (shape_code_reverse[r][p] === 1) blackpx = true;
			}	
		}
	}
// } else {
// 	shape_code = null;
// 	short_row_section = null;
// 	shape_code_reverse = null;

	let shortrow_code;
	if (short_row_section) {
		shortrow_code = [...shape_code_reverse];
		shape_code_reverse = shortrow_code.splice(0, first_short_row);
	}
	let return_info = [
		shape_code,
		// shape_code_reverse,
		// shortrow_code,
		short_row_section,
		// first_short_row,
		// last_short_row,
		section_count,
		shape_error,
		shape_err_row
	];

	// let return_info = [shape_code,
	// 	shape_code_reverse,
	// 	shortrow_code,
	// 	short_row_section,
	// 	first_short_row,
	// 	last_short_row,
	// 	section_count,
	// 	shape_error,
	// 	shape_err_row];
	
	return return_info;
}


// let shortrow_code;
// if (short_row_section) {
// 	// let multi_shortrows = true; //TODO: add this in for dealing with multiple shortrow sections... eventually
// 	// if ((last_short_row = shape_code_reverse.length - 1)) {
// 	//   multi_shortrows = false;
// 	// }
// 	shortrow_code = [...shape_code_reverse];
// 	shape_code_reverse = shortrow_code.splice(0, first_short_row);
// }

// module.exports = {
// 	shape_code,
// 	shape_code_reverse,
// 	shortrow_code,
// 	short_row_section,
// 	first_short_row,
// 	last_short_row,
// 	section_count,
// 	shape_error,
// 	shape_err_row,
// };

module.exports = {process};