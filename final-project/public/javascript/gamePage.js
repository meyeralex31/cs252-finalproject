/*eslint-env jquery, browser*/
//project
var proj = new Array();
//other players projectiles
var otherProj = new Array();
var powerUps = new Array(); // an array up all powerups
//this is for projectiles that have used to make sure that they cannot be reused
var usedProjs = new Array(); 
var cp; //current Player
var p2;
var p3;
var p4;
//arena where canvas is located at
var arena;
var gameID;
var userID;
//context of arena
var ctx;
//last button pressed
var lastHit = 0;
//count how many prots have been fired, used for making ids 
var countPs = 0;
//current health players
var health = 100;
//keeps track of how often it fires
var countShots  = 0;
//canvas it located on
var canvas = document.getElementById("canv");
canvas.addEventListener('keydown', keyInput, true);
//converts int that is stored from sql database to the actual color
function intToColor(color){
	switch(color){
		case 0:
			return "grey";
		case 1:
			return "red";
		case 2:
			return "green";
		case 3:
			return "blue";
	}
}
//starts the web page sets everything up
function start(){
	//gets userid and gameid from url
	var query = document.URL;
	query = query.substring(49);
	gameID = parseInt(query.substring(0,query.indexOf(":")), 10);
	userID = parseInt(query.substring(query.indexOf(":")+1), 10);
	//location of players x and y
	var x;
	var y;			
	//gets starting x and y location from server
	$.ajax({
		type : 'POST',
		url: '/sql/startgame',
		data: {gameID: gameID,userID: userID},
		success: function(data,status){
			x = data.x;
			y = data.y;
			//creates new curent player as well as the rest of the player 2
			cp = new component(30,30,"grey",x,y,"p1");
			p2 = new component(30,30,"grey",x,y,"op");
			p3 = new component(30,30,"grey",x,y,"op");
			p4 = new component(30,30,"grey",x,y,"op");
			//starts update server
			this.interval = setInterval(updateArena, 200);
		}
	}); 
}
//when the user presses the fire button
function fire(){
	proj.push(new component(4,4,cp.color,cp.x+14,cp.y+14,"pj"));
}
//sets the arena up 
arena = {	
	//creates a cavanas for our game
	context: canvas.getContext("2d"),
	canvas : canvas,
	//clears the board to allow everything to be redrawn
	clear : function(){
		this.context.clearRect(0,0,this.canvas.width, this.canvas.height);
	}
};
//creates a new figure
function component(width,height,color,x,y, type,id,speedX,speedY, playerID){
	//type of object
	this.type = type;
	this.width = width;
	this.height = height;
	//id of item made
	this.id;
	//player id of player who created it
	this.playerID;
	if(type === "pu"){
		this.id = id;
	}
	//sets speed for projectile shot
	if(this.type === "pj"){
		switch(lastHit){
			case 0:
				this.speedX = -30; //blocks moved per second
				this.speedY = 0;
				break;
			case 1:
				this.speedX = 0; //blocks moved per second
				this.speedY = -30;
				break;
			case 2:
				this.speedX = 30; //blocks moved per second
				this.speedY = 0;
				break;
			case 3:
				this.speedX = 0; //blocks moved per second
				this.speedY = 30;
				break;
		}
	}
	else if(type !== "pf"){
		this.speedX =0; //blocks moved per second
		this.speedY = 0;
	}
	//sets speed for other projs
	if(type === "pf"){
		this.speedX = speedX;
		this.speedY = speedY;
		this.id = id;
		this.playerID = playerID;
	}
	//if fired posted new projectile is posted
	if (this.type === "pj") {
		this.x = x;
		this.y = y;
		this.color = color;
		countPs++;
		this.id = countPs;
		$.ajax({
			type : 'POST',
			url: '/sql/fired',
			data: {gameID: gameID,playerID: userID,x:this.x,y:this.y,color:this.color,xSpeed:this.speedX,ySpeed:this.speedY,pid:countPs},
			success: function(data,status){}
		});
		//draws projectile
		ctx = arena.context;
		ctx.beginPath();
		ctx.arc(this.x,this.y,4,0,2*Math.PI);
		ctx.fillStyle = this.color;
		ctx.fill();
		ctx.stroke();
	} 
	else {
		this.x = x;
		this.y = y;
		this.color = color;
		//sets place to put player
		ctx= arena.context;
		ctx.fillStyle = this.color;					
		ctx.fillRect(this.x,this.y,this.width,this.height);
	}
	//what to do to update item
	this.update = function() {
		//updates location by speed the item is moving at
		this.x += this.speedX; 
		this.y += this.speedY;
		//if hits wall rgets rid of item from product
		if(this.type === "pj" && this.hitWall()){
			proj.splice(proj.indexOf(this),1);
		}
		if(this.type === "pf" && this.hitWall()){
			otherProj.splice(otherProj.indexOf(this),1);
		}
		//this sees if the player found a power up or the wall
		if(type === "p1"){
			this.getPowerUp();
			if(this.hitWall()){
				this.x += this.speedX; 
				this.y += this.speedY;
			}
		}
		//draws projectile
		if (this.type === "pj" || this.type === "pf") {
			ctx= arena.context;
			ctx.beginPath();
			ctx.arc(this.x,this.y,4,0,2*Math.PI);
			ctx.fillStyle = this.color;
			ctx.fill();
			ctx.stroke();
		}//draws other rect 
		else {
			ctx= arena.context;
			ctx.fillStyle = this.color;
			ctx.fillRect(this.x,this.y,this.width,this.height);
		}
	};
	//changes speed
	this.setXSpeed = function(x) {
		this.speedX = x;
	};
	//changes Y
	this.setYSpeed = function(y){
		this.speedY = y;
	};
	//if the figure hits a wall
	this.hitWall = function(){
		if(!(this.y > 0 || this.x > 0)) {
			return true;
		}
		else if(!(this.y + this.height < arena.canvas.height || this.x +this.height < arena.canvas.width)){
			return true;
		}
		return false;
	};
	//if something that hits projectile
	this.hitProjectile = function(otherPlyr){
		var i=0;  
		//checks if there projectile hits anything
		for(;i<proj.length;i++){
			if (!(proj[i].x-1 > otherPlyr.x + otherPlyr.width || proj[i].x + 1 < otherPlyr.x || proj[i].y > otherPlyr.y+otherPlyr.height || proj[i].y + 1 < otherPlyr.y)) {
				proj.splice(i, 1);
			}
		}
		//hits other projs get rid of it
		for(i =0;i<otherProj.length;i++){
			if(otherPlyr.id !== otherProj[i].id){
				if (!(otherProj[i].x-1 > otherPlyr.x + otherPlyr.width || otherProj[i].x + 1 < otherPlyr.x || otherProj[i].y > otherPlyr.y+otherPlyr.height || otherProj[i].y + 1 < otherPlyr.y)) {
					otherProj.splice(i, 1);
				}
			}	
		}
	};
	//sees if cp gets hit or not
	this.cpHit = function(){
		for(i =0;i<otherProj.length;i++){
			if (!(otherProj[i].x-1 > cp.x + cp.width || otherProj[i].x + 1 < cp.x || otherProj[i].y > cp.y+cp.height || otherProj[i].y + 1 < cp.y)) {
				ishit(otherProj[i]);
				otherProj.splice(i, 1);
			}
		}
	};
	//gets power ups 
	this.getPowerUp = function(){
		//checks all power ups to see if they found one. It than changes the color and removes that item. 
		for (i =0; i< powerUps.length; i++){
			if (!(powerUps[i].x > this.x + this.width || powerUps[i].x + powerUps[i].width < this.x || powerUps[i].y > this.y+this.height || powerUps[i].y + powerUps[i].height < this.y)) {
				getPowerUP(powerUps[i],i);
			}
		}		
	};
}
//update arena 
function updateArena(){
	var numberofDead = 0;
	var d = new Date();
	var time = d.getTime();
	//checks for everything to update arena
	$.ajax({
		type : 'POST',
		url: '/sql/updatePlayers',
		data: {gameID: gameID,userID: userID ,x: cp.x,y: cp.y,color: cp.color,type:cp.type},
		success: function(data,status){
			countShots++;
			arena.clear();
			cp.update();
			var i;
			for (i =0; i< proj.length; i++){
				proj[i].update();
			}
			//updates all players
			p2.x = data.p2x;
			p2.id = data.u2;
			p2.y = data.p2y;
			//sees if player is last left
			if(p2.x === undefined){
				alert("YOU WON GO buy yourself a medal\nYou will now be returned to the home page");
				win();
				return;
			}
			p2.color = intToColor(data.p2color);
			p2.update();
			cp.hitProjectile(p2);
			p3.y = data.p3y;
			p3.x = data.p3x;
			p3.id = data.u3;
			if(p3.x !== undefined){
				p3.color = intToColor(data.p3color);
				p3.update();
				cp.hitProjectile(p3);
			}
			p4.y = data.p4y;
			p4.x = data.p4x;
			p4.id = data.u4;
			if(p4.x !== undefined){
				p4.color = intToColor(data.p4color);
				p4.update();
				cp.hitProjectile(p4);
			}
			cp.cpHit();
			//sees if any new projectiles are added or needed
			var found;
			for(var j = 0; j < powerUps.length;j++){
				found = false; 
				for(var k = 0; k < data.power.length;k++){
					if(powerUps[k] === null || powerUps[k] === undefined){
						continue;
					}
					if(powerUps[j].id ===data.power[k].id){
						found = true;
						break;
					}
				}
				if(!found){
					powerUps.splice(j, 1);
				}
			}
			for(var j = 0; j < data.power.length;j++){
				found = false;
				for(var k = 0; k < powerUps.length;k++){
					if(powerUps[k] === null || powerUps[k] === undefined){
						continue;
					}
					if(powerUps[k].id ===data.power[j].id){
						found = true;
						break;
					}
				}
				if(!found){
					powerUps.push(new component(15,15,intToColor(data.power[j].color),data.power[j].x,data.power[j].y,"pu",data.power[j].id));
				}
			}
			//updates proj
			for (i =0; i< powerUps.length; i++){
				powerUps[i].update();
			}
			getnewProjs(data.projs);
			document.getElementById("score").innerHTML= time -d.getTime();
		}
	});
}
//update Y speed
function updateY(y){
	cp.setYSpeed(y);
}
//update X speed
function updateX(x){
	cp.setXSpeed(x);
}
//gets a power up
function getPowerUP(powerUp,i){
	cp.color = powerUps[i].color;
	//call to the server to remove the power up 
	$.ajax({
		type : 'POST',
		url: "/sql/removePower",
		data: {id: powerUps[i].id,gameID: gameID},
		success: function(data,status){}
	});
	powerUps.splice(i, 1);
}
//is the item hit
function ishit(proj) {
	//remove Proj
	$.ajax({
		type : 'POST',
		url: '/sql/remProj',
		data: {gameID: gameID,playerID: userID,id:proj.id},
		success: function(data,status){}
	});
	//see what change to health is
	if(cp.color.toLocaleLowerCase() === proj.color.toLocaleLowerCase()){
		health -= 10;
	}
	else if(cp.color.toLocaleLowerCase() === "grey" && proj.color.toLocaleLowerCase() !== "grey"){
		health -= 10;
	}
	else if(cp.color.toLocaleLowerCase() !== "grey" && proj.color.toLocaleLowerCase() === "grey"){
		health -= 10;
	}
	else if(cp.color.toLocaleLowerCase() === "red" && proj.color.toLocaleLowerCase() === "blue"){
		health -= 20;				
	}
	else if(cp.color.toLocaleLowerCase() === "red" && proj.color.toLocaleLowerCase() === "green"){
		health += 10;
	}
	else if(cp.color.toLocaleLowerCase() === "blue" && proj.color.toLocaleLowerCase() === "green"){
		health -= 20;
	}
	else if(cp.color.toLocaleLowerCase() === "blue" && proj.color.toLocaleLowerCase() === "red"){
		health += 10;				
	}
	else if(cp.color.toLocaleLowerCase() === "green" && proj.color.toLocaleLowerCase() === "red"){
		health -= 20;
	}
	else if(cp.color.toLocaleLowerCase() === "green" && proj.color.toLocaleLowerCase() === "blue"){
		health += 10;
	}
	//if health is lower than needed
	if(health <= 0){
		death();
	}
	//update health
	document.getElementById("healthStat").innerHTML = "Health: "+ health;
	document.getElementById("healthStat").style.color = "#00ff00";
	document.getElementById("healthStat").style.size = 40;
	return;
}
//tells user they are dead and returns to home page
function death() {
	$.ajax({
		type : 'POST',
		url: "/sql/death",
		data: {gameID: gameID,userID: userID},
		success: function(data,status){}
	});
	alert("you dead!!!\n You will now be returned to the home page");
	location.replace('/');
}
//posts a win adn returns to index
function win() {
	$.ajax({
		type : 'POST',
		url: "/sql/win",
		data: {gameID: gameID,userID: userID},
		success: function(data,status){}
	});				
	location.replace('/');
}
//an function that gets new projectiles from the server and inserts them into
function getnewProjs(newProjs){
	var found;
	for(var j = 0; j < newProjs.length;j++){
		found = false;
		for(var k = 0; k < otherProj.length;k++){
			if(otherProj[k] === null || powerUps[k] === undefined){
				continue;
			}
			if(otherProj[k].id ===newProjs[j].id){
				found = true;
				break;
			}
		}
		if(!found){
			var bool = false;
			for(var m = 0;m <usedProjs.length; m++){
				if(usedProjs[m].userid === newProjs[j].playerID && usedProjs[m].id === newProjs[j].id){
					bool = true;
					break;
				}
			}	
			if(bool){continue;}
			usedProjs[usedProjs.length] = {userid: newProjs[j].playerID, id: newProjs[j].id};
			otherProj.push(new component(15,15,intToColor(newProjs[j].color),newProjs[j].x,newProjs[j].y,"pf",newProjs[j].id,newProjs[j].xSpeed,newProjs[j].ySpeed,newProjs[j].playerID));
		}
	}
	for(var i =0;i < otherProj.length;i++){
		otherProj[i].update();
	}
}
//sets up input to allow moving and make sure they are moving
function keyInput(e){
	//space
	if (e.keyCode === 13 && countShots > 1) {
		fire();
		countShots = 0;
	}
	//w
	if (e.keyCode === 87) {
		if ((p2.x !== undefined) && !(p2.x > cp.x + cp.width || p2.x + p2.width < cp.x || p2.y > cp.y+cp.height || p2.y + p2.height < cp.y-10)) {
			cp.y = p2.y +p2.height + 15;
			lastHit = 1;
		}
		if ((p3.x !== undefined) && !(p3.x > cp.x + cp.width || p3.x + p3.width < cp.x || p3.y > cp.y+cp.height || p3.y + p3.height < cp.y-10)) {
			cp.y = p3.y +p3.height + 15;
			lastHit = 1;
		}
		if ((p4.x !== undefined) && !(p4.x > cp.x + cp.width || p4.x + p4.width < cp.x || p4.y > cp.y+cp.height || p4.y + p4.height < cp.y-10)) {
			cp.y = p4.y +p4.height + 15;
			lastHit = 1;
		}
		if (!(cp.y-10 < 0)) {
			cp.y = cp.y - 5;
			lastHit = 1;
		}
	}
	//s
	if (e.keyCode === 83) {
		if ((p2.x !== undefined) && !(p2.x > cp.x + cp.width || p2.x + p2.width < cp.x || p2.y-10 > cp.y+cp.height || p2.y + p2.height < cp.y)) {
			cp.y = p2.y-cp.height-15;
			lastHit = 3;
		}
		if ((p3.x !== undefined) && !(p3.x > cp.x + cp.width || p3.x + p3.width < cp.x || p3.y-10 > cp.y+cp.height || p3.y + p3.height < cp.y)) {
			cp.y = p3.y-cp.height-15;
			lastHit = 3;
		}
		if ((p4.x !== undefined) && !(p4.x > cp.x + cp.width || p4.x + p4.width < cp.x || p4.y-10 > cp.y+cp.height || p4.y + p4.height < cp.y)) {
			cp.y = p4.y-cp.height-15;
			lastHit = 3;
		}
		if (!(cp.y+cp.height+10 > 550)) {
			cp.y = cp.y + 5;
			lastHit = 3;
		}
	}
	//a
	if (e.keyCode === 65){
		if (p2.x !== undefined && !(p2.x > cp.x + cp.width || p2.x + p2.width < cp.x-10 || p2.y > cp.y+cp.height || p2.y + p2.height < cp.y)) {
			cp.x = p2.x+p2.width+15;
			lastHit = 3;
		}
		if (p3.x !== undefined && !(p3.x > cp.x + cp.width || p3.x + p3.width < cp.x-10 || p3.y > cp.y+cp.height || p3.y + p3.height < cp.y)) {
			cp.x = p3.x+p3.width+15;
			lastHit = 3;
		}
		if (p4.x !== undefined && !(p4.x > cp.x + cp.width || p4.x + p4.width < cp.x-10 || p4.y > cp.y+cp.height || p4.y + p4.height < cp.y)) {
			cp.x = p4.x+p4.width+15;
			lastHit = 3;
		}
		if (!(cp.x-10 < 0)) {
			cp.x = cp.x - 5;
			lastHit = 0;
		}
	}
	//d
	if (e.keyCode === 68) {
		if (p2.x !== undefined && !(p2.x-10 > cp.x + cp.width || p2.x + p2.width < cp.x || p2.y > cp.y+cp.height || p2.y + p2.height < cp.y)) {
			cp.x = p2.x-cp.width-15;
			lastHit = 3;
		}
		if (p3.x !== undefined && !(p3.x-10 > cp.x + cp.width || p3.x + p3.width < cp.x || p3.y > cp.y+cp.height || p3.y + p3.height < cp.y)) {
			cp.x = p3.x-cp.width-15;
			lastHit = 3;
		}			
		if (p4.x !== undefined &&!(p4.x-10 > cp.x + cp.width || p4.x + p4.width < cp.x || p4.y > cp.y+cp.height || p4.y + p4.height < cp.y)) {
			cp.x = p4.x-cp.width-15;
			lastHit = 3;
		}
		if (!(cp.x+cp.width+10 > 800)) {
			lastHit = 2;
			cp.x = cp.x + 5;
		}
	}
}

		