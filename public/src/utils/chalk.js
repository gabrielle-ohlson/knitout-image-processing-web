let chalk;

const F = function(...args) {
	console.log('Original function call', args);
}

const ChalkFunc = {
	apply: (target, thisArg, message) => {
		console.log('applying!', thisArg, message, target.name); //remove //debug

		let chalk_html = {
			'style': Object.keys(chalk),
			'message': message
		}

		chalk = new Proxy({}, Chalk); //reset

		return chalk_html;
	},
	get: (target, property, receiver) => {
		console.log('get func.', target, property, receiver);

		if (!(property in chalk)) {
			chalk_prop = new Proxy(F, ChalkFunc);

			chalk[property] = new Proxy({}, Chalk);
		} else chalk_prop = Reflect.get(target, property, receiver);

		return chalk_prop;
	},
	set: (target, property, value, receiver) => {
		console.log('set func.');
	}
}


const Chalk = {
	get: (target, property, receiver) => {
		console.log('get.', target, property, receiver, '\n'); //remove //debug

		let chalk_prop;

		if (!(property in chalk)) {
			chalk_prop = new Proxy(F, ChalkFunc);

			chalk[property] = new Proxy({}, Chalk);
		} else chalk_prop = Reflect.get(target, property, receiver);

		return chalk_prop;
	}
}


chalk = new Proxy({}, Chalk);

module.exports = chalk;