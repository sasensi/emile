App.Menu = new function()
{
	// params
	var textStyle   = App.config.textStyle,
		titleStyle  = App.extendObject(textStyle, {fillColor:App.config.colors.app}),
		notionStyle = App.extendObject(textStyle, {fillColor:App.config.colors.game}),

		buttonW = 600,
		margin = App.config.margin,

		titleMargin = [10,8],
		notionsMargin = 0
		;

	// local variables
	var t = this,
		buttonsGroup,
		notionsGroup,
		instructionsGroup,
		centerGroup,
		titleEl,

		currentGame,
		animations
		;

	// global variables
	t.layer;

	t.init = function()
	{
		// init variables
		currentGame = null;
		animations  = [];

		buttonsGroup      = new paper.Group();
		notionsGroup      = new paper.Group();
		instructionsGroup = new paper.Group();
		centerGroup       = new paper.Group(instructionsGroup, buttonsGroup);

		titleEl            = new paper.PointText([0,0]);
		titleEl.style      = titleStyle;
		titleEl.fontFamily = titleStyle.fontFamily;
		titleEl.fontSize   = titleStyle.fontSize;
		titleEl.rotate(-45);

		t.layer = createLayer();

		t.layer.addChildren([notionsGroup, centerGroup, titleEl]);

		return t.layer;
	}

	t.set = function(game)
	{
		currentGame = game;

		clearContent();

		var info             = game.info,
			name             = info.name,
			notions          = info.notions,
			instructions     = info.instructions,
			animationMethods = game.animationMethods
			;

		// title
		titleEl.content = name;

		// notions
		var widthArr = [];
		for (var i=0; i<notions.length; i++)
		{
			var notion = notions[i],
				text   = new paper.PointText([0,0]);

			text.content       = notion;
			text.style         = notionStyle;
			text.fontFamily    = notionStyle.fontFamily;
			text.fontSize      = notionStyle.fontSize;
			text.justification = 'center';

			notionsGroup.appendTop(text);
			widthArr.push([i,text.bounds.width]);
		}
			// larger to smaller
		widthArr.sort(function(a,b){
			if (a[1] < b[1])
				return 1;
			if (a[1] > b[1])
				return -1;
			return 0;
		})
		var offset = 0;
		for (var i=0; i<widthArr.length; i++)
		{
			var text = notionsGroup.children[widthArr[i][0]];
			text.position.y = offset;
			offset += text.leading + notionsMargin;
		}
		notionsGroup.rotate(-45);
		

		// instructions
		offset = 0;
		for (var i=0; i<instructions.length; i++)
		{
			var instruction = instructions[i],
				text        = new paper.PointText([0,offset]);

			text.content    = instruction;
			text.style      = textStyle;
			text.fontFamily = textStyle.fontFamily;
			text.fontSize   = textStyle.fontSize;

			instructionsGroup.appendTop(text);

			offset += text.leading;
		}

		// buttons
		for (var i=0; i<animationMethods.length; i++)
		{
			var anim   = animationMethods[i],
				circle = new paper.Path.Circle([0,0], buttonW);

			circle.fillColor = App.config.colors.game;

			buttonsGroup.appendTop(circle);
		}

		placeItems();
	}

	function clearContent()
	{
		buttonsGroup.removeChildren();
		notionsGroup.removeChildren();
		instructionsGroup.removeChildren();
	}

	function placeItems()
	{
		var viewBounds   = App.appProject.view.bounds,
			marginScale  = (viewBounds.width * (1 - margin)) / viewBounds.width,
			marginBounds = viewBounds.scale(marginScale),
			marginW      = margin * viewBounds.width*.5,
			marginH      = margin * viewBounds.height
			;

		// title
		titleEl.position = viewBounds.topLeft.add(titleEl.bounds.width*.5, titleEl.bounds.height*.5).add(titleMargin);

		// notions
		notionsGroup.position = viewBounds.bottomRight.add(-notionsGroup.bounds.width*.5, -notionsGroup.bounds.height*.5).subtract(titleMargin);

		// instruction
		instructionsGroup.position = viewBounds.center;

		// buttons
		var buttonsNbr = buttonsGroup.children.length,
			_buttonW   = (marginBounds.width - (buttonsNbr * marginW)) / buttonsNbr;

		_buttonW = Math.min(buttonW, _buttonW, marginBounds.height - (instructionsGroup.bounds.height + marginH));

		for (var i=0; i<buttonsNbr; i++)
		{
			var circle = buttonsGroup.children[i],
				scale = _buttonW / circle.bounds.width;

			circle.scale(scale);
		}

		var offset = 0;
		for (var i=0; i<buttonsNbr; i++)
		{
			var circle = buttonsGroup.children[i];

			circle.position.x = offset;
			offset += circle.bounds.width + marginW;
		}

		buttonsGroup.position = instructionsGroup.position.subtract(0,buttonsGroup.bounds.height*.5 + instructionsGroup.bounds.height*.5 + marginH * .5);

		centerGroup.position = viewBounds.center;
	}


	t.hitTestLayer = function(point)
	{
		return t.layer.firstChild.contains(point);
	}


	t.hitTestButtons = function(point)
	{
		for (var i=0; i<buttonsGroup.children.length; i++)
		{
			if (t.hitTestButton(i, point))
			{
				return i;
			}
		}
		return null;
	}

	t.hitTestButton = function(index, point)
	{
		return buttonsGroup.children[index].contains(point);
	}


	t.resize = function()
	{
		placeItems();

		removeAnimations();
		clearAnimations();
		// initAnimations();
		// startAnimations();
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
	}

	t.onHide = function()
	{
		removeAnimations();
	}

	t.onHideEnd = function()
	{
		clearAnimations();
	}


	function createLayer()
	{
		// create menu layer
		var layer = new paper.Layer();

		var	d            = (App.appProject.view.bounds.width + App.appProject.view.bounds.height) * Math.sqrt(2,2) * .5,
			mask         = new paper.Path.Rectangle(paper.view.center, d),
			background   = new paper.Path.Rectangle(App.appProject.view.bounds);


		layer.name       = 'menuLayer';
		background.name    = 'menuBackground';
		background.fillColor    = App.config.colors.menu;

		layer.sendToBack();

		mask.position = paper.view.center;
		mask.rotate(45);

		layer.addChildren([mask, background])
		layer.clipped = true;

		return layer;
	}





	function initAnimations()
	{
		animations = [];
		for (var i=0; i<currentGame.animationMethods.length; i++)
		{
			var circle          = buttonsGroup.children[i],
				animationMethod = currentGame.animationMethods[i],
				animation       = new animationMethod(circle);

			animations.push(animation);
		}
	}

	function startAnimations()
	{
		for (var i=0; i<animations.length; i++)
		{
			var animation = animations[i];
			animation.start();
		}
	}

	function removeAnimations()
	{
		for (var i=0; i<animations.length; i++)
		{
			var animation = animations[i];
			animation.stop();
		}
	}

	function clearAnimations()
	{
		for (var i=0; i<animations.length; i++)
		{
			var animation = animations[i];
			animation.clear();

			currentGame.animations = null;
		}
	}
	
}