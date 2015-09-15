App.Games.add('dot', new function()
{
	// params
	var scenarioArr = ['touch', 'tap', 'hold', 'move', 'line', 'keyboard'],

		winDotStyle = App.config.styles.filled,
		keyboardStyle = App.config.styles.keyboard,
		ghostStyle = App.extend(App.config.styles.filledDestination,
		{
			strokeColor: null
		}),
		pathStyle = App.config.styles.stroke,

		holdDelay = 1000,
		minMoveDistance = 100,
		maxTapDistance  = App.config.tapDistance,
		lineLengthCoeff = .4,

		keyboardDotNbr = 4,
		iterationNbr = 2
		;

	// local variables
	var t = this,
		currentScenario,
		dots,
		dotsCounter,
		dotsGroup,

		winGroup,
		currentWin,

		currentDot,
		currentTarget,
		currentPath,

		levelCounter,

		gamePlaying,
		dragging,
		dragIds,

		animReset,

		iterationCounter
		;

	// global methods
	t.init = function()
	{
		gamePlaying      = false;
		dragging         = null;
		levelCounter     = 0;
		dotsCounter      = 0;
		iterationCounter = 0;
		currentScenario  = null;
		dots             = [];
		currentTarget    = null;
		currentWin       = null;
		currentDot       = null;
		animReset        = null;
		dragIds          = {};

		winGroup = createWinGroup();

		dotsGroup = new paper.Group();
		dotsGroup.name = 'dotsGroup';


		positionItems()

		hideItems();
	}

	t.start = function()
	{
		// tweak
		// levelCounter = 0;

		gamePlaying = true;
		startLevel();

		// setFreeMode();
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
		if (!gamePlaying || dragIds[e.id])
			return;

		switch(currentScenario)
		{
			case 'touch':
				if (!isCaptured(currentDot) && currentDot.hitTest(e.point))
				{
					capture(currentDot);
					winDot(currentDot, winLevel);
				}
				break;
			case 'tap':
				if (!isCaptured(currentDot) && currentDot.hitTest(e.point))
				{
					capture(currentDot);
					dragIds[e.id] = true;
				}
				break;
			case 'hold':
				if (!isCaptured(currentDot) && currentDot.hitTest(e.point))
				{
					capture(currentDot);
					// set hold anim
					var animId = App.Anim.add({
						duration: holdDelay,
						init: function()
						{
							currentDot.activate();
						},
						action: function(time)
						{
							currentDot.loadHelper(time);
						},
						callback: function()
						{
							dragIds[e.id] = null;
							winDot(currentDot, winLevel);
						}
					})

					dragIds[e.id] = [e.time, animId];
				}
				break;
			case 'move':
				if (!isCaptured(currentDot) && currentDot.hitTest(e.point))
				{
					capture(currentDot);
					currentDot.activate();
					dragIds[e.id] = true;
				}
				break;
			case 'line':
				currentLine.onCursorDown(e);
				break;
			case 'keyboard':
				if (!isCaptured(currentDot) && currentDot.hitTest(e.point))
				{
					capture(currentDot);
					dragIds[e.id] = 'keyboard';
				}
				else
				{
					for (var i=0; i<dots.length; i++)
					{
						var dot = dots[i];
						if (!isCaptured(dot) && dot.hitTest(e.point))
						{
							dragIds[e.id] = dot;
							dot.getItem().bringToFront();
							dot.activate();
							break;
						}
					}
				}
				break;
			case 'free':
				if (currentPath)
					break;
				currentPath = new paper.Path(e.point);
				currentDot = new Dot(e.point);
				currentDot.show();
				currentDot.activate();
				App.setStyle(currentPath, pathStyle);
				dragIds[e.id] = true;
				break;
		}
	}

	t.onCursorMove = function(e)
	{
		if (!gamePlaying || (!dragIds[e.id] && currentScenario != 'line'))
			return;

		switch(currentScenario)
		{
			case 'tap':
				if (!currentDot.hitTest(e.point))
				{
					dragIds[e.id] = null;
					uncapture(currentDot);
				}
				break;
			case 'hold':
				var time = dragIds[e.id][0],
					animId = dragIds[e.id][1];
				if (!currentDot.hitTest(e.point))
				{
					currentDot.desactivate();
					uncapture(currentDot);
					App.Anim.removeAnimation(animId);
				}
				break;
			case 'move':
				currentDot.translate(e.delta);
				break;
			case 'line':
				currentLine.onCursorMove(e);
				break;
			case 'keyboard':
				if (dragIds[e.id] == 'keyboard')
				{
					currentDot.translate(e.delta);
					var dotPos = currentDot.getPosition();
					if (!currentKeyboard.hitTest(dotPos))
					{
						resetDot(currentDot, currentKeyboard.getItem().bounds.center);
						var clone = createDotClone(currentDot);
						clone.show(false);
						clone.activate();
						capture(clone);

						dotsCounter++;
						dots.push(clone);
						dragIds[e.id] = clone;
					}
				}
				else
				{
					dragIds[e.id].translate(e.delta);
					var dotPos = dragIds[e.id].getPosition();
					if (currentKeyboard.hitTest(dotPos))
					{
						dragIds[e.id].desactivate();
					}
					else
					{
						dragIds[e.id].activate();
					}
				}
				break;
			case 'free':
				currentPath.add(e.point);
				currentDot.position(e.point);
				break;
		}
	}

	t.onCursorUp = function(e)
	{
		if (!gamePlaying || (!dragIds[e.id] && currentScenario != 'line'))
			return;

		switch(currentScenario)
		{
			case 'tap':
				winDot(currentDot, winLevel);
				break;
			case 'hold':
				var animId = dragIds[e.id][1];
				currentDot.desactivate();
				uncapture(currentDot);
				App.Anim.removeAnimation(animId);
				break;
			case 'move':
				var delta = paper.view.center.getDistance(currentDot.getPosition());
				if (delta > minMoveDistance)
				{
					winDot(currentDot, winLevel);
				}
				else
				{
					currentDot.desactivate();
					uncapture(currentDot);
				}
				break;
			case 'line':
				currentLine.onCursorUp(e);
				break;
			case 'keyboard':
				if (dragIds[e.id] == 'keyboard')
				{
					var dotPos = currentDot.getPosition(),
						originalPos = currentDot.getItem().data.position,
						d = dotPos.getDistance(originalPos);
					if (d < maxTapDistance && dotsCounter < keyboardDotNbr)
					{
						dotsCounter++;
						tap(currentDot, function(){
							if (dots.length >= keyboardDotNbr)
							{
								winKeyboard(dots, winLevel);
							}
						});
					}
					resetDot(currentDot, currentKeyboard.getItem().bounds.center);
				}
				else
				{
					var dotPos = dragIds[e.id].getPosition();
					if (currentKeyboard.hitTest(dotPos))
					{
						removeDot(dragIds[e.id]);
						dotsCounter--;
					}
					else
					{
						dragIds[e.id].desactivate();
						if (dots.length >= keyboardDotNbr)
						{
							winKeyboard(dots, winLevel);
						}
						else
						{
							uncapture(dragIds[e.id]);
						}
					}
				}
				break;
			case 'free':
				// currentPath.simplify();
				App.saveBackground(currentPath);
				currentPath = null;
				var dot = currentDot;
				currentDot = null;
				dot.hide(function(){
					dot.remove();
				});
				break;
		}

		dragIds[e.id] = null;
	}

	t.onResize = function()
	{
		
	}


	// 
	// from external objects
	// 

	t.onBrokenLineWin = function(item)
	{
		item.name = 'winItem';
		paper.project.activeLayer.appendTop(item);
		currentLine.remove();
		winLine(item, winLevel);
		// console.log(paper.project.activeLayer.children);
		return;
	}



	// 
	// local methods
	// 

	// 
	// game scenario
	// 

	function startLevel()
	{
		dragIds = {};
		gamePlaying = true;

		currentScenario = scenarioArr[levelCounter];
		currentWin = winGroup.children[levelCounter];

		console.log('starting level',levelCounter,'with',currentScenario)

		currentDot = null;

		switch (currentScenario)
		{
			case 'touch' :
			case 'tap'   :
			case 'move'  :
				currentDot = new Dot(paper.view.center);
				break;
			case 'hold':
				currentDot = new Dot(paper.view.center, {helperScale: 1.2});
				break;
			case 'line':
				var p1 = paper.view.center,
					angle = iterationCounter % 2 == 0 ? -45 : 135,
					l = Math.min(lineLengthCoeff * paper.view.bounds.width, lineLengthCoeff * paper.view.bounds.height)
					p = new paper.Point(l, 0).rotate(angle)
					p2 = p1.add(p);
				currentLine = new BrokenLine([p1,p2], t, {littleDots:null});
				currentLine.show();
				break;
			case 'keyboard':
				currentKeyboard = new Keyboard();
				currentKeyboard.show(true, function(){
					var p = currentKeyboard.getItem().bounds.center;
					currentDot = new Dot(p);
					currentDot.show();
					currentDot.getItem().data.position = p;
				});
				break;
		}

		if (currentDot)
		{
			dotsGroup.appendTop(currentDot.getItem());
			currentDot.show();
		}
	}

	function winLevel()
	{
		nextLevel();
	}

	function nextLevel()
	{
		if (levelCounter < scenarioArr.length-1)
		{
			if (iterationCounter < iterationNbr-1)
			{
				iterationCounter++;
			}
			else
			{
				iterationCounter = 0;
				levelCounter++;
			}
			startLevel();
		}
		else
		{
			winGame();
		}
	}

	function winGame()
	{
		App.animateWinGroup(winGroup, setFreeMode);
	}

	function setFreeMode()
	{
		currentScenario = 'free';
	}



	// 
	// items creation
	// 

	function createWinGroup()
	{
		var group = new paper.Group();
		group.name = 'winGroup';
		for (var i=0; i<scenarioArr.length; i++)
		{
			var scenario = scenarioArr[i],
				item;
			switch(scenario)
			{
				case 'touch' :
				case 'tap'   :
				case 'hold'  :
				case 'move'  :
				case 'keyboard' :
					item = createCircle();
					break;
				case 'line':
					item = createLine();
					break;
			}
			if (item)
			{
				var style = scenario == 'line' ? App.config.styles.strokeWin : App.config.styles.filledWin;

				if (Array.isArray(item))
				{
					for (var j=0; j<item.length; j++)
					{
						App.setStyle(item[j], style);
						group.appendTop(item[j]);
					}
				}
				else
				{
					App.setStyle(item, style);
					group.appendTop(item);
				}
			}
		}
		return group;
	}

	function createCircle()
	{
		return new paper.Path.Circle([0,0], App.config.dotWidth);
	}

	function createLine()
	{
		return new paper.Path.Line([0,0], [App.config.dotWidth * 15,0]).rotate(-45);
	}

	function createDotClone(dot)
	{
		return new Dot(dot.getPosition());
	}




	// 
	// items positionement
	// 

	function positionItems()
	{
		App.positionWinGroup(winGroup);
	}

	function hideItems()
	{
		App.hideAllChildren(winGroup);
	}



	// 
	// items animation
	// 

	function winDot(dot, callback, indexOffset)
	{
		indexOffset = indexOffset || 0;

		dot.desactivate();

		var item = dot.getClone();
		item.applyMatrix = true;

		dot.remove();

		var item2 = winGroup.children[levelCounter + indexOffset];

		morphItem(item, item2, callback);
	}

	function winLine(item, callback)
	{
		morphItem(item, currentWin, callback);
	}

	function winKeyboard(dots, callback)
	{
		for (var i=0; i<dots.length; i++)
		{
			var dot = dots[i];
			winDot(dot, null, 0);
		}
		currentKeyboard.hide();
		winDot(currentDot, callback);
	}


	function morphItem(item, item2, callback)
	{
		App.setStyle(item, winDotStyle);
		App.morphItems(item, item2, function(){
			item2.visible = true;
			item.remove();
			App.callback(callback);
		});	
	}

	function resetDot(dot, point)
	{
		uncapture(dot);

		var p1 = dot.getPosition(),
			p2 = point,
			d  = p1.getDistance(p2);
		animReset = App.Anim.add({
			duration : Math.min(App.config.speeds.dotReset * d, App.config.delays.dotReset) * 1.5,
			easing   : App.config.easings.dotReset,
			action   : function(time)
			{
				dot.position(App.rampPoints(p1,p2,time));
			}
		})
	}

	function removeDot(dot)
	{
		for (var i=0; i<dots.length; i++)
		{
			if (dots[i] == dot)
			{
				dots.splice(i,1);
				break;
			}
		}
		dot.getItem().applyMatrix = true;
		App.hideItem(dot.getItem(),
		{
			callback: function()
			{
				dot.remove();
			}
		})
	}

	function tap(dot, callback)
	{
		var viewBounds = paper.view.bounds,
			margin = App.config.dotWidth * 2,
			_p1 = viewBounds.topLeft.add(margin),
			_p2 = currentKeyboard.getItem().bounds.topRight.subtract(margin),
			rdmP = App.randomPointFromPoints(_p1,_p2);

		var clone = dot.getClone();
		App.setStyle(clone, ghostStyle);
		var ghost = clone.clone();
		ghost.position = rdmP;

		var p1 = clone.position,
			p2 = ghost.position,
			d = p1.getDistance(p2);

		App.Anim.add({
			duration: Math.min(App.config.speeds.tap * d, App.config.delays.tap),
			action: function(time)
			{
				clone.position = App.rampPoints(p1,p2,time);
			},
			callback: function()
			{
				var dot = new Dot(ghost.position);
				dot.show();
				dots.push(dot);
				clone.remove();
				ghost.remove();
				App.callback(callback);
			}
		})
	}



	function capture(dot)
	{
		dot.getItem().data.captured = true;
	}

	function uncapture(dot)
	{
		dot.getItem().data.captured = false;
	}

	function isCaptured(dot)
	{
		return dot.getItem().data.captured;
	}
});