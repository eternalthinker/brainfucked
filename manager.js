
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
    var $state_ui = $('#state');
    var $notify_ui = $('#notification');
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
        RUNNING: "RUNNING",
        PAUSED: "PAUSED",
        STOPPED: "STOPPED",
        READ: "READ_WAITING",
        FINISHED: "FINISHED"
    });

    var StateClass = Object.freeze({
        RUNNING: "alert-success",
        PAUSED: "alert-warning",
        STOPPED: "alert-danger",
        READ_WAITING: "alert-info",
        FINISHED: "alert-success"
    });

    var curState;
    var curNotifyClass = "alert-danger";

    $output_ui.val("");
    $runtime_ui.text("Runtime: NIL");
    $notify_ui.hide();
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
                //setState(State.STOPPED); // Interpreter will send fin after error
                showError(data.message);
                break;
            }
            case "fin": {
                var runtime_ms = data.runtime;
                var runtime_str = "";
                if (runtime_ms < 100) {
                    runtime_str = runtime_ms + " ms";
                }
                else {
                    runtime_str = (runtime_ms / 1000.0) + " s";
                } 
                $runtime_ui.text("Runtime: " + runtime_str);
                setState(State.FINISHED);
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
        $runtime_ui.text("Runtime: NIL");
        $notify_ui.hide();
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
            $notify_ui.hide();
        }
        else {
            bf.postMessage({ "command": "resume" }); 
        }
        setState(State.RUNNING);
    }

    function setState(state) {
        $state_ui.removeClass(StateClass[curState]);
        $state_ui.addClass(StateClass[state]);
        $state_ui.text(state);
        curState = state;
        switch (state) {
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
            case State.FINISHED:
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
        $notify_ui.removeClass(curNotifyClass);
        curNotifyClass = "alert-danger";
        $notify_ui.addClass(curNotifyClass);
        $notify_ui.text("FATAL ERROR: " + message);
        $notify_ui.show();
    }

    function promptInput() {
        $input_ui.val("");
        // log consumed input
        // check for valid input (ascii)
        $notify_ui.removeClass(curNotifyClass);
        curNotifyClass = "alert-info";
        $notify_ui.addClass(curNotifyClass);
        $notify_ui.text("Program is waiting for input. Enter your input in the proper field and resume.");
        $notify_ui.show();
    }
/* ================== End of UI utility functions ================ */

}); // End of document.ready closure



