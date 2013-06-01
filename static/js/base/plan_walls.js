/* plan_walls.js
 * Contains all functions relative to walls and drawing them on a plan
 */

/**
 * Add a wall to the pla
 * 
 * @param start Position of the beginning of the wall
 * @param end Position of the end of the wall
 * @param wall_s Size of the wall
 * @param insulating_s Size of the insulating material
 */
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
	
	//We search the walls to find if it's not in prolongation of another, and combine them if it's the case.
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
};

/**
 * Remove a wall at a given point on the plan
 * @param point
 */
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
};


/**
 * Draw the walls on the plan (via the Renderer)
 * @param wall_p List of Wall objects
 * @param color Color of walls
 * @param insulating Color of insulating
 */
Plan.prototype.refreshWalls = function (wall_p,color,insulating) {
	if (wall_p == undefined) return;
	for (var i=0; i<wall_p.length; i++) {
		var wall = wall_p[i];
		this.renderer.drawWall(wall,color,insulating);
	}
};	


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

/**
 * Return the list of walls at a given position
 * @param point A position on the plan
 * @returns An array of walls at the point
 */
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

/**
 * Return a wall at a given position, using the items_next to select one if there's multiple wall at a point
 * @param point A position on the plan
 * @returns A wall at the point
 */
Plan.prototype.getWallAt = function (point) {
	var ws = this.getWallsAt(point);
	if (ws.length > 0) {
		return ws[this.items_next % ws.length];
	}
	return undefined;
};


/**
 * Save the list of walls (via AJAX) and call the callback function if success
 * @param callback A function to call after success
 * @param house_id The id of the house
 * @param csrf_token The csrf token
 */
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

/**
 * Return the wall nearest of a point
 * @param position A point on the plan
 * @param offset Ignore the offset first nearest walls
 * @returns A wall
 */
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

/**
 * True if wall is an external wall on the plan
 * @param wall
 * @param plan
 * @returns True if wall is external, false if not
 */
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

/** 
 * Load the list of wall
 * @param plan
 */
function loadWalls(plan) {
	$.ajax({url: '/builder/data/floor_'+ plan.floor_id +'/walls/get',
		success: function(v){
			plan.walls = jsonStripModel($.parseJSON(v));
			plan.hideMessage();
			plan.refresh();
			plan.events.call('wallLoaded',plan);
		},
		error:function(e){alert("Error " + e);},
	});		
};

/**
 * Register this plugin to a plan
 * @param plan
 */
function registerWallPlugin(plan) {
	//Registering event to load the walls when the user change the floor
	plan.events.register("floorChanged", loadWalls);
	
	//Registering functions for drawing the plan
	plan.events.register("refresh", function() {
		plan.refreshWalls(plan.backwalls, 'rgba(200,0,0,0.5)','rgba(150,0,0,0.5)');
		plan.refreshWalls(plan.walls, '#000000','#555555');	
	});
}