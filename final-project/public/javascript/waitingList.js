/*eslint-env browser, jquery*/
var gameID;
var bol = true;
var once = true;
//sets onStart and finds needed data
function onStart(){
	var query = document.URL;
	query = query.substring(48);
	gameID = parseInt(query.substring(0,query.indexOf(":")), 10);
	this.interval = setInterval(update, 1000);	
	document.getElementById("currentID").innerHTML = "GameID:"+gameID;
}
//updates to see when the game starts
function update(){
	$.ajax({
			type : 'POST',
			url: '/sql/check',
			data: {gameID: gameID},
			success: function(data,status){
				if(data.count === 4 && bol){
					bol = false;
					document.getElementById("numPlay").innerHTML = "Game starting shortly";
					alert("Are you ready to start!");
					var query = 'gamePage.html'+document.URL.substr(47);
					location.replace(query);
					
				}
				else if(data.count === 4){
					document.getElementById("numPlay").innerHTML = "Game starting shortly";
				}
				else{
					document.getElementById("numPlay").innerHTML = ""+data.count+" /4";
				}	
			}
	});
}