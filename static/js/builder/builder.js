	String.prototype.contains = function(it) { return this.indexOf(it) != -1; };

	function contains(arr,obj) {
		for (var i=0; i<floors.length; i++) {
			if (floors[i].floor.contains(obj)) return true;
		}
		return false;
	}
	
	function addFloorAt(n, obj) {
		floors.push(new Floor());
		for (var i=floors.length - 1; i>=n; i--) {
			if (i == n)
				floors[i] = obj;
			else
				floors[i] = floors[i - 1];
		}		
	}	