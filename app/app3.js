var midi = new poormidi();

midi.onMidiEvent = function(e){
  var cnt = e.data[1];

  /*
    MIDI Note Onで 8x8のサーモセンサの画素が送られてくる
    Note Number = 画素 (0-63)
    Velocity = 温度 x 2の値 (1/2にして使う)
  */
  thermoData[e.data[1]] =  e.data[2] / 2;
}

function checkTouchNote(num){
  if((num >= touch_notes_min)&&(num <= touch_notes_max)){
    return(Math.floor(Math.random() * 6));
  }else{
    return -1;
  }
}

function playCan(num){
  console.log("num:"+num);
  midi.sendNoteOn(1,out_notes[num],100);
}

///////////////////////////////////////////////////////////////////////
// Pixi.js

var stage = new PIXI.Container();
var width = window.innerWidth;
var height = window.innerHeight;
var renderer = PIXI.autoDetectRenderer(width, height, {autoResize: true});
renderer.backgroundColor = 0xFFFFFF;
renderer.antialias = true;
document.getElementById("pixiview").appendChild(renderer.view);

///////////////////////////////////////////////////////////////////////
// ThermoMatrix

var thermoMatrixContainer = new PIXI.Container();
stage.addChild(thermoMatrixContainer);

var matrixScaleCnt = 0;
var MATRIXSCALECMTMAX = 16;
var thcnt = 0;

var thermoData = [
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0
];

var colors = [
  0x50E3C2, // blue     : 
  0x7ED321, // 緑       : 24
  0xF8E71C, // 黄色     : 26
  0xF5A623, // オレンジ : 28
  0xD0021B, // 赤       : 30
];

var randomColor = function(){
  var index = Math.floor(Math.random() * colors.length); 
  return colors[index];
}


var selectColor = function(thermo){
  var col = 0;
  if(thermo < 26){
    col = 0;
  }else if(thermo < 28){
    col = 1;
  }else if(thermo < 30){
    col = 2;
  }else if(thermo < 32){
    col = 3;
  }else{
    col = 4;
  }
  return colors[col];
}

var isHumanPixel = function(thermo){
  if(thermo >= 31){
    return 1;
  }else{
    return 0;
  }
}

var initThermoMatrix2 = function(){
  console.log("initThermoMatrix2")

  var ypoint = 0;
  var humanPixelCnt = 0;
  for(var ycnt=0;ycnt < 8;ycnt++){
    var xpoint = 0 + (80*8);
    for(var xcnt=0;xcnt < 8;xcnt++){
      var circleTex = PIXI.Texture.fromImage("./img/circle.png");
      var circleSprite = new PIXI.Sprite(circleTex);
      circleSprite.position.x = xpoint;
      circleSprite.position.y = ypoint;
      circleSprite.scale.x = 0.1;
      circleSprite.scale.y = 0.1;
      circleSprite.anchor.x = 0.5;
      circleSprite.anchor.y = 0.5;
      thermoMatrixContainer.addChild(circleSprite);
      xpoint -= 80;
    }
    ypoint += 80;
  }
  thermoMatrixContainer.position.x = width / 2;
  thermoMatrixContainer.position.y = (height / 2);
  thermoMatrixContainer.pivot.x = ((80*8)/2) - ((80*8)/4);
  thermoMatrixContainer.pivot.y = ((80*8)/2) - ((80*8)/4);
};

var updateThermoMatrix2 = function(){
  console.log("updateThermoMatrix2")
  var thcnt = 0;
  var humanPixelCnt = 0;
  for(var ycnt=0;ycnt < 8;ycnt++){
    for(var xcnt=0;xcnt < 8;xcnt++){
      thermoMatrixContainer.children[thcnt].tint = selectColor(thermoData[thcnt]);

      var pixelSize = 0.1;
      if(thermoData[thcnt] >= 26.0){
        pixelSize = 0.1+(thermoData[thcnt] - 26.0)/10.0;
      }
      thermoMatrixContainer.children[thcnt].scale.x = pixelSize;
      thermoMatrixContainer.children[thcnt].scale.y = pixelSize;
      thcnt++;
      humanPixelCnt += isHumanPixel(thermoData[thcnt]);
    }
  }
  // 温度の高い画素が一定以上あったら「ちーん」を鳴らす
  // https://mz4u.net/cans-simulator/ を使っても鳴らせる
  // (macだと違うwindowでひらけばIAC経由で鳴らせる。要設定)
  if(humanPixelCnt > 3){
    midi.sendNoteOn(1,38,100);
  }
};

var updateThermoMatrix2Pos = function(){
  thermoMatrixContainer.rotation += 0.01;
  if(matrixScaleCnt < (MATRIXSCALECMTMAX / 2)){
    thermoMatrixContainer.scale.x += 0.01;    
    thermoMatrixContainer.scale.y += 0.01;    
  }else{
    thermoMatrixContainer.scale.x -= 0.01;    
    thermoMatrixContainer.scale.y -= 0.01;    
  }
  matrixScaleCnt++;
  matrixScaleCnt = matrixScaleCnt % MATRIXSCALECMTMAX;
}

initThermoMatrix2();

///////////////////////////////////////////////////////////////////////
// Animation Frame

requestAnimationFrame(animate);

var sprites_num = 0;
var frames = 0;
var isFilter = false;

function animate(){
  requestAnimationFrame(animate);

  if((frames % 3) == 0){
    updateThermoMatrix2Pos();
    renderer.render(stage);
  }
  if((frames % 16) == 2){
    updateThermoMatrix2();    
  }

  frames ++;
  frames %= 120;
}

///////////////////////////////////////////////////////////////////////
// resizeing
var resizeTimer = false;
window.onresize = function() {
  if (resizeTimer !== false) {
    clearTimeout(resizeTimer);
  }
  resizeTimer = setTimeout(function() {
    width = window.innerWidth;
    height = window.innerHeight;

  thermoMatrixContainer.position.x = width / 2;
  thermoMatrixContainer.position.y = (height / 2);
  thermoMatrixContainer.pivot.x = ((80*8)/2) - ((80*8)/4);
  thermoMatrixContainer.pivot.y = ((80*8)/2) - ((80*8)/4);

    renderer.resize(width, height);
  }, 200);
};



