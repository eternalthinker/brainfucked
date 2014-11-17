
/*if(typeof(Worker) !== "undefined") {
    // Yes! Web worker support!
    // Some code.....
    alert("ok");
} else {
    // Sorry! No Web Worker support..
} */

$(document).ready(function() {
    var $output_ui = $('#output');
    var $input_ui = $('#input');
    var $runtime_ui = $('#runtime');
    var $error_ui = $('#error');
    var $run_btn = $('#run');
    var $stop_btn = $('#stop');
    var $pause_btn = $('#pause');
    var $resume_btn = $('#resume');
    var $optimize_chk = $('#optimize');

    $run_btn.click(start);
    $stop_btn.click(stop);
    $pause_btn.click(pause);
    $resume_btn.click(resume);

    var State = Object.freeze({
        RUNNING: 1,
        PAUSED: 2,
        STOPPED: 3,
        READ: 4
    });
    var curState;

    setState(State.STOPPED);

/* ================== BF Worker ================ */

    var bf = new Worker("brainfucked.js");

    bf.onmessage = function(event){
        var data = event.data;

        switch (data.command) {
            case "print": {
                $output_ui.val($output_ui.val() + data.value);
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
                $runtime_ui.text(data.runtime);
                stop();
                break;
            }
            default:
                break;
        }
    };
/* ================== End of BF Worker ================ */


/* ================== UI utility functions ================ */

    function start()
    {
        $output_ui.val("");
        $runtime_ui.text("");
        $error_ui.text("");
        var program = $('#program').val();
        var input = $input_ui.val();
        var optimize = $optimize_chk.prop('checked');
        
        setState(State.RUNNING);
        bf.postMessage({ "command": "run", "program": program, "input": input, "optimize": optimize });
    }

    function stop() {
        setState(State.STOPPED);
        bf.postMessage({ "command": "halt" });
    }

    function pause() {
        setState(State.PAUSED);
        bf.postMessage({ "command": "halt" });   
    }

    function resume() {
        if (curState === State.READ) {
            var input = $input_ui.val();
            bf.postMessage({ "command": "input", "input": input });
        }
        else {
            bf.postMessage({ "command": "resume" }); 
        }
        setState(State.RUNNING);
    }

    function setState(state) {
        curState = state;
        switch (curState) {
            case State.RUNNING: {
                $run_btn.prop('disabled', true);
                $stop_btn.prop('disabled', false);
                $pause_btn.prop('disabled', false);
                $resume_btn.prop('disabled', true);
                $optimize_chk.prop('disabled', true);
                break;
            }
            case State.READ:
            case State.PAUSED: {
                $run_btn.prop('disabled', true);
                $stop_btn.prop('disabled', false);
                $pause_btn.prop('disabled', true);
                $resume_btn.prop('disabled', false);
                $optimize_chk.prop('disabled', true);
                break;
            }
            case State.STOPPED: {
                $run_btn.prop('disabled', false);
                $stop_btn.prop('disabled', true);
                $pause_btn.prop('disabled', true);
                $resume_btn.prop('disabled', true);
                $optimize_chk.prop('disabled', false);
                break;
            }
            default:
                break;
        }
    }

    function showError(message) {
        $error_ui.text(message);
    }

    function promptInput() {
        $input_ui.val("");
        // log consumed input
        // check for valid input (ascii)
        alert("Enter input..");
    }
/* ================== End of UI utility functions ================ */

}); // End of document.ready closure



