var App = new function()
{
	// local variables
	var t = this,
		requiredProperties = ['config','Kinect','Anim','Cursor','Font','ShapesLibrary','Games','Menu','Dictionary'],
		appCanvas,
		gameCanvas,

		menuButtons,

		viewBounds,

		animIds,

		mode,	// 0 = app, 1 = menu, 2 = game
		kinectMode,
		kinectTarget,

		touches,

		titleLayer
		;


	// global variables
	t.appProject;
	t.gameProject;
	t.appLayer;
	t.appPlaying;
	t.currentGame;

	// global methods
	t.init = function()
	{
		// check requirement
		var missingProperties = [];
		for (var i=0; i<requiredProperties.length; i++)
		{
			if (!t[requiredProperties[i]])
				missingProperties.push(requiredProperties[i]);
		}
		if (missingProperties.length > 0)
		{
			console.log('failed to load App, required propertie(s) missing',missingProperties,t);
			return;
		}

		// init variables
		mode         = 0;
		menuButtons  = [];
		animIds      = [];
		kinectMode   = false;
		kinectTarget = null;
		touches      = {};

		t.touches = touches;

		t.currentGame = null;

		// get DOM elements
		var appCanvas = document.getElementById('appCanvas');
		appCanvas.oncursordown = onCursorDown;
		appCanvas.oncursormove = onCursorMove;
		appCanvas.oncursorup   = onCursorUp;
		t.Cursor.addEventListener(appCanvas);

		gameCanvas = document.getElementById('gameCanvas');

		// init paper on both canvas
		// app project
		paper.setup(appCanvas);
		paper.view.onFrame = onPaperFrame;
		paper.view.onResize = onPaperResize;
		t.appProject = paper.project;

		t.appLayer = paper.project.activeLayer;
		t.appLayer.name = 'appLayer';
		createAppLayer();
		t.appLayer.clipped = true;

		t.Games.init();

		// create menu layer  and place it under app layer
		t.Menu.init();

		// check Kinect
		if(App.config.tryKinect)
		{
			App.Kinect.init(appCanvas);
		}


		viewBounds = paper.view.bounds;

		t.Anim.init();

		// create title
		t.Title.init();

		// game project
		paper.setup(gameCanvas);
		paper.view.onFrame = onPaperFrame;
		paper.view.onResize = onPaperResize;
		t.gameProject = paper.project;

		// init App properties
		t.ShapesLibrary.init();

		t.showMode();

		// test game
		if (App.config.testGame)
		{
			fakeStart(App.config.testGame);
		}

		if (App.config.title)
			t.showTitle();

		// start app
		t.appPlaying = true;
	}

	function fakeStart(gameName)
	{
		var game = t.Games.getGame(gameName);
		if (game != null)
		{
			t.Games.onHide();
			t.Menu.set(game);
			t.initGame(game);
			t.showGame(false, t.Games.onHideEnd, 0);
		}
	}


	// launched after kinect try


	// local methods
	function onPaperFrame(e)
	{
		App.Anim.update();
		paper.view.draw();

		if (t.currentGame && typeof t.currentGame.onFrame === 'function')
		{
			t.currentGame.onFrame();
		}
	}


	function onPaperResize(e)
	{
		var deltaX = (t.appProject.view.bounds.width - viewBounds.width) * .5,
			deltaY = (t.appProject.view.bounds.height - viewBounds.height) * .5;

		if (deltaX != 0 || deltaY != 0)
		{
			var prevDiag = App.getViewDiagonal(viewBounds),
				newDiag  = App.getViewDiagonal(),
				scale    = newDiag/prevDiag,
				center   = t.appProject.view.bounds.center;

			// calc mask scale
			var d0 = (viewBounds.width + viewBounds.height) * Math.sqrt(2,2) * .5,
				d1 = (t.appProject.view.bounds.width + t.appProject.view.bounds.height) * Math.sqrt(2,2) * .5,
				deltaD = d1/d0;

			t.appLayer.translate(deltaX, deltaY);
			t.Menu.layer.translate(deltaX, deltaY);
			t.Title.layer.translate(deltaX, deltaY);

			t.appLayer.firstChild.scale(deltaD);
			t.Menu.layer.firstChild.scale(deltaD);
			t.Title.layer.firstChild.scale(deltaD);

			// adapt backgrounds
			t.appLayer.children[1].fitBounds(t.appProject.view.bounds, true);
			t.Menu.layer.children[1].fitBounds(t.appProject.view.bounds, true);
			t.Title.layer.children[1].fitBounds(t.appProject.view.bounds, true);
			if (t.currentGame)
				t.currentGame.background.fitBounds(App.appProject.view.bounds, true);

			// resize buttons
			t.Menu.resize();
			t.Games.resize();
			t.Title.resize();

			// position masks without animating
			if (!isTitleMode())
			{
				t.showMode();
			}

			// store new bounds
			viewBounds = t.appProject.view.bounds;

			// resize game layer
			if (t.currentGame && typeof t.currentGame.onResize === 'function')
			{
				t.currentGame.onResize([deltaX, deltaY], scale);
			}
		}
	}


	// handle interactions
	function onCursorDown(e)
	{
		if (!t.appPlaying)
			return;


		_e = App.extend(addTouch(e));

		// on first event, enter full screen
		if (App.config.fullScreen && App.isNotFullScreen())
		{
			App.enterFullScreen();
			return;
		}

		// title mode
		if (isTitleMode())
		{
			App.Title.onCursorDown(e);
			t.appLayer.visible = true;
		}

		// event on app canvas
		else if (isAppMode())
		{
			// go menu
			if (!hitTestApp(e.point))
			{
				t.Games.onHide();
				t.showMenu(true, t.Games.onHideEnd);
			}

			// show / hide infos
			else if (t.Games.hitTestInfosButton(e.point))
			{
				t.appPlaying = false;
				t.Games.switchInfos(function(){
					t.appPlaying = true;
				});
			}

			// go game
			else
			{
				// check games buttons
				var game = t.Games.hitTestButtons(e.point);
				if (game != null)
				{
					t.Menu.layer.visible = true;

					t.Games.onHide();
					t.Menu.set(game);
					t.initGame(game);
					// t.showMenu(true, t.Games.onHideEnd, true);
					t.showGame(true, function(){
						t.Games.onHideEnd();
						t.appLayer.visible = false;
					}, 0);
				}
			}
		}

		else if (isMenuMode())
		{
			// go app
			if (hitTestApp(e.point))
			{
				t.Menu.onHide();
				t.showApp(true, t.Menu.onHideEnd);
			}

			// go game
			else if (!t.Menu.hitTestLayer(e.point))
			{
				t.Menu.onHide();
				t.showGame(true, t.Menu.onHideEnd);
			}

			// check menu buttons
			else
			{
				var buttonIndex = t.Menu.hitTestButtons(e.point);
				if (buttonIndex != null)
				{
					t.Menu.onHide();
					t.initGame(t.currentGame);
					t.showGame(true, t.Menu.onHideEnd, buttonIndex);
				}
			}
		}

		// if clicked on button while game is playing, pause game and show menu
		else if (t.Menu.hitTestLayer(e.point))
		{
			t.appLayer.visible = true;
			t.showMenu(true);
		}

		// event on game canvas
		else if (t.currentGame && typeof t.currentGame.onCursorDown === 'function')
		{
			t.currentGame.onCursorDown(_e);
		}
	}


	function onCursorMove(e)
	{
		if (!t.appPlaying)
			return;

		_e = App.extend(updateTouch(e));

		if (isGameMode() && t.currentGame && typeof t.currentGame.onCursorMove === 'function')
		{
			t.currentGame.onCursorMove(_e);
		}
	}


	function onCursorUp(e)
	{
		if (!t.appPlaying)
			return;

		// App.log('up' + e.id);

		_e = App.extend(removeTouch(e));

		if (isGameMode() && t.currentGame && typeof t.currentGame.onCursorUp === 'function')
		{
			t.currentGame.onCursorUp(_e);
		}
	}


	function addTouch(e)
	{
		e.delta = [0,0];
		e.time = Date.now();
		e.speed = 0;
		e.lastPoint = e.point;

		touches[e.id] = e;

		return e;
	}

	function updateTouch(e)
	{
		var touch = touches[e.id];

		// help for kinect handle
		if (!touch)
		{
			addTouch(e);
			return;
		}

		e.lastPoint = touch.point;
		e.delta = [e.point[0] - touch.point[0], e.point[1] - touch.point[1]]
		e.time = Date.now();
		e.speed  = e.time - touch.time;

		touches[e.id] = e;

		return e;
	}

	function removeTouch(e)
	{
		updateTouch(e);
		delete touches[e.id];

		return e;
	}

	function countTouches()
	{
		var counter = 0;
		for (var k in touches)
		{
			counter++;
		}
		return counter;
	}

	function getTouch(e)
	{
		return touches[e.id];
	}



	// handle kinect connection
	t.onKinectConnection = function()
	{
		kinectMode = true;

		t.Games.filterKinect();

		if (App.config.testKinectGame)
		{
			fakeStart(App.config.testKinectGame);
		}
	}

	t.onKinectDisconnection = function()
	{
		if (kinectMode)
		{
			console.log('lost connection with kinect, stopping game');
			t.Games.deFilterKinect();
			t.showApp(true);
		}
	}

	t.onKinectUserLeft = function()
	{
		console.log('app detect that user is left, wait a moment then pause game');
		if (t.currentGame && typeof t.currentGame.onKinectUserLeft === 'function')
		{
			t.currentGame.onKinectUserLeft();
		}
	}

	t.onKinectPointerMove = function(e)
	{
		if (!t.appPlaying)
			return;

		// check for primary hand
		if (e.primaryCursor)
		{
			// on title mode, click
			if (isTitleMode())
			{
				onCursorDown(e);
			}

			// if target already exist
			else if (kinectTarget)
			{
				if (kinectTarget.cursorId != e.id)
				{
					kinectTarget = null;
					return;
				}

				var hitTest = kinectTarget.hitTest,
					deltaT = new Date() - kinectTarget.date;

				// loose target
				if (!hitTest(e.point))
				{
					// console.log('loose target',hitTest)
					kinectTarget = null;
					App.Kinect.onPrimaryPointerLooseTarget();
				}

				// keep target
				else if (deltaT < App.config.delays.kinectTarget)
				{
					// show target loading
					var _t = deltaT / App.config.delays.kinectTarget;

					App.Kinect.onPrimaryPointerTarget(_t);
				}

				// proceed to click and remove target
				else
				{
					onCursorDown(e);
					kinectTarget = null;
					App.Kinect.onPrimaryPointerClick();
				}
			}

			// search for target
			else
			{
				var hitTest = appGlobalHitTest(e);
				if (hitTest)
				{
					kinectTarget =
					{
						hitTest : hitTest,
						cursorId : e.id,
						date : new Date()
					};

					// set pointer hover mode
					App.Kinect.onPrimaryPointerHover();
				}
				else
				{
					onCursorMove(e);
				}
			}
		}
		else
		{
			onCursorMove(e);
		}
	}


	// return a function to execute later with a point in parametter to test 
	function appGlobalHitTest(e)
	{
		// event on app canvas
		if (isAppMode())
		{
			// go menu
			if (!hitTestApp(e.point))
			{
				return function(point)
				{
					return !hitTestApp(point);
				}
			}

			// show / hide infos
			else if (t.Games.hitTestInfosButton(e.point))
			{
				return function(point)
				{
					return t.Games.hitTestInfosButton(e.point);
				}
			}

			else
			{
				// check games buttons
				var gameIndex = t.Games.hitTestButtons(e.point, true);
				if (gameIndex)
				{
					return function(point)
					{
						return t.Games.hitTestButton(gameIndex, point);
					}
				}
			}
		}

		else if (isMenuMode())
		{
			// go app
			if (hitTestApp(e.point))
			{
				return function(point)
				{
					return hitTestApp(point);
				}
			}

			// go game
			else if (!t.Menu.hitTestLayer(e.point))
			{
				return function(point)
				{
					return !t.Menu.hitTestLayer(point);
				}
			}

			// check menu buttons
			else
			{
				var buttonIndex = t.Menu.hitTestButtons(e.point, true);
				if (buttonIndex != null)
				{
					return function(point)
					{
						return t.Menu.hitTestButton(buttonIndex, point);
					}
				}
			}
		}

		// if clicked on button while game is playing, pause game and show menu
		else if (t.Menu.hitTestLayer(e.point))
		{
			return function(point)
			{
				return t.Menu.hitTestLayer(point);
			}
		}
	}




	// app local methods


	// mode gestion

	function isTitleMode()
	{
		return mode == -1;
	}

	function isAppMode()
	{
		return mode == 0;
	}

	function isMenuMode()
	{
		return mode == 1;
	}

	function isGameMode()
	{
		return mode == 2;
	}



	t.setTitleMode = function()
	{
		mode = -1;
	}

	t.setAppMode = function()
	{
		mode = 0;
	}

	t.setMenuMode = function()
	{
		mode = 1;
	}

	t.setGameMode = function()
	{
		mode = 2;
	}


	// interface movements

	// show methods
	t.showMode = function(animate, callback)
	{
		if (isTitleMode())
			t.showTitle(callback);
		else if (isAppMode())
			t.showApp(animate, callback);
		else if (isMenuMode())
			t.showMenu(animate, callback);
		else if (isGameMode())
			t.showGame(animate, callback);
	}

	t.showGame = function(animate, callback, gameMode)
	{
		if (t.currentGame)
		{
			t.setGameMode();
			setPosition(mode, animate, function(){
				// play or start game after anim
				if (t.currentGame.paused)
				{
					t.currentGame.paused = false;
					t.currentGame.play();
				}

				// restart
				else if (!t.currentGame.playing)
				{
					t.currentGame.playing = true;
					t.currentGame.start(gameMode);
				}

				App.callback(callback);
			});
		}
	}

	t.showMenu = function(animate, callback, emptyCorner)
	{
		if (!t.currentGame)
		{
			console.log('error : no current game when showing menu')
			t.showApp();
			return;
		}

		// pause game
		if (!t.currentGame.paused)
		{
			t.currentGame.paused = true;
			t.currentGame.pause();
		}

		t.setMenuMode();
		t.Menu.onShow(t.currentGame);
		setPosition(mode, animate, function(){
			t.Menu.onShowEnd();

			if (typeof callback === 'function')
				callback();
		}, emptyCorner);
	}

	t.showApp = function(animate, callback)
	{
		// pause game
		if (t.currentGame && !t.currentGame.paused)
		{
			t.currentGame.paused = true;
			t.currentGame.pause();
		}

		t.appLayer.visible = true;

 		t.setAppMode();
 		t.Games.onShow();
 		setPosition(mode, animate, function(){
 			t.Games.onShowEnd();
 			App.callback(callback);
 		}, !t.currentGame);
	}

	t.showTitle = function(animate, callback)
	{
		t.setTitleMode();
		t.Title.onShow();
 		setPosition(mode, animate, function(){
 			t.appLayer.visible = false;
 			t.Menu.layer.visible = false;
 			t.Title.onShowEnd();
 			App.callback(callback);
 		});
	}




	function setPosition(nbr, animate, callback, emptyCorner)
	{
		animate = animate || false;

		// cancel previous animations
		for (var i=0; i<animIds.length; i++)
		{
			App.Anim.removeAnimation(animIds[i]);
			animIds.splice(i,1);
			i--;
		}

		// calculate positions
		var totalOffset = t.appLayer.firstChild.bounds.width/2,
			// fullscreen
			pos0 = t.appProject.view.center,
			// emptyscreen
			pos3 = pos0.add(totalOffset, -totalOffset),
			// bottom left
			pos1 = pos0.add(App.config.cornerOffset, -App.config.cornerOffset),
			// top right
			pos2 = pos3.add(-App.config.cornerOffset, App.config.cornerOffset);


		var menuStart = t.Menu.layer.firstChild.position,
			appStart  = t.appLayer.firstChild.position,
			titleStart = t.Title.layer.firstChild.position;

		switch(nbr)
		{
			// title
			case -1:
				titleDestination = pos0;
				appDestination = pos0;
				menuDestination = pos0;
				break;
			// app
			case 0:
				titleDestination = pos3;
				appDestination = emptyCorner ? pos0 : pos1;
				menuDestination = pos0;
				break;
			// menu
			case 1:
				titleDestination = pos3;
				appDestination = pos2;
				menuDestination = pos1;
				break;
			// game
			case 2:
				titleDestination = pos3;
				appDestination = pos3;
				menuDestination = pos2;
				break;
		}


		// move masks
		if (!animate)
		{
			t.Menu.layer.firstChild.position = menuDestination;
			t.appLayer.firstChild.position = appDestination;
			t.Title.layer.firstChild.position = titleDestination;
			if (typeof callback === 'function')
			{
				callback();
			}
			t.appPlaying = true;
		}
		else
		{
			// avoid interaction during animation
			t.appPlaying = false;

			var anim = App.Anim.add({
				duration : App.config.delays.layerSwitch,
				easing   : 'easeInOutQuint',
				action   : function(_t)
				{
					var appP = App.rampPoints(appStart, appDestination, _t),
						menuP = App.rampPoints(menuStart, menuDestination, _t),
						titleP = App.rampPoints(titleStart, titleDestination, _t);

					t.appLayer.firstChild.position = appP;
					t.Menu.layer.firstChild.position = menuP;
					t.Title.layer.firstChild.position = titleP;
				},
				callback : function()
				{
					if (typeof callback === 'function')
					{
						callback();
					}

					console.log()
					t.appPlaying = true;
				}
			})

			animIds.push(anim);
		}

		// in kinect mode, handle pointers show/hide depending on menu
		if (kinectMode)
		{
			if ((isAppMode() || isMenuMode()) && !App.Kinect.pointersMenuMode)
			{
				App.Kinect.setPointersMenuMode(true);
			}
			else if (isGameMode() && App.Kinect.pointersMenuMode)
			{
				if (t.currentGame.info.kinectParametters)
				{
					App.Kinect.setPointersParametters(t.currentGame.info.kinectParametters);
				};
				App.Kinect.setPointersMenuMode(false);
			}
		}
	}




	// display methods
	function createAppLayer()
	{
		var d = (paper.view.bounds.width + paper.view.bounds.height) * Math.sqrt(2,2) * .5,
			mask       = new paper.Path.Rectangle(paper.view.center, d),
			background = new paper.Path.Rectangle(paper.view.bounds);

		background.name      = 'appuBackground';
		background.fillColor = App.config.colors.app;

		mask.position = paper.view.center;
		mask.rotate(45);
	}



	// calc methods




	// hit tests

	function hitTestMenu(point)
	{
		
	}

	function hitTestApp(point)
	{
		return t.appLayer.firstChild.contains(point);
	}


	// clear game canvas and reset zoom
	t.clearCurrentGame = function()
	{
		t.gameProject.clear();
		t.gameProject.view.zoom = 1;
		t.gameProject.view.center = t.appProject.view.center;
	}

	t.initGame = function(game)
	{
		// launch game
		t.clearCurrentGame();

		// create background
		var backgroundLayer = new paper.Layer();
		backgroundLayer.name = 'backgroundLayer';
		game.background = App.createBackground();
		backgroundLayer.appendTop(game.background);

		game.init();
		game.paused = false;
		game.playing = false;
		t.currentGame = game;
	}
}






window.onload = App.init;