/**
 * Size represents width/height pair
 */
var Size=function(w,h) {
	this.w = w;
	this.h = h;
};


/**
 * Abstract ancestor of all type of blocks. Provide common functions
 */
var AlertModel = function() {	
	this.outputs = new Array();
};
AlertModel.prototype.addOutput = function(model) {this.outputs.push(model);model.input = this;};
AlertModel.prototype.getOutputs = function() {return this.outputs;};
AlertModel.prototype.getOutputType = function() {return this.output_type;};
AlertModel.prototype.getInputType = function() {return this.input_type;};
AlertModel.prototype.getAnalog = function() {if (this.output_type == 'analog') return this; else return this.input.getAnalog();};
AlertModel.prototype.getSize = function() {return new Size(1,1);};
AlertModel.prototype.getColor = function() {return this.color;};

/**
 * AnalogMeter
 * Class to represent a meter (which has an analog output and no input). Extends AlertModel
 * @param meter The meter it runs
 * @constructor
 **/
var AnalogMeter=function(meter) {
	$.extend(this,new AlertModel());
	this.meter=meter;
	this.output_type = 'analog';
	this.input_type = 'analog';
	this.color = '#C0F020';
};

AnalogMeter.prototype.getInputCount = function() {return 0;};
AnalogMeter.prototype.getOutputCount = function() {return 1;};
AnalogMeter.prototype.getUnit = function() {return this.meter.energy.unit_instant;};
AnalogMeter.prototype.getText = function() {
	var text;
	if (this.meter.appliance_link == null)
		text = this.meter.energy.title;
	else
		text = this.meter.appliance_link.appliance.title;
	return text;
};
AnalogMeter.prototype.getImage = function() {
	return '/static/img/alert/meter_'+this.meter.energy.short_name+'.png';
};

/**
 * ADC
 */
var ADC = function(type,treshold) {
	$.extend(this,new AlertModel());
	this.type = type;
	this.treshold = treshold;
	this.output_type = 'digital';
	this.input_type = 'analog';
	this.color = '#90b0C0';
};

ADC.prototype.getText = function() {
	var text = '';
	for (var i = 0; i < adc_types.length; i++) {
		if (adc_types[i][0] == this.type)
			text = adc_types[i][1];
	}
	
	if (this.treshold != undefined)
		return parseFloat(this.treshold).toFixed()+' ' + this.getAnalog().getUnit();
	else
		return '';
};
ADC.prototype.getInputCount = function() {return 1;};
ADC.prototype.getOutputCount = function() {return 1;};
ADC.prototype.getCopy = function(callback,parentModel) {		
		var adc = $.extend(true,new ADC(this.type,this.params),this);
		var dialog;
		var inpt;
		if (parentModel.meter.energy.short_name == 'switch') {
			dialog = $('<div style="text-align:center;padding:40px;border-radius:14px;background-color:white;width:200px;margin:auto;">State :<br /></div>');
			inpt = $('<div><input type="radio" value="1" id="switchstate"/>On<br /><input type="radio" value="0" id="switchstate"/>Off</div>');
			var validate = function(){adc.treshold=parseFloat(inpt.find(':checked').val());callback(adc);$('.overlay').remove();};
		} else {
			dialog = $('<div style="text-align:center;padding:40px;border-radius:14px;background-color:white;width:200px;margin:auto;">Treshold in '+parentModel.getAnalog().getUnit()+' :<br /></div>');
			inpt = $('<input type="input" value="" style="width:30px;"/>');
			var validate = function(){adc.treshold=parseFloat(inpt.val());callback(adc);$('.overlay').remove();};
		}
		
		var btn = $('<input type="button" value="Ok" />');
		
		btn.click(validate);
		dialog.append(inpt);
		dialog.append($('<br />'));
		dialog.append($('<br />'));
		dialog.append(btn);
		modal(dialog);
		inpt.focus();
		inpt.keypress(function(e) {if(e.which == 13) validate();});
};
ADC.prototype.getImage = function() {
	return '/static/img/alert/' + this.type.toLowerCase()+ '.png';
};

/**
 * Alert
 */
var Alert = function(type,params) {
	$.extend(this,new AlertModel());
	this.type = type;
	this.params = params;
	this.output_type = '';
	this.input_type = 'digital';
	this.color = '#1E3C69';
};

