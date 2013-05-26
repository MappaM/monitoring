/* plan_appliances.js
 * Contains all functions relative to appliances and drawing them on a plan
 */

/**
 * Save all appliances links in database
 * @param callback Function to call when successfully saved (optional) 
 */
Plan.prototype.save_appliances = function(callback,house_id,csrf_token) {
	var f = "floor_id=" + floors[selectedFloor].pk +objects_to_request(this.appliances_links,'appliance_link_') + '&csrfmiddlewaretoken=' + csrf_token;
	
	$.ajax({
		  type: "POST",
		  url: '/builder/data/house_' + house_id + '/appliances/save',
		  data: f,
		  success: function(v){windows_changed = false;if (callback != undefined) callback();},
		  error:function(e){alert("Error when saving : " + e);},
		});
}

/**
 * Clear the list of appliances and set a permanent loading message
 */
function setCategoryLoading() {
	$('#appliance_list').html('<li>Loading...</li>');
	$('#appliance_menu .active').removeClass('active');
}

/**
 * Define the currently selected appliance type
 * @param index Index in the list of appliances showed
 */
Plan.prototype.setApplianceType = function(index) {
	if (index < 0)
		this.appliance_type = undefined;
	else
		this.appliance_type = this.appliances_types[index];
	$('#appliance_list .active').removeClass('active');
	if (index >= 0)
		$('#appliance_list li:nth-child('+(index + 1)+')').addClass('active');
}

/**
 * Display appliances in the list
 * @param appliance_types Array of ApplianceType objects
 */
function displayApplianceTypes(appliances_types,plan) {
	$('#appliance_list').children().remove();		
	plan.appliances_types = appliances_types;
	for (var i = 0; i < plan.appliances_types.length; i++) {
		
		var li = $('<li onclick="plan.setApplianceType(' + i + ');"></li>');
		$('#appliance_list').append(li);
		var canvas = $('<canvas class=""></canvas>');
		li.append(canvas);
		$(canvas).ready(function(){
			var w = 68;
		
			var ctx = canvas[0].getContext("2d");
			ctx.canvas.width = w;
			ctx.canvas.height = w;
			
			drawAppliance(ctx, w/2, w/2, w ,plan.appliances_types[i]);
			
		});
		
	}	
	plan.setApplianceType(0);
}

/**
 * Change the category of the appliance list menu
 */
function changeCategory(cat,plan) {
	setCategoryLoading();
	$('#appliance_menu #appliance'+cat).addClass('active');
	if (cat == 'Remover') {
		displayApplianceTypes(new Array({'title':'Remove','category':'Remover','pk' : -1},{'title':'Move','category':'Remover','pk' : -2}),plan);
	} else {
	
		$.ajax({url: '/builder/data/appliances/get/category/'+cat,
		success: function(v){
			displayApplianceTypes(jsonStripModel($.parseJSON(v)),plan);					
		},
		error:function(e){alert("Error " + e);},});
	}
}

/**
 * Print a text, wrapping it if the width is larger than maxWidth
 */
function wrapText(context, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';

    for(var n = 0; n < words.length; n++) {
      var testLine = line + words[n] + ' ';
      var metrics = context.measureText(testLine);
      var testWidth = metrics.width;
      if(testWidth > maxWidth) {
        context.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      }
      else {
        line = testLine;
      }
    }
    context.fillText(line, x, y);
  }

/**
 * Draw the image of an appliance in a canvas
 */
