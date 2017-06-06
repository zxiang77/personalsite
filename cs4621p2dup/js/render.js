var MAX_SELECTION = 3;
var MAX_GDP = 200000; // 182668
var MIN_GDP = 200;
var MAX_LIFE_EXPECTANCY = 90;
var MIN_LIFE_EXPECTANCY = 10;
var MAX_POPULATION = 1400000000;

var canvasName = "webglCanvas";
var backgroundVertexShader = "backgroundVertexShader";
var backgroundFragementShader = "backgroundFragementShader";
var lineVertexShader = "lineVertexShader";
var lineFragmentShader = "lineFragmentShader";
var selectCircleVertexShader = "selectCircleVertexShader";
var selectCircleFragmentShader = "selectCircleFragmentShader";
var highlightCircleVertexShader = "highlightCircleVertexShader";
var highlightCircleFragmentShader = "highlightCircleFragmentShader";
var outerCircleVertexShader = "outerCircleVertexShader";
var outerCircleFragmentShader = "outerCircleFragmentShader";
var circleVertexShader = "circleVertexShader"
var circleFragmentShader = "circleFragmentShader"
var countryConnectVertexShader = "countryConnectVertexShader"
var countryConnectFragmentShader = "countryConnectFragmentShader"
var circleOutlineVertexShader = "circleOutlineVertexShader"
var circleOutlineFragmentShader = "circleOutlineFragmentShader"

var nPixel = 512;

var startYear = 1800;
var endYear = 2015;
var nYears = endYear - startYear + 1;

var currentYear = 1800;
var linearX = true;
var linearY = true;

var maxX = MAX_GDP;
var maxY = MAX_LIFE_EXPECTANCY;
var maxSize = MAX_POPULATION;
var minSize = 5 / nPixel;
// num triangles to draw for a circle
var nCorners = 24;
var populationScale = 100 / nPixel;
var transparency = 0.5;
var regionColor = {
    "Asia": [0.41796875, 0.6796875, 0.8359375],     // blue
    "Europe": [0.98828125, 0.55078125, 0.234375],   // orange
    "Africa": [0.453125, 0.765625, 0.4609375],      // green
    "America": [0.6171875, 0.6015625, 0.78125],     // purple
}
var outerCircleLineColor = [0.6, 0.6, 0.6];
var highlightColor = [0.8359375, 0.15234375, 0.15625];
// mouse x y on canvas
var mouseX = -1;
var mouseY = -1;
var hovered = false;

var mouseClickX = -1;
var mouseClickY = -1;

var countryList = getCountryList();
var nCountries = countryList.length;
var lifeExpectancyList = getLifeExpectancy();
var gdpPerCapitaList = getGdpPerCapita();
var populationList = getPopulation();

function getData() {
    var data = {};

    for (c in countryList) {
        var country = countryList[c]["name"];
        var yearData = {};
        for (var i = 0; i < nYears; i++) {
            var year = startYear + i;
            lifeExpectancy = lifeExpectancyList[country] ? lifeExpectancyList[country][i] : null;
            gdpPerCapita = gdpPerCapitaList[country] ? gdpPerCapitaList[country][i] : null;
            population = populationList[country] ? populationList[country][i] : null;
            yearData[year] = {
                "country" : country,
                "year" : year,
                "lifeExpectancy": lifeExpectancy,
                "gdpPerCapita": gdpPerCapita,
                "population": population,
            };
        }
        data[country] = {
            "country" : country,
            "region": countryList[c]["region"],
            "abbreviation": countryList[c]["abbreviation"],
            "isSelected": false,
            "year": yearData,
        };
    }
    return data
}

var data = getData();

function getObjectMaxValue(obj) {
    return Math.max.apply(null, Object.keys(obj).map(
        function(key){
            return Math.max.apply(null, obj[key]);
        }));
}

// maps [min, max] to [-0.9, 0.9]
function logMapping(d, min, max) {
    return (Math.log(d) - Math.log(min)) / (Math.log(max) - Math.log(min)) * 1.8 - 0.9;
}

function linearMapping(d, min, max) {
    return (d - min) / (max - min) * 1.8 - 0.9;
}

