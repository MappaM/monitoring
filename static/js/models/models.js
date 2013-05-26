/*
 * models.js
 * Contains the javascript implementation of the django models
 */

var Meter = function(energy, mode, hash, appliance_link) {
	this.energy = energy;
	this.mode = mode;
	this.hash = hash;
	this.appliance_link = appliance_link;
};

var ApplianceLink = function(appliance, center, values, floor) {
	this.appliance = appliance;
	this.center = center;
	this.floor = floor;
	this.valus = values;
};

var ApplianceType = function(category, energies, title, variables) {
	this.category = category;
	this.energies = energies;
	this.title = title;
	this.variables = variables;
};

/**
 * Initialise a new Position
 * @param x A position object, or the x parameter
 * @param y the y parameter, only of x is not a position
 * @returns
 */
function Position(x,y) {
	if (typeof x == "object") {
		this.x = x.x;
		this.y = x.y;
	} else {
		this.x = x;
		this.y = y;
	}
};

/**
 * Return X if orientation is H and Y if orientation is V
 * @param orientation Orientation you want
 * @return X or Y in function of orientation
 */
Position.prototype.get = function(orientation) {
	if (orientation == 'H')
		return this.x;
	else if (orientation == 'V') {
		return this.y;
	} else throw new Exception("Orientation is unknown !");
};

Position.prototype.getInverted = function(orientation) {
	if (orientation == 'H')
		return this.y;
	else if (orientation == 'V') {
		return this.x;
	} else throw new Exception("Orientation is unknown !");
};

Position.prototype.set = function(orientation, value) {
	if (orientation == 'H')
		this.x = value;
	else if (orientation == 'V') {
		this.y = value;
	} else throw new Exception("Orientation is unknown !");
};

Position.prototype.add = function(orientation, value) {
	this.set(orientation,this.get(orientation) + value);
};

Position.prototype.getOrientation = function(orientation, value) {
	if (orientation == 'H')
		this.x = value;
	else if (orientation == 'V') {
		this.y = value;
	} else throw new Exception("Orientation is unknown !");
};

/**
 * True if the given position is the same than this one
 * @return true if the positions are the same
 */
Position.prototype.equals = function (b) {
	if (b == undefined) return false;
	if (this.x != b.x)
		return false;
	if (this.y != b.y)
		return false;
	return true;
};

/**
 * Return an equal copy of this position
 * @returns {Position} A copy of this object
 */
Position.prototype.copy = function () {
	return new Position(this.x,this.y);
};

var Floor = function(house, height, floor) {
	this.house = house;
	this.height = height;
	this.floor = floor;
	this.pk = 0;
};

var Energy = function(title,short_name,lhv,price) {
	if (typeof(title) == 'object') {
		$.extend(this, title);		
	} else {
		this.title = title;
		this.short_name = short_name;
		this.lhv = lhv;
		this.price = price;
	}
};

/**
 * Return an image jquery object which represent the energy meter
 * @param width
 * @param height
 * @returns jquery object
 */
Energy.prototype.getMeterImage = function(width,height) {
	var img = $('<img src="/static/img/symbols/'
		+ this.short_name + '.png" width="'
		+ (width) + '" height="' + (height)
		+ '"/>');
	
	var e = this;
	img.error(function(){
	  $(this)[0].src = '/static/img/symbols/meter.png';
	  console.log($(this).parent().position());
	  $(this).parent().append($('<div style="top:'+($(this).parent().height()*0.6)+'px;position:absolute;opacity:'+($(this).css('opacity'))+';left:0px;width:100%;margin:0;padding:0;text-align:center;color:'+e.color+';font-weight:bold;font-size:'+($(this).parent().width()*0.3)+'px;">'+e.title[0]+'</div>'));
	});
	return img;
};


var Wall = function (start,end,insulating_size,wall_size) {
	this.start = start;
	this.end = end;
	this.insulating_size = insulating_size;
	this.wall_size = wall_size;
};

/**
 * Return an image jquery object which represent the energy
 * @param width
 * @param height
 * @returns jquery object
 */
Energy.prototype.getImage = function(width,height) {
	var img = $('<img src="/static/img/symbols/'+this.short_name+'_mini.png" style="max-width:' +width+ 'px;max-height:'+height+'px;"/>');
	var e = this;
	img.error(function(){	  
	  $(this).parent().append($('<div style="padding:'+$(this).css('padding')+';margin:auto;;width:'+$(this).width()+'px;height:'+$(this).height()+'px;text-align:center;color:'+e.color+';font-weight:bold;font-size:'+($(this).width()*0.8)+'px;">'+e.title[0]+'</div>'));
	  $(this).remove();
	});
	return img;
};


Wall.prototype.getOrientation = function () {
	if (this.start.x == this.end.x)
		return 'V';
	else
		return 'H';
};