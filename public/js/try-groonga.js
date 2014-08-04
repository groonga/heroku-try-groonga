jQuery(function($, undefined) {
  var id = Math.random().toString();
  var sendCommandQueue = [];
  var dataTable = null;

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

  String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
  }

  function isValidResponse(json) {
    var isValid = true;
    if (json.length != 3) {
       isValid = false;
    }
    return isValid;
  }

  function createColumns(column_defs) {
    var columns = [];
    for (var i = 0; i < column_defs.length; i++) {
      column_name = column_defs[i][0];
      columns.push({"title": column_name});
    }
    return columns;
  }

  function createColumnsWithCaption(caption) {
    var columns = [
      {"title": "Error code"},
      {"title": "Timestamp"},
      {"title": "Execution time"},
      {"title": caption}
    ]
    return columns;
  }

  function createDataset(header, result) {
    var dataset = [
      [
        header[0],
        header[2],
        header[1],
        result
      ]
    ]
    return dataset;
  }

  function createColumnsFromHash(data) {
    var columns = [];
    for (var column_name in data) {
      columns.push({"title": column_name});
    }
    return columns;
  }

  function createRowFromHash(data) {
    var row = [];
    for (var column_name in data) {
      row.push(data[column_name]);
    }
    return row;
  }

  function clearDataTable() {
    if (dataTable != null) {
      $('#datatable').dataTable().fnClearTable();
      $('#datatable').dataTable().fnDestroy();
      $('#datatable').empty();
      dataTable = null;
    }
  }

  function isReturnBooleanResult(query) {
    var commands = [
      "cache_limit",
      "clearlock",
      "column_create",
      "column_remove",
      "column_rename",
      "defrag",
      "delete",
      "load",
      "log_level",
      "log_put",
      "log_reopen",
      "quit",
      "shutdown",
      "table_create",
      "table_remove",
      "truncate",
    ]
    for (var i in commands) {
      if (query.indexOf(commands[i]) == 0) {
        return true;
      }
    }
    return false;
  }

  function renderDataTable(command, json) {
    var response_header = json[0]
    var response_body = json[1]
    var columns = [];
    var dataset = [];
    if (isValidResponse(response_header)) {
      if (command.indexOf("status") == 0 ||
          command.indexOf("normalize") == 0) {
        columns = createColumnsFromHash(response_body);
        dataset.push(createRowFromHash(response_body));
      } else if (command.indexOf("check") == 0) {
        columns = createColumnsFromHash(response_body[0]);
        dataset.push(createRowFromHash(response_body[0]));
      } else if (command.indexOf("table_list") == 0 ||
                 command.indexOf("column_list") == 0) {
        columns = createColumns(response_body[0]);
        if (response_body.length > 1) {
          for (var i = 1; i < response_body.length; i++) {
            dataset.push(response_body[i]);
          }
        }
      } else if (command.indexOf("tokenize") == 0) {
        columns = createColumnsFromHash(response_body[0]);
        for (var i = 0; i < response_body.length; i++) {
          var row = [];
          var item = response_body[i];
          console.log(item);
          for (var column in item) {
            console.log(column);
            row.push(item[column]);
          }
          dataset.push(row);
        }
      } else if (isReturnBooleanResult(command)) {
        columns = createColumnsWithCaption("Result");
        dataset = createDataset(response_header, response_body);
      } else if (command.indexOf("select") == 0) {
        column_defs = response_body[0][1];
        columns = createColumns(column_defs);
        count = response_body[0][0];
        if (count > 0) {
          rows = response_body[0];
          for (var i = 2; i < rows.length; i++) {
            row = rows[i];
            dataset.push(row);
          }
        }
      } else if (command.indexOf("tokenizer_list") == 0 ||
                 command.indexOf("normalizer_list") == 0) {
        caption = command.split("_")[0].capitalize();
        columns = [
          {"title": caption},
        ]
        for (var i in response_body) {
          item = response_body[i];
          dataset.push([item["name"]]);
        }
      }
    } else {
      columns = [
        {"title": "Error code"},
        {"title": "Error message"},
        {"title": "Timestamp"},
        {"title": "Execution time"}
      ]
      dataset = [
        [
          response_header[0],
          response_header[3],
          response_header[1],
          response_header[2]
        ]
      ]
    }

    clearDataTable();
    dataTable = $('#datatable').DataTable({
      "data": dataset,
      "columns": columns,
      "bDestroy": true,
      "bSort": false,
    });
    dataTable.draw();
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
      if (command.indexOf("dump") == 0) {
        clearDataTable();
      } else {
        json = JSON.parse(response);
        renderDataTable(command, json);
      }
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
});
