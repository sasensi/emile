App.Games.add('movePanZoom', new function()
{
	// local variables

	var t = this,

		canvas,
		logEl,

		raster,
		currentPath,
		pathsGroup,
		viewCenter,

		touchArr,
		prevVector,
		prevPoints,
		gamePlaying,
		fakeTouchCounter,

		prevTransform,

		inertiaAnim;


	// local parametters
	var maxTargetScale = 10,
		minTargetScale = .1,
		pathStyle      = App.config.styles.stroke,
		inertiaDelay = 500,

		optimizePerformance = false		// not working
		;


	// global variables

	t.spiralGroup;


	// global methods

	t.init = function()
	{
		// init variables
		touchArr = [];
		prevVector = null;
		prevPoints = null;
		currentPath = null;
		fakeTouchCounter = 0;
		viewCenter = null;
		inertiaAnim = null;
		prevTransform = null;


		pathsGroup = new paper.Group();
		pathsGroup.name = 'pathsGroup';

		// fakeTouch(paper.view.center);
		// fakeTouch(paper.view.center.add([100,100]));

		// paper.project.activeLayer.translate(10,10);
	}

	t.start = function()
	{
		gamePlaying = true;

		// setTimeout(lockBackground, 1000);
		// setTimeout(unlockBackground, 5000);
	}

	t.pause = function()
	{
		gamePlaying = false;
	}

	t.play = function()
	{
		gamePlaying = true;
	}


	// interaction methods

	function addTouch(e)
	{
		touchArr.push([e.id, new paper.Point(e.clientX, e.clientY)]);
	}

	function removeTouch(e)
	{
		var index = getTouchIndex(e);
		touchArr.splice(index, 1);
	}

	function updateTouch(e)
	{
		for (var i=0; i<touchArr.length; i++)
		{
			if (touchArr[i][0] == e.id)
			{
				touchArr[i][1] = new paper.Point(e.clientX, e.clientY);
				break;
			}
		}
	}

	function getTouchIndex(e)
	{
		for (var i=0; i<touchArr.length; i++)
		{
			if (touchArr[i][0] == e.id)
			{
				return i;
			}
		}

		return null;
	}


	function getVector()
	{
		return new paper.Point(touchArr[1][1].x - touchArr[0][1].x, touchArr[1][1].y - touchArr[0][1].y);
	}

	function getPoints()
	{
		var result = [];

		for (var i=0; i<touchArr.length; i++)
		{
			result.push(getPoint(i));
		}

		return result;
	}

	function getPoint(index)
	{
		return touchArr[index][1];
	}


	function showTouch(index)
	{
		var c = new paper.Path.Circle(touchArr[index][1], 2);
		c.fillColor = 'red';
	}


	function showLine()
	{
		var path = new paper.Path();
		path.strokeColor = 'red';

		for (var i=0; i<touchArr.length; i++)
		{
			path.add(touchArr[i][1]);
		}
	}


	function oneTouch()
	{
		return touchArr.length == 1;
	}


	function twoTouch()
	{
		return touchArr.length == 2;
	}


	function threeTouch()
	{
		return touchArr.length == 3;
	}



	t.onCursorDown = function(e)
	{
		if (gamePlaying)
		{
			// remove current path
			if (oneTouch() && currentPath)
			{
				currentPath.remove();
				currentPath = null;
			}

			addTouch(e);
			// log(['down',touchArr]);

			// if anim is executing, cancel it
			if (inertiaAnim)
			{
				App.Anim.removeAnimation(inertiaAnim);
			}
			prevVector = null;
			prevPoints = null;
			// prevTransform = null;
		}
	}


	t.onCursorMove = function(e)
	{
		if (gamePlaying)
		{
			updateTouch(e);
			var touchIndex = getTouchIndex(e);

			if (twoTouch() && touchIndex != null)
			{
				// tweak
				if (optimizePerformance && !pathsGroup.visible)
					unlockBackground();

				if (touchIndex == 1)
				{
					prevPoints = prevPoints || getPoints();
					prevVector = prevVector || getVector();

					var v0   = prevVector,
						m0   = middlePoint(prevPoints),
						p1_0 = prevPoints[1]; 

					// update and store data
					prevVector = getVector();
					prevPoints = getPoints();
					
					var v1   = prevVector,
						m1   = middlePoint(prevPoints),
						p1_1 = prevPoints[1];

					// check length difference
					var deltaLength = v1.length - v0.length,
						deltaAngle  = v0.getDirectedAngle(v1),
						deltaX      = m1.x - m0.x,
						deltaY      = m1.y - m0.y;

					// order is very important : translate => rotate => zoom
					translateCanvas(deltaX, deltaY);
					rotateCanvas(deltaAngle, m1);
					zoomCanvas(deltaLength, m1);

					// store transform data
					prevTransform = [[deltaX, deltaY], deltaAngle, deltaLength, m1, new Date()];
				}
			}
			else if (touchIndex != null && ((threeTouch() && touchIndex == 2) || oneTouch()))
			{
				if (!currentPath)
				{
					currentPath = new paper.Path();
					App.setStyle(currentPath, pathStyle);
				}
				currentPath.add(paper.view.viewToProject(getPoint(touchIndex)));

				// if (threeTouch())
				// {
				// 	currentPath.strokeColor = App.config.colors.machine;
				// }
			}
		}
	}


	t.onCursorUp = function(e)
	{
		if (gamePlaying)
		{
			var touchIndex = getTouchIndex(e);

			// check end of gesture
			if (twoTouch() && prevTransform)
			{
				// launch inertia anim
				inertiaAnim = App.Anim.add({
					duration : inertiaDelay,
					'easing' : 'easeOutQuart',
					action   : function(t)
					{
						var _t    = (1-t),
							dX    = prevTransform[0][0] * _t,
							dY    = prevTransform[0][1] * _t,
							dA    = prevTransform[1] * _t,
							dL    = prevTransform[2] * _t,
							point = prevTransform[3];

						translateCanvas(dX, dY);
						rotateCanvas(dA, point);
						zoomCanvas(dL, point);
					},
					callback: function()
					{
						// tweak
						if (optimizePerformance)
							lockBackground();
					}
				})
			}

			removeTouch(e);

			if (currentPath)
			{
				currentPath.simplify();
				pathsGroup.appendTop(currentPath);
				currentPath = null;

				// tweak
				if (optimizePerformance)
					lockBackground();
			}
		}
	}


	t.onFrame = function(e)
	{
		// if (viewCenter)
		// {
		// 	viewCenter.remove();
		// }
		// viewCenter = new paper.Path.Circle(paper.view.viewToProject(paper.view.center), 5);
		// viewCenter.strokeColor = 'green'
	}


	t.onResize = function()
	{
	}


	// transformation methods
	function rotateCanvas(angle, point)
	{
		rotateView(angle, point);
	}


	function zoomCanvas(inc, point)
	{
		zoomPoint(-inc, point);
	}


	function translateCanvas(x, y)
	{
		x /= paper.view.zoom;
		y /= paper.view.zoom;

		translateView(x,y);
	}



	// utility functions
	function fakeTouch(point)
	{
		// add fake touch to test
		addTouch({id:fakeTouchCounter, clientX:point.x, clientY:point.y})
		var c = new paper.Path.Circle(point, 5);
		c.fillColor = 'red';
		fakeTouchCounter++;
	}


	function middlePoint(pointsArr)
	{
		var p0 = pointsArr[0],
			p1 = pointsArr[1];

		return App.rampPoints(p0,p1,.5);
	}


	function rotateView(angle, point)
	{
		point = paper.view.viewToProject(point);
		// angle = map(angle, -10, 10, -5, 5);
		angle *= .5;

		// iterate over all items in project
		var items = paper.project.getItems({class:paper.Path});
		for (var i=0; i<items.length; i++)
		{
			var item = items[i];
			if (item != t.background)
			{
				item.rotate(angle, point);
			}
		}
	}


	function zoomPoint(delta, point)
	{
		point = paper.view.viewToProject(point);

	    var modDelta = Math.abs(delta),
	        signDelta = delta > 0 ? -1 : 1,
	        scale = 1 + signDelta * map(modDelta, 0, 10, 0, 0.1);
	    // paper.project.activeLayer.scale(scale, point);

	    var items = paper.project.getItems({class:paper.Path});
	    for (var i=0; i<items.length; i++)
	    {
	    	var item = items[i];
	    	if (item != t.background)
	    	{
	    		item.scale(scale, point);
	    	}
	    }
	}

	function translateView(x,y)
	{
		var items = paper.project.getItems({class:paper.Path});
		for (var i=0; i<items.length; i++)
		{
			var item = items[i];
			if (item != t.background)
			{
				item.translate(x, y);
			}
		}
	}

	// Map val in range to domain
	function map(val, minR, maxR, minD, maxD) {
	    return minD + ((val > maxR ? maxR : val < minR ? minR : val) - minR) * (maxD - minD) / (maxR - minR);
	}

	function resizeBackground()
	{
		t.background.bounds = App.getBounds();
	}

	function lockBackground()
	{
		unlockBackground();

		raster = paper.project.activeLayer.rasterize();
		raster.opacity = .3;
		// raster.fitBounds(App.appProject.view.bounds);

		pathsGroup.visible = false;

		console.log(paper.project.activeLayer.children);
	}

	function unlockBackground()
	{
		pathsGroup.visible = true;

		if (raster)
			raster.remove()
	}

	function countVisiblePaths()
	{

	}
});