var wallVertexShader = "wallVertexShader";
var wallFragementShader = "wallFragmentShader";
var skyVertexShader = "skyVertexShader";
var skyFragementShader = "skyFragmentShader";
var floorVertexShader = "floorVertexShader";
var floorFragementShader = "floorFragmentShader";
var wallPath = "data/wall.jpg";
var floorPath = "data/floor.jpg";
var imagePaths = [wallPath, floorPath];
var imagePathDict = { wallPath: 1, floorPath: 2};
var skyPaths = ["data/skyBox/posx.png", "data/skyBox/negx.png",
    "data/skyBox/posy.png", "data/skyBox/negy.png",
    "data/skyBox/posz.png", "data/skyBox/negz.png",];
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
        console.log("Error in "+shaderScriptId);
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

// ------------------texture------------------
function createTextureObj(gl, program, image){
    // Step 1: Create the texture object.
    var texture = gl.createTexture();
    // Step 2: Bind the texture object to the "target" TEXTURE_2D
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Step 3: (Optional) Tell WebGL that pixels are flipped vertically,
    //         so that we don't have to deal with flipping the y-coordinate.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    // Step 4: Download the image data to the GPU.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    // Step 5: Creating a mipmap so that the texture can be anti-aliased.
    gl.generateMipmap(gl.TEXTURE_2D);
    // Step 6: Clean up.  Tell WebGL that we are done with the target.
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
}