Alert.prototype.getText = function() {
	var text = '';
	for (var i = 0; i < alert_types.length; i++) {
		if (alert_types[i][0] == this.type)
			text = alert_types[i][1];
	}
	
	if (this.params != undefined) {
		var param = this.params;
		if (param.length  > 19)
			param = param.substr(0,15) + '(...)';
		return param;
	} else
		return '';
	
};
Alert.prototype.getInputCount = function() {return 1;};
Alert.prototype.getOutputCount = function() {return 0;};
Alert.prototype.getCopy = function(callback,parentModel) {		
		var alert = $.extend(new Alert(this.type,this.params),this);
		//We only need a param for mails
		if (this.type != 'MAIL') {
			callback(alert);			
		} else {
			var dialog = $('<div style="text-align:center;padding:40px;border-radius:14px;background-color:white;width:250px;margin:auto;">E-mail address  :<br /></div>');
			var inpt = $('<input type="input" value="" style="width:140px;"/>');
			var btn = $('<input type="button" value="Ok" />');
			var validate = function(){alert.params=inpt.val();callback(alert);$('.overlay').remove();}; 
			btn.click(validate);
			dialog.append(inpt);
			dialog.append($('<br />'));
			dialog.append($('<br />'));
			dialog.append(btn);
			modal(dialog);
			inpt.focus();
			inpt.keypress(function(e) {if(e.which == 13) validate();});
		}
	};
Alert.prototype.getImage = function() {
	return '/static/img/alert/' + this.type.toLowerCase()+ '.png';
};
	
/**
 * Logic
 */
var Logic = function(type,params) {
	$.extend(this,new AlertModel());
	this.params = params;
	this.type = type;
	this.output_type = 'digital';
	this.input_type = 'digital';
	this.color = '#3AA6D0';
};
Logic.prototype.getText = function() {
	var text = '';
	for (var i = 0; i < logic_types.length; i++) {
		if (logic_types[i][0] == this.type)
			text = logic_types[i][1];
	}
	
	if (this.params != undefined) {
		var h = Math.floor(this.params);
		var m = (this.params - h) * 60;
		var param = (h<10?'0':'') + h.toString() + ':' + (m<10?'0':'') + Math.round(m).toString();
		
		return param;
	} else
		return '';
};
Logic.prototype.getInputCount = function() {if (this.type == 'AND') return 2; else return 1;};
Logic.prototype.getOutputCount = function() {return 1;};
Logic.prototype.getCopy = function(callback,parentModel) {
		var logic = $.extend(true,new Logic(this.type,this.params),this);
		
		//We only need a treshold for time logics
		if (this.type != 'TIMEL' && this.type != 'TIMEG') {
			callback(logic);			
		} else {
			var dialog = $('<div style="text-align:center;padding:40px;border-radius:14px;background-color:white;width:250px;margin:auto;">Time :<br /></div>');
			var inpth = $('<input type="input" value="" style="width:20px;"/>');
			var inptm = $('<input type="input" value="" style="width:20px;"/>');
			var btn = $('<input type="button" value="Ok" />');
			var validate = function(){logic.params=parseFloat(inpth.val()) + parseFloat((inptm.val()/60));callback(logic);$('.overlay').remove();}; 
			btn.click(validate);
			dialog.append(inpth);
			dialog.append(':');
			dialog.append(inptm);
			dialog.append($('<br />'));
			dialog.append($('<br />'));
			dialog.append(btn);
			modal(dialog);
			inpth.focus();
			inpth.keypress(function(e) {if(e.which == 13) validate();});
			inptm.keypress(function(e) {if(e.which == 13) validate();});
		}
};
Logic.prototype.getImage = function() {
	return '/static/img/alert/' + this.type.toLowerCase()+ '.png';
}

/**
 * Board manages a div to draw pieces on it
 */
var Board=function(params) {
	this.canvas = params.canvas;

	this.canvas.addClass('alert_canvas');
	
	this.analog = params.analog;
	this.onemeter = 100;
	this.w = 2;
	this.h = 3;
	this.hasChanged = false;
	
	this.resize = function() {
		pw = this.w*this.onemeter;		
		ph = this.h*this.onemeter;		
		
		this.canvas.width(pw);
		this.canvas.height(ph);
	};
	
	this.resize();
	this.refresh();
};

