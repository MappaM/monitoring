/**
 * Initialize a new Plan manager
 * @param params object of parameters
 */
function Plan(params) {
	this.params = params;
	var l = params.length;
	var w = params.width;
	if (params.precision == undefined)
		params.precision = grid_precision;		
	this.precision = params.precision;
	if (params.canvas == undefined)
		params.canvas = $('#plan');		
	this.canvas = params.canvas;
	
	//-------------------
	// Parameters
	//-------------------	
	this.displayLabels = false;
	if (params.draw_grid != undefined) this.draw_grid = params.draw_grid; else this.draw_grid = true;
	if (params.display_global_meters != undefined) this.display_global_meters = params.display_global_meters; else this.display_global_meters = 2;
	if (params.meterSize != undefined) this.meterSize = params.meterSize; else this.meterSize = 2;
	if (params.onemeter_max != undefined) this.onemeter_max = params.onemeter_max; else this.onemeter_max = 100;
	if (params.showBackWalls != undefined) this.showBackWalls = params.showBackWalls; else this.showBackWalls = false;
	if (params.enable_keys != undefined) this.enable_keys = params.enable_keys; else this.enable_keys = true;
	if (params.onemeter_min != undefined) this.onemeter_min = params.onemeter_min; else this.onemeter_min = 48;
	if (params.resize_height != undefined) this.resize_height = params.resize_height; else this.resize_height = true;
	if (params.enable_mouse != undefined) this.enable_mouse = params.enable_mouse; else this.enable_mouse = true;

	//-------------------
	// Canvas and sizes
	//-------------------
	//IE<9 compatiblity
	if (this.canvas[0].getContext == undefined)
		G_vmlCanvasManager.initElement(this.canvas[0]);
	
	this.offsetX = params.offsetX;
	this.offsetY = params.offsetY;

	if (this.offsetX == undefined)
		this.offsetX = 1;
	if (this.offsetY == undefined)
		this.offsetY = 1;

	this.offsetX -= 1;
	this.offsetY -= 1;
	this.c= this.canvas[0];	
	
	this.l = l+2;
	this.w = w+2;
	
	//-------------------
	// Elements
	//-------------------
	this.cursor = undefined;
	this.start = undefined;
	this.window = undefined;
	this.labels = undefined;
	this.backwalls = undefined;
	this.walls = undefined;
	this.appliances_links = new Array();
	this.appliances_types = new Array();
	this.meterLinks = new Array();
	this.tool =  'blank';
	this.toolColor =  '';
	this.ctx=this.c.getContext("2d");
	this.windows = Array(); 
	this.windows_changed = false;
	this.refreshing = false;
	
	//-------------------
	// Events
	//-------------------
	this.events = new EventManager(this);
	
	//Old version compatibility
	if (typeof getCurrentTool != 'function')
		getCurrentTool = function(){return '';};

	//-------------------
	// Movement of mouse and click
	//-------------------
	var plan = this;
	if (this.enable_mouse) {
		this.canvas.bind('mousemove',function(e) {
			newCursor = plan.get_e_pos(e);
	
			if ((newCursor == undefined && plan.cursor != undefined) ||  (newCursor != undefined && !newCursor.equals(plan.cursor))) {
				plan.cursor = newCursor;
				plan.events.call('stateChanged', plan);
				plan.refresh();
	
			}
		});
	}
	this.canvas.bind('mouseleave',function() {
		plan.cursor=undefined;
		plan.tool = 'blank';
	});		
	this.canvas.click(function(){
		plan.events.call("click");
	});	

	//-------------------
	// Keyboard listener
	//-------------------
	
	//Variable incremented when the users type "N", used to switch items, orientations, etc...
	this.items_next = 0;
	if (this.enable_keys)
		document.onkeydown = function(event) {
			if (event.keyCode == 78) {
				plan.items_next += 1;
				plan.events.call('stateChanged');
				plan.refresh();
				event.preventDefault();
			} else if (event.keyCode == 76) {
				plan.displayLabels = true;
				if (plan.labels == undefined) plan.labelize(plan.walls);
				plan.refresh();
				event.preventDefault();
			} else {
				plan.keyboardEvent = event;
				plan.events.call('keyStroke');
			}
		};	
		
	//-------------------
	// Size management
	//-------------------	
	this.autoresize = true;

	this.resize = function() {
		if (this.beforeResize != undefined) this.beforeResize(this);
		if (this.autoresize) {
			this.canvas.parent().width('100%');
			this.pl = this.canvas.parent().width();
			
			if (this.resize_height) {
				var scrollTop = 0;
				if (document.body)
					scrollTop = document.body.scrollTop;
				this.pw = $(window).height() - this.canvas.parent().offset().top + scrollTop - 40; //40 For average following things like button
				this.onemeter =  Math.max(this.onemeter_min,Math.min(Math.floor((this.pw - 1) / this.w),Math.floor((this.pl - 1) / this.l)));
			} else {
				this.onemeter =  Math.floor((this.pl - 1) / this.l);
			}
		}
		
		if (this.onemeter > this.onemeter_max) this.onemeter = this.onemeter_max;
		this.pl = this.onemeter * this.l - 1;		
		this.pw = this.onemeter * this.w - 1;
		this.canvas.width(this.pl + 1);
		this.canvas.height(this.pw + 1);
		this.ctx.canvas.width = this.pl + 1;
		this.ctx.canvas.height = this.pw + 1;
		this.renderer = new Renderer2D(this.ctx,this.onemeter,this.offsetX,this.offsetY,this.pl,this.pw);
		this.canvas.parent().width(this.canvas.width());
		
		this.events.call('resized',this);
		this.refresh();
		if (this.afterResize != undefined) this.afterResize(this);
	};
	$(window).smartresize(function(){plan.resize();});
	$(window).scroll(function() {
	    clearTimeout($.data(this, "scrollTimer"));
	    $.data(this, "scrollTimer", setTimeout(function() {
	    	plan.resize();
	    }, 50));});
	this.resize();
}	

