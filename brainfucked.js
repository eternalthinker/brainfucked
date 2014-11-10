

// error, infy loop

function Interpreter (program, input, ui)
{
	// Essential components
	this.program = program;
	this.input = input;
	this.ui = ui; // update and retrieve info from UI

	this.pc = 0; // program counter
	this.inputIdx = 0;
	this.memory = [0];
	this.memoryIdx = 0;
	this.output = "";

	// Optimization
	this.jumps = { };

	// Goodies
	this.startTime = Date.now(); 

	// Actions
	this.preProcess();
}

Interpreter.prototype.preProcess = function()
{
	// Pre-compute jumps mapping
	var stack = [];
	for (var pc = 0; pc < this.program.length; ++pc) {
		var op = this.program[pc];
		if (op == "[") {
			stack.push(pc);
		}
		else if (op == "]") {
			var lmatch = stack.pop();
			this.jumps[lmatch] = pc;
			this.jumps[pc] = lmatch;
		}
	}
}

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
	interpreter.run();
	var timeTaken = ((Date.now() - interpreter.startTime)/1000.0);
	postMessage("Runtime: " + timeTaken + "s");
	//outputUi.value += "Runtime: " + timeTaken + "s";
}

onmessage = function(event) {
	var data = event.data;
	//postMessage(data.program);

	if (data.command == "run") {
		interpreter = new Interpreter(data.program, null, null);
		run();
	}
};





