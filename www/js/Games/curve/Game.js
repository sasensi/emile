App.Games.add('curve', new function()
{
	// params
	var charArrays =
		[
			['pont'],
			['pont.inv'],
			['o'],
			['boucle.alone'],
			['boucle.inv.alone'],

			['pont', 'pont', 'pont.out'],
			['pont.inv', 'pont.inv', 'pont.inv.out'],
			['boucle.in', 'boucle', 'boucle.out'],
			['boucle.inv.in', 'boucle.inv', 'boucle.inv.out'],

			['pont','pont.lig.out','pont.lig', 'pont.inv.lig.in', 'pont.inv.out'],
			['boucle.in', 'boucle.lig', 'boucle.inv', 'boucle.inv.out'],
			['pont.lig.out', 'pont.lig', 'pont.inv.lig', 'pont.lig', 'pont.inv.lig.in'],
			['boucle.in.lig', 'boucle.inv.lig', 'boucle.lig', 'boucle.inv.out']
		],
		winStyle = App.extend(App.config.styles.strokeWin)
		;

	// local variables
	var t = this,
		pathsGroup,
		winGroup,

		currentPath,
		currentWin,
		currentCurve,

		levelCounter,

		gamePlaying,
		freeMode,
		dragging,

		dot,
		path,

		raster
		;

	// global methods
	t.init = function()
	{
		currentCurve = null;
		currentPath  = null;
		currentWin   = null;
		levelCounter = 0;
		gamePlaying  = false;
		freeMode     = false;
		dot          = null;
		path         = null;
		dragging     = null;
		raster       = null;

		pathsGroup = createPathsGroup();
		pathsGroup.name = 'pathsGroup';

		winGroup = createWinGroup();
		winGroup.name = 'winGroup';

		positionItems();

		hideItems();

	}

	t.start = function()
	{
		// tweak
		// levelCounter = pathsGroup.children.length-1;
		// fakeStart();
		// setFreeMode();

		startLevel();
	}

	function fakeStart()
	{
		for (var i=0; i<levelCounter; i++)
		{
			pathsGroup.firstChild.remove();
		}
	}

	t.play = function()
	{
		
	}

	t.pause = function()
	{
		
	}


	// interactions
	t.onCursorDown = function(e)
	{
		if (!gamePlaying || (!currentCurve && !freeMode) || (freeMode && dragging != null))
			return;

		if (freeMode)
		{
			path = new paper.Path(e.point);
			App.setStyle(path, 'stroke');
			dot = new Dot(e.point);
			dot.show();
			dot.activate();
			dragging = e.id;
			return;
		}

		currentCurve.onCursorDown(e);
	}

	t.onCursorMove = function(e)
	{
		if (!gamePlaying || (!currentCurve && !freeMode) || (freeMode && dragging != e.id))
			return;

		if (freeMode && dragging == e.id)
		{
			path.add(e.point);
			// path.smooth();
			dot.position(e.point);
			return;
		}

		currentCurve.onCursorMove(e);
	}

	t.onCursorUp = function(e)
	{
		if (!gamePlaying || (!currentCurve && !freeMode) || (freeMode && dragging != e.id))
			return;

		if (freeMode)
		{
			var clone = path.clone();
			clone.simplify(80);

			var	morph = new MorphPath(path, clone);

			path.remove();
			clone.visible = false;

			var _dot = dot;
			_dot.hide(true, function(){
				_dot.remove();
			});

			App.Anim.add({
				duration: 350,
				action: function(time)
				{
					morph.update(time);
				},
				callback: function()
				{
					morph.path.remove();
					morph.remove();
					clone.visible = true;
					App.saveBackground(clone);
				}
			})

			dragging = null;
			return;
		}

		currentCurve.onCursorUp(e);
	}

	t.onResize = function()
	{
		
	}


	// 
	// local methods
	// 


	// 
	// scenario
	// 

	function startLevel()
	{
		console.log('startLevel',levelCounter);
		currentPath = pathsGroup.firstChild;
		currentWin = winGroup.children[levelCounter];

		gamePlaying = true;

		currentCurve = new Curve(currentPath, t);
		currentCurve.start();
	}

	function nextLevel()
	{
		if (pathsGroup.children.length > 0)
		{
			levelCounter++;
			startLevel();
		}
		else
		{
			winGame();
		}
	}


	t.onCurveWin = function(path)
	{
		gamePlaying = false;
		winLevel(path);
	}

	function winLevel(path)
	{
		currentPath.remove();

		App.morphItems(path, currentWin, function(){
			path.remove();
			currentWin.visible = true;
			saveBackground();
			nextLevel();
		})
		
	}

	function winGame()
	{
		pathsGroup.remove();

		winGroup.visible = true;

		if (raster)
			raster.remove();

		App.animateWinGroup(winGroup, function(){
			App.saveBackground(winGroup);
			winGroup.remove();
			setFreeMode();
		})
	}

	function setFreeMode()
	{
		gamePlaying = true;
		freeMode = true;
	}




	// 
	// items creation
	// 

	function createPathsGroup()
	{
		var group = new paper.Group();

		for (var i=0; i<charArrays.length; i++)
		{
			var charArray = charArrays[i],
				word = new Word({
					charArray:charArray,
					openTypeFeatures: null
				});

			// ligature and reduce word
			word = ligatureAndReduce(word);
			group.appendTop(word);
		}

		App.setChildrenStyle(group, 'stroke');

		return group;
	}

	function ligatureAndReduce(group)
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

	function createWinGroup()
	{
		var group = pathsGroup.clone();

		App.setChildrenStyle(group, 'strokeWin');

		return group;
	}

	function hideItems()
	{
		App.setChildrenStyle(pathsGroup, {visible:false});

		App.setChildrenStyle(winGroup, {visible:false});
	}



	// 
	// items position
	// 

	function positionItems()
	{
		var viewBounds = paper.view.bounds,
			center = paper.view.center,
			marginBounds = viewBounds.scale(.8);

		pathsGroup.fitBounds(marginBounds);

		App.positionWinGroup(winGroup);
	}



	// 
	// misc
	// 

	function saveBackground()
	{
		var layer = paper.project.activeLayer;
		App.hideAllChildren(layer);

		t.background.visible = true;
		winGroup.visible = true;
		winGroup.opacity = 1;

		App.setChildrenStyle(winGroup, {opacity:1});

		if (raster)
			raster.remove()

		raster = layer.rasterize();
		raster.opacity = winStyle.opacity;

		App.setChildrenStyle(winGroup, {opacity:winStyle.opacity});

		layer.appendBottom(raster);
		layer.appendBottom(t.background);

		App.showAllChildren(layer);
		winGroup.visible = false;
	}

});