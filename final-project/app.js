/*eslint-env node, browser*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var conn1;
// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

var bodyParser =  require("body-parser");

var ibmdb = require('ibm_db');
//connects to the sql server data base and clears it get ready for new games
ibmdb.open("DRIVER={DB2};DATABASE=SQLDB;UID=user18046;PWD=1pm9Y7KJCHug;HOSTNAME=75.126.155.153;port=50000;",function(err,conn){if(err){
		console.log("error occured "+err.message);
		}conn1 =conn; 
		conn.query("DELETE FROM PLAYER;", function(err,data,more){});
		conn.query("DELETE FROM MYTABLE;", function(err,data,more){});
		conn.query("DELETE FROM POWER;", function(err,data,more){});
		conn.query("DELETE FROM PROJ;", function(err,data,more){});
});

// create a new express server
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// serve the files out of ./public as our main files
//removes proj from server
app.post("/sql/remProj",function(req,res){
	conn1.query("DELETE FROM PROJ where id ="+req.body.id +" and playerid = "+req.body.playerID+" and gameid = "+req.body.gameID+";",function(err,data,more){
		if(err){
			console.error(req.body.id+"\n"+req.body.playerID+"\n"+req.body.gameID+"\n"+err.message);
		}
		res.send();
	});
});
//person dies it removes everything about them from the server
app.post("/sql/death",function(req,res){
	conn1.query("Delete from MYTABLE where userid = "+req.body.userID+";",function(err,data,more){
		if(err){
			console.error(err.message);
		}
	});
	conn1.query("DELETE FROM PLAYER WHERE playerid = "+req.body.userID +";",function(err,data,more){
		if(err){
			console.error(err.message);
		}
	});
	conn1.query("DELETE FROM PROJ where playerid = "+req.body.userID+";",function(err,data,more){
		if(err){
			console.error(err.message);
		}	
		res.send();
	});
});
//removes everything about the game when a person wins
app.post("/sql/win",function(req,res){
	conn1.query("Delete from MYTABLE where userid = "+req.body.userID+";",function(err,data,more){
		if(err){
			console.error(err.message);
		}
	});
	conn1.query("DELETE FROM PLAYER WHERE gameid = "+req.body.gameID +";",function(err,data,more){
		if(err){
			console.error(err.message);
		}
	});
	conn1.query("DELETE FROM PROJ where gameid = "+req.body.gameID+";",function(err,data,more){
		if(err){
			console.error(err.message);
		}
	});
	conn1.query("DELETE FROM power where gameid = "+req.body.gameID+";",function(err,data,more){
		if(err){
			console.error(err.message);
		}
		res.send();
	});
});
//post it when they fired
app.post("/sql/fired",function(req,res){
	var color;
	switch(req.body.color){
		case "grey":
			color = 0;
			break;
		case "red":
			color = 1;
			break;
		case "green":
			color = 2;
			break;
		case "blue":
			color = 3;
			break;
		
	}
	console.error(req.body.gameID+","+req.body.playerID+","+req.body.x+","+req.body.y+","+req.body.xSpeed+","+req.body.ySpeed+","+req.body.pid);
	conn1.query("INSERT INTO PROJ VALUES("+req.body.gameID+","+req.body.playerID+","+req.body.x+","+req.body.y+","+color+","+req.body.xSpeed+","+req.body.ySpeed+","+req.body.pid+");",function(err,data,more){
		if(err){
			console.error(req.body.gameID+","+req.body.playerID+","+req.body.x+","+req.body.y+","+req.body.xSpeed+","+req.body.ySpeed+","+req.body.pid+"\n"+err.message);
		}
		res.send();
	});
});
//updates postion of players and than returns everything new that was added
app.post("/sql/updatePlayers",function(req,res){
	//add function to decide if to insert new powerups or not
	var color;
	switch(req.body.color){
		case "grey":
			color = 0;
			break;
		case "red":
			color = 1;
			break;
		case "green":
			color = 2;
			break;
		case "blue":
			color = 3;
			break;
		
	}
	//gives a random chance of a new power up appearing
	if(Math.floor((Math.random() * 54) + 1) === 1){
		conn1.query("SELECT MAX(ID) as cnt from POWER where gameID = "+req.body.gameID+";",function(err,data,moreResultSets){
			if(err){
				console.log(err.message);
			}
			var id;
			if(data[0].CNT === undefined || data[0].CNT === null){
				id = 1;
			}
			else{
				id = parseInt(data[0].CNT, 10)+1;
			}
			//sees if powers was already placed else and tries to place a new one
			conn1.query("SELECT x,y from POWER where gameID = "+req.body.gameID+";",function(err,data,moreResultSets){
				var found1 = false;
				var found2 = false;
				var found3 = false;
				var found4 = false;
				if(err){
					console.error(err.message);
				}
				else{
				
					for(var i =0; i < data.length; i++){
						console.error("data");
						if(data[i].X === 30 && data[i].Y === 30){
							found1 = true;	
						}
						if(data[i].X === 720 && data[i].Y === 30){
							found2 = true;
						}
						if(data[i].X === 30 && data[i].Y === 520){
							found3 = true;
						}
						if(data[i].X === 720 && data[i].Y === 520){
							found4 = true;
						}
					}
				}
				console.error("id = "+id+ "testing for data = "+found1);

				if(!found1 && Math.floor((Math.random() * 4) + 1) === 3){
					conn1.query("INSERT INTO POWER VALUES("+req.body.gameID+","+id+",30,30,"+Math.floor(Math.random() * 3 + 1)+");",function(err,data,more){
						if(err){
							console.error(err.message);
							return;
						}
					});
					id++;
				}
				if(!found2 && Math.floor((Math.random() * 4) + 1) === 3){
					conn1.query("INSERT INTO POWER VALUES("+req.body.gameID+","+id+",720,30,"+Math.floor(Math.random() * 3 + 1)+");",function(err,data,more){
						if(err){
							console.error(err.message);
							return;
						}
					
					});
					id++;
				}
				if(!found3 && Math.floor((Math.random() * 4) + 1) === 3){
					conn1.query("INSERT INTO POWER VALUES("+req.body.gameID+","+id+",30,520,"+Math.floor(Math.random() * 3 + 1)+");",function(err,data,more){
						if(err){
							console.error(err.message);
							return;
						}	
					});
					id++;
				}
				if(!found4 && Math.floor((Math.random() * 4) + 1) === 3){
					conn1.query("INSERT INTO POWER VALUES("+req.body.gameID+","+id+",720,520,"+Math.floor(Math.random() * 3 + 1)+");",function(err,data,more){
						if(err){
							console.error(err.message);
							return;
						}
					
					});
					id++;
				}
			});
		});
	}
	//updates player location
	conn1.query("UPDATE PLAYER SET X = "+req.body.x+", Y ="+req.body.y+", COLOR = "+ color+" WHERE PLAYERID = "+req.body.userID+";",function(err,max,moreResultSets){
		if(err){
			console.log("err1 "+err.message);
		}
	});
	//gets every other players postion
	 conn1.query("SELECT X,Y,COLOR,PLAYERID FROM PLAYER WHERE GAMEID = "+req.body.gameID+";",function(err,max,moreResultSets){
	 	if(err){
	 		console.log("err2 " + err.message);
	 		return;
	 	}
	 	var count = 0;
	 	var cpx1,cpy1,cp1color,cpx2,cpy2,cp2color,cpx3,cpy3,cp3color,user1,user2,user3;
	 	for(var i = 0;i < max.length;i++ ){
	 		if(parseInt(max[i].PLAYERID, 10) === parseInt(req.body.userID, 10)){
	 			continue;
	 		}
	 		if(count === 0){
	 			cpx1 = max[i].X;
	 			cpy1 = max[i].Y;
	 			cp1color = max[i].COLOR;
	 			user1 = max[i].PLAYERID;
	 		}
	 		else if(count === 1){
	 			cpx2 = max[i].X;
	 			cpy2 = max[i].Y;
	 			cp2color = max[i].COLOR;
	 			user2 = max[i].PLAYERID;
	 		}
	 		else if(count === 2){
	 			cpx3 = max[i].X;
	 			cpy3 = max[i].Y;
	 			cp3color = max[i].COLOR;
	 			user3 = max[i].PLAYERID;
	 		}
	 		count++;
	 	}
	 	//gets all powerups
	 	conn1.query("SELECT color,x,y,id from POWER where gameid = "+req.body.gameID+";",function(err,query,moreResults){
	 		if(err){
	 			return;	
	 		}
	 		var array = new Array();
	 		for( var j = 0;j < query.length;j++){
	 			array[j] = {color:query[j].COLOR, x:query[j].X, y:query[j].Y, id:query[j].ID};
	 		}
	 		var projs = new Array();
	 		//gets projections from server
	 		conn1.query("SELECT playerID, color ,x , y , id , xSpeed  ,ySpeed from proj where gameid = "+req.body.gameID + " and playerid != "+req.body.userID+";",function(err,query,more){
	 				if(err){
	 					console.error(err.message);
	 					return;
	 				}
	 				for(j = 0; j<query.length; j++){
	 					projs[j] ={playerID: query[j].PLAYERID,color: query[j].COLOR,x: query[j].X,y:query[j].Y,id:query[j].ID,xSpeed: query[j].XSPEED, ySpeed:query[j].YSPEED};
	 				}
	 				var data = {p2x: cpx1,p2y:cpy1,p2color: cp1color,p3x: cpx2,p3y:cpy2,p3color: cp2color,p4x: cpx3,p4y:cpy3,p4color: cp3color, u2:user1,u3:user2,u4:user3,power:array,projs: projs};
	 				res.send(data);
	 		});
	 		
	 	});
	 	
	 	
	 });
});
//removes power up from server
app.post("/sql/removePower",function(req,res){
	conn1.query("DELETE from POWER where id ="+req.body.id+" AND gameid ="+req.body.gameID+";",function(err,querry,more){
		if(err){
			console.log(err.message);
		}
		res.send();
	});
});
//for waiting screen checks if 4 players have been reached or not
app.post("/sql/check",function(req,res){
	var data;
	conn1.query("select COUNT(PLAYERID) as c from player where gameid = "+req.body.gameID+" GROUP BY gameId;", function(err,query,moreResultSets){
		if(err){
			console.log("err in search err is"+ err.message);
			data = {count: "-1"};
			res.send(data);
			return;
		}
		if(query[0] === null){
			data = {count: "1"};
			res.send(data);
			return;
		}
		if(query[0] !== undefined){
			data = {count: query[0].C};
		}
		else{
			data = {count:-1*req.body.gameID};
		}
		res.send(data);
	});
});
/*
app.get("/gamePage.html*",function(req,res){
	res.sendFile(__dirname + '/public/gamePage.html');
});*/
//when starting game gets player current location as it is randomly assigned
app.post("/sql/startgame", function(req,res){
		conn1.query("select X, Y from PLAYER WHERE PLAYERID = "+req.body.userID+" ;",function(err,max,moreResultSets){
		var data = {x: max[0].X,y: max[0].Y};
		res.send(data);
	});

});
//join or start new game
app.post("/sql/game",function(req,res){
	var userId;
	var gameID;
	var data;
	//gets a random number for the color that will be instered into the board
	var rand1 = Math.floor(Math.random() * 3 + 1);
	var rand2;
	var rand3;
	var update = function(id){
		this.userId = id;
	};
	//if a new game
	if(req.body.type === "ng"){
		//find max user id to give them to user
		conn1.query("SELECT MAX(USERID) as cnt from MYTABLE",function(err,data,moreResultSets){
			if(err){
				console.log("err in search err is"+ err.message);
				data = {userId: "-2"};
				res.send(data);
				return;
			}
			var temp;
			if(data[0].CNT === null){
				update(1);
				temp = 1;
			}
			else{
				update(parseInt(data[0].CNT, 10) + 1);
				temp = parseInt(data[0].CNT, 10) + 1;
			}
			var error = false;
			rand2 = Math.floor(Math.random() * 3 + 1);
			//creates a new user table
			conn1.query("INSERT INTO MYTABLE VALUES(\'"+req.body.user + "\', "+temp+");",function(err,data,moreResultsSets){
				if(err){
					console.log("err in search err is"+ err.message);
					data = {userId: "-3"};			
					res.send(data);
					error = true;
					return;
				}
			});
			//find a new game id
			conn1.query("select max(gameid) as CNT from player", function(err,max,moreResultSets){
				if(error){
					return;
				}
				if(err){
					console.log("err in search err is"+ err.message);
					data = {userId: "-4"};
					res.send(data);
					return;
				}
				var id = max[0].CNT;
				rand3 = Math.floor(Math.random() * 3 + 1);
				if(id === null){
					gameID = 1;
				}
				else{
					gameID = parseInt(id, 10)+1;
				}
				//give postion here for player
				conn1.query("INSERT INTO PLAYER (GAMEID,PLAYERID,X,Y,COLOR,HEALTH) VALUES("+gameID+","+temp+","+385+","+30+",0,100);",function(err,max,moreResultSets){
					if(err){
						console.log("err is "+err.message);
					}
					data = {gameID: gameID,userId: temp};
					res.send(data);
				});
				//puts 4 power ups into server 
				conn1.query("INSERT INTO POWER VALUES("+gameID+",0,30,30,"+rand1+");",function(err,data,more){
					if(err){
						console.log("powerup "+err.message);
					}
				});
				conn1.query("INSERT INTO POWER VALUES("+gameID+",1,720,30,"+rand2+");",function(err,data,more){
					if(err){
						console.log("powerup "+err.message);
					}
				});
				conn1.query("INSERT INTO POWER VALUES("+gameID+",2,30,520,"+rand3+");",function(err,data,more){
					if(err){
						console.log("powerup "+err.message);
					}
				});
				conn1.query("INSERT INTO POWER VALUES("+gameID+",3,720,520,"+Math.floor(Math.random() * 3 + 1)+");",function(err,data,more){
					if(err){
						console.log("powerup "+err.message);
					}
				});
			});
		});
	}
	//if you are trying to join a new game
	else if(req.body.type === "jg"){
		//find max user to set there name and sets user name
		conn1.query("SELECT MAX(USERID) as cnt from MYTABLE",function(err,data,moreResultSets){
			if(err){
				console.log("err in search err is"+ err.message);
				data = {userId: "-2"};
				res.send(data);
				return;
			}
			var temp;
			if(data[0].CNT === null){
				update(1);
				temp = 1;
			}
			else{
				update(parseInt(data[0].CNT, 10) + 1);
				temp = parseInt(data[0].CNT, 10) + 1;
			}
			//insert name int user
			var error = false;
			conn1.query("INSERT INTO MYTABLE VALUES(\'"+req.body.user + "\', "+temp+");",function(err,data,moreResultsSets){
				if(err){
					error = true;
					console.log("err in search err is"+ err.message);
					data = {userId: "-3"};			
					res.send(data);
					return;
				}
			});
			if(error){
				return;
			}
			//makes sure the counts are less than 4
			conn1.query("select gameId,COUNT(PLAYERID) as CNT from player where gameid = "+req.body.gameID+" GROUP BY gameId;", function(err,max,moreResultSets){
				if(error){
					return;
				}
				var x;
				var y;
				if(err){
					console.log("err in search err is"+ err.message);
					data = {userId: "-4"};
					res.send(data);
					return;
				}
				var id = max[0].GAMEID;
				if(id === null){
					console.log("err game doesn't exist");
					data = {userId: "-5"};
					res.send(data);
					return;
				}
				if(max[0].CNT > 3){
					console.log("err already has four players");
					data = {userId: "-6"};
					res.send(data);
					return;
				}
				//gives starting point
				if(max[0].CNT === 1){
					x = 30;
					y = 270;
				}
				else if(max[0].CNT === 2){
					x = 370;
					y = 490;
				}
				else if(max[0].CNT === 3){
					x = 720;
					y = 270;
				}
				//insert player into game
				conn1.query("INSERT INTO PLAYER (GAMEID,PLAYERID,X,Y,COLOR,HEALTH) VALUES("+req.body.gameID+","+temp+","+x+","+y+",0,100);",function(err,max,moreResultSets){
					if(err){
						console.log("err is "+err.message);
					}
					data = {gameID: req.body.gameID, userId: temp};
					res.send(data);
				});
			});
		});
	}
	else{
		conn1.query("SELECT MAX(USERID) as cnt from MYTABLE",function(err,data,moreResultSets){
			if(err){
				console.log("err in search err is"+ err.message);
				data = {userId: "-2"};
				res.send(data);
				return;
			}
			var temp;
			if(data[0].CNT === null){
				update(1);
				temp = 1;
			}
			else{
				update(parseInt(data[0].CNT, 10) + 1);
				temp = parseInt(data[0].CNT, 10) + 1;
			}
			//insert name int user
			var error = false;
			conn1.query("INSERT INTO MYTABLE VALUES(\'"+req.body.user + "\', "+temp+");",function(err,data,moreResultsSets){
				if(err){
					error = true;
					console.log("err in search err is"+ err.message);
					data = {userId: "-3"};			
					res.send(data);
					return;
				}
			});
			if(error){
				return;
			}
			conn1.query("SELECT gameid,count(playerid) as cnt from player group by gameid",function(err,query,moreResults){
				if(err){
					console.error(err.message);
				}
				else{
					for(var i = 0; i < query.length; i++){
						console.error("looping");
						if(query[i].CNT < 4){
							req.body.gameID = query[i].GAMEID;
							console.error("id = "+query[i].GAMEID);
							break;
						}
					}
				}
			//makes sure the counts are less than 4
			conn1.query("select gameId,COUNT(PLAYERID) as CNT from player where gameid = "+req.body.gameID+" GROUP BY gameId;", function(err,max,moreResultSets){
				if(error){
					return;
				}
				var x;
				var y;
				if(err){
					console.error("err in search err is"+ err.message);
					data = {userId: "-4"};
					res.send(data);
					return;
				}
				var id = max[0].GAMEID;
				if(id === null){
					console.log("err game doesn't exist");
					data = {userId: "-5"};
					res.send(data);
					return;
				}
				if(max[0].CNT > 3){
					console.log("err already has four players");
					data = {userId: "-6"};
					res.send(data);
					return;
				}
				//gives starting point
				if(max[0].CNT === 1){
					x = 30;
					y = 270;
				}
				else if(max[0].CNT === 2){
					x = 385;
					y = 490;
				}
				else if(max[0].CNT === 3){
					x = 720;
					y = 270;
				}
				//insert player into game
				conn1.query("INSERT INTO PLAYER (GAMEID,PLAYERID,X,Y,COLOR,HEALTH) VALUES("+req.body.gameID+","+temp+","+x+","+y+",0,100);",function(err,max,moreResultSets){
					if(err){
						console.log("err is "+err.message);
					}
					data = {gameID: req.body.gameID, userId: temp};
					res.send(data);
				});
			});
		});
	});

	}
});
//sets default http server
app.use(express.static(__dirname + '/public'));
// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();


// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {

	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
