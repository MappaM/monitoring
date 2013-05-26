function Renderer2D (ctx,onemeter,offsetX,offsetY,pl,pw) {
    this.ctx = ctx;
    this.onemeter = onemeter;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.pl = pl;
    this.pw = pw;
    
    this.defaultColors = new Array('#E4D3F5','#E5EFF4','#E5F6DD','#E8F5D3','#F5F3D9', '#F5ECE1', '#F5DFDF','#F5DFE5', '#F4D3F5', '#E9DFF5');

}
 
Renderer2D.prototype.drawGrid = function(xN,yN) {
	this.ctx.lineWidth = 1;
	this.ctx.beginPath();
	for (var i = 0; i <= xN; i++) {
		this.ctx.moveTo(this.onemeter * i,0);
		this.ctx.lineTo(this.onemeter * i,this.pw);
	}
	for (var i = 0; i <= yN; i++) {
		this.ctx.moveTo(0,this.onemeter * i);
		this.ctx.lineTo(this.pl,this.onemeter * i);
	}
	
	this.ctx.closePath();
	this.ctx.strokeStyle = '#aaaaaa'; 
	this.ctx.stroke();
	
};


Renderer2D.prototype.fillGrid = function(xN,yN,labels,colors) {
	if (colors == undefined) colors = this.defaultColors;
	this.ctx.lineWidth = 1;
	this.ctx.globalAlpha = 0.4;
	for (var i = 0; i < xN; i++) {
		for (var j = 0; j < yN; j++) {
			if (labels[j][i] > 0) {
				this.ctx.fillStyle = colors[(labels[j][i] - 1) % colors.length]; 
				this.ctx.fillRect((i - this.offsetX) * this.onemeter, (j - this.offsetY) * this.onemeter, this.onemeter, this.onemeter);
			}
		}
	}
	this.ctx.globalAlpha = 1;
	
	this.ctx.closePath();
	
	
};

Renderer2D.prototype.drawCircle = function (x,y,c) {
	this.ctx.beginPath(); 
	this.ctx.arc(x - (this.offsetX * this.onemeter), y - (this.offsetY * this.onemeter), 5, 0 , 2 * Math.PI, false);
	this.ctx.closePath();
	this.ctx.fillStyle = c;
	this.ctx.fill();
};

Renderer2D.prototype.drawWall = function (wall,color,insulating) {
	this.ctx.beginPath();
	
	var x = (wall.start.x - this.offsetX) * this.onemeter;
	var y = (wall.start.y - this.offsetY) * this.onemeter;
	var w = (wall.end.x - this.offsetX) * this.onemeter - x;
	var h = (wall.end.y - this.offsetY) * this.onemeter - y;
	var s = (wall.wall_size*this.onemeter / 2);
	
	this.ctx.rect(x - s ,y - s,w + 2 * s,h + 2 * s);
	this.ctx.closePath();
	this.ctx.strokeStyle = color; 
	this.ctx.stroke();
	if (wall.insulating_size > 0) {
		this.ctx.beginPath();
		var is = (wall.insulating_size*this.onemeter / 2);
		this.ctx.rect(x - is ,y - is,w + 2 * is,h + 2 * is);
		this.ctx.closePath();
		this.ctx.fillStyle = insulating; 
		this.ctx.fill();
	}
};

Renderer2D.prototype.drawWindow = function(window, color) {
	if (color == undefined)
		color = '#4050de';
	this.ctx.fillStyle = color;
	window.size = 0.1;
	if (window.orientation == 'V')					
		this.ctx.fillRect((window.center.x - window.size /2 - this.offsetX) * this.onemeter , (window.center.y - window.width/2 - this.offsetY) * this.onemeter, window.size * this.onemeter, window.width * this.onemeter);
	else if (window.orientation == 'H')			
		this.ctx.fillRect((window.center.x - window.width /2 - this.offsetX) * this.onemeter , (window.center.y - window.size/2 - this.offsetY) * this.onemeter, window.width * this.onemeter, window.size * this.onemeter);
};

Renderer2D.prototype.drawAppliance = function(appliance_link,color) {
	var x =  (appliance_link.center.x - this.offsetX) * this.onemeter;
	var y = (appliance_link.center.y - this.offsetY) * this.onemeter;
	var w = this.getApplianceWidth();
	this.ctx.beginPath();
	this.ctx.fillStyle='#ffffff';
	this.ctx.rect(x - w/2,y - w/2,w,w);
	this.ctx.fill();
	
	//Appliance is drawed as a 2D image directly to a given canvas at a given place b an external function
	drawAppliance(this.ctx, x , y , w , appliance_link.appliance);
	
	if (color != undefined) {
		this.ctx.strokeStyle=color;
		this.ctx.lineWidth=3;
		this.ctx.strokeRect(x - w/2,y - w/2,w,w);
	}

};

/**
 * Return the position in pixels (from the left top corner) of a Position
 * @param p Position of a point on the grid
 * @returns an {x:n,y:n} object
 */
Renderer2D.prototype.getPosition = function(p) {
	return new Position((p.x - this.offsetX) * this.onemeter , (p.y - this.offsetY) * this.onemeter);
};

Renderer2D.prototype.getVirtualPosition = function(left,top) {
	return new Position((left / this.onemeter) + this.offsetX , (top / this.onemeter) + this.offsetY);
};

/**
 * Return the size of an appliance 
 * @returns Size of an appliance in real pixels
 */
Renderer2D.prototype.getApplianceWidth = function() {
	return this.onemeter * this.getApplianceScale();
};

/**
 * Return the scale of an appliance 
 * @returns Scale of an appliance regarding one meter
 */
Renderer2D.prototype.getApplianceScale = function() {
	return 0.8;
};



Renderer2D.prototype.link = function(a,b,color,width) {
	if (width == undefined) width = 3;
	var pa = this.getPosition(a);
	var pb = this.getPosition(b);

	 this.ctx.beginPath();
	 this.ctx.moveTo(pa.x,pa.y);
	 this.ctx.lineWidth = width;
	 this.ctx.lineTo(pb.x,pb.y);
	 this.ctx.strokeStyle=color;
	 this.ctx.stroke();
};