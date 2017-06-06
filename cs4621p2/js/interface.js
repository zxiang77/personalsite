/**
 * Created by zilixiang on 3/10/17.
 */
/**
 * updating year slider
 */

var isPlaying = false;
var yearSlider = $("#yearBar");
var lastYearUpdate;
var yearUpdateInterval = 100.0;
var playButton = $("#playButton");

yearSlider.slider({
    min : 1800,
    max : 2015
});

function startPlay() {
    isPlaying = true;
    playButton.html("Stop!");
    lastYearUpdate = performance.now();
    yearSlider.slider("disable");
}

function stopPlay() {
    isPlaying = false;
    playButton.html("Play!");
    yearSlider.slider("enable");
}

playButton.on("click", function () {
    if (isPlaying) stopPlay();
    else startPlay();
});

function updateUi() {
    currentYear = yearSlider.slider("value");

    if (isPlaying) {
        if (currentYear == 2015) stopPlay();
        else {
            var curTime = performance.now();
            if (curTime - lastYearUpdate > yearUpdateInterval) {
                lastYearUpdate = curTime;
                yearSlider.slider("value", currentYear + 1);
            }
        }
    }
    currentYear = yearSlider.slider("value");
    $("#curYear").html("<h1>" + currentYear + "</h1>");
    window.requestAnimationFrame(updateUi);
}
window.requestAnimationFrame(updateUi);

/**
 * create country check Box
 */
function createCountryCheckBoxes() {
    var countryHtmls = [];
    var i;
    for (i = 0; i < countryList.length; i++) {
        var cName = countryList[i]["name"];
        countryHtmls.push("<input type='checkbox' value='" + cName + "' id='checkBox" + i + "'>" + cName +"<br>");
    }
    $("#countryCheckBox").html(countryHtmls.join(""));
    function setCheckBoxChangeFunction(i) {
        var checkBoxName = "checkBox" + i;
        var checkBox = $("#" + checkBoxName);
        var name = countryList[i]["name"];
        checkBox.change(function () {
            // console.log(selectedCountries);
           var checked = checkBox.prop("checked");
           if (!checked) {
               data[name]['isSelected'] = false;
           } else {
               data[name]['isSelected'] = true;
           }
        });
    }

    for (i = 0; i < countryList.length; i++) {
        setCheckBoxChangeFunction(i);
    }
}

createCountryCheckBoxes();


/**
 * mouse-canvas interaction
 */
var webglCanvas = $("#webglCanvas");

function updateMousePos(event) {
    var formatter = new Intl.NumberFormat();
    mouseX = Math.round(event.clientX - webglCanvas[0].getBoundingClientRect().left);
    mouseY = webglCanvas[0].getBoundingClientRect().height -
        (event.clientY - webglCanvas[0].getBoundingClientRect().top);
    $("#cursorGDP").text(formatter.format(Math.round(mouseXToGdp(mouseX))));
    $("#cursorLifeExp").text(mouseYToLifeExpectancy(mouseY).toFixed(2));

    var curData = mouseOn();

    if (curData != null) {
        var dpData = data[curData['country']]['year'][curData['year']];
        $("#dpCountry").text(dpData['country']);
        $("#dpYear").text(dpData['year']);
        $("#dpLifeExp").text(dpData["lifeExpectancy"]);
        $("#dpGDP").text(dpData["gdpPerCapita"]);
        $("#dpPopulation").text(formatter.format(Math.round(dpData["population"])));
    }
}

webglCanvas.mousemove(updateMousePos);

webglCanvas.click(function (event) {
    mouseClickX = Math.round(event.clientX - webglCanvas[0].getBoundingClientRect().left);
    mouseClickY = webglCanvas[0].getBoundingClientRect().height -
        (event.clientY - webglCanvas[0].getBoundingClientRect().top);
    var curData = mouseOn();
    if (curData != null) {
        var i;
        for (i = 0; i < countryList.length; i++) {
            var idName = "#checkBox" + String(i);
            var checkBox = $(idName);
            if (checkBox.val() === curData['country']) {
                var status = checkBox.prop("checked");
                checkBox.prop("checked", !status);
                checkBox.trigger("change");
                break;
            }
        }
    }
});

/**
 * scale settings bar
 */
$("#scalePop").slider({
    min : 50 / nPixel,
    create : function() {
        $(this).slider("value", populationScale);
    },
    max : 150 / nPixel,
    step : 0.001,
    slide : function () {
        populationScale = $("#scalePop").slider("value");
    }
});

$("#scaleTransp").slider({
    min : 0,
    max : 1,
    step : 0.01,
    create : function () {
        $(this).slider("value", transparency);
    },
    slide : function () {
        transparency = $("#scaleTransp").slider("value");
    }
});

$("#scaleGDP").change(function () {
    linearX = $("#scaleGDP").val() === "linear";
});

$("#scaleLifeExp").change(function () {
    linearY = $("#scaleLifeExp").val() === "linear";
})

/**
 * deselect button
 */
$("#deselectButton").click(function () {
    var i;
    for (i = 0; i < countryList.length; i++) {
        var idName = "#checkBox" + String(i);
        var checkBox = $(idName);
        if (checkBox.prop("checked")) {
            checkBox.prop("checked", false);
            checkBox.trigger("change");
        }
    }
});
