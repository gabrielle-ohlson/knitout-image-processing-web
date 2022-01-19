// redefine console
// import { parentPort, workerData } from 'worker_threads';
// const { Worker, workerData } = require('worker_threads');

let logMessages = [];
/*
// const express = require('express');
// const router = express.Router();
*/

// let http_options = {
//   host: 'www.host.com',
//   path: '/',
//   port: '80',
//   method: 'POST'
// };
// const { parentPort, workerData } = require('worker_threads');

// function runProcess (workerData) {
// 	return new Promise((resolve, reject) => {
// 		const worker = new Worker('../../../app.js', { workerData });
// 		worker.on('message', resolve);
// 		worker.on('error', reject);
// 		worker.on('exit', (code) => {
// 			if (code !== 0) { 
// 				reject(new Error(`Worker stopped with exit code ${code}`)) 
// 			}
// 		});
// 	});
// }


// async function run(data) {
// 	const result = await runProcess(data);
// 	console.log(result);
// }



let true_console_log = console.log; //store old built-in method
let true_console_error = console.error; //store old built-in method


console = {}; //redefine

console.log = function() {
	// info
	// if (typeof info === 'string' || typeof info === 'undefined') true_console_log(info);
	let html_info = [];
	let log_message = [];

	// true_console_log('arguments:', arguments);

	for (let info of arguments) {
		// true_console_log(info);
		if (typeof info === 'object' && 'chalk' in info) { //object
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
			if ('message' in info) {
				html += `${info.message}`;
				log_message.push(info.message);
			}
			html += '</span>';

			html_info.push(html);
		} else {
			// true_console_log(info, typeof info, !info);
			// if (info) log_message.push(info.toString());
			// else log_message.push(`${info}`); //undefined
			
			let message = JSON.stringify(info);
			true_console_log(message);
			log_message.push(message);

			if (html_info.length) html_info.push(`<span>${message}</span>`);
			// if (html.length) 
		}
		// 	return html;
		// } else true_console_log(info);
		//TODO
	}

	// true_console_log(log_message.join(' '));

	if (html_info.length) {
		let html = `<div>${html_info.join(' ')}</div>`;

		logMessages.push(html);
		/*
		// define the download route
		router.get('/download', function (req, res) {
			res.send({logMessages: html});
		});
		*/


		// appWorker.postMessage(html);

		// parentPort.postMessage(html);
		// run(html); //new //*
	// 	return html; //TODO: insert this into messages instead
	}
	// } else return;
}

console.error = function(err) {
	true_console_error(err);
}


// let info = console.log({'style': ['bold']})
// For some browsers and minifiers, you may need to apply this onto the window object.
// window.console = console;


module.exports = {
	// logger: router,
	console: console,
	true_console_log: true_console_log,
	logMessages: logMessages,
	set_locals: function(app) {
		app.locals.logMessages = logMessages
	}
}