// redefine console

let true_console_log = console.log; //store old built-in method

console = {}; //redefine

console.log = function(info) {
	true_console_log(info, typeof info); //remove //debug
	if (typeof info === 'string' || typeof info === 'undefined') true_console_log(info);
	else {//object
		let html = '<span';
		if ('style' in info) {
			html += ' style="';

			for (let style of info.style) {
				if (style === 'bold') html += ' font-weight: bold;';
				else if (style === 'italic') html += ' font-style: italic;';
				else if (style.includes('bg')) html += ` background-color: ${style.slice(2)};`;
				else html += ` color: ${style};`;
				//TODO: make sure this covers everything
			}
			html += '"';
		}
		html += '>';
		if ('message' in info) html += `${info.message}`;
		html += '</span>'; 

		return html;
	}
	//TODO
}


// let info = console.log({'style': ['bold']})
// For some browsers and minifiers, you may need to apply this onto the window object.
// window.console = console;


module.exports = {
	console: console,
	true_console_log: true_console_log
}