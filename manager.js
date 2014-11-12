
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

if(typeof(w) == "undefined") {
    w = new Worker("brainfucked.js");
    // Add messaging for terminate?
}

w.onmessage = function(event){
	var data = event.data;

	switch (data.command) {
		case "print": {
			outputUi.value += data.value;
			break;
		}
		case "read": {
			var input = 0;
			// prompt input
			w.postMessage({ "command": "input", "value": input });
			break;
		}
		case "error": {
			// move on to fin
		}
		case "fin": {
			runtimeUi.innerHTML = data.runtime;
			break;
		}
		default:
			break;
	}
};

function run()
{
	outputUi = document.getElementById("output");
	inputUi = document.getElementById("input");
	runtimeUi = document.getElementById("runtime");
	outputUi.value = "";
	runtimeUi.innerHTML = "";
	var program = document.getElementById("program").value;
	var input = inputUi.value;
	var optimize = document.getElementById("optimize").checked;
	w.postMessage({ "command": "run", "program": program, "input": input, "optimize": optimize });
}
