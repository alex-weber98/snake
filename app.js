// import colors from "./colors";


const canvas = document.getElementById("canvas");

var ctx = canvas.getContext("2d");

document.addEventListener("keydown", keyPressed)

const scoreText = document.getElementById("score")
const speed = document.getElementById("speed")
speed.addEventListener("change", RefreshSpeedValue);
const speedValueText = document.getElementById("speedValueText")


const btnStart = document.getElementById("btnStart");
btnStart.onclick = function() {StartingGame()};

const cbxBorder = document.getElementById("cbx");
cbxBorder.onclick = function() {onCheckboxClick()};

const notification = document.getElementById("notificationMessage");

const numFieldCount = document.getElementById("numFieldsize");
numFieldCount.onchange = function() {fieldSizeChange()};

const cbxLabel = document.getElementById("cbxLabel");
cbxBorder.checked = true;

canvas.addEventListener('touchstart', handleTouchStart, false);        
canvas.addEventListener('touchmove', handleTouchMove, false);

var isMobile = navigator.userAgent.match(/(iPad)|(iPhone)|(iPod)|(android)|(webOS)/i)

if(!isMobile){
    canvas.width = 500;
    canvas.height = 500;
}
else{
    canvas.width = vw(90);
    canvas.height = vw(90);
}

function vw(v) {
    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    return (v * w) / 100;
  }
  

var xDown = null;                                                        
var yDown = null;  
function handleTouchStart(evt){
    xDown = evt.touches[0].clientX;                                      
    yDown = evt.touches[0].clientY;    
}


function handleTouchMove(evt){
    if ( ! xDown || ! yDown ) {
        return;
    }
    var xUp = evt.touches[0].clientX;                                    
    var yUp = evt.touches[0].clientY;
    var xDiff = xDown - xUp;
    var yDiff = yDown - yUp;

    if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {/*most significant*/
        if ( xDiff > 0 ) {
            validateDirectionChange(directions.Left);
        /* left swipe */ 
        } else {
            validateDirectionChange(directions.Right);
        /* right swipe */
        }                       
    } else {
        if ( yDiff > 0 ) {
            validateDirectionChange(directions.Up);
        /* up swipe */ 
        } else { 
            validateDirectionChange(directions.Down);
        /* down swipe */
        }                                                                 
    }
    /* reset values */
    xDown = null;
    yDown = null;   
}


var interval ;// for move loop
var score = 0;
var currentDirection = 39;
var food;
var fieldsCount = 20;
var fieldsSize = canvas.width / fieldsCount;

var logs = [];
var loggingObject = { 
    x: 0, 
    y: 0
};


const directions = {
    Left: 37,
    Up: 38,
    Right: 39,
    Down: 40
}


fieldSizeChange();
RefreshSpeedValue();
startup();

function getOpDirection(direction){
    switch(direction){
        case directions.Left:
            return directions.Right;

        case directions.Right:
            return directions.Left;

        case directions.Up:
            return directions.Down;

        case directions.Down:
            return directions.Up;
    }
}


function startup(){
    fieldsSize = canvas.width / fieldsCount;
    ClearAll();
    drawFields();   
    setUpSnake();
    notification.innerHTML = "PRESS START TO PLAY"
    onCheckboxClick();
}

function setUpSnake(){
    
    let snakeLength = 5;
    const y = Math.floor(fieldsCount / 2);
    
    for(let x = 0; x < snakeLength; x++){
        drawSnake(x, y)

        let loggingObject = new Object();
        loggingObject.x = x;
        loggingObject.y = y;
        logs.unshift(loggingObject)
        drawSnake(x,y);
    }
}


function setUpGame(){
    score = 0;
    
    clearField();
    logs = new Array();

    drawFields();
    setUpSnake();

    createApple();
}


async function StartingGame(){
    setUpGame();
    optionsDisable(true);

    notification.innerHTML = 3;
    await sleep(1000);
    notification.innerHTML = 2;
    await sleep(1000);
    scrollToTop();
    notification.innerHTML = 1;
    await sleep(1000);

    lockYAxis(true);

    startGame();
}

const scrollToTop = () => {
    const c = document.documentElement.scrollTop || document.body.scrollTop;
    if (c > 0) {
      window.requestAnimationFrame(scrollToTop);
      window.scrollTo(0, c - c / 8);
    }
  };



