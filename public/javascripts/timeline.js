
var cnv;

function setup() {

    // Sets the screen to be 720 pixels wide and 400 pixels high
    cnv = createCanvas(800, 180);
    cnv.parent("canvaslocation");
    background(0, 0);

    noStroke();

    fill(102);
    rect(0, 60, 800, 60);
    textSize(32);
    text("1851", 10, 30);
    fill(0, 102, 153);
}