function createTextureCube(gl, program, sky){
    // Step 1: Create the texture object.
    var texture = gl.createTexture();
    // Step 2: Bind the texture object to the "target" TEXTURE_2D
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    // Step 3: (Optional) Tell WebGL that pixels are flipped vertically,
    //         so that we don't have to deal with flipping the y-coordinate.
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    var targets = [
       gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
       gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
       gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
    ];
    // Step 4: Download the image data to the GPU.
    for (var j = 0; j < 6; j++) {
        gl.texImage2D(targets[j], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sky[j]);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    // Step 5: Creating a mipmap so that the texture can be anti-aliased.
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    // Step 6: Clean up.  Tell WebGL that we are done with the target.
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    return texture;
}

function setTextureCube(gl, program, name, texture, idx){
    var loc = gl.getUniformLocation(program, name)
    if (loc != null) {
        // Step 1: Activate a "texture unit" of your choosing.
        gl.activeTexture(gl.TEXTURE0 + idx);
        // Step 2: Bind the texture you want to use.
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        // Step 3: Set the uniform to the "index" of the texture unit you just activated.
        gl.uniform1i(loc, idx);
    }
}

function setTexture(gl, program, name, texture, idx){
    var loc = gl.getUniformLocation(program, name)
    if (loc != null) {
        // Step 1: Activate a "texture unit" of your choosing.
        gl.activeTexture(gl.TEXTURE0 + idx);
        // Step 2: Bind the texture you want to use.
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // Step 3: Set the uniform to the "index" of the texture unit you just activated.
        gl.uniform1i(loc, idx);
    }
}

// ------------------ sky box ------------------
var gl = initializeWebGL("webglCanvas");

var skyProgram =
    createGlslProgram(gl, skyVertexShader, skyFragementShader);

var skyVert = [
        -1, -1, -1,
        1, 1, -1,
        1, 1, -1,
        -1, 1, -1,
        -1, -1, 1,
        1, -1, 1,
        1, 1, 1,
        -1, 1, 1,
    ];

var skyInd = [
        0, 4, 5,
        0, 5, 1,
        1, 5, 6,
        1, 6, 2,
        2, 6, 7,
        2, 7, 3,
        3, 7, 4,
        3, 4, 0,
        4, 7, 6,
        4, 6, 5,
        0, 1, 2,
        0, 2, 3,
    ];

var skyVertArray = new Float32Array(skyVert);
var skyVertBuffer = gl.createBuffer();
bindBuffer(gl, skyVertBuffer, skyVertArray, "array")

var skyIndArray = new Uint16Array(skyInd);
var skyIndBuffer = gl.createBuffer();
bindBuffer(gl, skyIndBuffer, skyIndArray, "element")

// ------------------ floor ------------------
var floorProgram =
    createGlslProgram(gl, floorVertexShader, floorFragementShader);
function getFloorBuffer(){
    var floorVert = [
            0, 0, 0, 0, 0,  // front left
            maze.sizeX, 0, 0, maze.sizeX*4, 0,  // front right
            maze.sizeX, maze.sizeY, 0, maze.sizeX*4, maze.sizeY*4,  // back right
            0, maze.sizeY, 0, 0, maze.sizeY*4, // back left
        ];
    var floorInd = [0, 1, 2, 0, 2, 3];

    var floorVertArray = new Float32Array(floorVert);
    var floorVertBuffer = gl.createBuffer();
    bindBuffer(gl, floorVertBuffer, floorVertArray, "array");

    var floorIndArray = new Uint16Array(floorInd);
    var floorIndBuffer = gl.createBuffer();
    bindBuffer(gl, floorIndBuffer, floorIndArray, "element");
    return {
        "vertBuffer": floorVertBuffer,
        "indBuffer": floorIndBuffer,
    };
}

// ------------------ walls ------------------
var wallProgram =
    createGlslProgram(gl, wallVertexShader, wallFragementShader);


function getNeighWalls(x, y) {
    var neighWalls = [0, 0, 0, 0]; // l, u, r, b
    // left
    if (x == 0 || maze.data[x-1][y] == 1) {
        neighWalls[0] = 1;
    }
    // up
    if (y == maze.sizeY-1 || maze.data[x][y+1] == 1) {
        neighWalls[1] = 1;
    }
    // right
    if (x == maze.sizeX-1 || maze.data[x+1][y] == 1) {
        neighWalls[2] = 1;
    }
    // bottowm
    if (y == 0 || maze.data[x][y-1] == 1) {
        neighWalls[3] = 1;
    }
    return neighWalls;
}

function getWallBuffer() {
    var wallVert = [];
    var n = 0;
    var wallInd = [];
    for (var x = 0; x < maze.sizeX; x++) {
        for (var y = 0; y < maze.sizeY; y++) {
            if (maze.data[x][y] == 0) {
                var neighWalls = getNeighWalls(x, y);
                // a wall on the left
                if (neighWalls[0] == 1) {
                    wallVert = wallVert.concat(
                        [x, y, 1, 0, 0],  //lt
                        [x, y+1, 1, 5, 0],  //rt
                        [x, y+1, 0, 5, 5], //rb
                        [x, y, 0, 0, 5] //lb
                    );
                    wallInd = wallInd.concat([n, n+3, n+1], [n+1, n+3, n+2]);
                    n += 4;
                }
                // a wall on the top
                if (neighWalls[1] == 1) {
                    wallVert = wallVert.concat(
                        [x, y+1, 1, 0, 0],  //lt
                        [x+1, y+1, 1, 5, 0],  //rt
                        [x+1, y+1, 0, 5, 5], //rb
                        [x, y+1, 0, 0, 5] //lb
                    );
                    wallInd = wallInd.concat([n, n+3, n+1], [n+1, n+3, n+2]);
                    n += 4;
                }
                // a wall on the right
                if (neighWalls[2] == 1) {
                    wallVert = wallVert.concat(
                        [x+1, y+1, 1, 0, 0],  //lt
                        [x+1, y, 1, 5, 0],  //rt
                        [x+1, y, 0, 5, 5], //rb
                        [x+1, y+1, 0, 0, 5] //lb
                    );
                    wallInd = wallInd.concat([n, n+3, n+1], [n+1, n+3, n+2]);
                    n += 4;
                }
                // a wall on the bottom
                if (neighWalls[3] == 1) {
                    wallVert = wallVert.concat(
                        [x+1, y, 1, 0, 0],  //lt
                        [x, y, 1, 5, 0],  //rt
                        [x, y, 0, 5, 5], //rb
                        [x+1, y, 0, 0, 5] //lb
                    );
                    wallInd = wallInd.concat([n, n+3, n+1], [n+1, n+3, n+2]);
                    n += 4;
                }
            }
        }
    }

    var wallVertArray = new Float32Array(wallVert);
    var wallVertBuffer = gl.createBuffer();
    bindBuffer(gl, wallVertBuffer, wallVertArray, "array");

    var wallIndArray = new Uint16Array(wallInd);
    var wallIndBuffer = gl.createBuffer();
    bindBuffer(gl, wallIndBuffer, wallIndArray, "element");
    return {
        "vertBuffer": wallVertBuffer,
        "indBuffer": wallIndBuffer,
        "vertCount": n,
        "faceCount": n / 2,
    };
}

function drawSky(vbuf, ibuf, gl, program, attrName, length){
    setVertexBufferAttr(gl, program, "array", vbuf, attrName, {
        unitSize : 3,
        step     : 3*4,
        offset   : 0,
    });
    drawTriangleFromElementBuffer(ibuf, length, 0);
}

function drawSquares(vbuf, ibuf, gl, program, posAttrName, uvAttrName, length){
    setVertexBufferAttr(gl, program, "array", vbuf, posAttrName, {
        unitSize : 3,
        step     : 4*5,
        offset   : 0,
    });
    setVertexBufferAttr(gl, program, "array", vbuf, uvAttrName, {
        unitSize : 2,
        step     : 4*5,
        offset   : 4*3,
    });
    drawTriangleFromElementBuffer(ibuf, length, 0);
}

var skyPer = mat4.create();
mat4.perspective(skyPer, 85*Math.PI/180.0, 4.0/3.0, 0.1, 5.0);

//---------------------main drawing logic--------------------------------
function runWebGL(images, skys){
    var skyTextureCube = createTextureCube(gl, skyProgram, skys);
    var wallTexture = createTextureObj(gl, wallProgram, images[wallPath]);
    var floorTexture = createTextureObj(gl, floorProgram, images[floorPath]);
    function updateWebGL(time) {
        moveEye(camera);
        updateEyeMatrix(camera);
        gl.clearColor(0.3, 0.7, 1.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.disable(gl.DEPTH_TEST);

        // draw sky
        gl.useProgram(skyProgram);
        var mvloc = gl.getUniformLocation(skyProgram, "modelViewMatrix");
        var projloc = gl.getUniformLocation(skyProgram, "projectionMatrix");
        gl.uniformMatrix4fv(projloc, false, skyPer);
        gl.uniformMatrix4fv(mvloc, false, camera.MfixedObjview);
        setTextureCube(gl, skyProgram, "skybox", skyTextureCube, 0)

        drawSky(
            skyVertBuffer,
            skyIndBuffer,
            gl,
            skyProgram,
            "position",
            36
        );
        gl.depthFunc(gl.LESS);
        gl.enable(gl.DEPTH_TEST);
        //draw floor
        gl.useProgram(floorProgram);
        var mvloc = gl.getUniformLocation(floorProgram, "modelViewMatrix");
        var projloc = gl.getUniformLocation(floorProgram, "projectionMatrix");
        gl.uniformMatrix4fv(projloc, false, camera.Mper);
        gl.uniformMatrix4fv(mvloc, false, camera.Mobjview);
        setTexture(gl, floorProgram, "floorTexture", floorTexture, 1);
        var floorBufs = getFloorBuffer();
        drawSquares(
            floorBufs["vertBuffer"],
            floorBufs["indBuffer"],
            gl,
            floorProgram,
            "position",
            "uv",
            6
        );
        // draw wall
        var wallData = getWallBuffer();
        var wallVertBuffer = wallData["vertBuffer"];
        var wallIndBuffer = wallData["indBuffer"];
        var nFaces = wallData["faceCount"] * 3;

        gl.useProgram(wallProgram);
        var mvloc = gl.getUniformLocation(wallProgram, "modelViewMatrix");
        var projloc = gl.getUniformLocation(wallProgram, "projectionMatrix");
        gl.uniformMatrix4fv(projloc, false, camera.Mper);
        gl.uniformMatrix4fv(mvloc, false, camera.Mobjview);
        setTexture(gl, wallProgram, "wallTexture", wallTexture, 2);
        drawSquares(
            wallVertBuffer,
            wallIndBuffer,
            gl,
            wallProgram,
            "position",
            "uv",
            nFaces
        );
        window.requestAnimationFrame(updateWebGL);
    }

    window.requestAnimationFrame(updateWebGL);
}

function loadImage(paths, idx, images, skys){
    var path = paths[idx];
    var image = new Image();
    images[path] = image;
    image.onload = function() {
        if (idx + 1 >= paths.length){
            runWebGL(images, skys);
        }else{
            loadImage(paths, idx + 1, images, skys);
        }
    };
    image.src = path;
}

function loadSky(skyPaths, idx, images, paths){
    var path = skyPaths[idx];
    var image = new Image();
    images[idx] = image;
    image.onload = function() {
        if (idx + 1 >= skyPaths.length){
            loadImage(paths, 0, {}, images);
        }
        else{
            loadSky(skyPaths, idx + 1, images, paths);
        }
    };
    image.src = path;
}

function loadAll(skyPaths, paths){
    loadSky(skyPaths, 0, new Array(6), paths);
}


function startWebGL() {
    loadAll(skyPaths, imagePaths);
}

startWebGL();