/**
 * Draw a model in a given container
 */
function getBlock (model,pos, onemeter, container) {

	var sz = model.getSize();
	
	var hi = model.getInputCount();
	
	var st = 0;
	if (hi > 0) {
		st = 20;
	}
	
	container.addClass('block_container');
	container.width(onemeter * sz.w + (hi?20:0));
	container.height(onemeter * sz.h);
	
	container.css('top',(pos * onemeter)+'px');
	
	var canvas = $('<canvas></canvas>');
	
	canvas[0].width = container.width();
	canvas[0].height = container.height();
	container.append(canvas);
	
	//IE<9 compatiblity
	if (canvas[0].getContext == undefined)
		G_vmlCanvasManager.initElement(canvas[0]);
	
	var ho = model.getOutputCount();
	
	var ctx = canvas[0].getContext('2d');
	

	ctx.beginPath();
	ctx.moveTo(st + 0,0);
	ctx.lineTo(st + onemeter * sz.w,0);
	if (ho > 0) {
		if (model.getOutputType() == 'digital') {
			ctx.lineTo(st + onemeter * sz.w, onemeter * sz.h / 2 - 10);
			ctx.lineTo(st + onemeter * sz.w - 20 , onemeter * sz.h / 2);
			ctx.lineTo(st + onemeter * sz.w, onemeter * sz.h / 2 + 10);
		} else {
			ctx.lineTo(st + onemeter * sz.w, onemeter * sz.h / 2 - 10);
			ctx.arc(st + onemeter * sz.w, onemeter * sz.h / 2, 20, 3/2 * Math.PI , 1/2 * Math.PI, true);
			ctx.lineTo(st + onemeter * sz.w, onemeter * sz.h / 2 + 10);
		}
	}
	ctx.lineTo(st + onemeter * sz.w, onemeter * sz.h);
	ctx.lineTo(st + 0, onemeter * sz.h);
	
	if (hi > 0) {
		if (model.getInputType() == 'digital') {
			ctx.lineTo(st, onemeter * sz.h / 2 + 10);
			ctx.lineTo(st - 20 , onemeter * sz.h / 2);				
			ctx.lineTo(st, onemeter * sz.h / 2 - 10);
		} else {
			ctx.lineTo(st, onemeter * sz.h / 2 + 10);
			ctx.arc(st, onemeter * sz.h / 2, 20, 3/2 * Math.PI , 1/2 * Math.PI, true);
			ctx.lineTo(st, onemeter * sz.h / 2 - 10);
		}
	}
	ctx.fillStyle = model.getColor();
	
	ctx.fill();
	var imageObj = new Image();
	imageObj.onload = function() {
		ctx.drawImage(imageObj, st + 4, (onemeter * sz.h / 2) - imageObj.height/2);
    };
    imageObj.src = model.getImage();
    ctx.fillStyle='white';
    ctx.textAlign = 'center';
	ctx.fillText(model.getText(),onemeter * sz.w / 2,(onemeter * sz.h) - 4);
	
	
	return container;
};

/**
 * Draw a piece and its descendant
 * @param model Piece
 * @param w Width
 * @param h Height
 * @returns {Number}
 */
Board.prototype.createSubtree = function (model,w,h) {
	outputs = model.getOutputs();
	var tch = 0;
	var board = this;
	for (var i = 0; i < model.getOutputCount(); i++) {
		var ch = 1;
		if (outputs.length > i) {
			ch = this.createSubtree(model.outputs[i],w+1,tch + h);
		} else {
			//Create droppable
			var drop = $('<div class="alert_droppable"></div>');
			drop.width(this.onemeter * 2);
			drop.height(this.onemeter);
			drop.css('top',h*this.onemeter+'px');
			drop.css('left',(w)*this.onemeter+'px');
			
			drop.droppable({
				accept:'.' + model.getOutputType(),
				activeClass:'active',
				hoverClass:'hover',
				drop:function(event,ui) {
					ui.draggable.data('model').getCopy(function(m){
						model.addOutput(m);
						board.hasChanged = true;
						board.refresh();
					},model);
				}
			});
			this.canvas.append(drop);			
		}
		tch += ch;
	}
	
	var box = $('<div></div>');
	this.canvas.append(box);	
	getBlock(model,h,this.onemeter, box);
	box.css('left',(w * this.onemeter + (w>0?-20:0))+ 'px');
	
	box.data('model',model);
	box.draggable({
		revert:true
	});
	return tch;
};


