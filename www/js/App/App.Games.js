App.Games = new function()
{
	// params
	var	requiredProperties = ['init','start','pause','play'],

		buttonW           = 100,
		buttonStrokeCoeff = .2,

		axisStrokeCoeff = .4,

		notionStyle       = App.extendObject(App.config.styles.text, {
			fillColor:App.config.colors.user,
			justification: 'left',
			opacity: .4
		}),
		titleStyle = App.extend(App.config.styles.text,{
			fillColor: App.config.colors.menu
		}),
		linkStyle         = App.extend(App.config.styles.stroke, {
			strokeColor : App.config.colors.menu,
			strokeWidth : buttonW * buttonStrokeCoeff*.5
		}),
		axisStyle         = App.extendObject(App.config.styles.trajectory, {
			strokeColor : App.config.colors.user,
			strokeWidth : linkStyle.strokeWidth * axisStrokeCoeff,
			dashArray   : [.01, linkStyle.strokeWidth * axisStrokeCoeff*2],
			opacity: notionStyle.opacity
		}),

		infosButtonTextStyle = App.extend(titleStyle, {
			fontSize: titleStyle.fontSize * 1.5,
			fillColor: App.config.colors.app
		}),
		infosButtonCircleStyle = {
			fillColor: App.config.colors.menu
		},
		infosButtonHiddenTextStyle = App.extend(infosButtonTextStyle, {
			fillColor: App.config.colors.menu
		}),
		infosButtonHiddenCircleStyle = {
			fillColor: App.config.colors.app
		},


		margin            = .05,
		titleMargin       = 10,
		notionsMargin     = 20,
		notionsTopMargin  = .05,
		linksMargin = 10,

		buttonRandomCoeff = 0,

		links = 
		[
			[null,'dot'],
			['dot','brokenLine'],
			['dot','shape1'],
			// ['brokenLine','shape1'],
			['brokenLine','curve'],
			['shape1','sticker'],
			// ['shape1','curve'],
			// ['curve','sticker'],
			['curve','movePanZoom'],
			['sticker','movePanZoom'],
			['keyboard',null]
		],

		axis = ['manipuler', 'tracer'],

		infosButtonCircleCoeff = .425,
		infosButtonMarginCoeff = 1.25,

		delayBeforeAnimStart = 150
		;

	var t = this,

		buttons,
		notionsStored,
		animationMethods,
		animations,
		delaysBeforeAnimations,

		buttonsGroup,
		notionsGroup,
		titlesGroup,
		axisGroup,
		linksGroup,

		hiddenInfos
		;

	games = {};

	t.init = function()
	{
		// init variables
		buttons       = {};
		animations    = {};
		delaysBeforeAnimations = {};
		notionsStored = {};
		hiddenInfos = false;

		if (!animationMethods)
			animationMethods = t.getAnimationMethods();

		// iterate over all games
		for (var k in games)
		{
			var game = games[k];

			// check properties
			var missingProperties = App.checkMissingProperties(game, requiredProperties);
			if (missingProperties || !App.config.gamesInfos[k] || !animationMethods[k])
			{
				console.log('cannot add game',k,'to games list because of missing properties',missingProperties);
				delete games[k];
				continue;
			}

			// store game data
			game.info             = App.config.gamesInfos[k];
			game.animationMethods = animationMethods[k];
		}

		axisGroup = createAxisGroup();
		axisGroup.name = 'axisGroup';

		notionsGroup = createNotions();
		notionsGroup.name = 'notionsGroup';

		linksGroup = createLinks();
		linksGroup.name = 'linksGroup';

		buttonsGroup = createButtons();
		buttonsGroup.name = 'buttonsGroup';

		titlesGroup = createTitles();
		titlesGroup.name = 'titlesGroup';

		infosButtonGroup = createInfosButtonGroup();
		infosButtonGroup.name = 'infosButtonGroup';

		placeItems();

		hideInfos(false);
	}


	// 
	// games creation
	// 

	t.add = function(name, object)
	{
		games[name] = object;
	}

	t.addKinect = function(name, object)
	{
		if (!animationMethods)
			animationMethods = t.getAnimationMethods();

		var game = games[name],
			animationMethods = animationMethods[name],
			infos = App.config.gamesInfos[name];

		if (game && animationMethods && infos)
		{
			object.animationMethods = animationMethods.kinect || animationMethods;
			object.info = App.extend(infos);
			object.info.instructions = infos.kinectInstruction || infos.instruction;
			object.originalGame = game;
			game.kinect = object;
		}
		else
		{
			console.log('cannot add kinect game : missing propertie')
		}
	}



	// 
	// commands from App
	// 

	t.resize = function(e)
	{
		removeAnimations();
		clearAnimations();

		var reset = hiddenInfos;

		if (reset)
			showInfos(false);

		placeItems();

		if (reset)
			hideInfos(false);
	}

	t.onShow = function()
	{
		removeAnimations();
		clearAnimations();
		initAnimations()
	}

	t.onShowEnd = function()
	{
		startAnimations();

		// tweak
		// hideInfos()
	}

	t.onHide = function()
	{
		removeAnimations();
	}

	t.onHideEnd = function()
	{
		clearAnimations();
	}

	t.switchInfos = function(callback)
	{
		if (hiddenInfos)
		{
			showInfos(true, function(){

				placeItems();
				App.callback(callback);
			});
		}
		else
		{
			hideInfos(true, callback)
		}
	}





	// 
	// kinect gestion
	// 

	t.filterKinect = function()
	{
		for (var k in games)
		{
			var game = games[k],
				button = buttons[k];

			// if not compatible with kinect
			if (!game.kinect)
			{
				// button.opacity = .5;
				// button.children[1].remove();
				button.children[1].fillColor = App.config.colors.app;
				buttons[k].desactivated = true;
			}
			else
			{
				games[k] = game.kinect;
			}
		}

		// reset animations
		removeAnimations();
		clearAnimations();
		initAnimations();
		startAnimations();
	}

	t.deFilterKinect = function()
	{
		for (var k in buttons)
		{
			if (buttons[k].desactivated)
			{
				delete buttons[k].desactivated;
				buttons[k].children[1].fillColor = App.config.colors.game;
			}
			else
			{
				games[k] = games[k].originalGame;
			}
		}
	}





	// 
	// hit tests
	// 
	
	t.hitTestButtons = function(point, returnKey)
	{
		for (var k in buttons)
		{
			if (buttons[k].desactivated)
				continue;

			if (t.hitTestButton(k, point))
			{
				if (returnKey)
				{
					return k;
				}
				else
				{
					return games[k];
				}
			}
		}
		return null;
	}

	t.hitTestButton = function(k, point)
	{
		return buttons[k].contains(point);
	}

	t.hitTestInfosButton = function(point)
	{
		return infosButtonGroup.firstChild.contains(point);
	}





	t.getGame = function(k)
	{
		return games[k];
	}

	t.getGameIndex = function(game)
	{

	}


	// display

	function createNotions()
	{
		// create notions list
		var group   = new paper.Group();

		for (var i=0; i<axis.length; i++)
		{
			var text = new paper.PointText([0,0]);
			text.content = axis[i];
			App.setStyle(text, notionStyle);
			group.appendTop(text);
		}
		
		return group;
	}

	function createButtons()
	{
		var group = new paper.Group();

		// create buttons
		var counter = 0;
		for (var k in games)
		{
			var info = App.config.gamesInfos[k],
				offset = info.offset,
				button = createButton(k, counter, offset);
			buttons[k] = button;
			group.appendTop(button);
			counter++;
		}

		return group;
	}

	function createButton(gameName, i, offsetIndex)
	{
		var offset    = offsetIndex * (buttonW*2 + buttonW * buttonStrokeCoeff),
			point  = new paper.Point(i * buttonW * (2 + buttonStrokeCoeff), paper.view.center.y + offset),
			group  = new paper.Group(),
			stroke = new paper.Path.Circle(point, buttonW * (1 + buttonStrokeCoeff)),
			circle = new paper.Path.Circle(point, buttonW)
			;

		stroke.fillColor = App.config.colors.menu;
		circle.fillColor = App.config.colors.game;

		group.addChildren([stroke, circle]);
		group.name = 'button_' + i;

		return group;
	}

	function createTitles()
	{
		var group = new paper.Group();

		for (var k in games)
		{
			// normal version
			var text = new paper.PointText(paper.view.center),
				name = App.config.gamesInfos[k].name
				;

			App.setStyle(text, titleStyle);
			text.content    = name;

			// with own typo
			// var name = App.config.gamesInfos[k].name,
			// 	text = new Word({word:name, openTypeFeatures:false, style:{strokeColor:App.config.colors.menu, strokeWidth:2.5}, size:titleStyle.fontSize*1.2, pivotPoint:true});

			group.appendTop(text);
		}

		return group;
	}

	function createAxisGroup()
	{
		var group = new paper.Group();


		for (var i=0; i<axis.length; i++)
		{
			var line = new paper.Path.Line([0,0], [0,0]);
			App.setStyle(line, axisStyle);
			group.appendTop(line);
		}

		return group;
	}

	function createLinks()
	{
		var group = new paper.Group();

		for (var i=0; i<links.length; i++)
		{
			var line = new paper.Path.Line([0,0],[0,0]);
			App.setStyle(line, linkStyle);
			group.appendTop(line);
		}

		return group;
	}

	function createInfosButtonGroup()
	{
		var group = new paper.Group();

		var text = new paper.PointText([0,0]);
		text.content = '?';
		App.setStyle(text, infosButtonTextStyle);

		var circle = new paper.Path.Circle([0,0], text.bounds.height* infosButtonCircleCoeff);
		App.setStyle(circle, infosButtonCircleStyle);

		circle.position = text.position;

		group.addChildren([circle, text]);

		return group;
	}






	function placeItems()
	{
		var viewBounds   = App.appProject.view.bounds,
			marginScale  = (viewBounds.width * (1 - margin)) / viewBounds.width,
			marginBounds = viewBounds.scale(marginScale);

		// buttons
		buttonsGroup.fitBounds(marginBounds);

		// links
		placeLinks();

		// info button
		infosButtonGroup.position = marginBounds.topLeft.add(infosButtonGroup.firstChild.bounds.width * .25, infosButtonGroup.firstChild.bounds.height * .25);
		infosButtonGroup.position.y = infosButtonGroup.position.x;

		if (hiddenInfos)
			return;

		storeButtonsPosition();

		// recalculate strokeWidth
		var strokeWidth = getButtonStrokeWidth();

		// axis & notions
		var keys = ['shape1','brokenLine'];
		for (var i=0; i<axisGroup.children.length; i++)
		{
			var line = axisGroup.children[i],
				button = buttons[keys[i]],
				posY = button.position.y,
				p1 = [viewBounds.left, posY],
				p2 = [viewBounds.right, posY];

			line.firstSegment.point = p1;
			line.lastSegment.point = p2;

			line.strokeWidth = strokeWidth * axisStrokeCoeff;
			line.dashArray = [.01, strokeWidth * axisStrokeCoeff*2];

			var notion = notionsGroup.children[i],
				onTop = i == 0,
				_posY = onTop
					? posY - titleMargin - notion.bounds.height*.5
					: posY + titleMargin + notion.bounds.height*.5,
				_poX = viewBounds.left + titleMargin*2 + notion.bounds.width*.5;

			notion.position = [_poX, _posY];
		}
		
		// titles
		for (var i=0; i<titlesGroup.children.length; i++)
		{
			var title  = titlesGroup.children[i],
				button = buttonsGroup.children[i],
				onTop = i != 1 && i != 3,
				posY = onTop 
					? -button.bounds.height*.5 - titleMargin - title.bounds.height*.5
					: button.bounds.height*.5 + titleMargin + title.bounds.height*.5,
				point = button.position.add(0, posY)
				;

			// optic correction
			if (onTop)
			{
				point = point.add(1, 0)
			}
			else
			{
				point = point.add(-1, 0)
			}

			title.position = point;
		}

		
		

		// place at begin and end

	}

	function storeButtonsPosition()
	{
		for (var k in buttons)
		{
			buttons[k].data.position = buttons[k].position;
		}
	}

	function getButtonStrokeWidth()
	{
		var button = buttonsGroup.firstChild;
		return (button.firstChild.bounds.height - button.lastChild.bounds.height) * .5;
	}

	function placeLinks()
	{
		var bounds = App.getBounds(),
			strokeWidth = getButtonStrokeWidth();
		for (var i=0; i<links.length; i++)
		{
			var k1 = links[i][0],
				k2 = links[i][1],
				button1 = buttons[k1],
				button2 = buttons[k2],
				p1 = button1 ? button1.position : bounds.topLeft.add(0,bounds.height*.5),
				p2 = button2 ? button2.position : bounds.topRight.add(0,bounds.height*.5),
				link = linksGroup.children[i];

			link.firstSegment.point = p1;
			link.lastSegment.point = p2;

			link.strokeWidth = strokeWidth;
		}
	}


	function hideInfos(animate, callback, inverted)
	{
		hiddenInfos = !inverted;

		// set button style
		App.setStyle(infosButtonGroup.firstChild, !inverted ? infosButtonHiddenCircleStyle : infosButtonCircleStyle);
		App.setStyle(infosButtonGroup.lastChild, !inverted ? infosButtonHiddenTextStyle : infosButtonTextStyle);

		var restartAnimations = App.getCount(animations) > 0;
		if (restartAnimations)
		{
			removeAnimations();
			clearAnimations();
		}

		var method1 = !inverted ? hideExtras : alignButtons,
			method2 = !inverted ? alignButtons : hideExtras;

		// hide extra infos
		method1(animate, function(){
			// place each buttons at center of the page
			method2(animate, function(){
				if (App.getCount(animations) > 0)
				{
					removeAnimations();
					clearAnimations();
					initAnimations();
					startAnimations();
				}

				else if (restartAnimations)
				{
					initAnimations();
					startAnimations();
				}

				App.callback(callback);
			}, inverted);
		}, inverted);
	}

	function alignButtons(animate, callback, inverted)
	{
		var center = App.getBounds().center;

		if (animate)
		{
			var positionArr = {};
			for (var k in buttons)
			{
				var button = buttons[k],
					p1 = button.position,
					p2 = !inverted ? [p1.x, center.y] : button.data.position;
				positionArr[k] = [p1,p2];
			}

			App.Anim.add({
				duration: animate ? 500 : 0, 
				easing: 'easeOutQuad',
				action: function(time)
				{
					for (var k in buttons)
					{
						var button = buttons[k],
							p1 = positionArr[k][0],
							p2 = positionArr[k][1];

						button.position = App.rampPoints(p1, p2, time);
					}

					placeLinks();
				},
				callback: callback
			});
		}
		else
		{
			for (var k in buttons)
			{
				var button = buttons[k];
				button.position = !inverted ? [button.position.x, center.y] : button.data.position;
			}
			placeLinks();
			App.callback(callback);
		}
	}

	function hideExtras(animate, callback, inverted)
	{
		if (animate)
		{
			var options = {
					scale: false,
					fade: true
				},
				method = !inverted ? 'hideItem' : 'showItem';
			App[method](titlesGroup, options);
			App[method](notionsGroup, options);
			App[method](axisGroup, App.extend(options, {callback:callback}));
		}
		else
		{
			titlesGroup.opacity = !inverted ? 0 : 1;
			notionsGroup.opacity = !inverted ? 0 : 1;
			axisGroup.opacity = !inverted ? 0 : 1;
			App.callback(callback);
		}
	}


	function showInfos(animate, callback)
	{
		hideInfos(animate, callback, true);
	}




	function initAnimations()
	{
		animations = {};
		delaysBeforeAnimations = {};
		for (var k in buttons)
		{
			if (buttons[k].desactivated)
				continue;

			var circle = buttons[k].lastChild;
			animations[k] = new games[k].animationMethods[0](circle);
		}
	}

	function startAnimations()
	{
		var delay = 0;
		for (var k in animations)
		{
			delaysBeforeAnimations[k] = App.Anim.add({
				delay: delay,
				data: k,
				callback: function(data)
				{
					animations[data].start();
					delete delaysBeforeAnimations[data];
				}
			})
			delay += delayBeforeAnimStart;
		}
	}

	function removeAnimations()
	{
		for (var k in animations)
		{
			animations[k].stop();
			if (delaysBeforeAnimations[k])
			{
				App.removeAnimation(delaysBeforeAnimations[k]);
				delete delaysBeforeAnimations[k];
			}
		}
	}

	function clearAnimations()
	{
		for (var k in animations)
		{
			animations[k].clear();
			delete animations[k];
		}
	}
}