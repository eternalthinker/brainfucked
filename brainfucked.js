

// error, infy loop

function Interpreter (program, input, optimize)
{
	// Essential components
	this.program = program.trim();
	this.input = input;

	this.pc = 0; // program counter
	this.inputIdx = 0;
	this.memory = [0];
	this.memoryIdx = 0;
	this.output = "";

	// Optimization
	this.jumps = { };
	this.optimized = false;

	// Goodies
	this.startTime = Date.now(); 
	this.runTime = 0;
	this.halt = false;

	// Actions
	if (optimize) {
		this.optimizeProgram();
		this.optimized = true;
	}
	else {
		this.preProcess();
	}
	this.runTime += Date.now() - this.startTime;
}

Interpreter.prototype.feedInput = function(input) 
{
	this.input = input;
	this.inputIdx = 0;
}

Interpreter.prototype.fin = function() 
{
	this.halt = true;
	var timeTaken = (this.runTime/1000.0) + "s";
	postMessage({ "command": "fin", "runtime": timeTaken });
}

Interpreter.prototype.preProcess = function()
{
	// Pre-compute jumps mapping
	var stack = [];
	var programArr = [];
	for (var pc = 0; pc < this.program.length; ++pc) {
		var op = this.program[pc];
		programArr.push(op);
		if (op == "[") {
			stack.push(pc);
		}
		else if (op == "]") {
			var lmatch = stack.pop();
			this.jumps[lmatch] = pc;
			this.jumps[pc] = lmatch;
		}
	}
	this.program = programArr;
}

Interpreter.prototype.optimizeProgram = function()
{
	var o_program = [];
	var o_pc = -1;
	var stack = [];
	var buffer = { op: null, count: 0 };

	this.program = this.program.replace(/[^><+-.,\[\]]/g, "");

	for (var pc = 0; pc < this.program.length; ++pc) {
		var op = this.program[pc];

		if (buffer.op != null && buffer.op != op) {
			if (buffer.count > 1) {
				o_program.push(buffer.count);
				o_pc++;
			} 
			o_program.push(buffer.op);
			o_pc++;
			buffer.op = null;
			buffer.count = 0;
		}

		switch (op) {
			case '>':
			case '<':
			case '-':
			case '+':
			{
				// at this point buffer.op is either repeating or null
				buffer.op = op;
				buffer.count++;
				break;
			}
			case '[': 
			{
				o_program.push(op);
				o_pc++;
				stack.push(o_pc);
				break;
			}
			case ']': 
			{
				o_program.push(op);
				o_pc++;
				var lmatch = stack.pop();
				this.jumps[lmatch] = o_pc;
				this.jumps[o_pc] = lmatch;
				break;
			}
			case '.':
			case ',':
			{
				o_program.push(op);
				o_pc++;
			}
			default:
				break;
		}
	}
	if (buffer.op != null) { // ><+- might remain in buffer if program ends with them
		if (buffer.count > 1) {
			o_program.push(buffer.count);
			o_pc++;
		} 
		o_program.push(buffer.op);
		o_pc++;
		buffer.op = null;
		buffer.count = 0;
	}
	this.program = o_program;
};

Interpreter.prototype.o_run = function()
{
	if (this.halt) {
		throw {
			name: "HaltInterpreter",
			level: "PROCEDURAL"
		};
	}
	this.startTime = Date.now();
	var count = 1;
	var iters = 50000;
	while(this.pc < this.program.length && --iters > 0) {
		var op = this.program[this.pc];

		if (typeof op == 'number') {
			count = op;
			op = this.program[++this.pc];
		}

		switch (op) {
			case '>': {
				this.memoryIdx += count;
				if (this.memoryIdx >= this.memory.length) {
					for (var i = this.memoryIdx - this.memory.length; i >= 0; --i) {
						this.memory[this.memoryIdx - i] = 0;
					}
				}
				break;
			}
			case '<': {
				this.memoryIdx -= count;
				postMessage({ "command": "print", "value": this.memoryIdx });
				if (this.memoryIdx < 0) {
					throw {
						name: "MemoryUnderflow",
						level: "TERMINAL",
						message: "Program attempted to access out of bound memory"
					};
				}
				break;
			}
			case '+': {
				this.memory[this.memoryIdx] += count;
				if (this.memory[this.memoryIdx] > 255) {
					this.memory[this.memoryIdx] = 0;
				}
				break;
			}
			case '-': {
				this.memory[this.memoryIdx] -= count;
				if (this.memory[this.memoryIdx] < 0) {
					this.memory[this.memoryIdx] = 255;
				}
				break;
			}
			case '.': {
				var c = String.fromCharCode(this.memory[this.memoryIdx]);
				//this.output += c;
				postMessage({ "command": "print", "value": c });
				break;
			}
			case ',': {
				if (this.inputIdx < this.input.length) {
					this.memory[this.memoryIdx] = String.charCodeAt(this.input[this.inputIdx++]);
				}
				else {
					this.memory[this.memoryIdx] = 0;
					this.halt = true;
					throw {
						name: "EOF",
						level: "PROCEDURAL"
					};
				}
				break;
			}
			case '[': {
				if (this.memory[this.memoryIdx] == 0) {
					this.pc = this.jumps[this.pc];
				}
				if (this.pc == undefined) {
					throw {
						name: "UnmatchedBrackets",
						level: "TERMINAL",
						message: "Unmatched '[' found in source code"
					};
				}
				break;
			}
			case ']': {
				if (this.memory[this.memoryIdx] != 0) {
					this.pc = this.jumps[this.pc];
				}
				if (this.pc == undefined) {
					throw {
						name: "UnmatchedBrackets",
						level: "TERMINAL",
						message: "Unmatched ']' found in source code"
					};
				}
				break;
			}
			default:
				break;
		}
		count = 1;
		++this.pc;
	} // end of while

	this.runTime += Date.now() - this.startTime;
	if (this.pc >= this.program.length) {
		this.fin();
	}
	else {
		setTimeout(run, 1);
	}
}

function run()
{
	try {
		interpreter.o_run();
	}
	catch (err) {
		switch (err.level) {
			case "TERMINAL": {
				postMessage({ "command": "error", "message": err.message });
				interpreter.fin();
				break;
			}
			case "PROCEDURAL": {
				if (err.name === "EOF") {
					postMessage({ "command": "read" });
				}
				break;
			}
			default:
				break;
		}
	}
}

onmessage = function(event) 
{
	var data = event.data;

	switch (data.command) {
		case "run": {
			interpreter = new Interpreter(data.program, data.input, data.optimize);
			run();
			break;
		}
		case "input": {
			interpreter.feedInput(data.input);
			// Move on to resume
		}
		case "resume": {
			interpreter.halt = false;
			run();
			break;
		}
		case "halt": {
			interpreter.halt = true;
			break;
		}
		default:
			break;
	}
};