/**
 * Clean the board and redraw tje chain of pieces
 */
Board.prototype.refresh = function() {
	this.canvas.html('');
	this.createSubtree(this.analog,0,Math.floor(this.h/2));
	
	function hasAlert(model){
		
		if (Alert.prototype.isPrototypeOf(model))
			return true;
		else {
			if (model.getOutputs().length > 0) {
				return hasAlert(model.getOutputs()[0]);
			} return false;
		}
	};
	var canSave = this.hasChanged && hasAlert(this.analog) || this.analog.outputs.length == 0;
	var saver = $('<img style="position:absolute;top:0;left:0;cursor:pointer;" src="/static/img/symbols/'+(canSave?'':'no')+'save.png"/>');
	
	//Prepare the chain of piece for transport through JSON
	function getStructure(model) {
		var outs = new Array();
		
		for (var i = 0; i < model.getOutputs().length; i++) {
			outs.push(getStructure(model.getOutputs()[i]));
		}
		var m;
		var param;
		if (model instanceof ADC) {
			m = 'ADC';
			param = model.treshold;
		} else if (model instanceof Logic) {
			m = 'Logic';
			param = model.params;
		} else if (model instanceof Alert) {
			m = 'Alert';
			param = model.params;
		} else if (model instanceof AnalogMeter) {
			m = 'AnalogMeter';
			param = model.meter;
		}
		return {
			model:m,
			type:model.type,
			params:param,
			outputs:outs,
		};
		
		
	}

	var b = this;
	saver.click(function(){
		$.ajax({
			url:'/alert/save',
			method:'post',
			data:'csrfmiddlewaretoken='+csrf_token+'&data='+encodeURIComponent(JSON.stringify(getStructure(b.analog))),
			success:function() {
				b.hasChanged = false;
				b.refresh();
			}
		});
	});
	this.canvas.append(saver);
};



function findMeterByPk(apk) {
	var list = new Array();
	for (var i = 0; i < meters.length; i++) {
		if ( meters[i].appliance_link != null && meters[i].appliance_link.pk == apk)
			list.push(meters[i]);
	}
	return list;
}

/**
 * Create an object extending AlertModel according to it's real type
 */
function unfoldPiece(model) {
	var m;
	if (model.model == 'ADC')
		m = new ADC(model.type,model.params);
	else if (model.model == 'Logic')
		m = new Logic(model.type,model.params);
	else if (model.model == 'Alert')
		m = new Alert(model.type,model.params);
	
	for (var i = 0; i < model.outputs.length; i++)
		m.addOutput(unfoldPiece(model.outputs[i]));
	return m;
}

/**
 * Transform the anonymous chain to a chain of correct implemented AlertModel
 * @param data 
 * @returns {AnalogMeter}
 */
function unfoldJSON(data) {
	
	var model = $.parseJSON(data);
	var am = new AnalogMeter(model.meter);
	for (var i = 0; i < model.outputs.length; i++)
		am.addOutput(unfoldPiece(model.outputs[i]));
	return am;
}

/**
 * Change meter in the board
 * @param meter The new meter
 * @param zone The zone of drawing
 */
function changeBoard(meter,zone) {
	$('#overall_meters,#plans').find('.active').removeClass('active');
	zone.addClass('active');
	$('#display_zone').children().remove();
	var canvas = $('<div></div>');	
	$('#display_zone').append(canvas);
	$('#piece_zone').show();
	$.ajax({
		url:'/alert/get/' + meter.pk,
		success:function(data) {
		
			board = new Board({	'canvas':canvas,
				'analog':unfoldJSON(data)});
		},
		error:function() {
			board = new Board({	'canvas':canvas,
				'analog':new AnalogMeter(meter)});
		}
	});	
}

/**
 * Draw the droppables over all appliances and global meter on the plans
 */
