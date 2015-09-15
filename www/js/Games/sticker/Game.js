App.Games.add('sticker', new function()
{
	// parametters
	var keyboardHeight    = .2,

		minSize       = 30,
		maxSize       = 500,

		keyboardPadding = .1,
		keyboardMargin  = .05,
		keyboardStyle   = App.config.styles.keyboard,
		buttonMargin = .3,

		buttonStyle = App.extend(App.config.styles.filled,{
			fillColor: App.config.colors.machine,
			strokeColor: App.config.colors.machine
		}),

		stickerPathStyle = App.extend(App.config.styles.filled,{
			blendMode: 'normal'
		}),
		stickerSelectedStyle = App.config.styles.selected,

		targetStyle = App.extend(App.config.styles.filledDestination, {
			strokeWidth : App.config.styles.selected.strokeWidth,
			strokeColor : App.config.colors.user,
			blendMode: 'screen'
		}),
		targetHoverStyle = App.extend(targetStyle,{
			fillColor: App.config.colors.user,
			strokeColor: App.config.colors.machine,
			blendMode: 'multiply'
		}),
		targetUnHoverStyle = targetStyle,
		capturedStyle = App.extend(targetHoverStyle, {
			opacity: 1
		}),

		ghostStyle = targetHoverStyle,

		winStyle = App.config.styles.filledWin,

		holdDelay = 200,

		captureMedDistance = App.config.dotWidth
		;

	// local variables
	var t = this,

		// paper elements
		keyboardGroup,
		keyboardBackground,
		stickersGroup,
		buttonsGroup,

		targetsGroup,
		winGroup,
		capturedGroup,

		currentTarget,
		currentWin,
		currentSticker,

		// arrays
		buttons,
		stickers,
		touches,

		levelCounter,

		buttonsAnimIds,

		dragging,
		selected,
		hoverTarget,

		gamePlaying,
		freeMode,

		raster
		;

	// global methods
	t.init = function()
	{
		// init variables
		buttons        = [];
		stickers       = [];
		touches        = {};
		buttonsAnimIds = [];
		dragging       = null;
		selected       = null;
		hoverTarget    = null;
		gamePlaying    = false;
		freeMode       = false;
		levelCounter   = 0;
		currentTarget  = null;
		currentWin     = null;
		currentSticker = null;
		raster         = null;
		minScale       = null;
		maxScale       = null;

		// create keyboard group
		capturedGroup = new paper.Group();
		capturedGroup.name = 'capturedGroup';


		keyboardGroup = createKeyboardGroup();

		buttonsGroup = createButtonsGroup();

		positionButtons();


		targetsGroup = createTargetsGroup();
		winGroup = createWinGroup();

		stickersGroup = new paper.Group();
		stickersGroup.name = 'stickersGroup';

		paper.project.activeLayer.appendTop(targetsGroup);

		positionItems();

		hideItems();
	}

	t.start = function()
	{
		// tweak
		// levelCounter = targetsGroup.children.length-1;
		// fakeStart(levelCounter);
		// winGame();
		// winGroup.visible = false;

		startLevel();



		// fakeTouch(paper.view.center);
	}

	function fakeStart(nbr)
	{
		for (var i=0; i<nbr; i++)
		{
			targetsGroup.firstChild.remove();
			winGroup.children[i].visible = true;
		}
		console.log(winGroup)
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
		if (!gamePlaying || countTouches() > 1)
			return;

		if (countTouches() == 1)
			{
			// hitTest buttons
			for (var i=0; i<buttons.length; i++)
			{
				var button = buttons[i];
				if (button.hitTest(e.point))
				{
					// cancel previous anim
					var index = button.index;
					if (buttonsAnimIds[index])
					{
						App.Anim.removeAnimation(buttonsAnimIds[index]);
						buttonsAnimIds[index] = null;
					}

					dragging = ['button', button, e.point];
					return;
				}
			}

			// hitTest stickers
			for (var i = stickersGroup.children.length-1; i>=0; i--)
			{
				var path = stickersGroup.children[i],
					sticker = path.data.obj;

				if (path.data.removing || path.data.creating)
					continue;

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
						console.log(sticker)
						return;
					}
					else
					{
						// set holding anim to select this element if any other finder interacts
						var animId = App.Anim.add({
							duration: holdDelay,
							callback: function()
							{
								selected.unSelect();
								sticker.select();
								selected = sticker;
								dragging = ['sticker',sticker];
							}
						})
						dragging = ['selection',sticker, animId];
						return;
					}
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

			// drag button until clone limit then get button back and create new sticker
			if (dragType == 'button')
			{
				var path = dragTarget.path;

				if (!keyboardHover(path.bounds.bottomCenter))
				{
					if (!freeMode)
					{
						clearStickers();
					}

					var sticker = new Sticker(dragTarget.path, stickers.length, dragTarget.index);
					sticker.select();
					stickers.push(sticker);

					// if previous selection, replace it
					if (selected)
					{
						selected.unSelect();
					}
					selected = sticker;
					dragging = ['sticker',sticker];

					sendButtonBack(dragTarget);
				}
				else
				{
					path.translate(e.delta);
				}
			}

			else if (dragType == 'sticker')
			{
				var path = dragTarget.path;
				path.translate(e.delta);

				// check keyboard hover
				if (keyboardHover(path.bounds.bottomCenter))
				{
					dragTarget.hover();
				}
				else
				{
					dragTarget.unHover();
				}
			}
		}

		// multi touch case
		else if (countTouches() == 2 && selected && getTouchIndex(e) == 1)
		{
			
			// cancel current selection
			if (dragging && dragging[0] == 'selection')
			{
				App.removeAnimation(dragging[2]);
				dragging = null;
			}

			var deltas = getDeltas(),
				dT = deltas[0],
				dS = deltas[1],
				dR = deltas[2];


			var path = selected.path;

			path.translate(dT); 
			path.rotate(dR);

			var scaleInc = dS / path.bounds.bottomLeft.getDistance(path.bounds.topRight),
				newScale = 1 + scaleInc,
				newW = path.bounds.width * newScale,
				newH = path.bounds.height * newScale;

			if (Math.min(newW, newH) > minSize && Math.max(newW, newH) < maxSize)
			{
				path.scaling = newScale;
			}

			// check keyboard hover
			if (keyboardHover(path.bounds.bottomCenter))
			{
				selected.hover();
			}
			else
			{
				selected.unHover();
			}
		}



		// check target
		if (!freeMode && currentTarget && ((countTouches() == 1 && dragging && dragging[0] == 'sticker') 
			|| (countTouches() == 2 && selected && getTouchIndex(e) == 1)))
		{
			var closestTarget, minD;
			for (var i=0; i<currentTarget.children.length; i++)
			{
				var target = currentTarget.children[i],
					targetDistance = hitTestTarget(target, selected.path);
				if (targetDistance)
				{
					if (!minD || targetDistance < minD)
					{
						closestTarget = target;
						minD = targetDistance;
					}
				}
			}

			if (closestTarget && closestTarget != hoverTarget)
			{
				if (hoverTarget)
					hideHoverOnTarget(hoverTarget);
				showHoverOnTarget(closestTarget);
				hoverTarget = closestTarget;
			}
			else if (!closestTarget && hoverTarget)
			{
				hideHoverOnTarget(hoverTarget);
				hoverTarget = null;
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

				if (dragType == 'button')
				{
					// check tap
					var d = new paper.Point(e.point).getDistance(dragging[2]);
					if (d < App.config.tapDistance)
					{
						tap(dragTarget, function(sticker){
							// check selected
							if (selected)
							{
								selected.unSelect();
							}

							if (!freeMode)
							{
								clearStickers(sticker);
							}

							selected = sticker;
							sticker.select();
						});
					}

					sendButtonBack(dragTarget);
				}

				else if (dragType == 'sticker')
				{
					// check keyboard hover
					if (keyboardHover(dragTarget.path.bounds.bottomCenter))
					{
						removeSticker(dragTarget);
						selected = null;

						if (hoverTarget)
						{
							hideHoverOnTarget(hoverTarget);
							hoverTarget = null;
						}
					}
				}

				// if trying to select a new element
				else if (dragType == 'selection')
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

						if (hoverTarget)
						{
							hideHoverOnTarget(hoverTarget);
							hoverTarget = null;
						}
					}
				}

				dragging = null;
			}

			// check keyboard hover
			else if (selected)
			{
				if (keyboardHover(selected.path.bounds.bottomCenter))
				{
					removeSticker(selected);
					selected = null;
				}
			}	

			// check target
			if (hoverTarget)
			{
				var target = hoverTarget,
					sticker = selected;

				// sticker.unSelect(App.config.colors.game);
				App.setStyle(sticker.path, capturedStyle);
				capturedGroup.appendTop(target);
				capturedGroup.appendTop(sticker.path);
				selected = null;
				hoverTarget = null;
				morph(target, sticker, function(){
					sticker.remove();
					App.setStyle(target, capturedStyle);

					// check win
					if (currentTarget.children.length == 0)
					{
						winLevel();
					}
				});
			}
		}

		// was 2 touches
		else
		{
			
		}
	}


	t.onResize = function()
	{
		// positionButtons();
	}






	// 
	// local methods
	// 

	// 
	// game scenario
	// 

	function startLevel()
	{
		currentTarget = targetsGroup.children[0];
		currentWin = winGroup.children[levelCounter];

		// console.log('startLevel',levelCounter,currentTarget.name);

		for (var i=0; i<currentTarget.children.length; i++)
		{
			currentTarget.children[i].opacity = 0;
		}
		currentTarget.visible = true;

		var o1 = 0,
			o2 = targetStyle.opacity;

		App.Anim.add({
			duration: App.config.delays.show,
			easing: App.config.easings.show,
			action: function(time)
			{
				var o = App.ramp(o1,o2,time);
				// App.log(o);
				for (var i=0; i<currentTarget.children.length; i++)
				{
					currentTarget.children[i].opacity = o;
				}
			},
			callback: function()
			{
				gamePlaying = true;
			}
		})
		
		// currentWin.visible = true;
	}

	function winLevel()
	{
		gamePlaying = false;

		currentTarget.remove();

		clearStickers();

		App.setStyle(capturedGroup, capturedStyle);

		App.morphItems(capturedGroup, currentWin, function(){

			currentWin.visible = true;

			saveBackground();

			capturedGroup.removeChildren();
			capturedGroup.opacity = 1;

			nextLevel();
		});
	}

	function nextLevel()
	{
		if (targetsGroup.children.length > 0)
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
		if (raster)
			raster.remove();

		winGroup.visible = true;

		// return
		App.animateWinGroup(winGroup, function(){
			// console.log('Win Game !!');

			App.saveBackground(winGroup);

			freeMode = true;
			gamePlaying = true;
		})
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






	function keyboardHover(point)
	{
		return point.y > keyboardBackground.bounds.top;
	}





	// 
	// hitTest
	// 

	function hitTestTarget(target, item)
	{
		// check type of shape
		var shapeIndex = target.data.id;
		if (shapeIndex != item.data.id)
			return null;

		var med;
		if (shapeIndex <= 2)
		{
			var boundsArr = ['topLeft','topRight','bottomLeft','bottomRight'];

			med = 0;
			for (var i=0; i<boundsArr.length; i++)
			{
				var bound = boundsArr[i],
					p1 = target.bounds[bound],
					p2 = item.bounds[bound],
					d = p1.getDistance(p2);
				med += d;
			}
			med /= boundsArr.length;
		}
		else
		{
			med = 0;
			for (var i=0; i<target.segments.length; i++)
			{
				var p1 = target.segments[i].point,
					p2 = item.segments[i].point,
					d = p1.getDistance(p2);
				med += d;
			}
			med /= target.segments.length;
		}

		if (med != null && med < captureMedDistance)
		{
			return med;
		}
		return null;
	}





	// 
	// items creation
	// 

	function createButtonsGroup()
	{
		// create buttons
		var paths = [],
			group = new paper.Group();
		group.name = 'buttonsGroup';

		paths[0] = new paper.Path.Rectangle([0,0], 1);

		paths[1] = new paper.Path.Circle([0,0], .5);

		// paths[2] = new paper.Path.RegularPolygon([0,0], 3, 1);
		paths[4] = paths[0].clone();
		paths[4].removeSegments(1,2);
		paths[4].rotate(-45);

		paths[2] = paths[0].clone().scale(.5,1);

		paths[3] = paths[1].clone();
		paths[3].removeSegments(0,1);
		paths[3].firstSegment.handleIn = null;
		paths[3].lastSegment.handleOut = null;
		
		for (var i=0; i<paths.length; i++)
		{
			var button = new Button(paths[i], i);
			buttons.push(button);
			buttonsAnimIds[i] = null;
			group.appendTop(button.path);
		}

		return group;
	}

	function createKeyboardGroup()
	{
		var group = new paper.Group();

		keyboardBackground = t.background.clone();
		App.setStyle(keyboardBackground, keyboardStyle);
		keyboardBackground.pivot = keyboardBackground.bounds.bottomCenter;
		group.appendTop(keyboardBackground);

		return group;
	}

	function createTargetsGroup()
	{
		var group = new paper.Group();
		group.name = 'targetsGroup';

		var square = buttonsGroup.children[0],
			circle = buttonsGroup.children[1],
			rect = buttonsGroup.children[2],
			halfCircle = buttonsGroup.children[3],
			triangle = buttonsGroup.children[4],

			center = paper.view.bounds.center
			;


		// lines params
		var linesItemsNbr = 3,
			alternanceArr = [square, rect],
			margin        = square.bounds.width *.5,
			rotationItem  = halfCircle,
			rotationInc   = 90,
			scaleItem     = triangle,
			scaleInc      = .5,

			offset = 0
			;

		// alternance
		var alternanceLine = new paper.Group();
		alternanceLine.name = 'alternanceLine';

		for (var i=0; i<linesItemsNbr; i++)
		{
			var index = i % alternanceArr.length,
				model = alternanceArr[index],
				item = model.clone(),
				w = item.bounds.width;
			alternanceLine.appendTop(item);

			item.position.x = offset + w*.5;
			offset += w + margin;
		}
		alternanceLine.position = center;


		// rotation
		var rotationLine = new paper.Group();
		rotationLine.name = 'rotationLine';

		for (var i=0; i<linesItemsNbr; i++)
		{
			var index = i % alternanceArr.length,
				model = rotationItem,
				item = model.clone();
			rotationLine.appendTop(item);

			item.rotate(i*rotationInc);

			item.position.x = offset + item.bounds.width*.5;
			offset += item.bounds.width + margin;
		}
		rotationLine.position = center;


		// scale
		var scaleLine = new paper.Group();
		scaleLine.name = 'scaleLine';

		for (var i=0; i<linesItemsNbr; i++)
		{
			var index = i % alternanceArr.length,
				model = scaleItem,
				item = model.clone();
			scaleLine.appendTop(item);

			item.scale(.5 + i*scaleInc);

			item.position.x = offset + item.bounds.width*.5;
			offset += item.bounds.width + margin;
		}
		scaleLine.position = center;




		// aglomered shapes

		// square of squares
		var squareOfSquares = new paper.Group(),
			nbr = 2;
		squareOfSquares.name = 'squareOfSquares';

		for (var i=0; i<nbr; i++)
		{
			for (var j=0; j<nbr; j++)
			{
				var item = square.clone();

				item.position = [i*item.bounds.width, j*item.bounds.height];
				squareOfSquares.appendTop(item);
			}
		}
		squareOfSquares.position = center;


		// square with triangles
		var trianglesSquare = new paper.Group();
		trianglesSquare.name = 'trianglesSquare';

		for (var i=0; i<4; i++)
		{
			var item = triangle.clone();
			trianglesSquare.appendTop(item);

			item.rotate(i*90, item.bounds.rightCenter);
		}
		trianglesSquare.position = center;



		// figurative

		// house
		var house = new paper.Group();
		house.name = 'house';

		var _rect = rect.clone(),
			_tr = triangle.clone().scale(1.2);
		house.addChildren([_rect, _tr]);

		_tr.translate(_rect.bounds.rightCenter.subtract(_tr.bounds.leftCenter));

		house.rotate(-90);
		house.position = center;


		// boat
		var boat = new paper.Group();
		boat.name = 'boat';

		var _tr = triangle.clone().scale(2),
			_trL = triangle.clone().rotate(180),
			_trR = triangle.clone().rotate(180);

		boat.addChildren([_tr, _trL, _trR]);

		_trL.translate(_tr.bounds.topLeft.subtract(_trL.bounds.leftCenter));
		_trR.translate(_tr.bounds.bottomLeft.subtract(_trR.bounds.leftCenter));

		boat.rotate(-90);
		boat.position = center;



		// symbolic

		// heart
		var heart = new paper.Group();
		heart.name = 'heart';

		var _sq = square.clone(),
			_hC1 = halfCircle.clone(),
			_hC2 = halfCircle.clone().rotate(-90);
		heart.addChildren([_sq, _hC1, _hC2]);

		_hC1.translate(_sq.bounds.rightCenter.subtract(_hC1.bounds.leftCenter));
		_hC2.translate(_sq.bounds.topCenter.subtract(_hC2.bounds.bottomCenter));

		heart.rotate(-45);
		heart.position = center;



		// leters

		// L
		var letterL = new paper.Group();
		letterL.name = 'letterL';

		var _r1 = rect.clone(),
			_r2 = rect.clone(),
			_r3 = rect.clone().rotate(90);
		letterL.addChildren([_r1, _r2, _r3]);

		align(_r2, 'topCenter', _r1, 'bottomCenter');
		align(_r3, 'bottomLeft', _r2, 'bottomRight');

		letterL.position = center;


		// E
		var letterE = new paper.Group();
		letterE.name = 'letterE';

		var _r1 = rect.clone(),
			_r2 = rect.clone(),
			_r3 = rect.clone().rotate(90),
			_r4 = rect.clone().rotate(90),
			_sq = square.clone().scale(.5);
		letterE.addChildren([_r1, _r2, _r3, _r4, _sq]);

		align(_r2, 'topCenter', _r1, 'bottomCenter');
		align(_r3, 'bottomLeft', _r2, 'bottomRight');
		align(_r4, 'topLeft', _r1, 'topRight');
		align(_sq, 'leftCenter', _r1, 'bottomRight');

		letterE.position = center;


		// S
		var letterS = new paper.Group();
		letterS.name = 'letterS';

		var _r1 = rect.clone().rotate(90),
			_r2 = rect.clone().rotate(90),
			_sq = square.clone().scale(.5),
			_hC1 = halfCircle.clone().scale(1.25),
			_hC2 = halfCircle.clone().scale(1.25).rotate(180);
		letterS.addChildren([_r1, _r2, _sq, _hC1, _hC2]);

		align(_hC1, 'topLeft', _sq, 'topRight');
		align(_hC2, 'bottomRight', _sq, 'bottomLeft');
		align(_r1, 'bottomRight', _hC1, 'bottomLeft');
		align(_r2, 'topLeft', _hC2, 'topRight');

		letterS.position = center;




		group.addChildren([alternanceLine, rotationLine, scaleLine, squareOfSquares, trianglesSquare, house, boat, heart, letterL, letterE, letterS]);

		for (var i=0; i<group.children.length; i++)
		{
			App.setChildrenStyle(group.children[i], targetStyle);
			// App.setChildrenStyle(group.children[i], targetStyle);
		}
		return group;
	}

	function align(item1, bound1, item2, bound2)
	{
		item1.translate(item2.bounds[bound2].subtract(item1.bounds[bound1]));
	}

	function createWinGroup()
	{
		var group = targetsGroup.clone();
		group.name = 'winGroup';

		// remove overlap
		for (var i=0; i<group.children.length; i++)
		{
			var child = group.children[i];
			for (var j=0; j<child.children.length; j++)
			{
				var _child = child.children[j];
				_child.opacity = 1;
				_child.blendMode = 'normal';
			}

			App.setStyle(child, winStyle);
		}

		return group;
	}









	// other local methods


	// 
	// items position
	// 

	function positionButtons()
	{
		var viewBounds = App.appProject.view.bounds;

		// background
		keyboardBackground.bounds = viewBounds;
		keyboardBackground.bounds.height = keyboardHeight * viewBounds.height;
		keyboardBackground.position = viewBounds.bottomCenter;

		var keyboardBounds = keyboardBackground.bounds;

		// resize items
		var l = buttonsGroup.children.length,
			size = Math.min(keyboardBounds.height * (1 - keyboardPadding*2), (keyboardBounds.width * (1 - keyboardMargin * l)) / l),
			rect = new paper.Path.Rectangle([0,0], [size, size]);

		for (var i=0; i<l; i++)
		{
			var button = buttonsGroup.children[i];
			button.fitBounds(rect.bounds);
		}
		rect.remove();

		// calculate total width
		var totalW = 0;
		for (var i=0; i<buttonsGroup.children.length; i++)
		{
			var button = buttonsGroup.children[i];
			totalW += button.bounds.width;
		}
		var totalMargin = keyboardBounds.width - totalW,
			margin = totalMargin / (l + 1);

		// position buttons
		var offset = margin;
		for (var i=0; i<buttonsGroup.children.length; i++)
		{
			var button = buttonsGroup.children[i],
				w = button.bounds.width;
			button.position.x = offset + w*.5;
			offset += w + margin;
		}

		// recheck keyboard height
		var realPadding = (keyboardBounds.height - buttonsGroup.bounds.height) / (keyboardBounds.height * 2),
			delta = realPadding - keyboardPadding;
		if (delta > 0)
		{
			keyboardBackground.scale(1,(1 - delta*2));
		}

		buttonsGroup.position = keyboardBackground.bounds.center;

		// store positions
		for (var i=0; i<buttonsGroup.children.length; i++)
		{
			var button = buttonsGroup.children[i];
			button.data.position = button.position;
		}
	}

	function positionItems()
	{
		// win
		App.positionWinGroup(winGroup);

		var viewBounds = paper.view.bounds,
			targetRect = new paper.Path.Rectangle(viewBounds.topLeft, keyboardBackground.bounds.topRight.subtract(0, winGroup.bounds.height)),
			targetBounds = targetRect.bounds,
			center = viewBounds.center
			;

		targetRect.remove();

		// targets
		for (var i=0; i<targetsGroup.children.length; i++)
		{
			targetsGroup.children[i].position = targetBounds.center;
		}
		targetsGroup.position = targetBounds.center;


		// offset over keyboars
		winGroup.translate(0, -keyboardBackground.bounds.height);
	}

	function hideItems()
	{
		for (var i=0; i<targetsGroup.children.length; i++)
		{
			targetsGroup.children[i].visible = false;
			winGroup.children[i].visible = false;
		}
	}



	// 
	// items animation
	// 

	function sendButtonBack(button)
	{
		var path = button.path,
			index = button.index,
			p1    = path.position,
			p2    = path.data.position;

		buttonsAnimIds[index] = App.Anim.add({
			duration: 500,
			easing: 'easeInQuad',
			action: function(_t)
			{
				path.position = App.rampPoints(p1, p2, _t);
			},
			callback: function()
			{
				buttonsAnimIds[index] = null;
			}
		});
	}

	function tap(button, callback)
	{
		var sticker = new Sticker(button.path, stickers.length, button.index);
		App.setStyle(sticker.path, ghostStyle);
		sticker.path.data.creating = true;
		stickers.push(sticker);

		var ghost = sticker.path.clone();
		App.setStyle(ghost, ghostStyle);

		var marginV = sticker.path.bounds.center.subtract(sticker.path.bounds.topLeft),
			rdmRect = new paper.Path.Rectangle(paper.view.bounds.topLeft.add(marginV), keyboardBackground.bounds.topRight.subtract(0,winGroup.bounds.height).subtract(marginV)),
			rdmBounds = rdmRect.bounds,
			rdmP = App.randomPointInBounds(rdmBounds);

		rdmRect.remove();
		sticker.path.position = rdmP;

		// animate ghost
		var p1 = ghost.position,
			p2 = sticker.path.position,
			d = p1.getDistance(p2),
			delay = Math.min(App.config.speeds.tap * d, App.config.delays.tap);

		App.Anim.add({
			duration: delay,
			action: function(time)
			{
				ghost.position = App.rampPoints(p1,p2,time);
			},
			callback: function()
			{
				ghost.remove();
				App.setStyle(sticker.path, stickerPathStyle);
				delete sticker.path.data.creating;
				App.callback(callback, sticker);
			}
		})
	}


	function showHoverOnTarget(target)
	{
		App.setStyle(target, targetHoverStyle);
	}

	function hideHoverOnTarget(target)
	{
		App.setStyle(target, targetUnHoverStyle);
	}


	function morph(target, sticker, callback)
	{
		var path       = sticker.path,
			shapeIndex = path.data.id;

		var v2 = target.segments[1].point.subtract(target.segments[0].point),
			v1 = path.segments[1].point.subtract(path.segments[0].point),
			angle = v1.getDirectedAngle(v2),
			scale = v2.length / v1.length
			;

		if (shapeIndex == 0)
		{
			angle = reduceAngle(angle, 90);
		}
		else if (shapeIndex == 1)
		{
			angle = 0;
		}
		else
		{
			angle = reduceAngle(angle, 180);
		}


		var r1 = path.rotation,
			r2 = path.rotation + angle,
			s1 = path.scaling.x,
			s2 = scale,
			p1 = path.position,
			p2 = target.position,
			d = p1.getDistance(p2);

		var maxDelay = App.config.delays.capture,
			speed = App.config.speeds.capture;

		// set anim
		App.Anim.add({
			duration: Math.max(d * speed, maxDelay),
			init: function()
			{
				path.applyMatrix = false;
			},
			action: function(time)
			{
				var r = App.ramp(r1,r2,time),
					s = App.ramp(s1,s2,time),
					p = App.rampPoints(p1,p2,time);
				path.rotation = r;
				path.scaling = s;
				path.position = p;
			},
			callback: function()
			{
				App.callback(callback);
			}
		})
	}

	function clearStickers(exception)
	{
		for (var i=0; i<stickersGroup.children.length; i++)
		{
			var path = stickersGroup.children[i],
				sticker = path.data.obj;

			if (sticker == exception || path.data.creating)
				continue;

			path.data.removing = true;
			removeSticker(sticker)
		}
	}

	function removeSticker(sticker)
	{
		var item = sticker.path;
		App.hideItem(item, {
			callback: function()
			{
				item.remove();
			}
		})
	}





	// 
	// misc
	// 

	function fakeTouch(point)
	{
		addTouch({
			point: point
		})
	}

	function reduceAngle(angle, nbr)
	{
		angle %= nbr;
		var absAngle = Math.abs(angle);

		if (Math.abs(angle + nbr) < absAngle)
			angle = angle + nbr;
		else if (Math.abs(angle - nbr) < absAngle)
			angle = angle - nbr;

		return angle;
	}

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



	// 
	// local Class
	// 

	// 
	// Sticker Class
	// 

	function Sticker(path, index, buttonIndex)
	{
		// local variables
		var _t = this,
			animSelect;

		function init()
		{
			// init
			animSelect = null;

			_t.path = path.clone();
			App.setStyle(_t.path, stickerPathStyle);
			stickersGroup.appendTop(_t.path);

			// _t.path.applyMatrix = false;
			
			_t.path.data.obj = _t;
			_t.path.data.id = buttonIndex;
			_t.index = buttonIndex;

			// _t.select();
		}

		_t.select = function()
		{
			App.removeAnimation(animSelect);

			stickersGroup.appendTop(_t.path);

			animSelect = App.animateSelection(_t.path);
		}

		_t.unSelect = function(color)
		{
			App.removeAnimation(animSelect);

			animSelect = App.animateDeselection(_t.path, null, color);
		}


		_t.hover = function()
		{
			_t.path.opacity = .5;
		}

		_t.unHover = function()
		{
			_t.path.opacity = 1;
		}


		_t.remove = function()
		{
			_t.path.remove();
			stickers.splice(index, 1);
		}


		_t.hitTest = function(point)
		{
			var hitTest = _t.path.hitTest(point);
			return hitTest;
		}

		init();
	}


	// 
	// Button Class
	// 

	function Button(path, index)
	{
		// local variables
		var _t = this;

		function init()
		{
			// init
			_t.index = index;

			_t.path = path;
			App.setStyle(path, buttonStyle);

			_t.path.data.id = index;
		}

		// global methods
		_t.hitTest = function(point)
		{
			return path.contains(point);
		}

		init();
	}
});