App.Games.addKinect('shape1', new function()
{
	// params
	var dotGroupWidthCoeff = .4,
		dotMargin = .1,

		targetShapesGroupHeightCoeff = .6,
		targetShapesGroupOffsetCoeff = .05,

		targetShapeStyle = App.config.styles.strokeDestination,
		winStyle = App.config.styles.strokeWin,
		tempStyle = App.config.styles.stroke,

		showDelay = App.config.delays.dotShow,
		hideDelay = App.config.delays.dotHide,
		morphDuration = 500,
		captureDuration = 800,
		morphEasing = 'easeInQuad',
		morphDelay = 0
		;

	// local variables
	var t = this,
		dotGroup,
		targetShapesGroup,
		winShapesGroup,

		dots,
		targets,

		currentTempShape,
		currentTempPath,
		currentTargetShape,
		currentTargetPath,
		currentWinShape,

		levelCounter,
		pathCounter,

		dotTouchIds,
		targetTouchIds,

		animTarget,
		animMorph,

		dragging,
		gamePlaying

		;

	// global methods
	t.init = function()
	{
		dots               = [];
		levelCounter       = 0;
		pathCounter        = 0;
		currentTempPath    = null;
		currentTargetShape = null;
		currentTargetPath  = null;
		currentWinShape    = null;
		currentTempShape   = null;
		dragging           = null;
		animTarget         = null;
		animMorph         = null;
		dotTouchIds        = {};
		targetTouchIds     = {};
		gamePlaying        = false;


		targetShapesGroup = createTargetShapesGroup();
		winShapesGroup = createWinShapesGroup();
		targets = createTargets();
		dots = createDots();

		splitTargetShapes();

		positionItems();

		hideItems();
	}

	t.start = function()
	{
		gamePlaying = true;

		// tweak
		// levelCounter = targetShapesGroup.children.length-1;

		startLevel();
	}

	t.play = function()
	{
		
	}

	t.pause = function()
	{
		
	}


	// interactions
	t.onCursorMove = function(e)
	{
		if (!e || !gamePlaying)
			return;

		if (dragging)
		{
			// update shape and dot positions
			var dotIndex = dotTouchIds[e.id],
				dot      = dots[dotIndex];

			// dot.position(e.point);
			if (!animMorph)
			{
				dot.position(e.point);
				currentTempPath.segments[dotIndex].point = e.point;
			}
			else
			{
				dot.getItem().data.point = e.point;
			}

			// touch has already been captured
			// check if target is still touched
			if (targetTouchIds[e.id] != null)
			{
				var targetIndex = targetTouchIds[e.id],
					target      = targets[targetIndex];
				if (!target.hitTest(e.point))
				{
					target.desactivate();
					target.touched = false;
					delete targetTouchIds[e.id];
				}
			}

			// check for target capture
			else
			{
				for (var i=0; i<targets.length; i++)
				{
					var target = targets[i];
					if (target.touched)
						continue;

					if (target.hitTest(e.point))
					{
						target.touched = true;
						target.activate();
						targetTouchIds[e.id] = i;

						// check if all target are touched
						var allTouched = true;
						for (var j=0; j<targets.length; j++)
						{
							if (i == j)
								continue;
							if (!targets[j].touched)
							{
								allTouched = false;
								break;
							}
						}

						if (allTouched)
						{
							dragging = null;
							winPath();
						}
					}
				}
			}
		}

		// check dots
		else
		{
			// check if dot is still touched
			if (dotTouchIds[e.id] != null)
			{
				var dotIndex = dotTouchIds[e.id],
					dot      = dots[dotIndex];

				if (!dot.hitTest(e.point))
				{
					dot.desactivate();
					dot.touched = false;
					delete dotTouchIds[e.id];
				}
			}

			// check dots
			else
			{
				for (var i=0; i<dots.length; i++)
				{
					var dot = dots[i];
					if (dot.touched)
						continue;

					if (dot.hitTest(e.point))
					{
						dot.touched = true;
						dot.activate();
						dotTouchIds[e.id] = i;

						var allTouched = true;
						for (var j=0; j<dots.length; j++)
						{
							if (i == j)
								continue;
							if (!dots[j].touched)
							{
								allTouched = false;
								break;
							}
						}

						// capture dots
						if (allTouched)
						{
							currentTempPath = createTempPath();
							dot.getItem().data.point = e.point;
							morphTempPath();
							dragging = true;

							// show target
							showTarget();
						}

						break;
					}
				}
			}
		}
	}

	t.onKinectUserLeft = function()
	{
		hideTarget();
		resetDots();
	}

	t.onResize = function()
	{
		
	}



	// local methods

	// 
	// game scenario
	// 

	function startLevel()
	{
		currentTempShape = new paper.Group();
		currentTargetShape = targetShapesGroup.children[levelCounter];
		currentWinShape = winShapesGroup.children[levelCounter];

		startPath();
	}

	function startPath()
	{
		currentTargetPath = currentTargetShape.children[pathCounter];

		// position targets
		for (var i=0; i<targets.length; i++)
		{
			var target = targets[i],
				point = currentTargetPath.segments[i].point;
			target.position(point);
		}

		positionDots();
		showDots();
	}

	function winPath()
	{
		gamePlaying = false;
		dragging = null;

		// store target indexes relative to dots
		var indexArr = [];
		for (var i=0; i<dots.length; i++)
		{
			for (var k in dotTouchIds)
			{
				if (dotTouchIds[k] == i)
				{
					indexArr.push(targetTouchIds[k]);
					break;
				}
			}
		}

		// reset variables
		dotTouchIds = {};
		targetTouchIds = {};

		// positions arr
		var positionArr = [];
		for (var i=0; i<currentTempPath.segments.length; i++)
		{
			var targetIndex = indexArr[i],
				p1 = currentTempPath.segments[i].point.clone(),
				p2 = currentTargetPath.segments[targetIndex].point.clone();
			positionArr.push([p1, p2]);
		}

		// remove helpers
		for (var i=0; i<dots.length; i++)
		{
			var dot = dots[i],
				target = targets[i];
			dot.touched = false;
			target.touched = false;
			dot.hide(false);
			target.hide(false);
			dot.desactivate();
			target.desactivate();
		}
		currentTargetPath.visible = false;

		if (animMorph)
			App.Anim.removeAnimation(animMorph);

		animMorph = App.Anim.add({
			duration: morphDuration,
			delay: morphDelay,
			easing   : 'easeOutQuad',
			action: function(time)
			{
				for (var i=0; i<currentTempPath.segments.length; i++)
				{
					var p1 = positionArr[i][0],
						p2 = positionArr[i][1],
						p = App.rampPoints(p1, p2, time);
					currentTempPath.segments[i].point = p;
				}
			},
			callback: function()
			{
				animMorph = null;
				currentTempShape.appendTop(currentTempPath);
				currentTempPath = null;

				if (pathCounter < currentTargetShape.children.length-1)
				{
					pathCounter++;
					startPath();
					gamePlaying = true;
				}
				else
				{
					pathCounter = 0;
					winLevel();
				}
			}
		});
	}

	function winLevel()
	{
		// animate shape to winShape
		App.setStyle(currentTempShape, tempStyle);

		App.morphItems(currentTempShape, currentWinShape, function()
		{
			currentWinShape.visible = true;
			currentTempShape.remove();
			gamePlaying = true;
			nextLevel();
		});
	}

	function nextLevel()
	{
		if (levelCounter < targetShapesGroup.children.length-1)
		{
			levelCounter++;
			startLevel();
		}
		else
		{
			winGame();
		}
	}

	function winGame()
	{
		gamePlaying = false;

		for (var i=0; i<dots.length; i++)
		{
			dots[i].remove();
			targets[i].remove();
		}

		App.animateWinGroup(winShapesGroup, function()
		{
			console.log('WIN GAME');
		});
	}





	// 
	// items animation
	// 

	function showDots()
	{
		for (var i=0; i<dots.length; i++)
		{
			dots[i].show();
		}
	}

	function showTarget(callback)
	{
		currentTargetPath.visible = true;
		animateTarget(true, callback);
	}

	function hideTarget(callback)
	{
		animateTarget(false, function(){
			currentTargetPath.visible = false;
			if (typeof callback === 'function')
				callback();
		});
	}

	function animateTarget(show, callback)
	{
		// cancel anim
		if (animTarget)
			App.Anim.removeAnimation(animTarget);

		// targets
		for (var i=0; i<targets.length; i++)
		{
			if (show)
				targets[i].show();
			else
				targets[i].hide();
		}

		// target shape
		var o1 = show ? 0 : currentTargetPath.opacity,
			o2 = show ? targetShapeStyle.opacity : 0,
			delay = show ? showDelay : hideDelay;

		animTarget = App.Anim.add({
			duration: delay,
			action: function(time)
			{
				var o = App.ramp(o1,o2,time);
				currentTargetPath.opacity = o;
			},
			callback: function()
			{
				animTarget = null;
				if (typeof callback === 'function')
					callback();
			}
		})
	}

	function resetDots()
	{
		dragging = null;
		dotTouchIds = {};
		targetTouchIds = {};

		var positionArr = [];

		for (var i=0; i<dots.length; i++)
		{
			var dot = dots[i],
				target = targets[i];
			dot.touched = false;
			dot.desactivate();
			target.desactivate();

			// anim dots to original position
			var p1 = dot.getPosition(),
				p2 = dot.getItem().data.originalPosition;
			positionArr.push([p1,p2]);
		}

		animDotReset = App.Anim.add({
			duration : App.config.delays.dotReset,
			easing   : App.config.easings.dotReset,
			action   : function(time)
			{
				for (var i=0; i<dots.length; i++)
				{
					var dot = dots[i],
						p1 = positionArr[i][0],					
						p2 = positionArr[i][1];

					dot.position(App.rampPoints(p1,p2,time));			
				}
			},
			callback : function()
			{
				animDotReset = null;
			}
		})

		if (currentTempPath)
			currentTempPath.remove();
	}

	function morphTempPath()
	{
		if (animMorph)
			App.Anim.removeAnimation(animMorph);

		var arr = [];
		for (var i=0; i<currentTempPath.segments.length; i++)
		{
			arr.push(currentTempPath.segments[i].point.clone());
		}

		animMorph = App.Anim.add(
		{
			duration : captureDuration,
			delay    : morphDelay,
			easing   : 'easeOutQuad',
			action: function(time)
			{
				for (var i=0; i<currentTempPath.segments.length; i++)
				{
					var dot = dots[i],
						p1 = arr[i],
						p2 = new paper.Point(dot.getItem().data.point),
						p = App.rampPoints(p1, p2, time);
					currentTempPath.segments[i].point = p;
					dot.position(p);
				}
			},
			callback: function()
			{
				animMorph = null;
			}
		});
	}






	// 
	// items creation
	// 
	function createDots()
	{
		var arr = [];
		for (var i=0; i<2; i++)
		{
			var dot = new Dot(null, {kinectMode:true});
			arr.push(dot);
		}
		return arr;
	}

	function createTargets()
	{
		var arr = [];
		for (var i=0; i<2; i++)
		{
			var dot = new Target(null, {kinectMode:true});
			arr.push(dot);
		}
		return arr;
	}

	function createTargetShapesGroup()
	{
		var wordName = 'LTHIFEVXYANZKMW',
			word = new Word({word:wordName, openTypeFeatures:null});

		return word;
	}

	function splitTargetShapes()
	{
		var pointsArr = [];
		for (var i=0; i<targetShapesGroup.children.length; i++)
		{
			var group = targetShapesGroup.children[i],
				arr = [];
			for (var j=0; j<group.children.length; j++)
			{
				var path = group.children[j];
				for (var k=0; k<path.curves.length; k++)
				{
					var curve = path.curves[k],
						p1 = curve.point1,
						p2 = curve.point2;
					arr.push([p1,p2]);
				}
			}
			if (arr.length > 0)
				pointsArr.push(arr);
		}
		targetShapesGroup.remove();

		targetShapesGroup = new paper.Group();
		for (var i=0; i<pointsArr.length; i++)
		{
			var arr = pointsArr[i],
				group = new paper.Group();
			targetShapesGroup.appendTop(group);
			for (var j=0; j<arr.length; j++)
			{
				var p1 = arr[j][0],
					p2 = arr[j][1],
					path = new paper.Path.Line(p1,p2);
				App.setStyle(path, targetShapeStyle);
				group.appendTop(path);
			}
		}
	}

	function createWinShapesGroup()
	{
		var clone = targetShapesGroup.clone();
		App.setStyle(clone, winStyle);
		return clone;
	}

	function createTempPath()
	{
		var path = new paper.Path();
		path.style = tempStyle;
		for (var i=0; i<dots.length; i++)
		{
			path.add(dots[i].getPosition());
		}
		return path;
	}


	function positionItems()
	{
		var viewBounds = paper.view.bounds,
			center = viewBounds.center
			;
		// dots
		positionDots();
		positionDots();
		positionDots();

		// targets
		// overlap shapes
		for (var i=0; i<targetShapesGroup.children.length; i++)
		{
			targetShapesGroup.children[i].position = center;
		}
		var targetBounds = viewBounds.scale(1,targetShapesGroupHeightCoeff);
		targetShapesGroup.fitBounds(targetBounds);
		targetShapesGroup.translate(0,targetShapesGroupOffsetCoeff * viewBounds.height);

		// win
		App.positionWinGroup(winShapesGroup);
	}

	function hideItems()
	{
		// targets
		for (var i=0; i<targetShapesGroup.children.length; i++)
		{
			var group = targetShapesGroup.children[i];
			for (var j=0; j<group.children.length; j++)
			{
				var item = group.children[j];
				item.visible = false;
			}
		}

		// win
		for (var i=0; i<winShapesGroup.children.length; i++)
		{
			var group = winShapesGroup.children[i];
			group.visible = false;
		}
	}

	function positionDots()
	{
		var w = paper.view.bounds.width * dotGroupWidthCoeff,
			margin = paper.view.bounds.height * dotMargin,
			p0 = [paper.view.bounds.center.x - w*.5, margin],
			p1 = [paper.view.bounds.center.x + w*.5, margin];
		dots[0].position(p0);
		dots[1].position(p1);

		dots[0].getItem().data.originalPosition = p0;
		dots[1].getItem().data.originalPosition = p1;
	}
});