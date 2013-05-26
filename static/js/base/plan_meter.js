/**
 * Initilise all draggables meters
 * @param energies_used List of energies to draw
 */
function initialiseDraggableMeter(energies_used) {
	for ( var i = 0; i < energies_used.length; i++) {
		var meter = $('<li class="meter" id="meter_' + energies_used[i].short_name
				+ '" style="border : 3px ' + energies_used[i].color
				+ ' solid;"></li>');
		var img = energies_used[i].getMeterImage(92,92);
		meter.append(img);
		meter.data('energy', energies_used[i]);
		meter.draggable({
			containment : plan.canvas,
			helper : 'clone',
			zIndex : 500,
			distance : 5,
			opacity : 0.9,
			revert : "invalid",
		});
		$('#meter_menu').prepend(meter);
	}
}

/**
 * Create a hash of size n
 * @param n size of the hash
 * @returns {String} A randomly generated string of size n
 */
function makehash(n) {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for ( var i = 0; i < n; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
}

function findMeter(appliance_link_pk, energy_short_name) {
	for ( var i = 0; i < meters.length; i++) {

		if (((meters[i].appliance_link == null &&  appliance_link_pk == null) || (meters[i].appliance_link != null && meters[i].appliance_link.pk == appliance_link_pk))
				&& meters[i].energy.short_name == energy_short_name)
			return meters[i];
	}
	return undefined;
}

function resizeMeters(plan) {

	appliancesRefresh(plan);

}

/**
 * Launch an overlay on the page to select a mode of meter
 * @param meter Meter
 * @param callback function(meter) to call after completion
 */
function meterModeSelector(meter, callback) {
	//If the meter is a state, the mode is set to INS
	if (meter.energy.type=='STATE') {
		meter.mode='INS';
		callback(meter);
		return;
	}
		
	var q = $('<div class="mode_chooser">Please select the mode of the meter :<br /></div>');
	for ( var i = 0; i < meter_modes.length; i++) {
		
		var mode = $('<div class="mode_choice"><div class="image"><img class="" src="/static/img/meters/mode_'
				+ meter_modes[i][0].toLowerCase()
				+ '.png" alt="'
				+ meter_modes[i][1]
				+ '"/></div><div>'
				+ meter_modes[i][1]
				+ '</div></div>');
		
		(function(l){mode.click(function(event) {
			$('.overlay').remove();
			
			meter.mode = meter_modes[l][0];
			callback(meter);
		});}(i));
		q.append(mode);
	}
	modal(q);
}

function createDropables(plan) {
	plan.canvas.parent().find('.meter_drop').remove();

	for ( var i = 0; i < plan.appliances_links.length; i++) {
		var a = plan.appliances_links[i];

		// Creating droppables for appliances
		var c = '';
		var accept = [];
		fa: for ( var ie = 0; ie < a.appliance.energies.length; ie++) {

			if (findMeter(a.pk, a.appliance.energies[ie].short_name) != undefined)
				continue fa;
			c += ' meter_drop_' + a.appliance.energies[ie].short_name;
			accept.push('#meter_' + a.appliance.energies[ie].short_name);

		}
		if (c == '')
			continue;
		var p = plan.renderer.getPosition(a.center);
		var w = plan.renderer.getApplianceWidth();
		var ma = $('<div class="meter_appliance meter_drop ' + c + '"></div>');
		plan.canvas.parent().append(ma);
		ma.data('appliance_link', a);
		ma.width(w);
		ma.height(w);
		ma.css('left', (p.x - w / 2) + 'px');
		ma.css('top', (p.y - w / 2) + 'px');
		ma.droppable({
			drop : function(event, ui) {
				var m = new Meter(ui.draggable.data('energy'), '',
						makehash(12), $(event.target).data('appliance_link'));
				meterModeSelector(m, function(m) {
					meters.push(m);
					createDropables(plan);
					refreshMeters(plan);
				});
			},
			accept : accept.join(','),
			hoverClass : 'meter_hover',
			activeClass : 'meter_active',
		});

	}
}

/**
 * Refresh the meters (calculate position, and call the respective drawers)
 */
function refreshMeters(plan) {
	
	
	plan.canvas.parent().find('.plan_meter').remove();

	var nMeters = {left:0,bottom:0,top:0,right:0};
	var maxMeters = {left:Math.max(1,Math.floor((plan.w-2) / plan.meterSize)),
			bottom:Math.max(1,Math.floor((plan.l-2) / plan.meterSize)),
			top:Math.max(1,Math.floor((plan.l -2) / plan.meterSize)),
			right:Math.max(1,Math.floor((plan.w-2) / plan.meterSize))};

	// Calculating meters to draw on the plan for appliances
	var metersToDraw = new Array();
	
	for ( var i = 0; i < plan.appliances_links.length; i++) {

		var a = plan.appliances_links[i];

		// Creating the meters for appliances
		var a_meters = new Array();
		
		// We search all appliances of the the plan and put in a_meters the meters of the ones which have a meter
		fa: for ( var ie = 0; ie < a.appliance.energies.length; ie++) {
			var m;
			if ((m = findMeter(a.pk, a.appliance.energies[ie].short_name)) != undefined)
				a_meters.push(m);

		}

		if (a_meters.length > 0) {
			var iwall = 0;
			var point;
			wallcap:while (true) {
				var nearestWall = plan.getNearestExternalWall(a.center,iwall);
				point = new Position(nearestWall.wall.start.x,
						nearestWall.wall.start.y);

				
				var backnMeters = clone(nMeters);
				
				if (nearestWall.wall.getOrientation() == 'V') {

					if (plan.labels[point.y][point.x] != 0)
						point.x -= 0.5 + plan.meterSize/2;
					else
						point.x += 0.5 + plan.meterSize/2;
					point.y = a.center.y;
				} else { // H

					if (plan.labels[point.y][point.x] != 0)
						point.y -=  0.5 + plan.meterSize/2;
					else
						point.y +=  0.5 + plan.meterSize/2;
					point.x = a.center.x;
				}
				
				if (nearestWall.wall.getOrientation() == 'H') {				
					if (nearestWall.wall.start.y > point.y)
						nMeters.top+=a_meters.length;					
					else 
						nMeters.bottom+=a_meters.length;
				} else {
					if (nearestWall.wall.start.x > point.x)
						nMeters.left+=a_meters.length;
					else 
						nMeters.right+=a_meters.length;
				}
				

				if(nMeters.left > maxMeters.left || nMeters.top > maxMeters.top || nMeters.right > maxMeters.right || nMeters.bottom > maxMeters.bottom) {
					iwall++;
					nMeters = backnMeters;
				} else 
					break wallcap;
			}
			
			for ( var im = 0; im < a_meters.length; im++) {
				metersToDraw.push({
					'meter' : a_meters[im],
					'position' : new Position(point),
					'wall' : nearestWall.wall
				});
			}
		}
	}

	var min_l = 0;
	//Creating overall meters if specified
	if (plan.display_global_meters) {
		
		// Computing some size values to position meters over the plan
		var meterWidth = plan.onemeter * plan.meterSize * 0.9;
		var leftOffset = (plan.offsetX - 1) * (-1) * plan.onemeter;
		var houseWidth = (plan.l + 2*plan.offsetX - 2) * plan.onemeter;
		
		var pass = 0;
		for ( var i = 0; i < energies_used.length; i++)
			if (energies_used[i].overall) pass = 1;
		var numOverallMeters = (energies_used.length - pass);
		var sharedSpace = (houseWidth / numOverallMeters);
		
		if (sharedSpace < plan.meterSize*plan.onemeter) {			
			sharedSpace = plan.meterSize * plan.onemeter;
			leftOffset  = ((plan.l * plan.onemeter) - (sharedSpace * numOverallMeters))/ 2
			min_l = plan.meterSize * numOverallMeters ;
		}
		
		// Displaying overall meters
		var c = 0;
		for ( var i = 0; i < energies_used.length; i++) {
			if (energies_used[i].overall)  {
				continue;				
			}
	
			if ((m = findMeter(null, energies_used[i].short_name)) != undefined) {
				
				var point = plan.renderer.getVirtualPosition(leftOffset
						+ (sharedSpace * (c + 0.5)), plan.onemeter * plan.meterSize/2);
				var nearestWall = plan.getNearestExternalWall(point);
				
				metersToDraw.push({
					'meter' : m,
					'position' : new Position(point),
					'wall' : nearestWall.wall
				});
			} else {
				var mv = $('<div class="plan_meter">&nbsp;</div>');
				plan.canvas.parent().append(mv);
				mv.width(meterWidth);
				mv.height(meterWidth);
				mv.css('left', leftOffset + (sharedSpace * c)
						+ (sharedSpace - meterWidth) / 2 + 'px');
				mv.css('top', 0);
	
				var dwidth = Math.min(meterWidth - 20, plan.meterSize*plan.onemeter * 0.9);
				var mvdrop = $('<div class="meter_global meter meter_drop meter_drop_'
						+ energies_used[i].short_name
						+ '" style="width:'
						+ dwidth
						+ 'px;height:'
						+ dwidth
						+ 'px;font-size:'
						+ Math.min(Math.max(9, dwidth / 6), 14)
						+ 'px;"></div>');
				mv.append(mvdrop);
				mvdrop.append(energies_used[i].getMeterImage((dwidth - 8),(dwidth - 8)))
				mvdrop.append('<br />Overall '
						+ energies_used[i].title.toLowerCase());
				mvdrop.droppable({
					drop : function(event, ui) {
						var m = new Meter(ui.draggable.data('energy'), '', makehash(12), null);
						meterModeSelector(m, function(m) {
							meters.push(m);
							refreshMeters(plan);
						});
					},
					accept : '#meter_' + energies_used[i].short_name,
					hoverClass : 'meter_hover',
					activeClass : 'meter_active',
				});
			}
			c++;
		}
	}

	// Meter links is the list of link between appliances and meters
	plan.meterLinks = new Array();

	// Drawing the meters

	// verify that ther is no collision of a meter dist meters arround the meter
	// made by index
	function decale(index, dist, orientation) {

		for ( var i = 0; i < metersToDraw.length; i++) {
			// If the object is not the index, and it is in the same orientation
			if (i != index
					&& metersToDraw[i].wall.getOrientation() == metersToDraw[index].wall.getOrientation()
					&& (Math.abs(metersToDraw[i].position.getInverted(orientation) - metersToDraw[index].position.getInverted(orientation))  < plan.meterSize/2)) {
				
				//Meters are not in order to do not make cross with links
				var dap = metersToDraw[i].meter.appliance_link.center.get(orientation) - metersToDraw[index].meter.appliance_link.center.get(orientation);
				var dme = metersToDraw[i].position.get(orientation) - metersToDraw[index].position.get(orientation);
				if ((dap * dme) < 0) {
					tmp = metersToDraw[i].meter;
					metersToDraw[i].meter = metersToDraw[index].meter;
					metersToDraw[index].meter = tmp;
				} 
				
				if (dist < 0) {// gauche ou haut
					var d = 0;

					if (metersToDraw[i].position.get(orientation) <= metersToDraw[index].position
							.get(orientation)) {
						if ((d = ((metersToDraw[index].position
								.get(orientation) + dist) - (metersToDraw[i].position
								.get(orientation) + plan.meterSize / 2))) < 0) {
							metersToDraw[i].position.set(orientation,
									metersToDraw[i].position.get(orientation)
											- Math.max(-d / 2, 0.05));
							metersToDraw[index].position.set(orientation,
									metersToDraw[index].position
											.get(orientation)
											+ Math.max(-d / 2, 0.05));
							decale(i,- plan.meterSize/2, orientation);
							decale(index, plan.meterSize/2, orientation);
							return;
						}
					}
				} else { // Droite ou bas
					var d = 0;
					if (metersToDraw[i].position.get(orientation) >= metersToDraw[index].position
							.get(orientation)) {
						if ((d = ((metersToDraw[i].position.get(orientation) - plan.meterSize/2) - (metersToDraw[index].position
								.get(orientation) + dist))) < 0) {
							metersToDraw[i].position.set(orientation,
									metersToDraw[i].position.get(orientation)
											+ Math.max(-d / 2, 0.05));
							metersToDraw[index].position.set(orientation,
									metersToDraw[index].position
											.get(orientation)
											- Math.max(-d / 2, 0.05));
							decale(i, plan.meterSize /2, orientation);
							decale(index, -plan.meterSize /2, orientation);
							return;
						}
					}
				}
			}
		}
	}

	// Colision detection
	for ( var j = 0; j < metersToDraw.length; j++) {
		if (metersToDraw[j].meter.appliance_link === null)
			continue;
		decale(j, -plan.meterSize /2, metersToDraw[j].wall.getOrientation());
		decale(j, plan.meterSize /2, metersToDraw[j].wall.getOrientation());
	}
	
	var min={x:999,y:999};
	var max={x:-1,y:-1};
	for ( var i = 0; i < metersToDraw.length; i++) {
		
		if (plan.params.isMeterResized !== false)
			plan.createMeter(plan,metersToDraw[i].meter,metersToDraw[i].position);

		bottom = new Position(metersToDraw[i].position);
		
		if (metersToDraw[i].meter.appliance_link != null) {
			min.x=Math.min(bottom.x - plan.meterSize/3,min.x);
			max.x=Math.max(bottom.x + plan.meterSize/3,max.x);
			min.y=Math.min(bottom.y - plan.meterSize/3,min.y);
			max.y=Math.max(bottom.y + plan.meterSize/3,max.y);
		}

		
		
		var mult;
		var orient;
		
		if (metersToDraw[i].wall.getOrientation() == 'H') {
			orient = 'V';
			if (metersToDraw[i].wall.start.y > bottom.y) {
				mult = 1;
			} else {
				mult = -1;
			}
		} else {
			orient = 'H';
			if (metersToDraw[i].wall.start.x > bottom.x) {
				mult = 1;
			} else {
				mult = -1;
			}
		}
		bottom.add(orient, mult * 0.90);
		if (metersToDraw[i].meter.appliance_link === null) {
			var wallp = new Position(metersToDraw[i].wall.start);
			if (metersToDraw[i].wall.getOrientation() == 'H') {
				wallp.x = bottom.x;
				wallp.y -= mult * (metersToDraw[i].wall.wall_size / 2);
			} else {
				wallp.y = bottom.y;
				wallp.x -= mult * (metersToDraw[i].wall.wall_size / 2);
			}
			plan.meterLinks.push({
				'from' : bottom,
				'to' : wallp,
				'color' : metersToDraw[i].meter.energy.color,
				'width' : plan.onemeter / 8,
			});
		} else {
			plan.meterLinks.push({
				'from' : bottom,
				'to' : metersToDraw[i].meter.appliance_link.center,
				'color' : metersToDraw[i].meter.energy.color
			});
		}
		
	}
	
	//Cropping the plan after the first pass, if there's no meter in one side
	if (plan.params.isMeterResized === false) {
		plan.params.isMeterResized = true;		

		//We crop a side only if it has no meter
		var cropLeft = nMeters.left == 0 ;// && nMeters.top<maxMeters.top && nMeters.bottom < maxMeters.bottom;
		var cropRight = nMeters.right == 0 ;// && nMeters.top<maxMeters.top && nMeters.bottom < maxMeters.bottom;
		var cropBottom = nMeters.bottom == 0; //  && nMeters.left<maxMeters.left && nMeters.right < maxMeters.right;
		var cropTop = nMeters.top == 0; // && nMeters.left<maxMeters.left && nMeters.right < maxMeters.right;

		var l = plan.l;
		var w = plan.w;
		plan.l = plan.params.length + 2 + (cropLeft?(-plan.meterSize):0) + (cropRight?(-plan.meterSize):0);		
		plan.w = plan.params.width + 2 + (cropTop?(-plan.meterSize):0) + (cropBottom?(-plan.meterSize):0);

		
		if (cropLeft)
			plan.offsetX = plan.params.offsetX - 1 +plan.meterSize;
		if (cropTop)
			plan.offsetY = plan.params.offsetY - 1 +plan.meterSize;
		
		//If there is meter in adjacent sides, we have to let the space for it
		if (plan.l < max.x-min.x - 2 || plan.l < min_l) {
			var nl = Math.max(Math.ceil(max.x-min.x) - 2,min_l);
			plan.offsetX -= (nl - plan.l) /2;
			plan.l = nl;			
		}
		
		if (plan.w < max.y-min.y - 2) {
			var nw = Math.ceil(max.y-min.y) - 2;
			plan.offsetY -= (nw - plan.w) /2;
			plan.w = nw;			
		}
		plan.croppedw = w - plan.w;
		plan.croppedl = l - plan/l;
		plan.resize();
		refreshMeters(plan);
	}
	plan.refresh();
	if (plan.afterResize != undefined) plan.afterResize(plan);

}


function refreshMetersDecoration(plan) {
	for ( var i = 0; i < plan.meterLinks.length; i++) {
		var l = plan.meterLinks[i];
		plan.renderer.link(l.from, l.to, l.color, l.width);
	}
}

Plan.prototype.save_meters = function(callback, house_id, csrf_token) {
	var f = objects_to_request(meters, 'meter_') + '&csrfmiddlewaretoken='
			+ csrf_token;

	$.ajax({
		type : "POST",
		url : '/builder/data/house_' + house_id + '/meters/save',
		data : f,
		success : function(v) {
			if (callback != undefined)
				callback();
		},
		error : function(e) {
			alert("Error when saving : " + e);
		},
	});
}