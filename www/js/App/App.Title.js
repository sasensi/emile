App.Title = new function()
{
	// params
	var wordName = 'émile',
		wordCapturedStyle = App.extend(App.config.styles.stroke, {

		}),
		freeWordStyle = App.extend(wordCapturedStyle, {
			strokeColor: App.config.colors.machine
		}),

		margin = App.config.margin,
		wordVerticalOffset = -.2,

		duration = 2000,
		durationMin = 1000,

		randomPointsCoeff = .075,
		randomLengthMin = .075,
		randomLengthMax = .125,

		speed = 50,

		titleDelay = 325
		;

	var t = this,

		layer,
		word,
		freeWord,
		line,
		background,

		anims,
		freeMode,
		readyToClick
		;

	t.init = function()
	{
		line = null;
		background = null;
		anims = [];
		readyToClick = false;
		freeMode = true;

		layer = createLayer();
		// layer.visible = false;

		t.layer = layer;

		word = createWord();
		layer.appendTop(word);
		// word.strokeColor = 'red';

		freeWord = createFreeWord();
		layer.appendTop(freeWord);

		positionItems();
	}






	// 
	// interactions
	// 

	t.onCursorDown = function(e)
	{
		if (freeMode && readyToClick)
		{
			freeMode = false;
			restartAnim(function(){
				removeAnim();

				// delay
				App.Anim.add({
					delay: titleDelay,
					callback: function()
					{
						t.onHide();
						App.showApp(true, t.onHideEnd);
					}
				})
			});
		}
	}

	t.resize = function()
	{
		var bounds = App.getBounds(),
			marginBounds = getMarginBounds();
		word.fitBounds(marginBounds);
		word.translate(0, wordVerticalOffset * word.bounds.height);
		freeWord.position = bounds.center;
	}






	// 
	// scenario
	// 

	t.onShow = function()
	{
		initAnim();
	}

	t.onShowEnd = function()
	{
		startAnim(null, true);
	}

	t.onHide = function()
	{
		removeAnim();
	}

	t.onHideEnd = function()
	{
		// tweak optimize performance
		word.remove();
		freeWord.remove();
		layer.visible = false;
	}


	// 
	// local methods
	// 

	// 
	// creation
	// 

	function createLayer()
	{
		var layer = new paper.Layer();
		layer.name = 'titleLayer';

		var	d      = (App.appProject.view.bounds.width + App.appProject.view.bounds.height) * Math.sqrt(2,2) * .5,
			mask   = new paper.Path.Rectangle(paper.view.center, d);
		background = new paper.Path.Rectangle(App.appProject.view.bounds);

		background.name    = 'titleBackground';
		background.fillColor    = App.config.colors.game;

		layer.bringToFront();

		mask.position = App.appProject.view.center;
		mask.rotate(45);

		layer.addChildren([mask, background]);
		layer.clipped = true;

		return layer;
	}

	function createWord()
	{
		var group = new Word({word:wordName});
		App.deGroupAllChildren(group);
		group.pivot = group.bounds.center;
		return group;
	}

	function createFreeWord()
	{
		var group = word.clone();
		group.name = 'freeWord';
		App.setStyle(group, freeWordStyle);
		for (var i=0; i<group.children.length; i++)
		{
			var path = group.children[i];
			path.smooth();

			// check for empty handle
			var v = path.segments[path.segments.length-2].point.subtract(path.lastSegment.point);
			path.lastSegment.handleIn = path.lastSegment.handleIn || v;
		}
		// group.fullySelected = true;
		return group;
	}

	function convertGroupToLine(group)
	{
		var counter = 0;
		for (var i=0; i<group.children.length; i++)
		{
			var path = group.children[i];
			for (var j=0; j<path.segments.length; j++)
			{
				var segment = path.segments[j];
				path.segments[j].point = [counter, 0];
				path.segments[j].handleIn = [-.5, 0];
				path.segments[j].handleOut = [.5, 0];

				counter++;
			}
		}
	}





	// 
	// position
	// 

	function positionItems()
	{
		var marginBounds = getMarginBounds()

		word.fitBounds(marginBounds);
		word.translate(0, wordVerticalOffset * word.bounds.height);

		freeWord.fitBounds(marginBounds);
		freeWord.translate(0, wordVerticalOffset * freeWord.bounds.height);
	}

	function getMarginBounds()
	{
		return App.getBounds().scale(1-margin*2);
	}





	// 
	// animation
	// 

	function initAnim()
	{
		anims = [];

		convertGroupToLine(freeWord);
		freeWord.fitBounds(getMarginBounds());
		freeWord.visible = false;
		readyToClick = false;
	}

	function startAnim(callback, reset)
	{
		// on init
		if (reset)
		{
			// trace path
			var bounds = App.getBounds();
			line = new paper.Path.Line(bounds.leftCenter.subtract(freeWord.bounds.width,0), bounds.leftCenter);
			layer.appendTop(line);
			line.visible = true;
			App.setStyle(line, freeWordStyle);

			var p1 = freeWord.bounds.leftCenter,
				p2 = freeWord.bounds.rightCenter;
			anims.push(App.Anim.add({
				duration: duration*.7,
				action: function(time)
				{
					line.firstSegment.point = App.rampPoints(bounds.leftCenter.subtract(freeWord.bounds.width,0), freeWord.bounds.leftCenter, time);
					line.lastSegment.point = App.rampPoints(bounds.leftCenter, freeWord.bounds.rightCenter, time);
				},
				callback: function()
				{
					line.remove();
					line = null;
					freeWord.visible = true;
					addPathAnims(callback);
					readyToClick = true;
				}
			}))
		}
		
		else
		{
			addPathAnims(callback);
		}
	}

	function addPathAnims(callback, reset)
	{
		for (var i=0; i<word.children.length; i++)
		{
			var freeLetter = freeWord.children[i];
			for (var j=0; j<freeLetter.segments.length; j++)
			{
				var index = anims.length,
					_callback = i == word.children.length-1 && j == freeLetter.segments.length-1 
						? callback
						: null;
				addAnim(i, j, index, _callback, reset);
			}
		}
	}

	function addAnim(letterIndex, segmentIndex, animIndex, callback, reset)
	{
		var s  = freeWord.children[letterIndex].segments[segmentIndex],
			_s = word.children[letterIndex].segments[segmentIndex],
			p1 = s.point.clone(),
			p2 = freeMode ? _s.point.add(getRandomV()) : _s.point,
			rdmRotation = App.rdm(360),
			hIn1 = s.handleIn.clone(),
			hIn2 = freeMode ? getRandomVfromV(hIn1).rotate(rdmRotation) : _s.handleIn,
			hOut1 = s.handleOut.clone(),
			hOut2 = freeMode ? getRandomVfromV(hOut1).rotate(rdmRotation) : _s.handleOut;

		var freeLetter = freeWord.children[letterIndex],
			isFirstLetter = letterIndex == 0,
			isFirstSegment = segmentIndex == 0;

		if (reset)
		{
			if (freeMode && !isFirstLetter && isFirstSegment)
			{
				var __s = freeWord.children[letterIndex-1].lastSegment;
				freeWord.children[letterIndex].segments[segmentIndex].point = __s.point;
				freeWord.children[letterIndex].segments[segmentIndex].handleOut = __s.handleIn.multiply(-1);
			}

			freeWord.children[letterIndex].segments[segmentIndex].point = p2;
			freeWord.children[letterIndex].segments[segmentIndex].handleIn = hIn2;
			freeWord.children[letterIndex].segments[segmentIndex].handleOut = hOut2;
			return;
		}

		var d = p1.getDistance(p2),
			_duration = !freeMode ? duration : Math.max(d*speed, durationMin);

		anims[animIndex] = App.Anim.add({
			duration : _duration,//App.rdmRange(duration, duration*2),
			easing:'easeInOutQuad',
			action   : function(time, data)
			{
				if (freeMode && !isFirstLetter && isFirstSegment)
				{
					var __s = freeWord.children[letterIndex-1].lastSegment;
					freeWord.children[letterIndex].segments[segmentIndex].point = __s.point;
					freeWord.children[letterIndex].segments[segmentIndex].handleOut = __s.handleIn.multiply(-1);
				}
				else
				{
					freeWord.children[letterIndex].segments[segmentIndex].point = App.rampPoints(p1, p2, time);
					freeWord.children[letterIndex].segments[segmentIndex].handleIn = App.rampPoints(hIn1, hIn2, time);
					freeWord.children[letterIndex].segments[segmentIndex].handleOut = App.rampPoints(hOut1, hOut2, time);
				}

			},
			callback: function(data)
			{
				addAnim(letterIndex, segmentIndex, animIndex);
				App.callback(callback);
			}
		});
	}





	function removeAnim()
	{
		for (var i=0; i<anims.length; i++)
		{
			var anim = anims[i];
			App.removeAnimation(anim);
		}
		anims = [];

		if (line)
		{
			line.remove();
			line = null;
		}
	}


	

	function restartAnim(callback)
	{
		removeAnim();
		startAnim(callback);
	}





	function getRandomLength()
	{
		var bounds = App.getBounds();
		return randomPointsCoeff * Math.min(bounds.width, bounds.height);
	}

	function getRandomV()
	{
		var rdmL = getRandomLength();
		return [
			App.rdmRange(-rdmL, rdmL),
			App.rdmRange(-rdmL, rdmL)
		]
	}

	function getRandomVfromV(v)
	{
		var bounds = App.getBounds(),
			size = Math.min(bounds.width, bounds.height),
			rdmL = App.rdmRange(randomLengthMin * size, randomLengthMax * size);
		return v.normalize(rdmL);
	}
}