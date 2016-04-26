/*eslint-env browser, jquery*/
var gameID;
var userID;
//gets general game id and sets up a new game
function getGameID(){
	var user = document.getElementById("textName").value;
	/*document.getElementById("button").disabled = true;
	document.getElementById("joinFriendbutton").disabled = true;
	document.getElementById("joinbutton").disabled = true;*/
	$.ajax({
				type : 'POST',
				url: '/sql/game',
				data: {user: user, type: "ng"},
				success: function(data,status){
					gameID = data.gameID;
					userID = data.userId;
					if(userID === -3){
						document.getElementById("textName").value = "";
						return;
					}
					document.getElementById("gameID").innerHTML = "Game id is ";
					document.getElementById("ID").innerHTML = data.gameID;
					document.getElementById("button").disabled = true;
					var query = '/waiting.html?'+gameID+':'+userID;
					location.replace(query);
				}
	});
}
//allows you to join other friends in the game
function joinFriends(){
	var user = document.getElementById("textName").value;
	var gameId = document.getElementById("textGameID").value;
	/*document.getElementById("button").disabled = true;
	document.getElementById("joinFriendbutton").disabled = true;
	document.getElementById("joinbutton").disabled = true;*/
	$.ajax({
				type : 'POST',
				url: '/sql/game',
				data: {user: user, type: "jg",gameID: gameId },
				success: function(data,status){
					gameID = data.gameID;
					userID = data.userId;
					document.getElementById("button").disabled = true;
					document.getElementById("gameID").innerHTML = "Game id is ";
					document.getElementById("ID").innerHTML = data.gameID;
					var query = '/waiting.html?'+gameID+':'+userID;
					location.replace(query);

				}
	});
}
//allows
//find new game and adds them into it.
function findGameID(){
	var user = document.getElementById("textName").value;
	$.ajax({
				type : 'POST',
				url: '/sql/game',
				data: {user: user, type: "rg"},
				success: function(data, status) {
					gameID = data.gameID;
					userID = data.userId;
					var query = 'waiting.html?'+gameID+':'+userID;
					location.replace(query);
				}
	});
}