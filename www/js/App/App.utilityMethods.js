// diverse global useful methods

// javascript tweak
if(!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}

// random number between 1 and 0
App.rdm = function(nbr)
{
	nbr = nbr || 1;
	return Math.random() * nbr;
}

// random number in defined range : min included, max excluded
App.rdmRange = function(min, max) {
    return Math.random() * (max - min) + min;
}


// random integer in defined range : min, max included
App.rdmIntRange = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


App.getLetterPath = function(letter)
{
	if (!letter || !App.Font || !App.Font.glyphs[letter])
	{
		console.log('error, letter',letter,'is not in the font')
		return null;
	}
	
	var pathsData = App.Font.glyphs[letter].paths;

	return App.convertPathsDataToGroup(pathsData);
}


// convert javascript array to paper js group of groups
App.groupsArrToGroup = function(groupsArr)
{
	var groups = new paper.Group();

	// loop groups
	for (var i=0; i<groupsArr.length; i++)
	{
		var group = new paper.Group();
		// loop paths
		for (var j=0; j<groupsArr[i].length; j++)
		{
			var path = new paper.Path(groupsArr[i][j]);
			group.appendBottom(path);
		}
		groups.appendBottom(group);
	}

	return groups;
}

// convert raw path data to paper js Group and Path objects
App.convertPathsDataToGroup = function(pathsData)
{
	var group = new paper.Group();

	for (var i=0; i<pathsData.length; i++)
	{
		group.appendBottom(new paper.Path(pathsData[i]));
	}

	return group;
}


// convert paper js objects to javascript array
App.groupToGroupsArr = function(groups)
{
	var result = [];
	for (var i=0; i<groups.children.length; i++)
	{
		var group = groups.children[i];
		result.push(App.groupToPathsArr(group));
	}
	return result;
}


// convert  paper js Group to path data
App.groupToPathsArr = function(group)
{
	var result = [];
	for (var i=0; i<group.children.length; i++)
	{
		var path = group.children[i];
		result.push(App.pathToPointsArr(path));
	}
	return result;
}


App.pathToPointsArr = function(path)
{
	var result = [];
	for (var i=0; i<path.segments.length; i++)
	{
		var p = path.segments[i].point;
		result.push([
			p.x,
			p.y
		])
	}
	// if path is closed, double the first point
	if (path.closed)
	{
		result.push([
			path.segments[0].point.x,
			path.segments[0].point.y
		]);
	}
	return result;
}


App.ramp = function(v1,v2,t)
{
	return v1 + (v2 - v1) * t;
}

App.rampPoints = function(p1, p2, t)
{
	if (!p1.x)
		p1 = new paper.Point(p1);
	if (!p2.x)
		p2 = new paper.Point(p2);
	return p2.subtract(p1).multiply(t).add(p1);
}

App.rampColors = function(c1, c2, t)
{
	var r = App.ramp(c1.components[0], c2.components[0], t),
		g = App.ramp(c1.components[1], c2.components[1], t),
		b = App.ramp(c1.components[2], c2.components[2], t);
	return new paper.Color(r, g, b);
}


App.checkMissingProperties = function(obj, props)
{
	var result = [];
	for (var i=0; i<props.length; i++)
	{
		if (!obj[props[i]])
		{
			result.push(props[i]);
		}
	}
	return result.length > 0 ? result : false;
}


// create a paper color from rgb values
App.createColor = function(r,g,b)
{
	return new paper.Color(r/255,g/255,b/255);
}

App.rdmColor = function()
{
	return new paper.Color(Math.random(), Math.random(), Math.random());
}

App.rdmPaletteColor = function()
{
	var counter = 0,
		kArr    = [];
	for (var k in App.config.colors)
	{
		kArr.push(k);
		counter++;
	};
	var rdmI = App.rdmIntRange(0,counter),
		rdmK = kArr[rdmI];

	return App.config.colors[rdmK];
}


// full screen gestion
App.enterFullScreen = function()
{
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
  } else if (document.documentElement.mozRequestFullScreen) {
    document.documentElement.mozRequestFullScreen();
  } else if (document.documentElement.webkitRequestFullscreen) {
    document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
  }
}


App.exitFullScreen = function()
{
  if (document.cancelFullScreen) {
    document.cancelFullScreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitCancelFullScreen) {
    document.webkitCancelFullScreen();
  }
}


