Plan.prototype.addWall = function(start,end,wall_s,insulating_s) {
	if (start.x != end.x && start.y != end.y) {
		this.displayError('The walls must be vertical or horizontal...');
		return;
	}
	if (start.x > end.x || start.y > end.y) {
		tmp = start;
		start = end;
		end = tmp;
	}
	newwall = new Wall(start,end,insulating_s,wall_s);
	
	ws = this.getWallsAt(start);	
	ws = ws.concat(this.getWallsAt(end));	
	for (var i = 0; i < ws.length; i++) {
		wall = ws[i];
		
		if ((wall.getOrientation() != newwall.getOrientation()) || (newwall.insulating_size != wall.insulating_size) || (wall.wall_size != newwall.wall_size))
			continue;
		if (wall.start.x == end.x && wall.start.y == end.y) {
			ws[i].start = new Position(start.x,start.y);
			return;
		} else if (wall.end.x == start.x && wall.end.y == start.y) {
			ws[i].end = new Position(end.x,end.y);			
			return;
		}				
	}

	plan.walls.push(newwall);
}

Plan.prototype.removeWallAt = function(point) {
	for (var i=0; i<this.walls.length; i++) {
		var wall = this.walls[i];
		candidate = this.getWallAt(point);
		if (candidate == undefined) continue; 
		if (wall.start.equals(candidate.start) && wall.end.equals(candidate.end)) {
			this.removeWindowsByIndex(this.getWindowsIndexBetween(candidate.start,candidate.end));
			this.walls.remove(i);
			break;
		}
	}
}

/**
 * Return true if there's a wall in the list, horizontal, at y from the top and including [xd,xf]
 */
function hasWallHorizontal(walls,y, xd , xf) {
	
	for (var i=0; i<walls.length; i++) {
		var wall = walls[i];
		if (wall.start.y == y && wall.start.y == wall.end.y) {
			if (wall.start.x <= xd && wall.end.x >= xf) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Return true if there's a wall in the list, vertical, at x from the left and including [yd,yf]
 */
function hasWallVertical(walls,x, yd , yf) {
	
	for (var i=0; i<walls.length; i++) {
		var wall = walls[i];
		if (wall.start.x == x && wall.start.x == wall.end.x) {
			if (wall.start.y <= yd && wall.end.y >= yf) {
				return true;
			}
		}
	}
	return false;
}

Plan.prototype.getWallsAt = function(point) {
	if (point == undefined) return undefined;
	var ws = Array();
	for (var i=0; i<this.walls.length; i++) {
		var wall = this.walls[i];
		if ((wall.start.x == point.x && wall.start.x == wall.end.x && wall.start.y <= point.y && wall.end.y >= point.y) || //V
				(wall.start.y == point.y && wall.start.y == wall.end.y && wall.start.x <= point.x && wall.end.x >= point.x)) {
			ws.push(wall);
		}
	}
	
	return ws;
};

Plan.prototype.getWallAt = function (point) {
	var ws = this.getWallsAt(point);
	if (ws.length > 0) {
		return ws[this.items_next % ws.length];
	}
	return undefined;
};



Plan.prototype.save_walls = function (callback,house_id,csrf_token) {
	if (this.walls == undefined) return;
	var f = "floor_id=" + floors[selectedFloor].pk +objects_to_request(this.walls,'wall_') + '&csrfmiddlewaretoken=' + csrf_token;
	
	$.ajax({
		  type: "POST",
		  url: '/builder/data/house_'+ house_id +'/walls/save',
		  data: f,
		  success: function(v){if (callback != undefined) callback();},
		  error:function(e){alert("Error when saving : " + e);},
		});
};

Plan.prototype.getNearestExternalWall = function(position,offset) {
	if (offset == undefined) offset = 0;
	this.labelize(this.walls);
	
	var allWalls = [];
	
	for (var i = 0; i < this.walls.length; i++) {
		
		var wall = this.walls[i];

		if (wall.getOrientation() == 'V') {

			if ((this.labels[wall.start.y][wall.start.x - 1] * this.labels[wall.start.y][wall.start.x]) != 0)
				continue;
			if (position.y <  wall.start.y || position.y >  wall.end.y) continue;
			allWalls.push({dist:Math.abs(position.x - wall.start.x),wall:wall,orientation:'V'});
			
		} else { //H
			if ((this.labels[wall.start.y - 1][wall.start.x] * this.labels[wall.start.y][wall.start.x]) != 0)
				continue;
			if (position.x <  wall.start.x || position.x >  wall.end.x) continue;
			
			allWalls.push({dist:Math.abs(position.y - wall.start.y),wall:wall,orientation:'H'});
		}

		
	}
	
	allWalls.sort(function(a,b){return (a.dist-b.dist)});

	return allWalls[offset];
};

function wallIsExternal(wall, plan) {
	if (wall.getOrientation() == 'H'){ //Mur horizontal		
		
		if ((plan.labels[wall.start.y - 1][wall.start.x] == 0) || (plan.labels[wall.start.y][wall.start.x] == 0)) {
			
			return true;
		}
	} else { //Mur vertical
		if ((plan.labels[wall.start.y][wall.start.x - 1] == 0) || (plan.labels[wall.start.y][wall.start.x] == 0)) {
			return true;
		}
	}
	return false;
}