function mouseXToGdp(mouseX) {
    var min = MIN_GDP;
    var max = MAX_GDP;
    var x = mouseX / nPixel * 2.0 - 1.0;
    return linearX ?
        (x + 0.9) / 1.8 * (max - min) + min :
        Math.exp((x + 0.9) / 1.8 * (Math.log(max) - Math.log(min)) + Math.log(min));
}

function mouseYToLifeExpectancy(mouseY) {
    var min = MIN_LIFE_EXPECTANCY;
    var max = MAX_LIFE_EXPECTANCY;
    var y = mouseY / nPixel * 2.0 - 1.0;
    return linearY ?
        (y + 0.9) / 1.8 * (max - min) + min :
        Math.exp((y + 0.9) / 1.8 * (Math.log(max) - Math.log(min)) + Math.log(min));
}

function updateCountryGeom() {
    maxX = linearX ? MAX_GDP : Math.log(MAX_GDP);
    maxY = linearY ? MAX_LIFE_EXPECTANCY : Math.log(MAX_LIFE_EXPECTANCY);
    for (country in data) {
        for (var year = startYear; year < endYear + 1; year++) {
            year = year.toString();
            if (data[country] && data[country]["year"][year]) {
                var x = linearX ?
                    linearMapping(
                        data[country]["year"][year]["gdpPerCapita"],
                        MIN_GDP,
                        MAX_GDP
                    ):
                    logMapping(
                        data[country]["year"][year]["gdpPerCapita"],
                        MIN_GDP,
                        MAX_GDP
                    );
                    Math.log(data[country]["year"][year]["gdpPerCapita"]) / maxX * 2 - 1;
                var y = linearY ?
                    linearMapping(
                        data[country]["year"][year]["lifeExpectancy"],
                        MIN_LIFE_EXPECTANCY,
                        MAX_LIFE_EXPECTANCY
                    ):
                    logMapping(
                        data[country]["year"][year]["lifeExpectancy"],
                        MIN_LIFE_EXPECTANCY,
                        MAX_LIFE_EXPECTANCY
                    );
                var size = Math.max(minSize,
                    Math.sqrt(data[country]["year"][year]["population"]) / Math.sqrt(maxSize) * populationScale);
                data[country]["year"][year]["x"] = x;
                data[country]["year"][year]["y"] = y;
                data[country]["year"][year]["size"] = size;
            }
        }
    }
}


// ---------------------- set up functions ---------------------
// Set up the canvas context
function initializeWebGL(canvasName) {
    var canvas = $("#" + canvasName);
    // Getting WebGL context the right way
    var gl = null;
    try {
        gl = canvas[0].getContext("experimental-webgl");
        if (!gl) {
            gl = canvas[0].getContext("webgl");
        }
    } catch (error) {
        // NO-OP
    }
    if (!gl) {
        alert("Could not get WebGL context!");
        throw new Error("Could not get WebGL context!");
    }
    return gl;
}

function createShader(gl, shaderScriptId) {
    var shaderScript = $("#" + shaderScriptId);
    var shaderSource = shaderScript[0].text;
    var shaderType = null;
    if (shaderScript[0].type == "x-shader/x-vertex") {
        shaderType = gl.VERTEX_SHADER;
    } else if (shaderScript[0].type == "x-shader/x-fragment") {
        shaderType = gl.FRAGMENT_SHADER;
    } else {
        throw new Error("Invalid shader type: " + shaderScript[0].type)
    }
    var shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        var infoLog = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error("An error occurred compiling the shader: " + infoLog);
    } else {
        return shader;
    }
}

function createGlslProgram(gl, vertexShaderId, fragmentShaderId) {
    var program = gl.createProgram();
    gl.attachShader(program, createShader(gl, vertexShaderId));
    gl.attachShader(program, createShader(gl, fragmentShaderId));
    gl.linkProgram(program);
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        var infoLog = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error("An error occurred linking the program: " + infoLog);
    } else {
        return program;
    }
}

//buffer operations