App.isNotFullScreen = function()
{
  return !document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement;
}

// note on paper js operators
// add, subtract, multiply, divide, modulo, equals

App.getBounds = function()
{
	return App.appProject.view.bounds;
}

App.getViewDiagonal = function(bounds)
{
	bounds = bounds || App.appProject.view.bounds;
	return bounds.topLeft.getDistance(bounds.bottomRight);
}


App.shuffleArray = function(arr) {
    for (var i = arr.length - 1; i > 0; i--)
    {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    return arr;
}


App.extendObject = function(obj, props)
{
	var clone = {};

	for (var k in obj)
	{
		clone[k] = obj[k];
	}

	if (props)
	{
		for (var k in props)
		{
			clone[k] = props[k];
		}
	}

	return clone;
}

App.extend = function(obj, props)
{
	return App.extendObject(obj, props);
}


App.getProportionedScale = function(path, nbr)
{
	var w  = path.bounds.width,
		dW = w * (1 - nbr),
		h  = path.bounds.height,
		dH = h * (1 - nbr),
		larger = Math.abs(dH) <= Math.abs(dW),
		nbrX = larger ? (w - dH) / w : nbr,
		nbrY = larger ? nbr : (h - dW) / h;

	return [nbrX, nbrY];
}


App.align = function(item, point, bound)
{
	var originalPivot = item.pivot;
	item.pivot        = item.bounds[bound];
	item.position     = point;
	item.pivot        = originalPivot;
}


App.getDashOffset = function(path, fromApp)
{
	// tweak
	var zoom = fromApp ? App.appProject.view.zoom : paper.view.zoom;

	var dashStep = (path.dashArray[0] + path.dashArray[1]),
		stepNbr = path.length * zoom / dashStep,
		stepOffset = stepNbr - Math.floor(stepNbr),
		offset = dashStep * stepOffset - path.dashArray[0];

	return offset;
}

App.getDashArray = function(path, originalDashArray, t, fromApp)
{
	if (t >= 1)
		return originalDashArray;

	// tweak
	var zoom = fromApp ? App.appProject.view.zoom : paper.view.zoom;

	var dashStep   = (originalDashArray[0] + originalDashArray[1]),
		stepNbr    = path.length * zoom * t / dashStep,
		stepOffset = stepNbr - Math.floor(stepNbr),
		offset     = dashStep * stepOffset - originalDashArray[0],
		arr        = [];

	stepNbr = offset >= originalDashArray[0] ? Math.ceil(stepNbr) : Math.floor(stepNbr);
	
	for (var i=0; i<stepNbr; i++)
	{
		arr.push(originalDashArray[0]);
		arr.push(originalDashArray[1]);
	};
	arr.push(originalDashArray[0]);
	arr.push(path.length);

	return arr;
}


App.addPoint = function(path, time)
{
	var originalLength = path.segments.length,
		inc = .01,
		counter = 0,
		maxCounter = 3;

	while (path.segments.length == originalLength)
	{
		var location = path.getLocationAt(path.length * time);

		if (time >= 1 || counter >= maxCounter)
		{
			var segment   = location.segment,
				index     = segment.index;

			path.insert(index, segment);
			path.segments[index].handleOut = null;
			path.segments[index+1].handleIn = null;
			break;
		}
		else
		{
			path.curves[location.index].divide(location);
			time += inc;
			counter++;
		}
	}
}


App.mapChar = function(char)
{
	return App.config.charMap[char];
}

App.unMapChar = function(mappedChar)
{
	var map = App.config.charMap;
	for (var k in map)
	{
		if (map[k] == mappedChar)
		{
			return k;
		}
	}
	return null;
}

App.setStyle = function(item, style)
{
	if (typeof(style) === 'string')
	{
		if (App.config.styles[style])
			style = App.config.styles[style];
		else if (App.config[style])
			style = App.config[style];
		else
			return;
	}

	for (var k in style)
	{
		item[k] = style[k];
	}
}

App.setChildrenStyle = function(group, style)
{
	for (var i=0; i<group.children.length; i++)
	{
		App.setStyle(group.children[i], style);
	}
}



// organize group of items in win box
App.positionWinGroup = function(group)
{
	var viewBounds = paper.view.bounds,
		winMargin = App.config.winMargin * viewBounds.height,
		winBounds  = viewBounds.scale(1,App.config.winBoxHeight);

	App.positionGroup(group, winBounds);

	group.position = viewBounds.bottomCenter.subtract(0, group.bounds.height*.5 + winMargin);
}

App.positionGroup = function(group, bounds)
{
	var viewBounds = paper.view.bounds;

	for (var i=0; i<group.children.length; i++)
	{
		group.children[i].position = viewBounds.center;
	}
	group.pivot = group.bounds.center;
	group.fitBounds(bounds);

	var totalW = 0;
	for (var i=0; i<group.children.length; i++)
	{
		totalW += group.children[i].bounds.width;
	}
	var totalMargin = viewBounds.width - totalW,
		margin      = totalMargin / (group.children.length + 1);

	var offset = margin;
	for (var i=0; i<group.children.length; i++)
	{
		var item = group.children[i],
			w = item.bounds.width;
		item.position.x = offset + w*.5;
		offset += w + margin;
	}
}



App.hideAllChildren = function(group)
{
	for (var i=0; i<group.children.length; i++)
	{
		group.children[i].visible = false;
	}
}

App.showAllChildren = function(group)
{
	for (var i=0; i<group.children.length; i++)
	{
		group.children[i].visible = true;
	}
}



App.showBounds = function(bounds)
{
	var r = new paper.Path.Rectangle(bounds);
	r.fillColor = 'red';
	r.opacity = .3;
	return r;
}

App.showPoint = function(point, color)
{
	var c = new paper.Path.Circle(point, 2);
	c.fillColor = color || 'red';
	return c;
}


// 
// generic animations
// 

App.morphItems = function(item1, item2, callback)
{
	// store pivot points
	var storedProperties = ['applyMatrix','pivot'];
	App.storeItemData(item1, storedProperties);
	App.storeItemData(item2, storedProperties);
	item1.pivot = item1.bounds.center;
	item2.pivot = item2.bounds.center;

	item1.applyMatrix = false;
	var s1 = item1.scaling.x,
		s2 = item2.bounds.width / item1.bounds.width;

	var props = [
		['position','rampPoints'],
		['opacity','ramp'],
		['strokeWidth', 'ramp'],
		['strokeColor','rampColors']
	];

	for (var i=0; i<props.length; i++)
	{
		var prop = props[i],
			key = prop[0],
			v1 = item1[key],
			v2 = item2[key];

		if (v1 != null && v2 != null && v1 != v2)
		{
			prop.push([v1,v2]);
		}
		else
		{
			props.splice(i,1);
			i--;
		}
	}
	// console.log(p1,p2,s1,s2,o1,o2,sW1,sW2,sC1,sC2);

	App.Anim.add({
		duration : App.config.delays.win,
		easing   : 'easeInQuad',
		action   : function(time)
		{
			var obj = {
				scaling:s1 != s2 ? App.ramp(s1,s2,time) : s2
			};

			for (var i=0; i<props.length; i++)
			{
				var prop = props[i],
					key = prop[0],
					method = prop[1],
					v1 = prop[2][0],
					v2 = prop[2][1];

				obj[key] = App[method](v1,v2,time);
			}

			App.setStyle(item1, obj);
		},
		callback: function()
		{
			App.restoreItemData(item1, storedProperties);
			App.restoreItemData(item2, storedProperties);
			App.removeItemData(item1, storedProperties);
			App.removeItemData(item2, storedProperties);
			App.callback(callback);
		}
	})
}

App.showItem = function(item, config, hide)
{
	var defaultConfig = {
		callback : null,
		init     : null,
		duration : App.config.delays.show,
		delay    : 0,
		easing   : App.config.easings.show,
		total    : null,
		scale    : true,
		fade     : false
	};
	config = App.extendObject(defaultConfig, config);

	storedProperties = config.scale ? ['applyMatrix','pivot'] : [];
	App.storeItemData(item, storedProperties);
	if (config.scale)
	{
		item.applyMatrix = false;
		item.pivot = item.bounds.center;
	}

	var s1 = !config.total 
				? item.scaling.x
				: hide ? 1 : App.config.minScaling,
		s2 = hide ? App.config.minScaling : 1,
		o1 = !config.total 
				? item.opacity
				: hide ? 1 : 0,
		o2 = hide ? 0 : 1;

	return App.Anim.add({
		duration : config.duration,
		delay    : config.delay,
		easing   : config.easing,
		init     : config.init,
		action   : function(time)
		{
			if (config.scale)
				item.scaling = App.ramp(s1, s2, time);
			if (config.fade)
				item.opacity = App.ramp(o1, o2, time)
		},
		callback: function()
		{
			App.restoreItemData(item, storedProperties);
			App.removeItemData(item, storedProperties);
			App.callback(config.callback);
		}
	})
}

App.hideItem = function(item, options)
{
	return App.showItem(item, options, true);
}

App.animateWinGroup = function(group, callback)
{
	var totalDuration  = App.config.delays.winGroup,
		minDuration    = App.config.delays.show,
		l              = group.children.length,
		duration       = Math.max(totalDuration/l, minDuration),
		_totalDuration = duration * l,
		delay          = (totalDuration - _totalDuration) / l,
		offsetDelay    = 300;

	for (var i=0; i<group.children.length; i++)
	{
		var item      = group.children[i],
			_callback = i < group.children.length-1 ? null : callback;

		App.animateWinItem(item, {
			duration : duration,
			delay    : i * (duration + delay) + offsetDelay,
			callback : _callback
		})
	}
}

App.animateWinItem = function(item, config)
{
	var defaultConfig =
	{
		duration : App.config.delays.show,
		delay    : 0,
		callback : null
	};
	App.extendObject(defaultConfig, config);

	var sW1 = item.strokeWidth,
		sW2 = App.config.styles.stroke.strokeWidth,
		sW3 = sW1,
		o1  = item.opacity,
		o2  = 1
		;

	// console.log(sW1,sW2,sW3,o1,o2)

	return App.Anim.add({
		duration : config.duration *.5,
		delay    : config.delay,
		easing   : 'easeOutQuad',
		action   : function(time)
		{
			item.opacity = App.ramp(o1,o2,time);
			item.strokeWidth = App.ramp(sW1,sW2,time);
		},
		callback : function()
		{
			App.Anim.add({
				duration : config.duration * .5,
				easing : 'easeInQuad',
				action : function(time)
				{
					item.strokeWidth = App.ramp(sW2,sW3,time);
				},
				callback: config.callback
			})
		}
	})
}


App.animateSelection = function(item, callback, color, inverted)
{
	var c1 = item.strokeColor,
		c2 = color ? color : !inverted ? App.config.styles.selected.strokeColor : App.config.styles.stroke.strokeColor;

	return App.Anim.add({
		duration: App.config.delays.select,
		action: function(time)
		{
			item.strokeColor = App.rampColors(c1,c2,time);
		},
		callback: function()
		{
			App.callback(callback);
		}
	})
}

App.animateDeselection = function(item, callback, color)
{
	return App.animateSelection(item, callback, color, true);
}




App.storeItemData = function(item, datas)
{
	for (var i=0; i<datas.length; i++)
	{
		var data = datas[i];
		if (item[data] != null)
		{
			item.data[data] = item[data];
			// console.log('store data',data,item.data[data]);
		}
	}
}

App.restoreItemData = function(item, datas)
{
	for (var i=0; i<datas.length; i++)
	{
		var data = datas[i];
		if (item.data[data] != null)
		{
			item[data] = item.data[data];
			// console.log('restore data',data,item[data]);
		}
	}
}

App.removeItemData = function(item, datas)
{
	for (var i=0; i<datas.length; i++)
	{
		var data = datas[i];
		item.data[data] = null;
	}
}


App.callback = function(callback, arg1, arg2, arg3)
{
	if (typeof callback === 'function')
	{
		callback(arg1, arg2, arg3);
	}
}


App.getPaperChildrenCount = function()
{
	return paper.project.getItems({
	    selected: false
	}).length;
}


App.createBackground = function()
{
	var path = new paper.Path.Rectangle(paper.view.bounds);
	path.fillColor = App.config.colors.game;
	path.name = 'background';
	return path;
}


App.removeAnimation = function(id)
{
	if (id != null)
	{
		App.Anim.removeAnimation(id);
	}
	return null;
}

App.endAnimation = function(id)
{
	if (id != null)
	{
		App.Anim.endAnimation(id);
	}
	return null;
}


App.randomPointInBounds = function(bounds)
{
	return new paper.Point(
		App.rdmRange(bounds.left, bounds.right),
		App.rdmRange(bounds.top, bounds.bottom)
	);
}

App.randomPointFromPoints = function(p1,p2)
{
	return new paper.Point(
		App.rdmRange(p1.x, p2.x),
		App.rdmRange(p1.y, p2.y)
	);
}

App.log = function(msg)
{
	if (!App._log)
	{
		App._log = new paper.PointText(paper.view.bounds.topLeft.add(10,50));
		App.setStyle(App._log, App.config.styles.text);
	}

	App._log.content = msg.toString();
}



App.saveBackground = function(item, Game)
{
	Game = Game || App.currentGame;

	if (!item || !Game)
	{
		console.log('error on savebackground, missing argument(s)');
		return;
	}

	var layer = paper.project.activeLayer;
	App.hideAllChildren(layer);

	Game.background.visible = true;
	item.visible = true;

	if (Game.raster)
		Game.raster.visible = true;

	var raster = layer.rasterize();
	if (Game.raster)
		Game.raster.remove();
	Game.raster = raster;
	item.remove();

	layer.appendBottom(raster);
	layer.appendBottom(Game.background);

	App.showAllChildren(layer);
}

// optimize perf
/*
App.saveBackground = function(item, Game)
{
	Game = Game || App.currentGame;

	if (!item || !Game)
	{
		console.log('error on savebackground, missing argument(s)');
		return;
	}

	if (!Game.rasterGroup)
	{
		var group = new paper.Group();
		group.name = 'rasterGroup';
		Game.rasterGroup = group;
	}

	var layer = paper.project.activeLayer;

	App.hideAllChildren(layer);

	Game.background.visible = true;
	Game.rasterGroup.visible = true;
	item.visible = true;

	if (Game.raster)
		Game.raster.remove();

	var raster = layer.rasterize();
	Game.raster = raster;
	Game.rasterGroup.appendTop(item);
	Game.rasterGroup.visible = false;

	layer.insertChild(raster, Game.background.index);
	App.showAllChildren(layer);
}
*/





App.forceGroup = function(item)
{
	// console.log('/*/',item,App.isGroup(item))
	if (!App.isGroup(item))
	{
		var parent = item.parent,
			index = item.index;
		item = new paper.Group([item]);
		parent.insertChild(index, item);
	}
	return item;
	// console.log('after',item,App.isGroup(item))
}

App.deGroupAllChildren = function(group)
{
	for (var i=0; i<group.children.length; i++)
	{
		var child = group.children[i];
		if (App.isGroup(child))
		{
			App.deGroup(child);
		}
	}
}

App.deGroup = function(group)
{
	var parent = group.parent,
		index  = group.index;
	for (var i=0; i<group.children.length; i++)
	{
		var child = group.children[i];
		parent.insertChild(index + i, child);
		i--;
	}
	group.remove();
}

App.isGroup = function(item)
{
	return Array.isArray(item.children);
}



App.alignItems = function(item1, bound1, item2, bound2)
{
	item1.translate(item2.bounds[bound2].subtract(item1.bounds[bound1]));
}


App.ligatureAndReduce = function(group)
{
	App.deGroupAllChildren(group);
	var path = new paper.Path();
	path.name = group.name;
	for (var i=0; i<group.children.length; i++)
	{
		var item = group.children[i];

		if (path.segments.length == 0)
		{
			path.segments = item.segments;
		}
		else
		{
			item.translate(path.lastSegment.point.subtract(item.firstSegment.point));
			path.lastSegment.handleOut = item.firstSegment.handleOut;
			item.removeSegment(0);
			for (var j=0; j<item.segments.length; j++)
			{
				path.segments.push(item.segments[j]);
			}
		}
	}
	group.remove();

	return path;
}



App.getFontAccents = function(names)
{
	var glyphs = App.Font.glyphs,
		result = [];
	for (var k in glyphs)
	{
		var baseName = k.split('.')[0],
			accent = baseName.substr(1,baseName.length-1);

		if (accent != '' && names.indexOf(accent) >= 0 && result.indexOf(baseName) < 0)
		{
			result.push(baseName);
		}
	}
	return result;
}

App.getCount = function(obj)
{
	var counter = 0;
	for (var k in obj)
	{
		counter++;
	}
	return counter;
}