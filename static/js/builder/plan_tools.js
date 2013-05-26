	/**
	 * Change a floor in the floor chooser of a plan
	 * @param e Event
	 * @param plan The plan object
	 */
	function changeFloor(e,plan) {
		
		plan.displayMessage('Saving...');
		var newFloor = $(e.target).data('floor');
		labels = undefined;
		save(function() {
		selectedFloor = newFloor;
		
		if (selectedFloor < floors.length - 1 && !floors[selectedFloor + 1].floor.contains('CELLAR')) {
			plan.getFloorContent(floors[selectedFloor].pk,floors[selectedFloor + 1].pk);
		} else if (floors[selectedFloor].floor.contains('CELLAR')) {
			plan.getFloorContent(floors[selectedFloor].pk,floors[selectedFloor - 1].pk);
		} else {
			plan.getFloorContent(floors[selectedFloor].pk);
		}
		
		drawFloors(plan);});
	}
	
	/**
	 * Return the currently selected tool
	 * @returns The selected tool
	 */
	function getCurrentTool() {
		tool =  $('#tool:checked').val();
		if (tool != undefined)
			return tool;
		return $('#tool').val();
	}
	
	
	/**
	 * Draw the floors chooser of the plans
	 */
	function drawFloors(plan) {
		var fw = 100;
		var fh = 100 / floors.length;
		$('#floor_show').html('');
		var unselectableColor = '#de77aa';
		var selectedColor = '#44339e';
		var normalColor = '#AA77De';
		for (var i=0; i<floors.length; i++) {
			var st = 'float:none;width:' + (fw)  + 'px;height:' + (fh)  + 'px;margin:auto;padding:0;border-radius:0;';
			var selectable = true;
			if (floors[i].floor == 'ROOF_ATTIC')
				selectable = false;
			
			var e = undefined;
			if (floors[i].floor.contains('ROOF')) {
				if (floors[i].floor == 'ROOF_ATTIC')
					s = 0;
				else 
					s = fh/3;
				e = $('<canvas id="floor'+floors[i].pk+'" class="floor'+floors[i].pk+'" width="'+ (fw + 2) + '" height="' + (fh + 2) + '" style="' + st + '" class="floor_draw floor_' + floors[i].floor.toLowerCase() + '" id="floor_roof"></canvas>');
				$('#floor_show').append(e);
				e.ready(function() {
					var c=document.getElementById("floor_roof");
					if (!c.getContext)
						G_vmlCanvasManager.initElement(e);
					var ctx=c.getContext("2d");
					var th = fh - s;
					ctx.moveTo(1,th + 2);
					ctx.lineTo(fw / 2 + 1,1);
					ctx.lineTo(fw + 1,th + 2);
					ctx.lineTo(fw + 1,th + s + 1);
					ctx.lineTo(1,th + s + 1);
					ctx.lineTo(1,th + 2);		
					ctx.lineWidth = 1;
					ctx.stroke();
					
					if (selectable) {
						$(c).css('cursor','pointer');
						if (selectedFloor == i)
							ctx.fillStyle = selectedColor;
						else
							ctx.fillStyle = normalColor;
						
					}
						else ctx.fillStyle = unselectableColor;

					ctx.fill();
				});
	
			} else if (!floors[i].floor.contains('SLAB') && floors[i].floor != 'CRAWL_SPACE') {
					if (selectedFloor == i)
						st += 'background-color:'+selectedColor+';';
					else
						st += 'background-color:'+normalColor+';';
				 
				e = $('<div class="floor_draw floor_' + floors[i].floor.toLowerCase() + '" style="' + st +'cursor:pointer;">&nbsp;</div>');
				$('#floor_show').append(e);
			}
			if (e != undefined) {
				
				e.data('floor',i)
				if (selectable)
					e.click(function(e) {changeFloor(e,plan);});
			}
		}
	}