//bind data to buffer using [kind]buffer in the context gl
function bindBuffer(gl, buffer, data, kind) {
    var glkind = kind == "array" ? gl.ARRAY_BUFFER : gl.ELEMENT_ARRAY_BUFFER;
    gl.bindBuffer(glkind, buffer);
    gl.bufferData(glkind, data, gl.STATIC_DRAW);
    gl.bindBuffer(glkind, null);
}

// set up vertex attribute
function setVertexBufferAttr(gl, program, kind, buffer, attr, conf){
    var glkind = kind == "array" ? gl.ARRAY_BUFFER : gl.ELEMENT_ARRAY_BUFFER;
    gl.bindBuffer(glkind, buffer);
    var attrLocation = gl.getAttribLocation(program, attr);
    gl.enableVertexAttribArray(attrLocation);
    gl.vertexAttribPointer(
        attrLocation, conf.unitSize, gl.FLOAT, false, conf.step, conf.offset
    );
    gl.bindBuffer(glkind, null);
}

function drawFromElementBuffer(buffer, numPoints, offset, drawKind){
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.drawElements(drawKind, numPoints, gl.UNSIGNED_SHORT, offset);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

function drawFromArrayBuffer(buffer, numPoints, offset, drawKind){
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.drawArrays(drawKind, 0, numPoints);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function drawTriangleFromElementBuffer(buffer, numPoints, offset){
    drawFromElementBuffer(buffer, numPoints, offset, gl.TRIANGLES);
}

function drawTriangleFromArrayBuffer(buffer, numPoints, offset){
    drawFromArrayBuffer(buffer, numPoints, offset, gl.TRIANGLES);
}

function drawLineFromArrayBuffer(buffer, numPoints, offset){
    drawFromArrayBuffer(buffer, numPoints, offset, gl.LINES);
}

function drawLineStripFromArrayBuffer(buffer, numPoints, offset){
    drawFromArrayBuffer(buffer, numPoints, offset, gl.LINE_STRIP);
}

function drawLineloopFromElementBuffer(buffer, numPoints, offset){
    drawFromElementBuffer(buffer, numPoints, offset, gl.LINE_LOOP);
}

function drawLineFromElementBuffer(buffer, numPoints, offset){
    drawFromElementBuffer(buffer, numPoints, offset, gl.LINES);
}

//set uniforms
function setUniform3f(gl, program, name, x, y, z){
    var loc = gl.getUniformLocation(program, name);
    gl.uniform3f(loc, x, y, z);
}
function setUniform2f(gl, program, name, x, y){
    var loc = gl.getUniformLocation(program, name);
    gl.uniform2f(loc, x, y);
}
function setUniform1f(gl, program, name, x){
    var loc = gl.getUniformLocation(program, name);
    gl.uniform1f(loc, x);
}
function setUniform1i(gl, program, name, x){
    var loc = gl.getUniformLocation(program, name);
    gl.uniform1i(loc, x);
}
function setUniform3fa(gl, program, name, count, data){
    for(var i=0; i<count; i++) {
       var uniformName = name+"[" + i + "]";
       setUniform3f(gl, program, uniformName, data[i*3], data[i*3+1], data[i*3+2]);
   }
}
function setUniform1fa(gl, program, name, count, data){
    for(var i=0; i<count; i++) {
       var uniformName = name+"[" + i + "]";
       setUniform1f(gl, program, uniformName, data[i]);
   }
}
function setUniform1ia(gl, program, name, count, data){
    for(var i=0; i<count; i++) {
       var uniformName = name+"[" + i + "]";
       setUniform1i(gl, program, uniformName, data[i]);
   }
}

function hasData(country, year) {
    var yearn = year.toString();
    return (data[country] != undefined) &&
        (data[country]["year"][yearn] != undefined) &&
        (data[country]["year"][yearn]["gdpPerCapita"] != undefined) &&
        (data[country]["year"][yearn]["gdpPerCapita"] > 0) &&
        (data[country]["year"][yearn]["lifeExpectancy"] != undefined) &&
        (data[country]["year"][yearn]["lifeExpectancy"] > 0) &&
        (data[country]["year"][yearn]["population"] != undefined) &&
        (data[country]["year"][yearn]["population"] > 0);
}

function needDraw(country, year) {
    if (hasData(country, year) == true) {
        if ((data[country]["isSelected"] == true && year <= currentYear)
        || year == currentYear) {
            return true;
        }
    }
    return false;
}
// get the circle mouse is on
function mouseOn() {
    var mx = mouseX / nPixel * 2 - 1;
    var my = mouseY / nPixel * 2 - 1;

    for (country in data) {
        if (data[country]["isSelected"]) {
            for (year in data[country]["year"]) {
                if (hasData(country, year) && year <= currentYear) {
                    var x = data[country]["year"][year]["x"];
                    var y = data[country]["year"][year]["y"];
                    var r = data[country]["year"][year]["size"];
                    var inCircle = (mx - x)*(mx - x) + (my - y)*(my - y) < r*r;
                    if (inCircle) {
                        hovered = true;
                        return {
                            "country": country,
                            "year": year,
                        };
                    }
                }
            }
        } else {
            if (hasData(country, currentYear)) {
                var x = data[country]["year"][currentYear]["x"];
                var y = data[country]["year"][currentYear]["y"];
                var r = data[country]["year"][currentYear]["size"];
                var inCircle = (mx - x)*(mx - x) + (my - y)*(my - y) < r*r;
                if (inCircle) {
                    hovered = true;
                    return {
                        "country": country,
                        "year": currentYear,
                    };
                }
            }
        }
    }
    hovered = false;
    return null;
}

var gl = initializeWebGL(canvasName);

// ------------------ background triangles ------------------
var backgroundProgram =
    createGlslProgram(gl, backgroundVertexShader, backgroundFragementShader);
var backgroundVert = [
    -1.0, -1.0,   // lower left
    1.0, -1.0,   // lower right
    1.0, 1.0,   // top right
    -1.0, 1.0,   // top left
];

var backgroundInd = [0, 1, 2, 0, 2, 3];

var backgroundVertArray = new Float32Array(backgroundVert);
var backgroundVertBuffer = gl.createBuffer();
bindBuffer(gl, backgroundVertBuffer, backgroundVertArray, "array")

var backgroundIndArray = new Uint16Array(backgroundInd);
var backgroundIndBuffer = gl.createBuffer();
bindBuffer(gl, backgroundIndBuffer, backgroundIndArray, "element")

// ------------------ Lines  ------------------
// generate
function generateLogValues() {
    var logValues = [];
    for (var i = 1; i < 10; i++) {
        logValues.push(i * 10);
    }
    for (var i = 1; i < 10; i++) {
        logValues.push(i * 100);
    }
    for (var i = 1; i <= 10; i++) {
        logValues.push(i * 1000);
    }
    return logValues.map(function(d) {
        return Math.log(d) / Math.log(3000) * 2.0 - 1.0;
    });
}

var lineProgram = createGlslProgram(gl, lineVertexShader, lineFragmentShader);
function getLineBuffer() {
    var lineVert = [];
    var nLines = 21;
    var logValues = generateLogValues();
    for (var i = 0; i < nLines; i++) {
        if (linearY) {
            lineVert.push(-1.0);
            lineVert.push(-1.0 + 0.2 * i);
            lineVert.push(1.0);
            lineVert.push(-1.0 + 0.2 * i);
        } else {
            lineVert.push(-1.0);
            lineVert.push(logValues[i]);
            lineVert.push(1.0);
            lineVert.push(logValues[i]);
        }
        if (linearX) {
            lineVert.push(-1.0 + 0.2 * i);
            lineVert.push(-1.0);
            lineVert.push(-1.0 + 0.2 * i);
            lineVert.push(1.0);
        } else {
            lineVert.push(logValues[i]);
            lineVert.push(-1.0);
            lineVert.push(logValues[i]);
            lineVert.push(1.0);
        }
    }

    var lineVertArray = new Float32Array(lineVert);
    var lineVertBuffer = gl.createBuffer();
    bindBuffer(gl, lineVertBuffer, lineVertArray, "array");
    return {
        "lineVertBuffer": lineVertBuffer,
        "nLines": nLines,
    };
}


// ------------------  SelectCircles  ------------------
// appear when a country is selected
var selectCircleProgram = createGlslProgram(gl, selectCircleVertexShader, selectCircleFragmentShader);
var selectCircleVert = [];
// number of select circles to draw when one circle has mouse on it
var nSelectCircles = 3;
var selectCircleSizeScale = [1.0, 2.0, 3.0];
for (var j = 0; j < nSelectCircles; j++) {
    for (var i = 0; i < nCorners; i++) {
        var theta = 2 * Math.PI * i / nCorners;
        selectCircleVert.push(Math.cos(theta));
        selectCircleVert.push(Math.sin(theta));
        selectCircleVert.push(selectCircleSizeScale[j]);
    }
}

var selectCircleInd = [];
for (var j = 0; j < nSelectCircles; j++) {
    for (var i = 0; i < nCorners; i++) {
        selectCircleInd.push(j * nCorners + i % nCorners);
        selectCircleInd.push(j * nCorners + (i+1) % nCorners);
    }
}

var selectCircleVertArray = new Float32Array(selectCircleVert);
var selectCircleVertBuffer = gl.createBuffer();
bindBuffer(gl, selectCircleVertBuffer, selectCircleVertArray, "array");
var selectCircleIndArray = new Uint16Array(selectCircleInd);
var selectCircleIndBuffer = gl.createBuffer();
bindBuffer(gl, selectCircleIndBuffer, selectCircleIndArray, "element");

function setUpSelectCircleUniforms(gl, program) {
    var highlighted = mouseOn();
    if (hovered) {
        var country = highlighted["country"];
        var year = highlighted["year"];
        var x = data[country]["year"][year]["x"];
        var y = data[country]["year"][year]["y"];
        var size = data[country]["year"][year]["size"];

        setUniform2f(gl, program, "center", x, y);
        setUniform1f(gl, program, "size", size);
    } else {
        setUniform2f(gl, program, "center", 0.0, 0.0);
        setUniform1f(gl, program, "size", 0.0);
    }

}

// ------------------  HighlightCircle  ------------------
// appear when a country is selected
var highlightCircleProgram = createGlslProgram(gl, highlightCircleVertexShader, highlightCircleFragmentShader);
var highlightCircleVert = [];
for (var i = 0; i < nCorners; i++) {
    var theta = 2 * Math.PI * i / nCorners;
    highlightCircleVert.push(Math.cos(theta));
    highlightCircleVert.push(Math.sin(theta));
}
highlightCircleVert.push(0.0);
highlightCircleVert.push(0.0);

var highlightCircleInd = [];
for (var i = 0; i < nCorners; i++) {
    highlightCircleInd.push(i);
    highlightCircleInd.push((i + 1) % nCorners);
    highlightCircleInd.push(nCorners);
}


var highlightCircleVertArray = new Float32Array(highlightCircleVert);
var highlightCircleVertBuffer = gl.createBuffer();
bindBuffer(gl, highlightCircleVertBuffer, highlightCircleVertArray, "array");
var highlightCircleIndArray = new Uint16Array(highlightCircleInd);
var highlightCircleIndBuffer = gl.createBuffer();
bindBuffer(gl, highlightCircleIndBuffer, highlightCircleIndArray, "element");

//-------------------------country circles-------------------------------
var countryCircleProgram = createGlslProgram(gl, circleVertexShader, circleFragmentShader);

function createNameMapping() {
    countryMap = {};
    var idx = 0;
    for (country in data){
        countryMap[country] = idx;
        idx++;
    }
    return countryMap;
}

function hasSelected(){
    var selected = false;
    for (country in data){
        if (data[country] != undefined){
            selected = selected || data[country]["isSelected"];
        }
    }
    return selected;
}

function createSelectionMap(countryMap) {
    selectionMap = new Array(nCountries);
    for (country in data){
        selectionMap[countryMap[country]] = data[country]["isSelected"] ? 1 : 0;
    }
    return selectionMap;
}

//give range (0, base) if not selected. Otherwise give (-1, -0.5)
function calculateYearZ(year, selected, base, countryID, isOutline){
    var offset = (year - startYear + 1) / (nYears)
    var interval = 1 / nYears / nCountries;
    var incr = isOutline ? 0 : interval / 2;
    if (selected <= 0){
        return (1-offset) * base + countryID * interval + incr;
    }else{
        return -0.5 * offset + countryID * interval + incr;
    }
}

function getGlobalTransparency() {
    if (hasSelected() || hovered) {
        return transparency;
    }
    return 1.0;
}

function getCountryBuffer() {
    countryMap = createNameMapping();
    countryVert = [];
    var countryVertexCount = 0;
    var globalTransparency = getGlobalTransparency();
    var countryID = 0;
    for (country in data) {
        var alpha = globalTransparency;
        var selected = 0;
        if (data[country]["isSelected"] == true){
            selected = 1;
            if (hovered !== true){
                alpha = 1.0;
            }
        }

        for (var year = startYear; year < endYear + 1; year++) {
            yearn = year.toString();
            if (needDraw(country, year)) {
                var z = calculateYearZ(year, selected, 0.5, countryID, false);
                var x = data[country]["year"][yearn]["x"];
                var y = data[country]["year"][yearn]["y"];
                var size = data[country]["year"][yearn]["size"];
                var color = regionColor[data[country]["region"]];
                // push vertices
                for (var i = 0; i < nCorners; i++) {
                    //push: this, next, center
                    var theta = 2 * Math.PI * i / nCorners;
                    countryVert.push(size * Math.cos(theta) + x);
                    countryVert.push(size * Math.sin(theta) + y);
                    countryVert.push(z);
                    countryVert.push(color[0]);
                    countryVert.push(color[1]);
                    countryVert.push(color[2]);
                    countryVert.push(alpha);
                    countryVertexCount++;

                    var theta = 2 * Math.PI * ((i+1) % nCorners) / nCorners;
                    countryVert.push(size * Math.cos(theta) + x);
                    countryVert.push(size * Math.sin(theta) + y);
                    countryVert.push(z);
                    countryVert.push(color[0]);
                    countryVert.push(color[1]);
                    countryVert.push(color[2]);
                    countryVert.push(alpha);
                    countryVertexCount++;

                    countryVert.push(x);
                    countryVert.push(y);
                    countryVert.push(z);
                    countryVert.push(color[0]);
                    countryVert.push(color[1]);
                    countryVert.push(color[2]);
                    countryVert.push(alpha);
                    countryVertexCount++;
                }
            }
        }
        countryID ++;
    }
    var countryVertArray = new Float32Array(countryVert);
    var countryVertBuffer = gl.createBuffer();
    bindBuffer(gl, countryVertBuffer, countryVertArray, "array");
    return {
        "countryVertBuffer": countryVertBuffer,
        "countryVertexCount": countryVertexCount,
    }
}
//-------------------------Country Circle outlines--------------------------
var countryOutlineProgram = createGlslProgram(gl, circleOutlineVertexShader,
    circleOutlineFragmentShader);
function getCountryOutlineBuffer() {
    countryOutlineVert = [];
    var countryVertexCount = 0;
    var countryID = 0;
    var globalTransparency = getGlobalTransparency();
    for (country in data) {
        var alpha = globalTransparency;
        var selected = 0;
        if (data[country]["isSelected"] == true){
            selected = 1;
            if (hovered !== true){
                alpha = 1.0;
            }
        }
        for (var year = startYear; year < endYear + 1; year++) {
            yearn = year.toString();
            if (needDraw(country, year)) {
                var x = data[country]["year"][yearn]["x"];
                var y = data[country]["year"][yearn]["y"];
                var z = calculateYearZ(year, selected, 0.5, countryID, true);
                var size = data[country]["year"][yearn]["size"];
                // push vertices
                for (var i = 0; i < nCorners; i++) {
                    //push: this, next
                    var theta = 2 * Math.PI * i / nCorners;
                    countryOutlineVert.push(size * Math.cos(theta) + x);
                    countryOutlineVert.push(size * Math.sin(theta) + y);
                    countryOutlineVert.push(z);
                    countryOutlineVert.push(alpha);
                    countryVertexCount++;

                    var theta = 2 * Math.PI * ((i+1) % nCorners) / nCorners;
                    countryOutlineVert.push(size * Math.cos(theta) + x);
                    countryOutlineVert.push(size * Math.sin(theta) + y);
                    countryOutlineVert.push(z);
                    countryOutlineVert.push(alpha);
                    countryVertexCount++;
                }
            }
        }
        countryID++;
    }
    var countryOutlineVertArray = new Float32Array(countryOutlineVert);
    var countryOutlineVertBuffer = gl.createBuffer();
    bindBuffer(gl, countryOutlineVertBuffer, countryOutlineVertArray, "array");
    return {
        "countryOutlineVertBuffer": countryOutlineVertBuffer,
        "countryOutlineVertexCount": countryVertexCount,
    }
}

//-----------------------Country Connect Lines---------------------------
var countryConnectProgram =
    createGlslProgram(gl, countryConnectVertexShader,
        countryConnectFragmentShader);
function getCountryConnectLines() {
    countryConnectLine = []
    for (country in data) {
        var countryLine = []
        var color = regionColor[data[country]["region"]];
        for (var year = startYear; year < endYear + 1; year++) {
            yearn = year.toString();
            if (needDraw(country, year)) {
                var x = data[country]["year"][yearn]["x"];
                var y = data[country]["year"][yearn]["y"];

                countryLine.push(x);
                countryLine.push(y);
                countryLine.push(color[0]);
                countryLine.push(color[1]);
                countryLine.push(color[2]);
            }
        }
        if (countryLine.length > 5){
            countryConnectLine.push(countryLine);
        }
    }
    return countryConnectLine;
}
//-----------------------attribute assignment----------------------------
function drawBackground(vbuf, ibuf, gl, program, vAttrName){
    setVertexBufferAttr(gl, program, "array", vbuf, vAttrName, {
        unitSize : 2,
        step     : 4*2,
        offset   : 0,
    });
    drawTriangleFromElementBuffer(ibuf, 6, 0);
}

function drawBackgroundLines(vbuf, gl, program, vAttrName, length){
    setVertexBufferAttr(gl, program, "array", vbuf, vAttrName, {
        unitSize : 2,
        step     : 4*2,
        offset   : 0,
    });
    drawLineFromArrayBuffer(vbuf, length, 0);
}

function drawSelectCircles(vbuf, ibuf, gl, program, vAttrName, cIndAttrName, length){
    setVertexBufferAttr(gl, program, "array", vbuf, vAttrName, {
        unitSize : 2,
        step     : 4*3,
        offset   : 0,
    });
    setVertexBufferAttr(gl, program, "array", vbuf, cIndAttrName, {
        unitSize : 1,
        step     : 4*3,
        offset   : 8,
    });
    drawLineFromElementBuffer(ibuf, length, 0);
}
function drawHighlightCircle(vbuf, ibuf, gl, program, vAttrName, length){
    setVertexBufferAttr(gl, program, "array", vbuf, vAttrName, {
        unitSize : 2,
        step     : 4*2,
        offset   : 0,
    });
    drawTriangleFromElementBuffer(ibuf, length, 0);
}
function drawCountryCircles(vbuf, gl, program, vAttrName,
    fAttrName, sAttrName, length){
    setVertexBufferAttr(gl, program, "array", vbuf, vAttrName, {
        unitSize : 3,
        step     : 4*7,
        offset   : 0,
    });
    setVertexBufferAttr(gl, program, "array", vbuf, fAttrName, {
        unitSize : 4,
        step     : 4*7,
        offset   : 4*3,
    });
    drawTriangleFromArrayBuffer(vbuf, length, 0);
}

function drawOuterCirlces(vbuf, ibuf, gl, program, vAttrName,
    fAttrName, sAttrName, length) {
    setVertexBufferAttr(gl, program, "array", vbuf, vAttrName, {
        unitSize : 2,
        step     : 4*7,
        offset   : 0,
    });
    setVertexBufferAttr(gl, program, "array", vbuf, fAttrName, {
        unitSize : 4,
        step     : 4*7,
        offset   : 4*2,
    });
    setVertexBufferAttr(gl, program, "array", vbuf, sAttrName, {
        unitSize : 1,
        step     : 4*7,
        offset   : 4*6,
    });
    drawLineFromElementBuffer(ibuf, length, 0);
}

function drawCountryConnectLines(vbuf, gl, program,
    vAttrName, cAttrName, length){
    setVertexBufferAttr(gl, program, "array", vbuf, vAttrName, {
        unitSize : 2,
        step     : 4*5,
        offset   : 0,
    });
    setVertexBufferAttr(gl, program, "array", vbuf, cAttrName, {
        unitSize : 3,
        step     : 4*5,
        offset   : 4*2,
    });
    drawLineStripFromArrayBuffer(vbuf, length, 0);
}

function drawCountryOutlines(vbuf, gl, program, vAttrName, cAttrName, length){
    setVertexBufferAttr(gl, program, "array", vbuf, vAttrName, {
        unitSize : 3,
        step     : 4*4,
        offset   : 0,
    });
    setVertexBufferAttr(gl, program, "array", vbuf, cAttrName, {
        unitSize : 1,
        step     : 4*4,
        offset   : 3*4,
    });

    drawLineFromArrayBuffer(vbuf, length, 0);
}
//---------------------main drawing logic--------------------------------
function updateWebGL(time) {
    updateCountryGeom();

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.depthFunc(gl.LESS);
    gl.enable(gl.DEPTH_TEST);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);

    gl.useProgram(backgroundProgram);
    drawBackground(
        backgroundVertBuffer, backgroundIndBuffer,
        gl, backgroundProgram, "position"
    );

    var lineData = getLineBuffer();
    var lineVertBuffer = lineData["lineVertBuffer"];
    var nLines = lineData["nLines"];
    gl.useProgram(lineProgram);
    drawBackgroundLines(lineVertBuffer, gl, lineProgram, "position", nLines * 4);

    if (hovered) {
        gl.useProgram(selectCircleProgram);
        setUpSelectCircleUniforms(gl, selectCircleProgram);
        drawSelectCircles(
            selectCircleVertBuffer, selectCircleIndBuffer, gl,
            selectCircleProgram, "position", "selectCircleSize", nSelectCircles * nCorners * 2
        );
        gl.useProgram(highlightCircleProgram);
        setUpSelectCircleUniforms(gl, highlightCircleProgram);
        drawHighlightCircle(
            highlightCircleVertBuffer, highlightCircleIndBuffer, gl,
            highlightCircleProgram, "position", nCorners * 3
        );
    }

    gl.useProgram(countryCircleProgram);
    var countryData = getCountryBuffer();
    var countryVertBuffer = countryData["countryVertBuffer"];
    var countryVertexCount = countryData["countryVertexCount"];
    if (countryVertexCount > 0) {
        drawCountryCircles(
            countryVertBuffer, gl,
            countryCircleProgram, "position", "color", "selected", countryVertexCount
        );
    }

    gl.useProgram(countryConnectProgram);
    var countryLines = getCountryConnectLines();
    for (var i = 0; i < countryLines.length; i++){
        var line = countryLines[i];
        var countryLineVertArray = new Float32Array(line);
        var countryLineBuffer = gl.createBuffer();
        bindBuffer(gl, countryLineBuffer, countryLineVertArray, "array");
        drawCountryConnectLines(countryLineBuffer, gl,
            countryConnectProgram, "position", "color", line.length/5);
    }

    gl.useProgram(countryOutlineProgram);
    var outlineData = getCountryOutlineBuffer();
    var outlineVertBuffer = outlineData["countryOutlineVertBuffer"];
    var outlineVertexCount = outlineData["countryOutlineVertexCount"];
    if (outlineVertexCount > 0){
        drawCountryOutlines(outlineVertBuffer, gl, countryOutlineProgram,
             "position", "alpha", outlineVertexCount);
    }

    window.requestAnimationFrame(updateWebGL);
}

window.requestAnimationFrame(updateWebGL);
