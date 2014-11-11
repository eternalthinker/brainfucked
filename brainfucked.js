

// error, infy loop

function Interpreter (program, input, ui, optimize)
{
	// Essential components
	this.program = program.trim();
	this.input = input;
	this.ui = ui; // update and retrieve info from UI

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

	// Actions
	if (optimize) {
		this.optimizeProgram();
		this.optimized = true;
	}
	else {
		this.preProcess();
	}
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
				if (lmatch == undefined) {
					// Error
				}
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
	if (stack.length > 0) {
		// Error, unmatched '['
	}
	this.program = o_program;
};

Interpreter.prototype.step = function()
{
	var op = this.program[this.pc];
	//document.write(op);
	switch (op) {
		case '>': {
			if (++this.memoryIdx == this.memory.length) {
				this.memory[this.memoryIdx] = 0;
			}
			break;
		}
		case '<': {
			if (--this.memoryIdx < 0) {
				// Error
			}
			break;
		}
		case '+': {
			if (++this.memory[this.memoryIdx] > 255) {
				this.memory[this.memoryIdx] = 0;
			}
			break;
		}
		case '-': {
			if (--this.memory[this.memoryIdx] < 0) {
				this.memory[this.memoryIdx] = 255;
			}
			break;
		}
		case '.': {
			this.output += String.fromCharCode(this.memory[this.memoryIdx]);
			//document.writeln(this.output[this.output.length-1]);
			postMessage(this.output[this.output.length-1]);
			break;
		}
		case ',': {
			if (this.inputIdx < this.input.length) {
				this.memory[this.memoryIdx] = String.charCodeAt(this.input[this.inputIdx++]);
			}
			else {
				this.memory[this.memoryIdx] = 0;
				// Prompt input
			}
			break;
		}
		case '[': {
			if (this.memory[this.memoryIdx] == 0) {
				this.pc = this.jumps[this.pc];
			}
			if (this.pc == undefined) {
				// Error
			}
			break;
		}
		case ']': {
			if (this.memory[this.memoryIdx] != 0) {
				//document.writeln("<br/>" + this.pc + " [ ] " + this.jumps[this.pc]);
				this.pc = this.jumps[this.pc];
			}
			if (this.pc == undefined) {
				// Error
			}
			break;
		}
		default:
			break;
	}
	++this.pc;
}

Interpreter.prototype.run = function()
{
	while(this.pc < this.program.length) {
	//var i = 0;
	//while (i < 10000) {
		this.step();
	//	++i;
	}
}

Interpreter.prototype.o_run = function()
{
	var count = 1;
	while(this.pc < this.program.length) {
		var op = this.program[this.pc];

		if (typeof op == 'number') {
			count = op;
			//postMessage(op);
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
				if (this.memoryIdx < 0) {
					// Error
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
				this.output += String.fromCharCode(this.memory[this.memoryIdx]);
				//document.writeln(this.output[this.output.length-1]);
				postMessage(this.output[this.output.length-1]);
				break;
			}
			case ',': {
				if (this.inputIdx < this.input.length) {
					this.memory[this.memoryIdx] = String.charCodeAt(this.input[this.inputIdx++]);
				}
				else {
					this.memory[this.memoryIdx] = 0;
					// Prompt input
				}
				break;
			}
			case '[': {
				if (this.memory[this.memoryIdx] == 0) {
					this.pc = this.jumps[this.pc];
				}
				if (this.pc == undefined) {
					// Error
				}
				break;
			}
			case ']': {
				if (this.memory[this.memoryIdx] != 0) {
					//document.writeln("<br/>" + this.pc + " [ ] " + this.jumps[this.pc]);
					this.pc = this.jumps[this.pc];
				}
				if (this.pc == undefined) {
					// Error
				}
				break;
			}
			default:
				break;
		}
		count = 1;
		++this.pc;
	}
}


function UiControls ()
{

}
// UI Controls
// step mode
// sanitize i/p
// error

function run()
{
	//var outputUi = document.getElementById("output");
	//var program = document.getElementById("program").value;
	//var 
	if (interpreter.optimized) {
		interpreter.o_run();
	}
	else {
		interpreter.o_run();
	}
	var timeTaken = ((Date.now() - interpreter.startTime)/1000.0);
	postMessage("\nRuntime: " + timeTaken + "s\n");
	//for (var i =0; i < interpreter.memory.length; ++i) {
	//	postMessage(interpreter.memory[i] + " ");
	//}
	//outputUi.value += "Runtime: " + timeTaken + "s";
}

onmessage = function(event) {
	var data = event.data;

	if (data.command == "run") {
		interpreter = new Interpreter(data.program, null, null, true);
		//postMessage("\n" + interpreter.program.join("") + " pc = " + interpreter.pc + '\n');
		run();
	}
};





