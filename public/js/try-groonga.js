jQuery(function($, undefined) {
    var id = Math.random().toString();
    $("#terminal").terminal(function(command, term) {
	if (command === "") {
	    term.echo("");
	} else {
	    var success = function(data, textStatus, jqXHR) {
		if (typeof data == "string") {
		    term.echo(data);
		} else {
		    term.echo(JSON.stringify(data, undefined, 2));
		}
	    };
	    $.post("sessions/" + id, command, success);
	}
    }, {
	greetings: "",
	height: 400,
	prompt: "groonga> "
    });
});
