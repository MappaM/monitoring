/* global.js
 * This file contains all function that must be accessible in all applications
 */

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

Array.prototype.removeEquals = function(obj) {
	this.remove(this.indexOf(obj)); 
};


function houseChoose(id) {
		if (id == '-1') return;
	if (id == '') {
		
		$.ajax({
			url:'/select_house/',
			success:function(data){window.location.href = '/builder/';},
		});
	} else {
		$.ajax({
			url:'/select_house/'+id,
			success:function(data){window.location.reload();},
		});
		
	}
}

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function object_to_request(obj, prefix, suffix) {
	request = '';
	for(var property in obj) {
		
		if (typeof obj[property] === 'object')
			if ((obj[property]) == null) {
				request += '&' + prefix + property + suffix + '=' + null;
			} else
				request += object_to_request(obj[property], prefix+ property + '_', suffix);
		else if (typeof obj[property] !== 'function') {
			
			request += '&' + prefix + property + suffix + '=' + obj[property];
		}
	}
	return request;
}

function objects_to_request(tab,prefix) {
	request = "&n="+tab.length;
	for (var i = 0; i < tab.length; i++) {
		obj = tab[i];
		request += object_to_request(obj, prefix, i);
		
	}
	
	return request;
}

/**
 * Change the page to the specified menu
 * @param selected The name of the menu
 */
function menu(selected) {
	//$('#menubar .active').removeClass('active');
	window.location.href = '/' + selected;
}

/**
 * Resize the background of the page
 */
function bg_resize() {
	var body = document.body;
    var html = document.documentElement;

    $('#content').css('height','auto');
    var height = Math.max( body.scrollHeight , body.offsetHeight, 
                       html.clientHeight, html.scrollHeight , html.offsetHeight );

	
	$('#content').css('height',((height-154)+'px'));
}

/*
 * Code for automatic background resizing
 */
$(window).resize(bg_resize);
$(document).ready(function(){
	bg_resize();
});

/**
 * Strip a list of djnago models passed to transform them as simble javascript objects containing just the fields of the model and their values, and Wall, Position and Window if applicable
 * @param model Array of django objects
 * @returns Array of javascript objects
 */
function jsonStripModel(model) {
	
	var ar = new Array();
	if (model == undefined) return ar;
	
	for (var i = 0; i < model.length; i++) {
		
		if (model[i].model == 'builder.wall') {
			var start = new Position(model[i].fields.start.x,model[i].fields.start.y);
			var end = new Position(model[i].fields.end.x,model[i].fields.end.y);
			obj = new Wall(start,end,model[i].fields.insulating_size,model[i].fields.wall_size);
		} else if (model[i].model == 'builder.window') {
			var center = new Position(model[i].fields.center.x,model[i].fields.center.y);
			obj = new Window(center,model[i].fields.width,model[i].fields.height,model[i].fields.type,model[i].fields.orientation);
		} else if (model[i].model == 'builder.appliancelink') {
			var center;
			if (model[i].fields.center.x == undefined)
				center = new Position(model[i].fields.center.fields.x,model[i].fields.center.fields.y);
			else
				center = new Position(model[i].fields.center.x,model[i].fields.center.y);
			
			var floor = model[i].fields.floor;
			l = new Array();			
			l.push(model[i].fields.appliance);
			ap = jsonStripModel(l);
			
			obj = new ApplianceLink(ap[0],center,model[i].fields.values,floor);
			
		} else if (model[i].model == 'builder.appliancetype') {

			obj = new ApplianceType(model[i].fields.category,jsonStripModel(model[i].fields.energies),model[i].fields.title, model[i].fields.variables);
			
			
		} else if (model[i].model == 'builder.meter') {
			var al;
			if (model[i].fields.appliance_link == null)
				al = null;
			else
				al = jsonStripModel(new Array(model[i].fields.appliance_link))[0]; 
			obj = new Meter(jsonStripModel(new Array(model[i].fields.energy))[0],model[i].fields.mode,model[i].fields.hash,al);
			
			
		} else if (model[i].model == 'builder.energy') {

			obj = new Energy(model[i].fields);
			
			
		} else {
			obj = model[i].fields;
		}
		
		obj.pk = model[i].pk;
		ar.push(obj);

	}
	return ar;
}

/**
 * Put a jquery object in a dialog mode with all page content behind a black filter except the dialog
 * @param content The jquery object
 */
function modal(content) {
	var overlay = $('<div class="overlay"></div>');
	$('body').append(overlay);
	overlay.height($(window).height());
	overlay.append(content);
	content.css('margin', 'auto');
	content.css('marginTop', ($(window).height() - content.height()) / 2);
}