/**
 * Force refresh even if timeout is not out
 */
Plan.prototype.forceRefresh = function() {
	
}


/**
 * Redraw the plan
 */
Plan.prototype.refresh = function () {
	
	//Process to refresh only if not refreshing is currently done
	if (this.refreshing)  {
		if (this.refreshAwaiting)
			console.log("Refreshing ignored.");
		else {
			console.log("Refreshing stacked.");
			this.refreshAwaiting = true;
		}
		
		return;
	}
	this.refreshing = true;
	
	console.log("Refreshing plan...");
	
	//Cleaning canvas
	this.renderer.clear();

	//Drawing the grid
	if (this.draw_grid)
		this.renderer.drawGrid(this.l,this.w);
	else if (this.walls != undefined) {
		if (this.labels == undefined) this.labelize(this.walls);
		this.renderer.fillGrid(this.l, this.w, this.labels, this.params.colors);
	}
	
	//Displaying label (to display label, press l key on the plan)
	if (this.displayLabels && this.labels != undefined) {
		for (var y = 0;y < this.w; y++) {
			for (var x = 0;x < this.l; x++) {
				this.ctx.fillText(this.labels[y][x]+ " " + (y) + " " + (x),(x + 0.5) * this.onemeter,(y + 0.5) * this.onemeter);
			};
		};
	}
	
	this.events.call('refresh');


	if (this.cursor != undefined) {
		if (getCurrentTool() == 'window' || getCurrentTool() == 'windowRemover') {

			var ws = this.getWallsAt(this.cursor);

			if (ws.length > 1) {
				this.displayAlert('Press N to put the window on another wall');
			}

			if (ws.length == 0) {
				this.window = undefined;
				this.renderer.drawCircle(this.cursor.x * this.onemeter, this.cursor.y * this.onemeter,'red');
			} else {
				var wall = ws[this.items_next % ws.length];

				this.window = new Window(this.cursor);

				this.window.width = parseInt($('#window_width').val()) / 100;
				this.window.height = parseInt($('#window_height').val()) / 100;
				this.window.orientation = wall.getOrientation();
				this.window.type = $('#window_type').val();

				//If window is entirely on the wall, or if it has no orientation

				if ((this.window.orientation == 'H' && (this.window.center.x - (this.window.width / 2)) >= wall.start.x && (this.window.center.x + (this.window.width / 2)) <= wall.end.x) 
						||	(this.window.orientation == 'V' && (this.window.center.y - (this.window.width / 2)) >= wall.start.y && (this.window.center.y + (this.window.width / 2)) <= wall.end.y)
				) {

					w = this.getWindowAt(this.cursor);

					if (w == undefined)
						if (getCurrentTool() == 'windowRemover')
							this.renderer.drawCircle(this.cursor.x * this.onemeter, this.cursor.y * this.onemeter,'red');
						else
							this.renderer.drawWindow(this.window);
					else
						if (getCurrentTool() == 'windowRemover')
							this.renderer.drawWindow(w,'#ff0000');
						else
							this.renderer.drawWindow(this.window,'#ff0000');
				} else {
					this.window = undefined;
					this.renderer.drawCircle(this.cursor.x * this.onemeter, this.cursor.y * this.onemeter,'red');
				}
			}
		} else if (this.tool == 'wall') {	
			this.renderer.drawWall(this.toolParams,'#FF0000','#FF0000');
		} else if (this.tool == 'appliance') {
			drawAppliance(this.ctx, this.cursor.x * this.onemeter, this.cursor.y * this.onemeter, this.onemeter * 0.8, this.appliance_type);
		} else if (this.tool == 'circle') {
			this.renderer.drawCircle(this.cursor.x * this.onemeter, this.cursor.y * this.onemeter,this.toolColor);
		} else if (this.tool == 'blank') {
			//Draw nothing
		} else {
			this.renderer.drawCircle(this.cursor.x * this.onemeter, this.cursor.y * this.onemeter,'blue');
		}
	}	

	if (this.start != undefined) {
		this.renderer.drawCircle(this.start.x * this.onemeter, this.start.y * this.onemeter,'green');
	}
	
	//We use a timeout to draw no more than each 100ms
	var plan = this;
	window.setTimeout(function(){
		plan.refreshing = false;
		if (plan.refreshAwaiting) {
			plan.refreshAwaiting = false;
			plan.refresh();
		}
	},66);
};


