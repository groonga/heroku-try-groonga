jQuery(function($, undefined) {
  var id = Math.random().toString();
  var sendCommandQueue = [];

  function enqueueCommand(command, onResponse) {
    var sendCommand = function() {
      var success = function(data, textStatus, jqXHR) {
        var response;
        if (typeof data == "string") {
          response = data;
        } else {
          response = JSON.stringify(data, undefined, 2);
        }
        onResponse(response);

        sendCommandQueue.shift();
        if (sendCommandQueue.length > 0) {
          sendCommandQueue[0]();
        }
      };
      $.post("sessions/" + id, command, success);
    };

    sendCommandQueue.push(sendCommand);
    if (sendCommandQueue.length == 1) {
      sendCommand();
    }
  }

  $("#terminal").terminal(function(command, term) {
    if (command === "") {
      return;
    }

    enqueueCommand(command, function(response) {
      if (response.length == 0) {
        return;
      }
      term.echo(response);
    });
  }, {
    greetings: "",
    height: 400,
    prompt: "groonga> "
  });

  $("#terminal").mousewheel(function(event) {
    this.scrollTop += event.deltaY * -10;
    return event.preventDefault();
  });

  $("#paste-submit").click(function(event) {
    var text = $("#paste-area").val();
    var lines = text.replace(/\r\n|\r/g, "\n").split("\n");
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (line === "") {
        continue;
      }
      enqueueCommand(line, function(response) {
        if ($("#paste-alert").prop("checked")) {
          alert(response);
        }
      });
    }
  });
});
