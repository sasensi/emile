App.Games.add('brokenLine', new function()
{
	// params
	var prefix = 'svg/',
		drawingNames = ['castle','test'],
		extension = '.svg',

		contemplationDelay = 1500,
		shortContemplationDelay = 0,
		viewDelay = 1200,
		viewMinDelay = 300,
		viewSpeed = 3,

		viewMargin = App.config.dotWidth*4
		;


	// local variables
	var t = this,

		currentDrawing,
		currentSubDrawing,
		currentPaths,
		currentPath,
		currentBrokenLine,
		currentLine,
		dot,
		currentWin,

		drawingsGroup,
		winGroup,
		userGroup,

		gamePlaying,
		freeMode,
		dragging,

		levelCounter,
		subDrawingCounter,
		pathCounter,
		loadCounter,

		intro,
		raster
		;

	// global methods
	t.init = function()
	{
		currentDrawing    = null;
		currentSubDrawing = null;
		currentWin        = null;
		currentBrokenLine = null;
		currentLine       = null;
		dot       = null;
		gamePlaying       = false;
		levelCounter      = 0;
		subDrawingCounter = 0;
		loadCounter       = 0;
		winGroup          = null;
		intro             = true;
		freeMode          = false;
		raster            = null;

		t.background.bounds = App.appProject.view.bounds.scale(2);

		drawingsGroup = new paper.Group();
		drawingsGroup.name = 'drawingsGroup';
		drawingsGroup.visible = false;

		userGroup = new paper.Group();
		userGroup.name = 'userGroup';

		loadSvg();
	}

	function loadSvg()
	{
		// directly in html method
		for (var i=0; i<drawingNames.length; i++)
		{
			var id = drawingNames[i],
				DOMEl = document.getElementById(id),
				svg = paper.project.importSVG(DOMEl);

			if (svg)
				drawingsGroup.appendTop(svg);
		}
		t.onSvgLoad();


		// from file asynchronous method

		// if (loadCounter < drawingNames.length)
		// {
		// 	var name = drawingNames[loadCounter],
		// 		fullPath = prefix + name + extension,
		// 		svg = paper.project.importSVG(fullPath,
		// 		{
		// 		     expandShapes: true,
		// 		     onLoad: function(item)
		// 		     {
		// 		     	drawingsGroup.appendTop(item);
		// 		     	loadSvg();
		// 		     }
		// 		});
		// 	loadCounter++;
		// }
		// else
		// {
		// 	t.onSvgLoad();
		// }
	}

	t.start = function()
	{
		gamePlaying = true;

		startLevel();
	}

	t.onSvgLoad = function(item, i)
	{
		drawingsGroup.visible = true;

		App.setStyle(drawingsGroup, App.config.styles.stroke);

		createItems();

		positionItems();

		hideItems();
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
		if (!gamePlaying || (!currentBrokenLine && !freeMode))
			return;

		if (!freeMode)
		{
			currentBrokenLine.onCursorDown(e);
			return;
		}

		if (dragging != null)
			return;

		currentLine = new paper.Path([e.point, e.point]);
		dot = new Dot(e.point);
		dot.show();
		dot.activate();
		App.setStyle(currentLine, 'stroke');
		dragging = e.id;
	}

	t.onCursorMove = function(e)
	{
		if (!gamePlaying || (!currentBrokenLine && !freeMode) || (freeMode && !currentLine))
			return;

		if (!freeMode)
		{
			currentBrokenLine.onCursorMove(e);
			return;
		}

		if (dragging != e.id)
			return;

		currentLine.lastSegment.point = e.point;
		dot.position(e.point);
	}

	t.onCursorUp = function(e)
	{
		if (!gamePlaying || (!currentBrokenLine && !freeMode) || (freeMode && !currentLine))
			return;

		if (!freeMode)
		{
			currentBrokenLine.onCursorUp(e);
			return;
		}

		if (dragging != e.id)
			return;

		dot.hide(function(){
			dot.remove();
		});
		App.saveBackground(currentLine, t);
		currentLine = null;
		dragging = null;
	}

	t.onResize = function()
	{
		
	}



	t.onBrokenLineWin = function(item)
	{
		winPath(item);
	}



	// 
	// local methods
	// 

	// 
	// scenario
	// 

	function startPath()
	{
		currentPath = currentPaths.firstChild;
		currentPath.visible = true;

		currentBrokenLine = new BrokenLine(currentPath.segments, t);
		currentBrokenLine.show();
		gamePlaying = true;
	}

	function startPaths()
	{
		currentPaths = currentSubDrawing.firstChild;

		scaleViewToItemBounds({item:currentPaths, animate:!intro}, function()
		{
			startPath();
		});

		intro = false;
	}

	function startSubDrawing()
	{
		currentSubDrawing = currentDrawing.firstChild;
		startPaths();
	}

	function startLevel()
	{
		// console.log('start level',levelCounter);
		currentWin     = winGroup.children[levelCounter];
		currentDrawing = drawingsGroup.firstChild;

		startSubDrawing();
	}



	function nextPath()
	{
		if (currentPaths.children.length > 0)
		{
			startPath();
		}
		else
		{
			winPaths();
		}
	}

	function nextPaths()
	{
		if (currentSubDrawing.children.length > 0)
		{
			startPaths();
		}
		else
		{
			winSubDrawing();
		}
	}

	function nextSubDrawing()
	{
		if (currentDrawing.children.length > 0)
		{
			scaleViewToItemBounds({item:userGroup}, function(){
				App.Anim.add({
					duration: contemplationDelay,
					callback: function()
					{
						startSubDrawing();
					}
				})
			})
		}
		else
		{
			winLevel();
		}
	}

	function nextLevel()
	{
		if (drawingsGroup.children.length > 0)
		{
			levelCounter++;
			startLevel();

			// hide winGroup
			setTimeout(function(){
				App.hideItem(winGroup, {
					fade: true,
					scale: false
				})
			}, contemplationDelay);
		}
		else
		{
			winGame();
		}
	}



	function winPath(item)
	{
		gamePlaying = false;

		// console.log('win path')

		userGroup.appendTop(item);
		currentBrokenLine.remove();
		currentPath.remove();
		
		nextPath();
	}

	function winPaths()
	{
		// console.log('win paths');
		currentPaths.remove();

		nextPaths();
	}

	function winSubDrawing()
	{
		// console.log('win subDrawing');
		currentSubDrawing.remove();

		nextSubDrawing();
	}

	function winLevel()
	{
		// console.log('win level');
		currentDrawing.remove();

		App.showItem(winGroup, {
			fade: true,
			scale: false
		})

		scaleViewToItemBounds({zoom:1}, function(){

			setTimeout(function(){
				App.morphItems(userGroup, currentWin, function(){
					currentWin.visible = true;
					userGroup.removeChildren();
					userGroup.opacity = 1;
					nextLevel();
				});
			}, contemplationDelay);
		});
	}

	function winGame()
	{
		t.background.bounds = paper.view.bounds;

		drawingsGroup.remove();
		userGroup.removeChildren();
		userGroup.opacity = 1;

		App.animateWinGroup(winGroup, function(){
			App.saveBackground(winGroup, t);
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

	function createItems()
	{
		setDrawingHierarchy();

		winGroup = createWinGroup();
	}

	function setDrawingHierarchy()
	{
		drawingsGroup = App.forceGroup(drawingsGroup);
		drawingsGroup.name = 'drawingsGroup';
		for (var i=0; i<drawingsGroup.children.length; i++)
		{
			var drawing = App.forceGroup(drawingsGroup.children[i]);
			drawing.name = 'drawing_' + i;
			for (var j=0; j<drawing.children.length; j++)
			{
				var subDrawing = App.forceGroup(drawing.children[j]);
				subDrawing.name = 'subDrawing_' + j;
				for (var k=0; k<subDrawing.children.length; k++)
				{
					var paths = App.forceGroup(subDrawing.children[k]);
					paths.name = 'paths_' + k;
					App.deGroupAllChildren(paths);
				}
			}
		}
	}

	function createWinGroup()
	{
		var group = drawingsGroup.clone();
		group.name = 'winGroup';

		for (var i=0; i<group.children.length; i++)
		{
			var child = group.children[i];
			App.deGroupAllChildren(child);

			App.setStyle(child, App.config.styles.strokeWin);
		}

		return group;
	}

	function hideItems()
	{
		for (var i=0; i<drawingsGroup.children.length; i++)
		{
			var drawing = drawingsGroup.children[i];
			App.hideAllChildren(drawing);
		}
		
		App.hideAllChildren(winGroup);
	}





	// 
	// items position
	// 

	function positionItems()
	{
		var viewBounds = paper.view.bounds,
			marginBounds = viewBounds.scale(.8),
			center = viewBounds.center
			;

		// drawings
		for (var i=0; i<drawingsGroup.children.length; i++)
		{
			var drawing = drawingsGroup.children[i];
			drawing.fitBounds(marginBounds);
			drawing.position = center;
		}
		drawingsGroup.position = center.subtract(0, viewBounds.height * App.config.winBoxHeight*.5);

		// win
		App.positionWinGroup(winGroup);
	}




	// 
	// animation
	// 

	function scaleViewToItemBounds(options, callback)
	{
		var defaultOptions =
			{
				item: null,
				zoom: null,
				position: null,
				animate: true
			};

		options = App.extend(defaultOptions, options);

		var pos1        = paper.view.center,
			zoom1       = paper.view.zoom,

			pos2        = options.position ? options.position : options.item ? options.item.position : App.appProject.view.center,
			largestSide = options.item && options.item.bounds.width > options.item.bounds.height ? 'width' : 'height',
			zoom2       = options.zoom || (zoom1 * paper.view.bounds[largestSide] - viewMargin*2) / options.item.bounds[largestSide];

		if (!options.animate)
		{
			paper.view.center   = pos2;
			paper.view.zoom     = zoom2;
			// t.background.bounds = paper.view.bounds.scale(2);
			App.callback(callback);
		}
		else
		{

			var d = pos1.getDistance(pos2) * zoom1,
				delay = Math.min(Math.max(viewSpeed * d  + Math.abs(zoom2 - zoom1) * viewMinDelay, viewMinDelay), viewDelay);

			// console.log('//',d,delay, '<',viewMinDelay,'>',viewDelay);

			// t.background.bounds = paper.view.bounds.scale(2 * zoom2/zoom1);

			// position
			App.Anim.add({
				duration: delay,
				delay: shortContemplationDelay,
				easing: 'easeInOutQuad',
				action: function(time)
				{
					paper.view.center = App.rampPoints(pos1,pos2,time);

					t.background.position = paper.view.center;
				}
			})

			// zoom
			App.Anim.add({
				duration: delay * .7,
				delay: shortContemplationDelay + delay * .3,
				easing: 'easeInQuad',
				action: function(t)
				{
					paper.view.zoom = App.ramp(zoom1,zoom2,t);
				},
				callback: function()
				{
					// t.background.bounds = paper.view.bounds;
					App.callback(callback);
				}
			})
		}
	}



	// 
	// misc
	// 


});