/**
 * Display an error
 * @param txt The error
 */
Plan.prototype.displayError = function(txt) {
	$('#plan_message').css('position','none');
	$('#plan_message').html(txt);
	$('#plan_message').fadeIn().delay(3000).fadeOut();
};


Plan.prototype.displayMessage = function(txt) {
	this.canvas.hide();
	$('#plan_message').html(txt);
	$('#plan_message').show();
};

Plan.prototype.hideMessage = function() {
	this.canvas.show();
	$('#plan_message').hide();
};


Plan.prototype.displayAlert = function (txt) {
	$('#plan_message').css('position','absolute');
	$('#plan_message').css('right','24px');
	$('#plan_message').html(txt);
	$('#plan_message').stop(true,true).show().delay(1500).fadeOut(1500);
};


/**
 * Compute labels of each square on the plan
 */
Plan.prototype.labelize = function (walls) {
	this.labels = new Array(this.w);
	var labelnumber = 0;
	//First pass
	for (var y = 0;y < this.w; y++) {
		this.labels[y] = new Array(this.l);
		for (var x = 0;x < this.l; x++) {
			newlab = labelnumber;
			if (hasWallHorizontal(walls,y,x, x+1)) {

				if (hasWallVertical(walls,x,y, y+1)) {
					labelnumber++;
					newlab = labelnumber;
				} else {
					newlab = this.labels[y][x - 1];
				}
			} else {
				if (y >0) {
					if (x == 0 || hasWallVertical(walls,x,y, y+1))							
						newlab = this.labels[y - 1][x];
					else
						newlab = Math.min(this.labels[y - 1][x],this.labels[y][x - 1]);
				} else
					newlab = labelnumber;
			}
			this.labels[y][x] = newlab;
		}
	}
	//Second pass
	for (var y = this.w - 2; y >= 0; y--) {
		for (var x = this.l - 2; x >= 0; x--) {
			newlab = labelnumber;
			if (hasWallHorizontal(walls,y + 1,x, x+1)) {					
				if (hasWallVertical(walls,x + 1,y, y+1)) {
					newlab = this.labels[y][x] ;
				} else {
					newlab = Math.min(this.labels[y][x], this.labels[y][x + 1]); 
				}
			} else {
				if (hasWallVertical(walls,x + 1,y, y+1)) {
					newlab = Math.min(this.labels[y][x], this.labels[y + 1 ][x]) ;
				} else {
					newlab = Math.min(this.labels[y][x], this.labels[y][x + 1],  this.labels[y + 1 ][x]); 
				}

			}
			this.labels[y][x] = newlab;
		}
	}
	this.refresh();
};

/**
 * Change the current floor
 * @param floor_id The id of the floor
 * @param backfloor_id The id of the floor under the one passed as floor_id, for background drawing purpose
 */	 
Plan.prototype.getFloorContent = function(floor_id,backfloor_id) {
	this.displayMessage('Loading...');
	
	this.floor_id = floor_id;
	this.backfloor_id = backfloor_id;
	this.events.call("floorChanged");
};


/**
 * Get position of the cursor in the grid
 * @param e Mouse event
 * @returns Position of the cursor
 */
Plan.prototype.get_e_pos = function(e) {
	if (e == undefined) return undefined;		
	var rl = e.pageX - this.canvas.offset().left;
	var rw = e.pageY - this.canvas.offset().top;
	if (rl < 0 || rw < 0 || rl > this.canvas.width() || rw > this.canvas.height()) return undefined;
	var l = Math.round((rl * this.precision) / this.onemeter) / this.precision;
	var w = Math.round((rw * this.precision) / this.onemeter) / this.precision;
	if (l == 0 || w == 0 || l == this.l || w==this.w) return undefined;
	return new Position(l,w);
};



/**
 * To be called when a tool has changed. Reset the display normaly changed by this tool
 */
Plan.prototype.toolChanged = function() {
	this.start = undefined;
	this.cursor = undefined;
	plan.refresh();
};


/**
 * Find if a point is in the house
 * @param point A point on the grid
 * @returns True if it is in the exterior
 */
Plan.prototype.isExterior = function(point) {
	if (this.labels == undefined) this.labelize(this.walls);
	if (point.y != Math.round(point.y)) {
		if (this.isExterior({'x':point.x,'y':Math.floor(point.y)}) || this.isExterior({'x':point.x,'y':Math.ceil(point.y)})) 
			return true;
		else 
			return false;
	} else {
		if (point.x != Math.round(point.x)) {
			if (this.isExterior({'x':Math.floor(point.x),'y':point.y}) || this.isExterior({'x':Math.ceil(point.x),'y':point.y})) 
				return true;
			else 
				return false;
		} else {
			return this.labels[point.y][point.x]==0;
		}
	}
};