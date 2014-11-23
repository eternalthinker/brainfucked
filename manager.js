/*
 * Manager class for running the Interpreter, and managing UI actions
 */

$(document).ready(function() {
    var $program_ui = $('#program');
    var $output_ui = $('#output');
    var $input_ui = $('#input');
    var $runtime_ui = $('#runtime');
    var $memory_btn = $('#show-memory');
    var $memory_modal = $('#memory');
    var $tape = $('#tape');
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
    $memory_btn.click(showMemory);
    $('.load-pgm').click(loadProgram);

    var State = Object.freeze({
        RUNNING: "RUNNING",
        PAUSED: "PAUSED",
        STOPPED: "STOPPED",
        READ: "READ_WAITING",
        FINISHED: "FINISHED"
    });

    // Quick lookup for Bootstrap styling class names: STATE => [stateClass, glyphiconClass]
    var StateClass = Object.freeze({
        RUNNING: ["alert-success", "play"],
        PAUSED: ["alert-warning", "pause"],
        STOPPED: ["alert-danger", "remove"],
        READ_WAITING: ["alert-info", "edit"],
        FINISHED: ["alert-success", "ok"]
    });

    var curState = State.STOPPED;
    var curNotifyClass = "alert-danger";
    var curMemory = { tape: [], idx: -1 };

    init();
    setState(State.STOPPED);

/* ================== BF Worker ================ */

    if(typeof(Worker) == "undefined") {
        $notify_ui.addClass(curNotifyClass);
        $notify_ui.text("No Web Worker support found in browser. Sorry, cannot run the interpreter!");
        $notify_ui.show();
    }
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
                $runtime_ui.text(runtime_str);
                curMemory = data.memory;
                if (! data.halted) {
                    setState(State.FINISHED);
                }
                else if (curState == State.RUNNING) {
                    setState(State.STOPPED);
                }
                break;
            }
            default:
                break;
        }
    };
/* ================== End of BF Worker ================ */


/* ================== UI utility functions ================ */

    function parseInput(input)
    {
        input = input.replace(/\\(\\|n|\d{1,3})/g, function (m0, m1) {
            switch (m1) {
                case "\\":      // "\\" becomes '\'    
                    return m1;
                    break;
                case "n":       // "\n" becomes NEWLINE
                    return '\n';
                    break;
                default:        // "\num" becomes ASCII(num)
                    var n = +m1;
                    if (n <= 255) {
                        return String.fromCharCode(n);
                    }
                    return m1;
                    break;
            }
        });
        return input
    }

    function init()
    {
        $output_ui.val("");
        $input_ui.val("");
        $runtime_ui.text("");
        $notify_ui.hide();
    }

    function start()
    {
        $output_ui.val("");
        $runtime_ui.text("");
        $notify_ui.hide();
        var program = $program_ui.val();
        var input = parseInput($input_ui.val());
        var optimize = $optimize_chk.prop('checked');
        setState(State.RUNNING);
        bf.postMessage({ "command": "run", "program": program, "input": input, "optimize": optimize });
    }

    function stop() 
    {
        setState(State.STOPPED);
        bf.postMessage({ "command": "halt" });
    }

    function pause() 
    {
        setState(State.PAUSED);
        bf.postMessage({ "command": "halt" });   
    }

    function resume() 
    {
        if (curState === State.READ) {
            var input = parseInput($input_ui.val());
            bf.postMessage({ "command": "input", "input": input });
            $notify_ui.hide();
        }
        else {
            bf.postMessage({ "command": "resume" }); 
        }
        setState(State.RUNNING);
    }

    function setState(state) 
    {
        $state_ui.removeClass(StateClass[curState][0]);
        $state_ui.addClass(StateClass[state][0]);
        $state_ui.html("<span class='glyphicon glyphicon-" + StateClass[state][1] + "'></span> " + state);
        curState = state;
        switch (state) {
            case State.RUNNING: {
                $run_btn.prop('disabled', true);
                $stop_btn.prop('disabled', false);
                $pause_btn.prop('disabled', false);
                $resume_btn.prop('disabled', true);
                $optimize_chk.prop('disabled', true);
                $memory_btn.prop('disabled', true);
                break;
            }
            case State.READ:
            case State.PAUSED: {
                $run_btn.prop('disabled', true);
                $stop_btn.prop('disabled', false);
                $pause_btn.prop('disabled', true);
                $resume_btn.prop('disabled', false);
                $optimize_chk.prop('disabled', true);
                $memory_btn.prop('disabled', false);
                break;
            }
            case State.FINISHED:
            case State.STOPPED: {
                $run_btn.prop('disabled', false);
                $stop_btn.prop('disabled', true);
                $pause_btn.prop('disabled', true);
                $resume_btn.prop('disabled', true);
                $optimize_chk.prop('disabled', false);
                $memory_btn.prop('disabled', false);
                if (curNotifyClass !== "alert-danger") {
                    $notify_ui.hide();
                }
                break;
            }
            default:
                break;
        }
    }

    function showError(message) 
    {
        $notify_ui.removeClass(curNotifyClass);
        curNotifyClass = "alert-danger";
        $notify_ui.addClass(curNotifyClass);
        $notify_ui.text("FATAL ERROR: " + message);
        $notify_ui.show();
    }

    function promptInput() 
    {
        $input_ui.val("");
        $input_ui.focus();
        // TODO: Log consumed input
        $notify_ui.removeClass(curNotifyClass);
        curNotifyClass = "alert-info";
        $notify_ui.addClass(curNotifyClass);
        $notify_ui.text("Program is awaiting input. Enter your input and resume.");
        $notify_ui.show();
    }

    function loadProgram(event) 
    {
        stop();
        init();
        $.get("examples/" + event.target.id + ".b", function (data) {
            $program_ui.val(data);
        }, "text");
        location.hash = '#';
    }

    function showMemory()
    {
        $tape.html("<tr><th>Index</th><th>Decimal</th><th>ASCII</th></tr>");
        for (var i = 0; i < curMemory.tape.length && i < 30000; ++i) {
            $tape.append("<tr class='" + ((i === curMemory.idx)?"success":"dummy") + "'>"
            + "<td>" + (i+1) + "</td>"
            + "<td>" + curMemory.tape[i] + "</td>"
            + "<td>" + String.fromCharCode(curMemory.tape[i]) + "</td>"
            + "</tr>");
        }
        $memory_modal.modal();
    }
/* ================== End of UI utility functions ================ */

}); // End of document.ready closure



