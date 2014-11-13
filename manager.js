
/*if(typeof(Worker) !== "undefined") {
    // Yes! Web worker support!
    // Some code.....
    alert("ok");
} else {
    // Sorry! No Web Worker support..
} */

var outputUi = null;
var inputUi = null;
var runtimeUi = null;
var State = Object.freeze({
	RUNNING: 1,
	PAUSED: 2,
	STOPPED: 3,
	READ: 4
});
var curState = State.STOPPED;

if(typeof(w) == "undefined") {
    w = new Worker("brainfucked.js");
}

w.onmessage = function(event){
	var data = event.data;

	switch (data.command) {
		case "print": {
			outputUi.value += data.value;
			break;
		}
		case "read": {
			pause();
			curState = State.READ;
			promptInput();
			break;
		}
		case "error": {
			curState = State.STOPPED;
			showError(data.message);
			break;
		}
		case "fin": {
			runtimeUi.innerHTML = data.runtime;
			stop();
			break;
		}
		default:
			break;
	}
};


function run()
{
	if (curState === State.STOPPED) {
		start();
	}
	else {
		resume();
	}
	curState = State.RUNNING;
}

function start()
{
	outputUi = document.getElementById("output");
	inputUi = document.getElementById("input");
	runtimeUi = document.getElementById("runtime");
	runButton = document.getElementById("run");
	resumeButton = document.getElementById("resume");
	stopButton = document.getElementById("stop");
	pauseButton = document.getElementById("pause");

	outputUi.value = "";
	runtimeUi.innerHTML = "";
	var program = document.getElementById("program").value;
	var input = inputUi.value;
	var optimize = document.getElementById("optimize").checked;
	runButton.disabled = true;
	stopButton.disabled = false;
	pauseButton.disabled = false;
	resumeButton.disabled = true;
	curState = State.RUNNING;

	w.postMessage({ "command": "run", "program": program, "input": input, "optimize": optimize });
}

function resume() {
	if (curState === State.READ) {
		var input = inputUi.value;
		w.postMessage({ "command": "input", "input": input });
	}
	else {
		w.postMessage({ "command": "resume" });	
	}
	curState = State.RUNNING;
	stopButton.disabled = false;
	pauseButton.disabled = false;
	resumeButton.disabled = true;
	runButton.disabled = true;
}

function stop() {
	curState = State.STOPPED;
	w.postMessage({ "command": "halt" });
	stopButton.disabled = true;
	pauseButton.disabled = true;
	runButton.disabled = false;	
	resumeButton.disabled = true;
}

function pause() {
	curState = State.PAUSED;
	w.postMessage({ "command": "halt" });	
	stopButton.disabled = false;
	pauseButton.disabled = true;
	resumeButton.disabled = false;
	runButton.disabled = true;
}

function showError(message) {
	outputUi.value += message;
}

function promptInput() {
	inputUi.value = "";
	// log consumed input
	// check for valid input (ascii)
	alert("Enter input..");
}