function startGame(){
    notification.innerHTML = "";
    currentDirection = directions.Right;
    let s = 150 - speed.value;
    interval = window.setInterval(Move, s)
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function drawFields(){
    
    let color;
    
    for(let x = 0; x < fieldsCount; x++){
        for(let y = 0; y < fieldsCount; y++){          
            drawField(x,y);
        }
    }
}

function drawField(x, y){
    ctx.fillStyle = getFieldColor(x,y);
    ctx.fillRect(x * fieldsSize, y * fieldsSize, fieldsSize, fieldsSize);
}

function clearField(x, y){

    ctx.clearRect(x*fieldsSize, y *fieldsSize, fieldsSize, fieldsSize);
    ctx.fillStyle = getFieldColor(x,y);
    ctx.fillRect(x*fieldsSize, y *fieldsSize, fieldsSize, fieldsSize);
}


function optionsDisable(boolean){

    btnStart.disabled = boolean;
    speed.disabled = boolean;
    numFieldCount.disabled = boolean;
    cbxBorder.disabled = boolean;
    cbxLabel.disabled = boolean;

    if(!boolean){
        lockYAxis(false);
    }
}


function lockYAxis(boolean){
    
    if(isMobile){
        
        if(boolean){
            document.getElementsByTagName("html")[0].style.overflowY = "hidden";
        }
        else{
            document.getElementsByTagName("html")[0].style.overflowY = "scroll";
        }
    }  
    
}


function getFieldColor(x, y){
    if(x % 2 == 0){
        if(y % 2 == 0){
            color = "#c0ed8a";
        }
        else{
            color = "#86b849";
        }
    }
    else{
        if(y % 2 == 0){
            color = "#86b849";
        }
        else{
            color = "#c0ed8a";
        }
    }
    return color;
}



function Move(){

    let nextField = getNextField();


    if(nextField.x == food.x && nextField.y == food.y){
        score++;
        clearField(nextField.x, nextField.y);
        drawField(nextField.x, nextField.y);
        createApple();
    }
    else if(isCrashed(nextField)){
        clearInterval(interval);
        optionsDisable(false);
        return;
    }
    else{
        let x = logs.pop();
        clearField(x.x, x.y);
    }

    logs.unshift(nextField);
    drawSnake(nextField.x, nextField.y);

    scoreText.innerHTML = score;

}

function ClearAll(){
    ctx.clearRect(0, 0, canvas.width, canvas.height)
}


function drawSnake(x, y){

    const spacing = 2;
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(x*fieldsSize + spacing, y *fieldsSize + spacing, fieldsSize -spacing * 2, fieldsSize -spacing *2);
    //ctx.strokeStyle = "black";
    //ctx.lineWidth = "2";
    //ctx.rect(x*fieldsSize + 1, y *fieldsSize + 1, fieldsSize -2, fieldsSize - 2);
    //ctx.stroke();
}

function createApple(){

    food = getEmptyField();
    var image = document.createElement('img');
    image.src = "images/apple.png";

    image.onload = function () {
        console.log(food.x *fieldsSize + " " + food.y * fieldsSize)
        ctx.drawImage(image, food.x *fieldsSize, food.y * fieldsSize, fieldsSize, fieldsSize);
    }   
}





function keyPressed(event){

    validateDirectionChange(event.keyCode);
}

function validateDirectionChange(direction){
    
    if(direction != getOpDirection(currentDirection)){

        currentDirection = direction
   } 
}

function getNextField(){
    var loggingObject = new Object();

    curSnakeHead = logs[0];

    switch(currentDirection){
        case directions.Left:
            loggingObject.x = curSnakeHead.x -1;
            loggingObject.y = curSnakeHead.y;
            break;
        case directions.Up:
            loggingObject.x = curSnakeHead.x;
            loggingObject.y = curSnakeHead.y -1;
            break;
        case directions.Right:
            loggingObject.x = curSnakeHead.x +1;
            loggingObject.y = curSnakeHead.y;
            break;
        case directions.Down:
            loggingObject.x = curSnakeHead.x;
            loggingObject.y = curSnakeHead.y +1;
            break;
    }
    return loggingObject;
}

function isCrashed(nextField){
    let x = nextField.x;
    let y = nextField.y;
    let result = false;

    // outside of field
    if(cbxBorder.checked){
        if((x < 0 || x >= fieldsCount) || (y < 0 || y >= fieldsCount)){
            result = true;
        }
    }
    else{
        SnakeOverFieldHandler(nextField)
    }

    // crashed into itself
    for(let i = 0; i < logs.length; i++){
        let log = logs[i];
        if(log.x == x && log.y == y){
            result = true;
        }
    }

    return result;
}


function SnakeOverFieldHandler(nextField){
    
    if(nextField.x > (fieldsCount - 1)){
        nextField.x = 0;
    }
    else if(nextField.x < 0){
        nextField.x = fieldsCount - 1;
    }
    else if(nextField.y > fieldsCount - 1){
        nextField.y = 0;
    }
    else if(nextField.y < 0){
        nextField.y = fieldsCount - 1;
    }

}


function getEmptyField(){
    
    let loggingObject = new Object();
    let emptyField = false;
    let nextField = getNextField();


    while(!emptyField){
        loggingObject.x = Math.floor(Math.random() * fieldsCount);
        loggingObject.y = Math.floor(Math.random() * fieldsCount);

        let field = getNextField();

        emptyField = checkIfEmpty(loggingObject.x, loggingObject.y) && (loggingObject.x != field.x || loggingObject.y != field.y);  

    }
    console.log(loggingObject.x + " " + loggingObject.y)
    return loggingObject;

}
function checkIfEmpty(x, y){
    let result = true;
    for(let i = 0; i < logs.length; i++){
        let log = logs[i];
        if(log.x == x && log.y == y){
            result = false;
        }
    }

    return result;
}


function onCheckboxClick(){
    if(cbxBorder.checked == true){
        canvas.classList.remove('blinkingBorder');
    }
    else{
        canvas.classList.add('blinkingBorder');
    }
}

function fieldSizeChange(){
    fieldsCount = numFieldCount.value;
    startup();
}

function RefreshSpeedValue(){
    speedValueText.innerHTML = speed.value;
}
