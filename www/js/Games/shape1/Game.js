App.Games.add('shape1', new function()
{
	// params
	var incrementStep = 4,

		normalLineLength = 270,
		minScale = .3,
		maxScale = 1.8,

		lineAngle = -45,

		maxMargin = 270,

		targetShapeStyle = App.config.styles.filledDestination,
		basicShapeStyle = App.config.styles.filled,
		winShapeStyle = App.config.styles.filledWin
		;

	// local variables
	var t = this,
		targetShapesGroup,
		basicShapesGroup,
		winShapesGroup,
		shapesGroup,

		levelCounter,

		currentBasicShape,
		currentTargetShape,
		currentWinShape,
		currentTempShape,
		selectionShape,

		dots,
		targets,

		dotTouchIds,
		targetTouchIds,
		selectTouchIds,

		animDotReset,
		animTarget,

		gamePlaying,
		dragging
		;

	// global methods
	t.init = function()
	{
		// init variables
		levelCounter   = 0;
		gamePlaying    = false;
		dragging       = null;
		animDotReset   = null;
		animTarget     = null;
		selectionShape = null;
		dots           = [];
		targets        = [];
		dotTouchIds    = {};
		targetTouchIds = {};
		selectTouchIds = {};


		// create shapes
		targetShapesGroup = createShapesGroup();

		basicShapesGroup = createBasicShapesGroup();

		winShapesGroup = createWinShapesGroup();

		shapesGroup = new paper.Group([basicShapesGroup, targetShapesGroup]);

		// position shapes
		positionShapes();

		hideShapes();
	}

	t.start = function()
	{
		gamePlaying = true;
		
		// tweak
		// levelCounter = 11;

		startLevel();

		// tweak
		// setFreeMode();
	}

	t.play = function()
	{
		gamePlaying = true;
	}

	t.pause = function()
	{
		gamePlaying = false;
	}

	// 
	// interactions
	// 

	t.onCursorDown = function(e)
	{
		if (!gamePlaying)
			return;

		// after winning game
		if (selectionShape != null)
		{
			selectionShape.onCursorDown(e);
			return;
		}


		// check dots
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

				if (allTouched)
				{
					// cancel anim
					if (animDotReset)
						App.Anim.removeAnimation(animDotReset);

					currentTempShape.visible = true;
					dragging = true;

					// show target
					for (var i=0; i<dots.length; i++)
					{
						// adapt shape
						var dot = dots[i];
						currentTempShape.segments[i].point = dot.getPosition();

						// show target
						var target = targets[i];
						target.show();
					}

					currentTargetShape.visible = true;
					currentTargetShape.opacity = 0;
					var o1 = 0,
						o2 = targetShapeStyle.opacity;
					animTarget = App.Anim.add({
						duration: App.config.delays.show,
						action: function(time)
						{
							var o = App.ramp(o1,o2,time);
							currentTargetShape.opacity = o;
						},
						callback: function()
						{
							animTarget = null;
						}
					})
				}

				break;
			}
		}
	}





	t.onCursorMove = function(e)
	{
		if (!gamePlaying)
			return;

		// after winning game
		if (selectionShape != null)
		{
			selectionShape.onCursorMove(e);
			return;
		}

		if (dragging)
		{
			// update shape and dot positions
			var dotIndex = dotTouchIds[e.id],
				dot      = dots[dotIndex];

			// dot.position(e.point);
			dot.translate(e.delta);
			e.point = dot.getPosition();
			currentTempShape.segments[dotIndex].point = e.point;

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
							winLevel();
						}
					}
				}
			}
		}

		else
		{
			// check dots
			if (dotTouchIds[e.id] != null)
			{
				// check if dot is still touched
				var dotIndex = dotTouchIds[e.id],
					dot      = dots[dotIndex];

				if (!dot.hitTest(e.point))
				{
					dot.desactivate();
					dot.touched = false;
					delete dotTouchIds[e.id];
				}
			}
			
			t.onCursorDown(e)
		}

	}





	t.onCursorUp = function(e)
	{
		if (!gamePlaying)
			return;

		// after winning game
		if (selectionShape != null)
		{
			selectionShape.onCursorUp(e);
			return;
		}

		if (dotTouchIds[e.id] == null && targetTouchIds[e.id] == null)
			return;

		if (dragging)
		{
			console.log('release shape, reseting dots and targets');
			dragging = null;
			dotTouchIds = {};

			var positionArr = [];

			for (var i=0; i<dots.length; i++)
			{
				var dot = dots[i],
					target = targets[i];
				dot.touched = false;
				dot.desactivate();
				target.desactivate();
				target.hide();

				// anim dots to original position
				var p1 = dot.getPosition(),
					p2 = currentBasicShape.segments[i].point;
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

			currentTempShape.remove();
			currentTempShape = currentBasicShape.clone();

			currentTargetShape.visible = false;
		}

		else
		{
			// check if dot is still touched
			var dotIndex = dotTouchIds[e.id],
				dot      = dots[dotIndex];

			dot.desactivate();
			dot.touched = false;
			delete dotTouchIds[e.id];
		}

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
		// init variables
		currentBasicShape = basicShapesGroup.children[Math.floor(levelCounter / incrementStep)];
		currentTargetShape = targetShapesGroup.children[levelCounter];
		currentWinShape = winShapesGroup.children[levelCounter];
		currentTempShape = currentBasicShape.clone();

		// create dots
		for (var i=0; i<currentBasicShape.segments.length; i++)
		{
			var dot = new Dot(currentBasicShape.segments[i].point);
			dot.show();
			dots.push(dot);
		}

		// create targets
		for (var i=0; i<currentTargetShape.segments.length; i++)
		{
			var target = new Target(currentTargetShape.segments[i].point);
			targets.push(target);

		}
	}	

	function winLevel()
	{
		gamePlaying = false;

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

		// positions arr
		var positionArr = [];
		for (var i=0; i<currentTempShape.segments.length; i++)
		{
			var targetIndex = indexArr[i],
				p1 = currentTempShape.segments[i].point,
				p2 = currentTargetShape.segments[targetIndex].point;
			positionArr.push([p1, p2]);
		}

		// remove helpers
		for (var i=0; i<dots.length; i++)
		{
			var dot = dots[i],
				target = targets[i];
			dot.remove();
			target.remove();
		}
		currentBasicShape.visible = false;
		currentTargetShape.visible = false;

		// reset variables
		dots = [];
		targets = [];
		dotTouchIds = {};
		targetTouchIds = {};


		App.Anim.add({
			duration : App.config.delays.morphTarget,
			easing   : App.config.easings.morphTarget,
			action   : function(time)
			{
				for (var i=0; i<currentTempShape.segments.length; i++)
				{
					var p1 = positionArr[i][0],
						p2 = positionArr[i][1],
						p = App.rampPoints(p1, p2, time);
					currentTempShape.segments[i].point = p;
				}
			},
			callback: function()
			{
				// morph to win
				App.morphItems(currentTempShape, currentWinShape, function()
				{
					currentWinShape.visible = true;
					currentTempShape.remove();
					gamePlaying = true;
					nextLevel();
				});
			}
		});
	}

	function nextLevel()
	{
		// check if there is a next shape
		if (levelCounter < winShapesGroup.children.length-1)
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

		App.animateWinGroup(winShapesGroup, function()
		{
			setFreeMode();
		});
	}

	function setFreeMode()
	{
		var model = basicShapesGroup.lastChild;

		selectionShape = new SelectionShape(model);
		selectionShape.show(function(){
			selectionShape.select(function(){
				gamePlaying = true;
			})
		})
	}







	// 
	// shape creation
	// 

	function createShapesGroup()
	{
		var group = new paper.Group(),
			bounds = paper.view.bounds,
			center = bounds.center
			;

		// lines
		// normal
		var line1 = new paper.Path.Line(center, center.add(normalLineLength, 0)).rotate(lineAngle);
		App.setStyle(line1, App.config.styles.strokeDestination);
		line1.position = center

		// rotated
		var line2 = line1.clone().rotate(90);

		// scaled up
		var line3 = line1.clone().scale(maxScale);

		// scaled down
		var line4 = line1.clone().scale(minScale);


		// triangles
		// normal
		var p1 = new paper.Point(normalLineLength,0),
			p2 = p1.clone().rotate(-60),
			triangle1 = new paper.Path([0,0], p1, p2);
		App.setStyle(triangle1, targetShapeStyle);
		triangle1.position = center;
		triangle1.closed = true;

		// rotated
		var triangle2 = triangle1.clone().rotate(180);

		// scaled up
		var triangle3 = triangle1.clone().scale(maxScale);

		// scaled down
		var triangle4 = triangle1.clone().scale(minScale);


		// square
		// normal
		var p1 = new paper.Point(normalLineLength,0),
			p2 = new paper.Point(normalLineLength,normalLineLength),
			p3 = new paper.Point(0,normalLineLength),
			square1 = new paper.Path([0,0], p1, p2, p3);
		App.setStyle(square1, targetShapeStyle);
		square1.position = center;
		square1.closed = true;

		// rotated
		var square2 = square1.clone().rotate(45);

		// scaled up
		var square3 = square1.clone().scale(maxScale);

		// scaled down
		var square4 = square1.clone().scale(minScale);


		group.addChildren([line1, line2, line3, line4, triangle1, triangle2, triangle3, triangle4, square1, square2, square3, square4]);
		return group;
	}

	function createBasicShapesGroup()
	{
		var group = new paper.Group(),
			nbr = targetShapesGroup.children.length / incrementStep
			;

		for (var i=0; i<nbr; i++)
		{
			var index = i * incrementStep,
				shape = targetShapesGroup.children[index].clone();

			// tweak
			var style = i == 0 ? App.config.styles.stroke : basicShapeStyle;
			App.setStyle(shape, style);
			group.appendTop(shape);
		}

		return group;
	}

	function createWinShapesGroup()
	{
		var group = new paper.Group()
			;

		for (var i=0; i<targetShapesGroup.children.length; i++)
		{
			var shape = targetShapesGroup.children[i].clone();

			// tweak
			var style = i<4 ? App.config.styles.strokeWin : winShapeStyle;

			App.setStyle(shape, style);

			group.appendTop(shape);
		}

		return group;
	}






	function positionShapes()
	{
		var viewBounds = paper.view.bounds;

		// win shapes
		App.positionWinGroup(winShapesGroup);

		// shapes
		var totalW = targetShapesGroup.bounds.width + basicShapesGroup.bounds.width,
			totalMargin = totalW > viewBounds.width ? 0 : viewBounds.width - totalW,
			margin = Math.min(totalMargin / 3, maxMargin)
			;

		// first center all shapes
		for (var i=0; i<targetShapesGroup.children.length; i++)
		{
			var shape = targetShapesGroup.children[i];
			shape.position = viewBounds.center;
		}
		shapesGroup.position = viewBounds.center;

		// then offset first of each series
		for (var i=0; i<basicShapesGroup.children.length; i++)
		{
			var shape = targetShapesGroup.children[i * incrementStep];
			shape.translate(-normalLineLength*.45);
		}
	}

	function hideShapes()
	{
		// basic
		for (var i=0; i<basicShapesGroup.children.length; i++)
		{
			basicShapesGroup.children[i].visible = false;
		}

		// target & win
		for (var i=0; i<targetShapesGroup.children.length; i++)
		{
			targetShapesGroup.children[i].visible = false;
			winShapesGroup.children[i].visible = false;
		}
	}












	// 
	// Classes
	// 

	function SelectionShape(model)
	{
		// params
		var normalStyle = App.config.styles.filled,
			selectedStyle = App.config.styles.selected,

			minScale = .3,
			maxScale = 2,

			delaySelect = App.config.delays.select,
			holdDelay = 0
			;

		var _t = this,
			path,
			animShow,
			animSelect,

			touches,
			selected,
			dragging,
			freeMode
			;

		function init()
		{
			animShow   = null;
			animSelect = null;
			dragging = null;
			touches    = {};
			selected = false;
			freeMode = true;

			path = model.clone();
			App.setStyle(path, normalStyle);
			path.applyMatrix = false;
			path.visible = false;

			_t.path = path;

			console.log('//',path)
		}

		_t.show = function(callback)
		{
			if (animShow)
				App.Anim.removeAnimation(animShow);
			path.visible = true;
			animShow = App.Anim.add({
				duration: 800,
				easing: 'easeOutQuad',
				action: function(time)
				{
					path.scaling = time
				},
				callback: function()
				{
					animShow = null;
					if (typeof(callback) === 'function')
						callback();
				}
			})
		}

		_t.select = function(callback)
		{
			selected = _t;
			
			App.removeAnimation(animSelect);

			animSelect = App.animateSelection(path, callback);
		}

		_t.unSelect = function(callback)
		{
			selected = false;
			
			App.removeAnimation(animSelect);

			animSelect = App.animateDeselection(path, callback);
		}

		_t.hitTest = function(point)
		{
			return path.contains(point);
		}

		_t.getPath = function()
		{
			return path;
		}

		function cancelAnims()
		{
			if (animShow)
				App.Anim.removeAnimation(animShow);
			if (animSelect)
				App.Anim.removeAnimation(animSelect);
		}

		// 
			// interactions
			// 

		_t.onCursorDown = function(e)
		{
			if (countTouches() == 1)
				{
				// hitTest stickers
				var sticker = _t;

				if (sticker.hitTest(e.point))
				{
					// if sticker is already selected, drag it
					if (selected == sticker)
					{
						dragging = ['sticker',sticker];
						return;
					}
					else if (!selected)
					{
						selected = sticker;
						sticker.select();
						dragging = ['sticker',sticker];
						return;
					}
				}

				// if click outside, maybe trying to deselect
				if (selected && freeMode)
				{
					dragging = ['deselection',e.point];
				}
			}

			// 2 touches
			else
			{
				if (dragging && dragging[0] == 'deselection')
				{
					dragging = null;
				}
			}
		}







		t.onCursorMove = function(e)
		{

			if (!gamePlaying || countTouches() > 2)
				return;

			if (countTouches() == 1 && dragging)
			{
				var dragType   = dragging[0],
					dragTarget = dragging[1];

				if (dragType == 'sticker')
				{
					_t.path.translate(e.delta);
				}
			}

			// multi touch case
			else if (countTouches() == 2 && selected && getTouchIndex(e) == 1)
			{
				
				var deltas = getDeltas(),
					dT = deltas[0],
					dS = deltas[1],
					dR = deltas[2];

				var path = selected.path;

				path.translate(dT); 
				path.rotate(dR);

				var scaleInc = dS / path.bounds.bottomLeft.getDistance(path.bounds.topRight),
					newScale = path.scaling.x + scaleInc;


				if (minScale < newScale && newScale < maxScale)
				{
					path.scaling = newScale;
				}
			}
		}







		t.onCursorUp = function(e)
		{
			if (!gamePlaying || countTouches() > 2)
				return;

			if (countTouches() == 0)
			{
				if (dragging)
				{
					var dragType = dragging[0],
						dragTarget = dragging[1];

					if (dragType == 'selection')
					{
						App.endAnimation(dragging[2]);
					}

					else if (dragType == 'deselection')
					{
						var d = new paper.Point(dragTarget).getDistance(e.point);
						if (d < App.config.tapDistance)
						{
							selected.unSelect();
							selected = null;
						}
					}

					dragging = null;
				}
			}
		}

		// 
		// local cursor gestion
		// 

		function getDeltas()
		{
			var touch0 = getTouch(0),
				touch1 = getTouch(1);


			if (!touch0 || !touch1)
				return null;

			var prevVector = new paper.Point(touch1.lastPoint).subtract(touch0.lastPoint),
				actualVector = new paper.Point(touch1.point).subtract(touch0.point),
				prevMidPoint = App.rampPoints(touch1.lastPoint, touch0.lastPoint, .5),
				actualMidPoint = App.rampPoints(touch1.point, touch0.point, .5);

			var deltaTranslation = actualMidPoint.subtract(prevMidPoint),
				deltaLength = actualVector.length - prevVector.length,
				deltaRotation = prevVector.getDirectedAngle(actualVector);

			return [
				deltaTranslation,
				deltaLength,
				deltaRotation
			];
		}

		function getTouch(i)
		{
			var counter = 0;
			for (var k in App.touches)
			{
				if (counter == i)
				{
					return App.touches[k];
				}
				counter++;
			}
			return null;
		}

		function getTouchIndex(e)
		{
			var counter = 0;
			for (var k in App.touches)
			{
				if (k == e.id)
				{
					return counter;
				}
				counter++;
			}
			return null;
		}

		function countTouches()
		{
			var counter = 0;
			for (var k in App.touches)
			{
				counter++;
			}
			return counter;
		}

		function countAppTouches()
		{
			var counter = 0;
			for (var k in App.touches)
			{
				counter++;
			}
			return counter;
		}

		function printTouches()
		{
			var str = countTouches() + ' touches : ';
			for (var k in touches)
			{
				str += ' | ' + k;
			};
			return str;
		}

		init();
	}
});
