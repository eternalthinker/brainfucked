
/*if(typeof(Worker) !== "undefined") {
    // Yes! Web worker support!
    // Some code.....
    alert("ok");
} else {
    // Sorry! No Web Worker support..
} */


if(typeof(w) == "undefined") {
    w = new Worker("brainfucked.js");
}


w.onmessage = function(event){
	//alert(event.data);
    outputUi.value += event.data;
}; 

function run()
{
	outputUi = document.getElementById("output");
	outputUi.value = "";
	var program = document.getElementById("program").value;
	var data = { "command": "run", "program": program };
	//alert(data.command);
	w.postMessage(data);
}