function drawAppliance(canvas, x , y , width, appliance) {
	if (appliance == undefined) return;
	canvas.beginPath();
	canvas.lineWidth = 1;
	canvas.rect(x- width/2, y-width/2, width, width);
	canvas.strokeStyle = '#222222';
	canvas.stroke();
	canvas.closePath();
	var h = (width / 6);
	canvas.font = h + 'px Arial';
	canvas.fillStyle = '#222222';
	canvas.textAlign = 'center';

	wrapText(canvas, appliance.title, x, (y - width/2) + h +1, width - 2, h);
	
	var imgWidth = Math.min(20,width * 0.6);
	
	if (appliance.energies != undefined) {
		var length = appliance.energies.length;
		for (var i = 0; i < appliance.energies.length; i++)
			if (appliance.energies[i].type == 'STATE') length--;
		var s = (width - 2 -  imgWidth * length) / 2
		for (var i = 0; i < appliance.energies.length; i++) {
			if (appliance.energies[i].type == 'STATE') continue;
			//Scoping function as i could be overwritten...
			(function(i){				
					ld = function() {
						if (!energy_images[appliance.energies[i].short_name]) {
							canvas.fillStyle = appliance.energies[i].color;
							canvas.font = 'bold ' +(imgWidth *0.8) + 'px Arial';
							canvas.textAlign = 'left';
							canvas.fillText(appliance.energies[i].title[0], s + x - width/2 + 1 + imgWidth * i, y + (width/ 2) - 1 - imgWidth*0.1);
						} else
							canvas.drawImage(energy_images[appliance.energies[i].short_name], 0,0,92,92,  s + x - width/2 + 1 + imgWidth * i, y + (width/ 2) - 1 - imgWidth, imgWidth, imgWidth);
					};
					
					if (eimg_num < energies.length) { //If not all images are loaded
						stack.push(ld); //We put the drawImage function in the stack
					} else
						ld(); //Or we launch it directly
				
	    	
			})(i);
		}
	}
};

/*
 * We implement here a little cache for images of energy powers. We have to implement a stack to put the functions
 *  to call when all images will be loaded, as it can happen that drawAppliance is called before the load is finished
 */
var energy_images = new Object(); //Object containing the images
var eimg_num = 0; //Number of images finished
var stack = new Array();

/**
 * Function called when an image has finished loading
 */
function launchStack() {
	eimg_num++;
	if (eimg_num < energies.length) return;
	for (var i = 0; i < stack.length;i++) {
		stack[i](); //We run all functions in the stack
	}
}

for (var i = 0; i < energies.length; i ++) {
	energy_images[energies[i].short_name] = new Image();
	energy_images[energies[i].short_name].onload = launchStack;
	((function(i){energy_images[energies[i].short_name].onerror = function(e){		
		delete energy_images[energies[i].short_name];
		launchStack();
	};})(i));
	
	energy_images[energies[i].short_name].src = '/static/img/symbols/'+energies[i].short_name+'.png';
}
/*energy_images.water = new Image();
energy_images.water.onload = eimgLoaded;
energy_images.water.src = '/static/img/symbols/water.png';

energy_images.electric = new Image();
energy_images.electric.onload = eimgLoaded;
energy_images.electric.src = '/static/img/symbols/electric.png';

energy_images.fuel = new Image();
energy_images.fuel.onload = eimgLoaded;
energy_images.fuel.src = '/static/img/symbols/fuel.png';*/


/**
 * Add a new window in the list
 * @param window The window to add
 */
Plan.prototype.addApplianceLink = function(appliance_link) {
	this.appliances_links.push(appliance_link);
}


/**
 * Launch an overlay on the page to choose the parameters of the object
 * @param appliance The appliance type
 * @param values The object representing vairables : values. Can be an empty object if the appliance is new
 * @param callback function(values) to call after completion
 */
function applianceVariablesSelector(appliance, values, callback) {	
	//variables = [{name:'activated', type:'boolean', title:'Does this appliance has a remote switch?'}];
	variables = new Array();
	if (variables.length == 0) {
		callback(new Object());
		return;
	}
	var q = $('<div class="appliance_chooser"></div>');
	for ( var i = 0; i < appliance.variables.length; i++) {
		var selecter;
		
		(function(l){mode.click(function(event) {
			$('.overlay').remove();
			
			meter.mode = meter_modes[l][0];
			callback(meter);
		});}(i));
		q.append(selected);
	}
	btn = $('<input type="button" value="Save" />');
	btn.click(function(){
		$('.overlay').remove();
		callback(values);
	});
	q.append(btn);
	modal(q);
}