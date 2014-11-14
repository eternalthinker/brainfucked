
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
			setState(State.READ);
			promptInput();
			break;
		}
		case "error": {
			setState(State.STOPPED);
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
	setState(State.RUNNING);
}

function start()
{
	outputUi = document.getElementById("output");
	inputUi = document.getElementById("input");
	runtimeUi = document.getElementById("runtime");
	errorUi = document.getElementById("error");
	runButton = document.getElementById("run");
	resumeButton = document.getElementById("resume");
	stopButton = document.getElementById("stop");
	pauseButton = document.getElementById("pause");
	optimizeCheck = document.getElementById("optimize");

	outputUi.value = "";
	runtimeUi.innerHTML = "";
	errorUi.innerHTML = "";
	var program = document.getElementById("program").value;
	var input = inputUi.value;
	var optimize = optimizeCheck.checked;
	
	setState(State.RUNNING);
	w.postMessage({ "command": "run", "program": program, "input": input, "optimize": optimize });
}

function setState(state) {
	curState = state;
	switch (curState) {
		case State.RUNNING: {
			runButton.disabled = true;
			stopButton.disabled = false;
			pauseButton.disabled = false;
			resumeButton.disabled = true;
			optimizeCheck.disabled = true;
			break;
		}
		case State.READ:
		case State.PAUSED: {
			runButton.disabled = true;
			stopButton.disabled = false;
			pauseButton.disabled = true;
			resumeButton.disabled = false;
			optimizeCheck.disabled = true;
			break;
		}
		case State.STOPPED: {
			runButton.disabled = false;
			stopButton.disabled = true;
			pauseButton.disabled = true;
			resumeButton.disabled = true;
			optimizeCheck.disabled = false;
			break;
		}
		default:
			break;
	}
}

function resume() {
	if (curState === State.READ) {
		var input = inputUi.value;
		w.postMessage({ "command": "input", "input": input });
	}
	else {
		w.postMessage({ "command": "resume" });	
	}
	setState(State.RUNNING);
}

function stop() {
	setState(State.STOPPED);
	w.postMessage({ "command": "halt" });
}

function pause() {
	setState(State.PAUSED);
	w.postMessage({ "command": "halt" });	
}

function showError(message) {
	errorUi.innerHTML = message;
}

function promptInput() {
	inputUi.value = "";
	// log consumed input
	// check for valid input (ascii)
	alert("Enter input..");
}

