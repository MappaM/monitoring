var EventManager = function() {
	
};

EventManager.prototype.call = function(event, context) {
	if (this[event])
		for (var i = 0; i < this[event].length; i++)
			this[event][i](context);
};

EventManager.prototype.register = function(event, method) {
	if (!this[event])
		this[event] = new Array();
	this[event].push(method);
};