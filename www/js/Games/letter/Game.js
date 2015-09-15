App.Games.add('letter', new function()
{
	// params
	var letters = 'oldqgapbrnhmuyvwcxszekijtf',
		exceptionsLetters = 'olcv',

		winStyle             = App.config.styles.strokeWin,
		targetStyle          = App.config.styles.strokeDestination,
		activeTargetStyle    = 
		{
			strokeColor : App.config.colors.user
		},
		inactiveTargetStyle  =
		{
			strokeColor : targetStyle.strokeColor
		},
		puzzleStyle          = App.config.styles.movableStroke,
		shapeStyle           = puzzleStyle,

		shapeGroupMargin     = .1,
		puzzleMargin         = .035,

		targetHoverDistance  = 100,

		puzzleHitTestOptions =
		{
			fill : false, stroke: true, segments: false, tolerance: 50
		},

		showDelay = App.config.delays.show * 2,

		optimizePerformance = true
		;

	// local variables
	var t = this,

		winGroup,
		targetGroup,
		shapeGroup,
		puzzleGroup,
		userGroup,

		currentPuzzle,
		currentTarget,
		currentShape,
		currentWin,
		currentDrawing,
		raster,

		gamePlaying,
		dragging,
		hovering,

		levelCounter,

		animPuzzle

		;

	// global methods
	t.init = function()
	{
		levelCounter   = 0;
		gamePlaying    = false;
		dragging       = null;
		hovering       = null;
		currentPuzzle  = null;
		currentTarget  = null;
		currentShape   = null;
		currentWin     = null;
		currentDrawing = null;
		raster         = null;
		animPuzzle     = null;


		shapeGroup  = createShapeGroup();
		shapeGroup.name = 'shapeGroup';

		winGroup    = createWinGroup();
		winGroup.name = 'winGroup';

		targetGroup = createTargetGroup();
		targetGroup.name = 'targetGroup';

		puzzleGroup = createPuzzleGroup();
		puzzleGroup.name = 'puzzleGroup';

		userGroup = new paper.Group();
		userGroup.name = 'userGroup';

		positionItems();

		hideItems();
	}

	t.start = function()
	{
		gamePlaying = true;

		startLevel();

		// tweak
		// startDrawing();
	}

	t.play = function()
	{
		
	}

	t.pause = function()
	{
		
	}


	// 
	// interactions
	// 

	t.onCursorDown = function(e)
	{
		if (!gamePlaying)
			return;

		// drawing
		if (currentDrawing)
		{
			currentDrawing.onCursorDown(e);
			return;
		}

		if (dragging != null)
			return;

		// hitTest puzzle
		var target = hitTestPuzzles(e.point);
		if (target)
		{
			if (animPuzzle)
				App.Anim.removeAnimation(animPuzzle);
			dragging = {id:e.id, target:target};
		}
	}

	t.onCursorMove = function(e)
	{
		if (!gamePlaying)
			return;

		// drawing
		if (currentDrawing)
		{
			currentDrawing.onCursorMove(e);
			return;
		}

		if (!dragging || dragging.id != e.id)
			return;

		// move target
		dragging.target.translate(e.delta);

		var hoverTarget = hitTestTargets(dragging.target);
		if (hoverTarget)
		{
			if (!hovering || hovering != hoverTarget)
			{
				if (hovering)
					desactivateTarget(hovering);

				activateTarget(hoverTarget);
				hovering = hoverTarget;
			}
		}
		else if (hovering)
		{
			desactivateTarget(hovering);
			hovering = null;
		}
	}

	t.onCursorUp = function(e)
	{
		if (!gamePlaying)
			return;

		// drawing
		if (currentDrawing)
		{
			currentDrawing.onCursorUp(e);
			return;
		}

		if (!dragging || dragging.id != e.id)
			return;

		// check hover
		if (hovering)
		{
			desactivateTarget(hovering);
			// check if it is the good shape
			if (goodTarget(hovering, dragging.target))
			{
				lockTarget(hovering, dragging.target);
			}
			else
			{
				resetPuzzle(dragging.target);
			}
			hovering = null;
		}
		else
		{
			dragging.target.data.position = dragging.target.position;
		}
		dragging = null;
	}

	t.onResize = function()
	{
		
	}


	// 
	// local methods
	// 

	// 
	// game scenario
	// 

	function startLevel()
	{
		if (optimizePerformance)
		{
			if (currentPuzzle)
				currentPuzzle.remove();
			if (currentTarget)
				currentTarget.remove();
			if (currentShape)
				currentShape.remove();
			if (currentWin)
				currentWin.remove();

			levelCounter = 0;
		}

		currentPuzzle = puzzleGroup.children[levelCounter];
		currentTarget = targetGroup.children[levelCounter];
		currentShape  = shapeGroup.children[levelCounter];
		currentWin    = winGroup.children[levelCounter];

		console.log();

		var letterName = currentShape.name.split('_')[1],
			showPuzzle = exceptionsLetters.indexOf(letterName) < 0;

		if (showPuzzle)
		{
			showPuzzleAndTarget(function()
			{
				gamePlaying = true;
			})
		}

		else
		{
			showShape(function(){
				gamePlaying = true;
				startDrawing();
			})
		}

	}

	function startDrawing()
	{
		currentDrawing = new Drawing(new paper.Group(currentShape.clone()), t, {showPath:true});
		userGroup.appendTop(currentDrawing.group);
		currentShape.remove();

		App.hideItem(currentPuzzle, {
			scale    : false,
			fade     : true,
			callback : function()
			{
				currentPuzzle.remove();
				currentTarget.remove();
				

				currentDrawing.start();
			}
		})
	}

	t.onDrawingWin = function(group)
	{
		currentDrawing = null;
		winLevel(group);
	}

	function winLevel(group)
	{
		gamePlaying = false;

		App.morphItems(group, currentWin, function()
		{
			if (optimizePerformance)
			{
				saveBackground(group);
			}
			nextLevel();
		});
	}

	function nextLevel()
	{
		if (levelCounter < targetGroup.children.length-1)
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
		if (!optimizePerformance)
		{
			App.animateWinGroup(winGroup, function()
			{
				console.log('win game !!!')
			});
		}
		else
		{
			App.showItem(raster, {
				scale    : false,
				fade     : true,
				duration : App.config.delays.win,
				callback : function()
				{
					console.log('win game !!! (optimizePerformance)')
				}
			})
		}
	}


	// 
	// items creation
	// 

	function createShapeGroup()
	{
		return new Word({word:letters, style:shapeStyle, openTypeFeatures:false, pivotPoint:true});
	}

	function createWinGroup()
	{
		return new Word({word:letters, style:winStyle, openTypeFeatures:false, pivotPoint:true});
	}

	function createTargetGroup()
	{
		var charArray = [];
		for (var i=0; i<letters.length; i++)
		{
			var ch = letters[i] + '.split';
			charArray.push(ch);
		}

		var word = new Word({charArray:charArray, style:targetStyle, openTypeFeatures:false, pivotPoint:true});
		// store order
		for (var i=0; i<word.children.length; i++)
		{
			for (var j=0; j<word.children[i].children.length; j++)
			{
				word.children[i].children[j].data.originalIndex = j;
			}
		}
		return word;
	}

	function createPuzzleGroup()
	{
		var charArray = [];
		for (var i=0; i<letters.length; i++)
		{
			var ch = letters[i] + '.split';
			charArray.push(ch);
		}
		return new Word({charArray:charArray, style:puzzleStyle, openTypeFeatures:false, pivotPoint:true});
	}


	function hideItems()
	{
		App.hideAllChildren(shapeGroup);
		App.hideAllChildren(targetGroup);
		App.hideAllChildren(winGroup);
		App.hideAllChildren(puzzleGroup);
	}




	// 
	// position items
	// 

	function positionItems()
	{
		var viewBounds = paper.view.bounds,
			center     = viewBounds.center,
			winMargin  = App.config.winMargin,
			marginRect = new paper.Path.Rectangle(viewBounds.scale((1 - puzzleMargin*2), (1 - winMargin - shapeGroupMargin*2)))
			;

		marginRect.pivot    = marginRect.bounds.topCenter;
		marginRect.position = viewBounds.topCenter.add(0,shapeGroupMargin * viewBounds.height);
		var marginBounds    = marginRect.bounds;
		marginRect.remove();
			
		// shapes
		positionCenter(shapeGroup, marginBounds, viewBounds);

		// targets
		positionCenter(targetGroup, marginBounds, viewBounds);

		// puzzle
		positionCenter(puzzleGroup, marginBounds, viewBounds);

		// synchronise shapes
		for (var i=0; i<targetGroup.children.length; i++)
		{
			var shape = shapeGroup.children[i],
				target = targetGroup.children[i],
				puzzle = puzzleGroup.children[i],
				shapeCenter = shape.bounds.center,
				targetCenter = target.bounds.center,
				delta = shapeCenter.subtract(targetCenter);
			target.position = target.position.add(delta);
			puzzle.position = target.position;
		}

		// explode puzzle
		for (var i=0; i<puzzleGroup.children.length; i++)
		{
			var group = puzzleGroup.children[i],
				target = targetGroup.children[i],
				boundsArr = getRandomBounds(target, marginBounds);

			for (var j=0; j<group.children.length; j++)
			{
				var item = group.children[j];
				positionRandom(item, boundsArr);

				// store position
				item.data.position = item.position;
			}
		}

		// win
		App.positionWinGroup(winGroup);
	}

	function positionCenter(group, marginBounds, viewBounds)
	{
		for (var i=0; i<group.children.length; i++)
		{
			group.children[i].position = viewBounds.center;
		}
		group.pivot = group.bounds.center;
		group.fitBounds(marginBounds);
	}

	function getRandomBounds(item, bounds)
	{
		var p0 = bounds.topLeft,
			p1 = new paper.Point(item.bounds.topLeft.x - puzzleMargin *.5 * paper.view.bounds.width, p0.y),
			p2 = new paper.Point(item.bounds.topRight.x + puzzleMargin *.5 * paper.view.bounds.width, p0.y),
			p3 = bounds.topRight,
			leftRect = new paper.Path.Rectangle(p0, p1.add(0,bounds.height)),
			rightRect = new paper.Path.Rectangle(p2, p3.add(0,bounds.height)),
			leftBounds = leftRect.bounds,
			rightBounds = rightRect.bounds
			;

		leftRect.remove();
		rightRect.remove();

		return [leftBounds, rightBounds];
	}

	function positionRandom(item, boundsArr)
	{
		// set 2 bounding boxes relative to target
		var randomIndex = App.rdmIntRange(0,1),
			bounds = boundsArr[randomIndex];

		positionItemInBounds(item, bounds);
	}

	function positionItemInBounds(item, bounds)
	{
		var coordArr = ['x','y'],
			boundArr = ['width','height'];
		for (var i=0; i<2; i++)
		{
			var coord = coordArr[i],
				bound = boundArr[i],
				delta = bounds[bound] - item.bounds[bound];
			if (delta <= 0)
			{
				item.position[coord] = bounds.center[coord];
			}
			else
			{
				var rdmOffset = Math.random() > .5 ? App.rdmRange(-delta*.5,0) : App.rdmRange(0, delta*.5);
				item.position[coord] = bounds.center[coord] + rdmOffset;
			}
		}
	}



	// 
	// hit tests
	// 

	function hitTestTargets(puzzle)
	{
		var closest = null,
			minD = null;
		for (var i=0; i<currentTarget.children.length; i++)
		{
			var target = currentTarget.children[i],
				d = hitTestTarget(puzzle, target);
			if (d && (closest == null || d < minD))
			{
				closest = target;
				minD = d;
			}
		}
		return closest;
	}

	function hitTestTarget(puzzle, target)
	{
		if (target.data.locked)
			return null;

		var puzzlePos = puzzle.position,
			targetPos = target.position,
			d = puzzlePos.getDistance(targetPos);

		if (d < targetHoverDistance)
		{
			return d;
		}
		return null;
	}

	function hitTestPuzzles(point)
	{
		for (var i=0; i<currentPuzzle.children.length; i++)
		{
			var puzzle = currentPuzzle.children[i];
			if (hitTestPuzzle(point, puzzle))
			{
				return puzzle;
			}
		}
		return null;
	}

	function hitTestPuzzle(point, puzzle)
	{
		if (puzzle.data.locked)
		{
			return null;
		}
		return puzzle.hitTest(point, puzzleHitTestOptions);
	}




	// 
	// items verifications
	// 

	function goodTarget(target, puzzle)
	{
		return target.data.originalIndex == puzzle.index;
	}

	function allLocked()
	{
		for (var i=0; i<currentTarget.children.length; i++)
		{
			if (!currentTarget.children[i].data.locked)
			{
				return false;
			}
		}
		return true;
	}



	// 
	// items effects
	// 

	function activateTarget(target)
	{
		currentTarget.appendTop(target);
		App.setStyle(target, activeTargetStyle);
	}

	function desactivateTarget(target)
	{
		App.setStyle(target, inactiveTargetStyle);
	}

	function lockTarget(target, puzzle)
	{
		target.data.locked = true;
		puzzle.data.locked = true;

		App.Anim.add({
			duration : App.config.delays.morphTarget,
			easing   : App.config.easings.morphTarget,
			data     : [puzzle.position, target.position],
			action   : function(time, data)
			{
				puzzle.position = App.rampPoints(data[0], data[1], time);
			},
			callback : function(data)
			{
				data[1].visible = false;
				if (allLocked())
				{
					startDrawing();
				}
			}
		})
	}

	function resetPuzzle(puzzle)
	{
		animPuzzle = App.Anim.add({
			duration : App.config.delays.dotReset,
			easing   : App.config.easings.dotReset,
			data     : puzzle.position,
			action   : function(time, data)
			{
				puzzle.position = App.rampPoints(data, puzzle.data.position, time);
			},
			callback : function()
			{
				animPuzzle = null;
			}
		});
	}

	function showPuzzleAndTarget(callback)
	{
		for (var i=0; i<currentPuzzle.children.length; i++)
		{
			var puzzle   = currentPuzzle.children[i],
				target   = currentTarget.children[i],
				_callback = i < currentPuzzle.children.length-1
					? null
					: function(){
						App.callback(callback);
					},
				init = i < currentPuzzle.children.length-1
					? null
					: function(){
						currentPuzzle.visible = true;
						currentTarget.visible = true;
					};

			App.showItem(puzzle, {duration:showDelay, total:true, callback:_callback, init:init});
			App.showItem(target, {duration:showDelay, total:true, fade:true, scale:false});
		}
	}

	function showShape(callback)
	{
		currentShape.opacity = 0;
		currentShape.visible = true;
		App.Anim.add({
			duration: App.config.delays.show,
			action: function(time)
			{
				currentShape.opacity = App.ramp(0, winStyle.opacity, time);
			},
			callback: callback
		})
	}



	// 
	// performance optimisation
	// 

	function saveBackground(item)
	{
		// tweak 
		if (item)
			item.opacity = 1;

		if (raster)
			raster.opacity = 1;

		var _raster = paper.project.activeLayer.rasterize();
		_raster.opacity = winStyle.opacity;
		if (raster)
		{
			raster.remove();
		}
		raster = _raster;
		if (item)
		{
			item.remove();
		}
	}
});