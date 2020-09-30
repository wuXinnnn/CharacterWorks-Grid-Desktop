const { ipcRenderer } = require("electron");
let fs = require("fs");
let configObj = JSON.parse(fs.readFileSync("./config.json"));
let cwIp = configObj.url;
let cwUrl = "http://" + cwIp + ":5201" || "http://127.0.0.1:5201";
let globalTimeOut = 2000;
$("#basic-url").val(cwIp);
var button_width = 120;
ipcRenderer.on("cwBtnActivate", function (event, grid_names, grid_value) {
  Activate_Button(grid_names, grid_value);
});
// Remotely trigger CW grid button when a web grid button is pressed.

$("#cwRefreshBtn").on("click", function () {
  var $btn = $(this).button("loading");
  ipcRenderer.send("CWShortCutUnRegister");
  ipcRenderer.removeAllListeners("cwBtnActivate");
  cwIp = $("#basic-url").val();
  cwUrl = "http://" + cwIp + ":5201" || "http://127.0.0.1:5201";
  configObj.url = cwIp;
  fs.writeFileSync("./config.json", JSON.stringify(configObj, null, 2));
  $("#select_box").html("<select id='drop'></select>");
  $("#grid_view").html("");
  Get_Grid_Names();
});

function resetAll() {
  $("#select_box").html("<select id='drop'></select>");
  $("#grid_view").html("");
  $("#cwRefreshBtn").button("reset");
}

function Activate_Button(grid_names, grid_value) {
  var activate_grid_button_cmd = {
    action: "activate_grid_cell",
    grid: grid_names,
    cell: grid_value,
  };

  $.ajax({
    url: cwUrl,
    type: "POST",
    data: JSON.stringify(activate_grid_button_cmd),
    timeout: globalTimeOut,
    dataType: "json",
    async: true,
    contentType: "application/json; charset=utf-8",
    success: function (resp) {
      console.log("Send To CW: " + JSON.stringify(activate_grid_button_cmd));
    },
    error: function (error) {
      resetAll();
      console.log(error);
      return;
    },
  });
}

// Create a web grid button and initialize it using given parameters.
function Button_Init(
  grid_name,
  grid_value,
  grid_names,
  grid_row,
  grid_color,
  grid_key
) {
  var grid_button = $("<button/>").attr({
    class: "button",
    type: "button",
    id: "cwID",
  });

  var button_color =
    "rgb(" + grid_color[0] + "," + grid_color[1] + "," + grid_color[2] + ")";

  $("#grid_view").append(grid_button);

  $(".button")
    .last()
    .on("click", function () {
      Activate_Button(grid_names, grid_value);
    });

  $(".button")
    .last()
    .css("box-shadow", "inset 0px 15px " + button_color);

  $(".button")
    .last()
    .html(grid_name + "<div class='tus'>" + grid_key + "</div>");

  if (grid_key != "") {
    ipcRenderer.send("CWShortCutRegister", grid_key, grid_names, grid_value);

    keys = grid_key.replace(",", " ");
    Mousetrap.bind(keys.toString().toLowerCase(), function () {
      Activate_Button(grid_names, grid_value);
    });
  }
  $("#cwRefreshBtn").button("reset");
}

// Create an empty button.
function Button_Empty(grid_row) {
  var grid_empty_button = $("<button/>").attr({
    class: "button_empty",
    type: "button",
    id: "cwID",
    value: "Drop Here",
  });

  $("#grid_view").append(grid_empty_button);
}

function Button_Size(btnsize) {
  $(".button").css("width", btnsize);
  $(".button").css("height", btnsize);
  $(".button_empty").css("width", btnsize);
  $(".button_empty").css("height", btnsize);
}

// add grid tabs
function Add_List(grid_names, grid_row) {
  $("#drop").append($("<option></option>").val(grid_row).html(grid_names));
}

// Drop Down List Change Handler.
$(function () {
  $("#drop").change(function () {
    $("#grid_view").empty();
    Mousetrap.reset();
    Get_Button_Names(
      $("option:selected", this).val(),
      $("option:selected", this).text()
    );
  });
});

$(document).on("change", "#cw_slider", function () {
  fontSize = 12 * ($(this).val() / 124);
  $(".button").css({ "font-size": fontSize });
  $("body").css("width", (button_count + 1) * $(this).val());
  button_width = $(this).val();
  Button_Size(button_width);
});

// Get Grid Buttons in selected tab and list grid buttons
function Get_Button_Names(grid_row, grid_names) {
  var get_grid_button_cmd = { action: "list_grid_cells", grid: grid_names };
  $.ajax({
    url: cwUrl,
    type: "POST",
    data: JSON.stringify(get_grid_button_cmd),
    timeout: globalTimeOut,
    dataType: "json",
    async: true,
    contentType: "application/json; charset=utf-8",
    success: function (resp) {
      document.title = grid_names;
      button_count = resp.grids[0].size[0];
      $("body").css("width", (button_count + 1) * button_width);

      for (var i = 0; i < resp.grids[0].size[1]; i++) {
        for (var j = 0; j < resp.grids[0].size[0]; j++) {
          var s = { position: [j, i] };
          flag = 0;
          for (var k = 0; k < resp.grids.length; k++) {
            for (var p = 0; p < resp.grids[k].cells.length; p++) {
              if (
                resp.grids[k].cells[p].position[0] == s.position[0] &&
                resp.grids[k].cells[p].position[1] == s.position[1]
              ) {
                Button_Init(
                  resp.grids[k].cells[p].text,
                  resp.grids[k].cells[p].position,
                  grid_names,
                  grid_row,
                  resp.grids[k].cells[p].color,
                  resp.grids[k].cells[p].key
                );
                flag = 1;
              }
            }
          }

          if (flag == 0) {
            Button_Empty(grid_row);
          }
        }
      }

      Button_Size(button_width);
      var value = document.getElementById("cw_slider").value;
      fontSize = 12 * (value / 124);
      $(".button").css({ "font-size": fontSize });
    },
    error: function (error) {
      resetAll();
      console.log(error);
      return;
    },
  });
}

// Get Grid Tabs and fill the Drop Down List.
function Get_Grid_Names() {
  var button_slider =
    '<input type="range" name="cw_slider" class="textbox" id="cw_slider" min="60" max="200" step="1" value="120" />';

  var get_grid_names_cmd = { action: "list_grid_names" };

  $.ajax({
    url: cwUrl,
    type: "POST",
    data: JSON.stringify(get_grid_names_cmd),
    timeout: globalTimeOut,
    dataType: "json",
    async: true,
    contentType: "application/json; charset=utf-8",
    success: function (resp) {
      if (resp.grids.length > 0) {
        for (var grid_row = 0; grid_row < resp.grids.length; grid_row++) {
          grid_names = resp.grids[grid_row];
          Add_List(grid_names, grid_row);
        }

        grid_names = resp.grids[0];
        Get_Button_Names(0, grid_names);
        $("#select_box").append(button_slider);
      } else {
        Add_List("No Grid Found", "0");
      }
    },
    error: function (error) {
      resetAll();
      console.log(error);
      return;
    },
  });
}
