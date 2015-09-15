App.Games.addKinect('brokenLine', new function()
{
	// params
	var namesArr = ['horizontalSegment','verticalSegment','segment','horizontalParrallelSegments','verticalParrallelSegments','parallelSegments','perpendicularSegments','rdmPerpendicularSegments','multiCrossedSegments','sawTooth','squared','sonicWave','spiral']
		;

	// local variables
	var t = this,

		shapesGroup,
		winGroup,
		tempGroup,

		currentShape,
		currentWin,
		currentPath,
		currentBrokenLine,

		gamePlaying,

		levelCounter,
		pathCounter
		;

	// global methods
	t.init = function()
	{
		gamePlaying       = false;
		levelCounter      = 0;
		pathCounter       = 0;
		currentShape      = null;
		currentWin        = null;
		currentPath       = null;
		currentBrokenLine = null;

		shapesGroup = createShapesGroup();

		winGroup = createWinGroup();

		tempGroup = createTempGroup();


		positionItems();

		hideItems();

	}

	t.start = function()
	{
		gamePlaying = true;

		// tweak
		// levelCounter = shapesGroup.children.length-1;
		// fakeStart();

		startLevel();
	}

	function fakeStart()
	{
		for (i=0; i<levelCounter; i++)
		{
			shapesGroup.firstChild.remove();
			winGroup.children[i].visible = true;
		}
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
		if (!gamePlaying || !currentBrokenLine)
			return;

		currentBrokenLine.onKinectMove(e);
	}

	t.onKinectUserLeft = function()
	{
		if (!gamePlaying || !currentBrokenLine)
			return;

		currentBrokenLine.onKinectUserLeft();
	}

	t.onResize = function()
	{

	}



	// 
	// local
	// 

	// 
	// scenario
	// 

	function startLevel()
	{

		currentWin = winGroup.children[levelCounter];
		currentShape = shapesGroup.firstChild;

		pathCounter = 0;

		// tweak
		// currentWin.visible = true;

		startPath();
	}

	function startPath()
	{

		currentPath = currentShape.firstChild;
		currentBrokenLine = new BrokenLine(currentPath.segments, t, null);
		currentBrokenLine.show();
	}


	function nextLevel()
	{

		if (shapesGroup.children.length > 0)
		{
			levelCounter++;
			startLevel();
		}
		else
		{
			winGame();
		}
	}

	function nextPath()
	{

		if (currentShape.children.length > 0)
		{
			startPath();
		}
		else
		{
			winLevel();
		}

	}


	function winLevel()
	{

		App.morphItems(tempGroup, currentWin, function(){
			tempGroup.remove();
			tempGroup = createTempGroup();
			currentShape.remove();
			currentWin.visible = true;
			nextLevel();
		});

	}

	function winPath(path)
	{

		currentPath.remove();
		tempGroup.appendTop(path);
		nextPath();
	}

	t.onBrokenLineWin = function(path)
	{
		winPath(path);
	}


	function winGame()
	{

		App.animateWinGroup(winGroup, function(){
			App.saveBackground(winGroup);
		})
	}




	// 
	// creation
	// 

	function createShapesGroup()
	{
		var group = new paper.Group();
		group.name = 'shapesGroup';

		for (var i=0; i<namesArr.length; i++)
		{
			var name = namesArr[i];
			if (App.ShapesLibrary[name])
			{
				var item = App.ShapesLibrary[name]();
				item = App.forceGroup(item);
				item.name = name;
				group.appendTop(item);
			}
		}

		App.setStyle(group, 'stroke');

		return group;
	}

	function createWinGroup()
	{
		var group = shapesGroup.clone();
		group.name = 'winGroup';

		App.setChildrenStyle(group, 'strokeWin');
		return group;
	}

	function createTempGroup()
	{
		var group = new paper.Group();
		group.name = 'tempGroup';
		return group;
	}


	function hideItems()
	{
		App.hideAllChildren(shapesGroup);
		App.hideAllChildren(winGroup);
	}




	// 
	// position
	// 

	function positionItems()
	{
		var marginBounds = App.getBounds().scale(1 - App.config.margin * 2),
			squareBounds = marginBounds.scale(marginBounds.height/marginBounds.width, 1);
			;

		// scale shapes
		for (var i=0; i<shapesGroup.children.length; i++)
		{
			var shape = shapesGroup.children[i];
			shape.fitBounds(squareBounds);
			winGroup.children[i].fitBounds(squareBounds);
		}

		shapesGroup.fitBounds(marginBounds);

		App.positionWinGroup(winGroup);
	}


});