function drawCallers(plan) {
	var w = $('#plans_container').width() / plans[0].l;
	var n = 0;
	
	//Drawing caller for overall meters
	$('#overall_meters').height(w);
	$('#overall_meters').find('.meter').remove();
	var imgWidth = Math.min(20, w * 0.8 );
	for (var i = 0; i < meters.length; i++) {
		
		if (meters[i].appliance_link != null) continue;
		var img = meters[i].energy.getImage(imgWidth,imgWidth);
		img.css('padding',(w-imgWidth) / 2 + 'px');
		var ma = $('<div class="meter"></div>');
		ma.append(img);
		ma.width(w);
		ma.height(w);
		ma.css('left',(i*(w + 4))+'px');
		$('#overall_meters').append(ma);
		(function(meter,zone) {
			ma.click(function(){changeBoard(meter,zone);});
		})(meters[i],ma);
		n++;
	}
	$('#overall_meters').width((w + 4) * n);
	
	//Drawing callers for appliances meters
	plan.canvas.parent().find('.meter').remove();
	for ( var i = 0; i < plan.appliances_links.length; i++) {
		var a = plan.appliances_links[i];
		
		var mets = findMeterByPk(a.pk);
		if (mets.length == 0) continue;

		var p = plan.renderer.getPosition(a.center);
		var w = plan.renderer.getApplianceWidth();
		
		var ma = $('<div class="meter"></div>');
		ma.width(w);
		ma.height(w);
		ma.css('left',p.x - w / 2);
		ma.css('top',p.y - w / 2);
		plan.canvas.parent().append(ma);
		(function(ms,zone){
			ma.click(function() {
				if (ms.length > 1) {
					multipleMeterSelector(ms,function(meter){
						changeBoard(meter,zone);
					});
				} else {
					changeBoard(ms[0],zone);
				}
		
		});})(mets,ma);
	}
	
	bg_resize();
}

/**
 * Launch an overlay on the page to select a mode of meter
 * @param meters List of meters to choose
 * @param callback function(meter) to call after completion
 */
function multipleMeterSelector(meters, callback) {
	
	var q = $('<div id="meter_chooser">Please choose one meter :<br /></div>');
	for ( var i = 0; i < meters.length; i++) {
		
		var mode = $('<div><img src="/static/img/symbols/meter_'
				+ meters[i].energy.short_name + '.png" /></div>');
		
		(function(l){mode.click(function(event) {
			$('.overlay').remove();
			callback(meters[l]);
		});}(i));
		q.append(mode);
	}
	modal(q);
}

/**
 * Draw the usables pieces in the menu
 */
function initPieces() {
	var models = new Array();
	
	for (var i = 0; i < adc_types.length; i++) {
		var model = new ADC(adc_types[i][0]);
		models.push(model);
	}
	for (var i = 0; i < logic_types.length; i++) {
		var model = new Logic(logic_types[i][0]);
		models.push(model);
	}
	
	for (var i = 0; i < alert_types.length; i++) {
		var model = new Alert(alert_types[i][0]);
		models.push(model);
	}

	for (var i = 0; i < models.length; i++) {
		var model = models[i];
		var piece_container = $('<div class="piece_container '+model.getInputType()+'"></div>');
		$('#piece_zone').append(piece_container);
		var piece = $('<div></div>');
		piece_container.append(piece);		
		
		getBlock(model, new Position(0,0), 100, piece);
		
		piece_container.width(piece.width());
		piece_container.data('model',model);
		
		(function(model){
			piece_container.draggable({
			revert:'invalid',
			zIndex:300,
			helper:function(){
				var piece_container = $('<div class="piece_container"></div>');
				var piece = $('<div></div>');
				piece_container.append(piece);
				getBlock(model, new Position(0,0), 100, piece);
				piece_container.width(piece.width());
				return piece_container;
			},
		});})(model);
	}
	trash = $('<div class="piece_container trash"><img src="/static/img/symbols/remove.png"></div>');
	$('#piece_zone').append(trash);
	trash.droppable({
		accept:'.block_container',
		activeClass:'active',
		hoverClass:'hover',
		drop:function(event,ui) {
			var model = ui.draggable.data('model');
			model.input.outputs.removeEquals(model);
			board.hasChanged = true;
			board.refresh();
		}
	});
	
}