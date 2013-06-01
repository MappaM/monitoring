function Window(center,width,height,type,orientation) {
	this.center = center;
	this.width = width;
	this.height = height;
	this.type = type;
	this.orientation = orientation;
}

/**
 * Tell if the window is between two point (vertically alligned or horizontally aligned)
 * @param start First point (most left top)
 * @param end Second point (most right bottom)
 */
Window.prototype.between = function(start,end) {
	
	if (start.y == end.y) //H
		return  start.y==this.center.y && (this.center.x >= start.x && this.center.x <= end.x);
	else //V
		return  start.x==this.center.x && (this.center.y >= start.y && this.center.y <= end.y);
};

/**
 * Save all windows in database
 * @param callback Function to call when successfully saved (optional) 
 */
Plan.prototype.save_windows = function(callback,house_id,csrf_token) {
	var f = "floor_id=" + floors[selectedFloor].pk +objects_to_request(this.windows,'window_') + '&csrfmiddlewaretoken=' + csrf_token;

	var plan = this;
	$.ajax({
		  type: "POST",
		  url: '/builder/data/house_' + house_id + '/windows/save',
		  data: f,
		  success: function(v){plan.windows_changed = false;if (callback != undefined) callback();},
		  error:function(e){alert("Error when saving : " + e);},
		});
}

/**
 * Remove a window by it's index in the list of windows
 * @param i Index of the window to remove in the list
 */
Plan.prototype.removeWindowByIndex = function (i) {
	this.windows.remove(i);
	this.windows_changed = true;
}

/**
 * Return indexes of all windows whose center is between start and end (they have to be aligned)
 * @param start Position of start
 * @param end Position of end
 */
Plan.prototype.getWindowsIndexBetween = function(start,end) {
	indexes = Array();
	
	for (var i=0; i<this.windows.length; i++) {
		var window = this.windows[i];
		
		if (window.between(start,end)) {
			indexes.push(i);
		}
	}
	return indexes;
};

/**
 * Delete all windows whose indexes are in the list. Indexes have to be ordered !
 * @param index_list List of window index
 */
Plan.prototype.removeWindowsByIndex = function(index_list) {
	for (var i=0; i<index_list.length; i++) {
		var index = index_list[i];
		this.removeWindowByIndex(index - i);
	}
};

/**
 * Return the window at some postion
 * @param point Position to look after
 * @returns a Window at this position, undefined if there's none
 */
Plan.prototype.getWindowAt = function(point) {
	
	for (var i=0; i<this.windows.length; i++) {
		var window = this.windows[i];
		if (window.center.equals(point)) {
			return window;
		}
	}
	
};

/**
 * Add a new window in the list
 * @param window The window to add
 */
Plan.prototype.addWindow = function(window) {
	this.windows.push(window);
	this.windows_changed = true;
};


/**
 * Redraw the windows on the plan
 * @param windows_p The list of Window objects
 */
Plan.prototype.refreshWindows = function(windows_p) {
	if (windows_p == undefined) return;
	for (var i=0; i<windows_p.length; i++) {
		var window = windows_p[i];
		this.renderer.drawWindow(window);
	}
};

/**
 * Load the windows
 */
function loadWindows(plan) {
	$.ajax(	{
				url: '/builder/data/floor_'+ plan.floor_id +'/windows/get',
				success: function(v){
					plan.windows = jsonStripModel($.parseJSON(v));
					plan.refresh();
				},
		  	});
};

/**
 * Register this plugin to a plan
 * @param plan
 */
function registerWindowPlugin(plan) {
	plan.events.register("wallLoaded", loadWindows);
	plan.events.register("floorChanged", function(plan){plan.windows = null;});
	plan.events.register("refresh", function(plan){plan.refreshWindows(plan.windows);});
}