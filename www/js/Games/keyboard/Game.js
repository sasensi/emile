App.Games.add('keyboard', new function()
{
	// params
	var letterStyle       = App.config.styles.movableStroke,
		drawingStyle      = App.config.styles.stroke,
		targetHelperStyle = App.extendObject(App.config.styles.target, {strokeColor:App.config.colors.user}),

		linkLimit  = 50,
		zoomMargin = .1,

		onlyTrueWords = true,

		accents      = ['acute','grave','dieresis','circumflex'],

		letterPlacementSpeed = 6,
		itemDisparitionDelay = 300,

		fadeOpacity = App.config.fadeOpacity
		;

	// local variables
	var t = this,

		lettersLayer,
		lettersGroup,
		accentsGroup,
		wordsGroup,
		drawingsGroup,
		targetHelper,

		dragging,
		gamePlaying,
		animatingWord,

		currentDrawing
		;

	// global variables
	t.avaiableAccents;

	// global methods
	t.init = function()
	{
		gamePlaying       = false;
		animatingWord     = false;
		currentDrawing    = null;
		t.avaiableAccents = App.getFontAccents(accents);


		lettersLayer = new paper.Layer();
		lettersLayer.name = 'lettersLayer';

		lettersGroup = new paper.Group();
		lettersGroup.name = 'lettersGroup';

		wordsGroup   = new paper.Group();
		wordsGroup.name = 'wordsGroup';

		accentsGroup   = new paper.Group();
		accentsGroup.name = 'accentsGroup';

		drawingsGroup   = new paper.Group();
		drawingsGroup.name = 'drawingsGroup';

		lettersLayer.addChildren([wordsGroup, lettersGroup]);

		targetHelper    = new paper.Path();
		targetHelper.style = targetHelperStyle;

		Keyboard.init();

		lettersLayer.activate();
	}

	t.start = function()
	{
		gamePlaying = true;
	}

	t.play = function()
	{
		gamePlaying = true;
		
	}

	t.pause = function()
	{
		gamePlaying = false;
	}


	// interactions
	t.onCursorDown = function(e)
	{
		if (!gamePlaying || dragging)
			return;

		// drawing mode
		if (currentDrawing)
		{
			currentDrawing.onCursorDown(e);
			dragging = [e.id,true];
			return;
		}

		// drawings
		for (var i=0; i<drawingsGroup.children.length; i++)
		{
			var drawing = drawingsGroup.children[i];
			if (drawing.bounds.contains(e.point))
			{
				dragging = [e.id,'drawing',drawing];
				return;
			}
		}

		// keyboard
		var keyboardHitTest = Keyboard.hitTest(e.point);
		if (keyboardHitTest)
		{
			dragging = [e.id,'keyboard',keyboardHitTest];
			return;
		}


		// sliders
		for (var i=0; i<wordsGroup.children.length; i++)
		{
			var word    = wordsGroup.children[i],
				wordObj = word.data.object;
			if (wordObj.active)
			{
				var slider = wordObj.slider;
				if (slider.hitTestDot(e.point))
				{
					dragging = [e.id,'slider',slider];
					slider.touch(e.point);
					return;
				}
			}
		}

		var lettersHitTest = hitTestLetters(e.point);
		if (lettersHitTest)
		{
			lettersGroup.appendTop(lettersHitTest);
			dragging = [e.id,'letter',lettersHitTest];
			return;
		}

		// words
		var wordsHitTest = hitTestWords(e.point);
		if (wordsHitTest)
		{
			var word  = wordsHitTest[0],
				index = wordsHitTest[1];

			var letter = breakWord(word, index);

			dragging = [e.id,'letter',letter];

			var link = checkLink(letter);

			if (link)
				showtargetHelper(link[0], link[1]);
			return;
		}
		
	}

	t.onCursorMove = function(e)
	{
		if (!gamePlaying || !dragging || dragging[0] != e.id)
			return;

		if (targetHelper.segments.length > 0)
			targetHelper.removeSegments();

		// drawing
		if (currentDrawing)
		{
			currentDrawing.onCursorMove(e);
			return;
		}

		var dragId     = dragging[0],
			dragType   = dragging[1],
			dragTarget = dragging[2];

		switch(dragType)
		{
			case 'drawing':
				dragTarget.translate(e.delta);
				// check keyboard hover
				if (Keyboard.hitTestZone(dragTarget.bounds.bottomCenter))
					dragTarget.opacity = fadeOpacity;
				else
					dragTarget.opacity = 1;
				break;

			case 'slider':
				// check complete
				if (dragTarget.drag(e.point))
				{
					startDrawing(dragTarget.word);
					dragging = null;
				}
				// cancel slider
				else if (!dragTarget.hitTestZone(e.point))
				{
					dragTarget.removeTouch();
					dragging = null;
				}
				break;

			case 'keyboard':
				// check keyboard zone
				// continue dragging
				var letter = Keyboard.getLetter(dragTarget);
				if (Keyboard.hitTestZone(letter.children[1].bounds.bottomCenter))
				{
					Keyboard.drag(dragTarget, e.delta);
				}

				// clone letter and send original back to keyboard
				else
				{
					Keyboard.release(dragTarget);

					var letter = Keyboard.getLetterClone(dragTarget);
					letter.data.anim = null;
					App.setStyle(letter, letterStyle);
					letter.firstChild.strokeColor = null;
					// letter.firstChild.selected = true;

					// check Accent
					if (accents.indexOf(dragTarget) >= 0)
					{
						accentsGroup.appendTop(letter);
						dragging = [e.id,'accent', letter];
					}
					else
					{
						lettersGroup.appendTop(letter);
						dragging = [e.id,'letter', letter];
					}
				}
				break;

			case 'accent':
				if (Keyboard.hitTestZone(dragTarget.children[1].bounds.bottomCenter))
					dragTarget.opacity = fadeOpacity;
				else
					dragTarget.opacity = 1;


				var link = checkLinkAccent(dragTarget);
				if (link)
					showtargetHelper(link[0]);

				dragTarget.translate(e.delta);
				break;

			case 'letter':
				if (Keyboard.hitTestZone(dragTarget.children[1].bounds.bottomCenter))
					dragTarget.opacity = fadeOpacity;
				else
					dragTarget.opacity = 1;

				// search for a close letter to link
				var link = checkLink(dragTarget);
				if (link)
					showtargetHelper(link[0], link[1]);

				dragTarget.translate(e.delta);
				break;
		}
	}

	t.onCursorUp = function(e)
	{
		if (!gamePlaying || !dragging || dragging[0] != e.id)
			return;

		if (targetHelper.segments.length > 0)
			targetHelper.removeSegments();

		// drawing
		if (currentDrawing)
		{
			currentDrawing.onCursorUp(e);
			dragging = null;
			return;
		}

		var dragId     = dragging[0],
			dragType   = dragging[1],
			dragTarget = dragging[2];

		switch(dragType)
		{
			case 'drawing':
				if (Keyboard.hitTestZone(dragTarget.bounds.bottomCenter))
				{
					removeItem(dragTarget);
				}
				break;

			case 'slider':
				dragTarget.removeTouch();
				break;

			case 'keyboard':
				// release touch and check tap
				Keyboard.release(dragTarget, true)
				break;

			case 'accent':
				if (Keyboard.hitTestZone(dragTarget.children[1].bounds.bottomCenter))
				{
					removeItem(dragTarget);
				}
				
				else
				{
					var link = checkLinkAccent(dragTarget);
					if (link)
					{
						accentuateLetter(link, dragTarget, function(){
							dragTarget.remove();
						});
					}
					else
						removeItem(dragTarget);
				}
				break;

			case 'letter':
				// on keyboard zone, remove letter
				if (Keyboard.hitTestZone(dragTarget.children[1].bounds.bottomCenter))
				{
					removeItem(dragTarget);
				}
				else
				{
					var link = checkLink(dragTarget);
					if (link)
						compileWord(dragTarget, link[0]);
				}
				break;
		}

		dragging = null;
	}

	t.onResize = function()
	{
		Keyboard.resize();
	}


	function hitTestLetters(point)
	{
		for (var i=lettersGroup.children.length-1; i>=0; i--)
		{
			var letter = lettersGroup.children[i];
			if (letter.data.anim == null && letter.firstChild.bounds.contains(point))
			{
				return letter;
			}
		}
		return null;
	}

	function hitTestWords(point)
	{
		// loop words
		for (var i=wordsGroup.children.length-1; i>=0; i--)
		{
			var word = wordsGroup.children[i];
			if (word.data.anim == null)
			{
				// loop letters
				for (var j=0; j<word.children.length; j++)
				{
					var letter = word.children[j];
					if (letter.firstChild.bounds.contains(point))
					{
						return [word, j];
					}
				}
			}
		}
		return null;
	}


	function checkLink(target, word)
	{
		var closestLink = getClosestLetter(target, word);
		if (!closestLink)
			return null;

		var	closest     = closestLink[0],
			wordIndex   = closestLink[1];

		// check left or right
		var targetOnLeft = closest.firstChild.position.x > target.firstChild.position.x,
			targetSide   = targetOnLeft ? 'right' : 'left',
			closestSide  = targetOnLeft ? 'left' : 'right',
			targetP      = target.firstChild.bounds[targetSide + 'Center'],
			closestP     = closest.bounds[closestSide + 'Center'],
			d            = targetP.getDistance(closestP);

		// check anim
		if (closest.data.anim != null || closest.data.ligatureAnim != null)
			return null;

		if (d < linkLimit || closest.firstChild.bounds.contains(targetP) || closest.firstChild.bounds.contains(target.firstChild.position))
		{
			// console.log('closest is',closest.name,'link on target',targetSide,'side');
			return [closest, targetOnLeft, wordIndex];
		}
		return null;
	}

	function checkLinkAccent(accent)
	{
		var closestLink = getClosestLetter(accent);
		if (!closestLink)
			return null;

		var	closest     = closestLink[0],
			wordIndex   = closestLink[1];

		if (accent.firstChild.intersects(closest.firstChild))
		{
			// check compatibility
			var letterName = closest.data.name,
				accentName = accent.data.charName,
				name = letterName + accentName;

			if (t.avaiableAccents.indexOf(name) >= 0)
			{
				name = App.unMapChar(name);
				return [closest, name];
			}
			// replace existing accent
			else
			{
				var otherName = closest.data.charName.substr(0,1) + accentName;
				if (t.avaiableAccents.indexOf(otherName) >= 0)
				{
					name = App.unMapChar(otherName);
					return [closest, name];
				}
			}
		}
		return null;
	}

	function accentuateLetter(link, accent, callback)
	{
		var letter     = link[0],
			letterName = link[1],
			isWord     = letter.parent.name.split('_')[0] == 'word',
			newWord,
			destinationLetter
			;

		// letter case
		if (isWord)
		{
			var word     = letter.parent,
				wordName = word.data.name,
				index    = letter.index,
				newName  = wordName.substr(0,index) + letterName + wordName.substr(index+1);

			newWord  = new Word({word:newName, letterBox:true, size:word.bounds.height, style:letterStyle, position:word.position}, t);
			destinationLetter = newWord.children[index];
		}
		else
		{
			newWord = new Word({word:letterName, letterBox:true, size:letter.bounds.height, style:letterStyle, position:letter.position}, t);
			destinationLetter = newWord.firstChild;
		}

		// anim accent
		var v  = destinationLetter.lastChild.position.subtract(accent.lastChild.position),
			p1 = accent.position,
			p2 = p1.add(v);

		newWord.visible = false;

		App.Anim.add({
			duration: v.length * letterPlacementSpeed,
			action: function(time)
			{
				accent.position = App.rampPoints(p1,p2,time);
			},
			callback: function()
			{
				newWord.visible = true;

				if (isWord)
					letter.parent.data.object.clear();
				else
					letter.remove();

				wordsGroup.appendTop(newWord);
				activateWord(newWord);

				if (typeof callback === 'function')
					callback();
			}
		})

	}

	function checkWordLink(word)
	{
		var letters = word.children; //[word.firstChild, word.lastChild];
		for (var i=0; i<letters.length; i++)
		{
			var letter = letters[i],
				link = checkLink(letter, word);

			if (link)
			{
				compileWord(letter, link[0]);
				return true;
			}
		}
	}


	function getClosestLetter(target, word)
	{
		var minD      = null,
			closest   = null,
			wordIndex = null;

		// check letters
		for (var i=0; i<lettersGroup.children.length; i++)
		{
			var letter = lettersGroup.children[i];
			if (target == letter || (dragging && dragging[2] == letter))
				continue;

			var d = target.firstChild.position.getDistance(letter.firstChild.position);

			if (!minD || d < minD)
			{
				minD    = d;
				closest = letter;
			}
		}

		// check words
		for (var i=0; i<wordsGroup.children.length; i++)
		{
			var _word = wordsGroup.children[i];
			if (word && word == _word)
				continue;

			for (var j=0; j<_word.children.length; j++)
			{
				var letter = _word.children[j];
				if (target == letter)
					continue;

				var d = target.firstChild.position.getDistance(letter.firstChild.position);

				if (!minD || d < minD)
				{
					minD      = d;
					closest   = letter;
					wordIndex = j;
				}
			}
		}

		if (closest)
		{
			return [closest, wordIndex];
		}
		return null;
	}
	
	function compileWord(item1, item2)
	{
		// make an array containing all sub items stored by x position
		var items   = [],
			arr     = [item1, item2],
			medX    = 0,
			arrY    = {},
			maxD    = null;

		for (var i=0; i<arr.length; i++)
		{
			var item = arr[i];
			if (isWordChild(item))
			{
				var parent = item.parent;
				for (var j=0; j<parent.children.length; j++)
				{
					var child = parent.children[j];
					items.push([child,child.firstChild.position.x])
				}
			}
			else
			{
				items.push([item,item.firstChild.position.x]);
			}
		}

		// calc position of new word
		for (var i=0; i<items.length; i++)
		{
			var item = items[i][0];
			medX += items[i][1];
			arrY[item.firstChild.position.y] = arrY[item.firstChild.position.y] ? arrY[item.firstChild.position.y] + 1 : 1;
		}

		medX /= items.length;

		var maxY = null,
			yPos = null,
			equality = false;
		for (var k in arrY)
		{
			if (!maxY || arrY[k] > maxY)
			{
				maxY = arrY[k];
				yPos = k;
				equality = false;
			}
			else if (arrY[k] == maxY)
			{
				equality = true;
			}
		}

		if (equality)
			yPos = item1.firstChild.position.y;

		var newWordPosition = [medX, yPos];

		// sort items by abscisse
		items.sort(function(a,b){
			if (a[1] < b[1]) {
		        return -1;
		    }
		    if (a[1] > b[1]) {
		        return 1;
		    }
		    return 0;
		});

		// make new word with all letters
		var newWordName = '';
		for (var i=0; i<items.length; i++)
		{
			var item = items[i][0];
			newWordName += item.data.name;
		}

		var newWord = new Word({word:newWordName, letterBox:true, style:letterStyle, position:newWordPosition, size:items[0][0].bounds.height}, t);

		// calculate maximum distance to set animation speed and calc position arr
		var positionArr = [],
			indexArr    = [];

		for (var i=0; i<items.length; i++)
		{
			var item = items[i][0],
				d    = item.firstChild.position.getDistance(newWord.children[i].firstChild.position);

			maxD = !maxD || d > maxD ? d : maxD;
			positionArr.push([item.firstChild.position, newWord.children[i].firstChild.position]);

			// add to ligature anim arr
			if (item.data.charName != newWord.children[i].data.charName)
			{
				// reset ligature
				resetLigature(item);
				indexArr.push(i);
			}
		}

		// hide new word
		newWord.visible = false;

		// anim each letter
		var animId = App.Anim.add({
			duration : maxD * letterPlacementSpeed,
			action   : function(time)
			{
				for (var i=0; i<items.length; i++)
				{
					var p = App.rampPoints(positionArr[i][0],positionArr[i][1],time);
					items[i][0].position = p;
				}
			},
			callback : function()
			{
				// remove all
				newWord.data.anim = null;
				for (var i=0; i<arr.length; i++)
				{
					var item = arr[i];
					if (isWordChild(item))
					{
						var parent = item.parent;
						parent.data.object.clear();
					}
					else
					{
						item.remove();
					}
				}

				// anim ligatures and show new word
				newWord.data.object.animateLigature(indexArr, function(){
					// check other near words or activate word
					if (!checkWordLink(newWord))
					{
						wordsGroup.appendTop(newWord);
						activateWord(newWord);
					}
				})
				newWord.visible = true;
			}
		});

		// set animId for all
		newWord.data.anim = animId;
		item1.data.anim   = animId;
		item2.data.anim   = animId;
		for (var i=0; i<items.length; i++)
		{
			var item = items[i][0];
			item.data.anim = animId;
		}
	}

	function isWordChild(item)
	{
		return item.parent && item.parent.name && item.parent.name.split('_')[0] == 'word';
	}

	function resetLigature(letter)
	{
		// check if item has ligature
		var charName     = letter.data.charName,
			radical      = charName[0],
			isLigature   = charName.indexOf('.lig') >= 0,
			ligatureAnim = null,
			accentOffset = t.avaiableAccents.indexOf(charName.split('.')[0]) >= 0 ? -1 : 0
			;

		for (var k in App.config.ligatureSegments)
		{
			if (k.indexOf(radical) >= 0)
			{
				ligatureAnim = App.config.ligatureSegments[k];
				break;
			}
		}

		if (isLigature && ligatureAnim != null)
		{
			// hide segment
			var path    = letter.children[letter.children.length - 1 - ligatureAnim[0] + accentOffset],
				segment = path.segments[path.segments.length - 1 - ligatureAnim[1]],
				l1      = segment.location.offset;

			// init anim
			path.dashArray = [l1, path.length];
		}
	}


	function activateWord(word)
	{
		// check if word is in dictionary
		if (!onlyTrueWords || App.Dictionary.indexOf(word.data.name) >= 0)
		{
			word.data.object.activate();
		}
	}


	function alignWord(word, point, bound)
	{
		var letter = bound == 'leftCenter' ? word.firstChild : word.lastChild,
			box    = letter.firstChild,
			p      = box.bounds[bound],
			v      = point.subtract(p);

		word.translate(v);
	}


	function breakWord(word, index)
	{
		var wordName            = word.data.name,
			brokenWordLeftName  = wordName.substr(0,index),
			extractedLetterName = wordName[index],
			brokenWordRightName = wordName.substr(index+1,wordName.length),

			names        = [wordName.substr(0,index), wordName[index], wordName.substr(index+1,wordName.length)],
			indexArr     = [-1, 0, 1],
			boundsArr    = ['rightCenter', 'center', 'leftCenter'],
			createdWords = [],
			result
			;

		for (var i=0; i<names.length; i++)
		{
			if (names[i] == '')
				continue;

			var name   = names[i],
				_index = index + indexArr[i],
				bound  = boundsArr[i],
				_word  = new Word({word:name, letterBox:true, size:word.bounds.height, style:letterStyle}, t);

			alignWord(_word, word.children[_index].firstChild.bounds[bound], bound);

			if (name.length > 1)
			{
				wordsGroup.appendTop(_word);
				createdWords.push(_word);
			}
			else
			{
				if (i == 1)
				{
					result = _word.firstChild;
				}
				lettersGroup.appendTop(_word.firstChild);
				_word.remove();
			}
		}

		for (var i=0; i<createdWords.length; i++)
		{
			// check for other close letters or words
			var _word = createdWords[i];
			activateWord(_word);
		}

		word.data.object.clear();
		return result;
	}


	function showtargetHelper(target, onLeft)
	{
		var offset    = [0, -target.firstChild.bounds.height * .275],
			offset2   = [0, -target.firstChild.bounds.height * .14]
			boxBounds = target.firstChild.bounds;
		// accent case
		if (onLeft == null)
		{
			targetHelper.add(boxBounds.bottomLeft.add(offset));
			targetHelper.add(boxBounds.bottomRight.add(offset));
		}
		else
		{
			var p1 = onLeft ? boxBounds.bottomLeft.add(offset) : boxBounds.bottomRight.add(offset),
				p2 = p1.add(offset2);

			targetHelper.add(p1);
			targetHelper.add(p2);

		}
	}




	function startDrawing(_Word)
	{
		var word = _Word.word;

		Keyboard.hide();

		_Word.slider.clear();
		
		zoomLayer(word, function(){
			currentDrawing = new Drawing(word, t, {
				showPath    : true,
				name        : word.data.name,
				morph       : .4,
				ghostGroup  : true,
				helpPath    : null,
				limit       : null,
				checkPoints : true,
				accuracy    : true
			});
			currentDrawing.start();
		});
	}

	function zoomLayer(word, callback)
	{
		gamePlaying = false;
		lettersLayer.applyMatrix = false;

		// remove letter boxes
		for (var i=0; i<word.children.length; i++)
		{
			var letter = word.children[i],
				box    = letter.firstChild;
			box.remove();
		}

		word.pivot = word.bounds.center;
		lettersLayer.pivot = word.position;

		var p1 = lettersLayer.position,
			p2 = paper.view.center,

			w1 = word.bounds.width,
			w2 = paper.view.bounds.width * (1 - zoomMargin * 2),
			sW = w2/w1,
			h1 = word.bounds.height,
			h2 = paper.view.bounds.height * (1 - zoomMargin * 2),
			sH = h2/h1,

			s1 = 1,
			s2 = Math.min(sW,sH)
			;

		// store position
		lettersLayer.data.position = lettersLayer.position;
		lettersLayer.data.scaling = lettersLayer.scaling.x;

		lettersLayer.data.translation = p1.subtract(p2);
		lettersLayer.data.zoom = s1/s2;

		App.Anim.add({
			duration : 1000,
			action   : function(time)
			{
				var scale = App.ramp(s1,s2,time);
				lettersLayer.position = App.rampPoints(p1,p2,time);
				lettersLayer.scaling = [scale, scale];
			},
			callback : function()
			{
				lettersLayer.applyMatrix = true;
				gamePlaying = true;

				if (typeof callback === 'function')
					callback();
			}
		})
	}

	function unZoomLayer()
	{
		gamePlaying = false;
		lettersLayer.applyMatrix = false;

		var p1 = lettersLayer.position,
			p2 = p1.add(lettersLayer.data.translation),
			s1 = lettersLayer.scaling.x,
			s2 = lettersLayer.data.zoom;

		App.Anim.add({
			duration : 1000,
			action   : function(time)
			{
				var scale = App.ramp(s1,s2,time);
				lettersLayer.position = App.rampPoints(p1,p2,time);
				lettersLayer.scaling = [scale, scale];
			},
			callback : function()
			{
				lettersLayer.applyMatrix = true;
				Keyboard.show();
				gamePlaying = true;
			}
		})
	}


	t.onDrawingWin = function(word)
	{
		unZoomLayer();
		currentDrawing = null;
		dragging = null;
		word.style = drawingStyle;
		drawingsGroup.appendTop(word);
	}


	function removeItem(item)
	{
		// item.bringToFront();
		App.hideItem(item, {
			callback: function()
			{
				item.remove();
			}
		});
	}










	// 
	// Keyboard object
	// 

	var Keyboard = new function()
	{
		// params
		var accentsChars        = unMapChars(accents),
			keyboardDisposition =
			[
				'a b c d e f g h i j k l m n o',
				'p q r s t u v w x y z  ' + accentsChars.join(' ')
			],

			height    = App.config.keyboardHeightCoeff,
			interline = -30,
			space     = .8,
			padding   = .08,

			minTargetWidth = 400,
			maxTargetWidth = 700,

			keyboardLettersStyle = App.extendObject(App.config.styles.stroke,
			{
				strokeColor : App.config.colors.machine,
				shadowColor : App.config.colors.game,
				shadowScale : 2
			}),
			keyboardBackgroundStyle = App.config.styles.keyboard,
			keyboardBorderStyle = keyboardLettersStyle,
			ghostOpacity = App.config.styles.strokeDestination.opacity,

			releaseDelay      = 500,
			keyboardShowDelay = 800,
			tapSpeed          = App.config.speeds.tap,
			tapMaxDelay       = App.config.delays.tap
			;

		var _t = this,
			keyboardLayer,
			keyboardLettersGroup,
			keyboardBackground,
			keyboardBorder,
			letters,
			keyBoardAnim
			;

		_t.init = function()
		{
			letters = {};

			keyboardLayer = new paper.Layer();
			keyboardLayer.name = 'keyboardLayer';

			keyboardBackground = new paper.Path.Rectangle(paper.view.bounds);
			App.setStyle(keyboardBackground, keyboardBackgroundStyle);
			keyboardBackground.name = 'keyboardBackground';
			keyboardLayer.appendTop(keyboardBackground);

			keyboardBorder = new paper.Path.Line([keyboardBackground.bounds.topLeft, keyboardBackground.bounds.topRight]);
			// keyboardBorder.style = keyboardBorderStyle;
			keyboardLayer.appendTop(keyboardBorder);

			// create letters
			keyboardLettersGroup = createLetters();
			keyboardLettersGroup.name = 'keyboardLettersGroup';
			keyboardLayer.appendTop(keyboardLettersGroup);

			// keyboardLayer.clipped = true;

			placeKeyboard();
		}

		_t.resize = function()
		{
			placeKeyboard();
		}

		_t.show = function()
		{
			keyboardLayer.visible = true;

			if (keyBoardAnim)
				App.Anim.removeAnimation(keyBoardAnim);

			keyBoardAnim = App.showItem(keyboardLayer,{
				scale:false,
				fade: true,
				callback: function()
				{
					keyBoardAnim = null;
				}
			})
			return;

			var p1 = keyboardLayer.position,
				p2 = paper.view.bounds.bottomCenter.add(0, -keyboardLayer.bounds.height*.5);

			keyBoardAnim = App.Anim.add({
				duration : keyboardShowDelay,
				easing   : 'easeOutQuad',
				action   : function(time)
				{
					keyboardLayer.position = App.rampPoints(p1,p2,time);
				},
				callback: function()
				{
					keyBoardAnim = null;
				}
			});
		}

		_t.hide = function()
		{
			if (keyBoardAnim)
				App.Anim.removeAnimation(keyBoardAnim);

			keyBoardAnim = App.hideItem(keyboardLayer,{
				scale:false,
				fade: true,
				callback: function()
				{
					keyBoardAnim = null;
				}
			})
			return;

			var p1 = keyboardLayer.position,
				p2 = paper.view.bounds.bottomCenter.add(0, keyboardLayer.bounds.height*.5);

			keyBoardAnim = App.Anim.add({
				duration : keyboardShowDelay,
				easing   : 'easeInQuad',
				action   : function(time)
				{
					keyboardLayer.position = App.rampPoints(p1,p2,time);
				},
				callback: function()
				{
					keyboardLayer.visible = false;
					keyBoardAnim = null;
				}
			});
		}


		_t.drag = function(letter, translation)
		{
			var letterGroup = letters[letter];
			if (letterGroup.data.anim)
			{
				App.Anim.removeAnimation(letterGroup.data.anim);
			}

			letterGroup.translate(translation);
		}

		_t.release = function(letter, checkTap)
		{
			var letterGroup = letters[letter],
				p1 = letterGroup.position,
				p2 = letterGroup.data.position;

			letterGroup.data.anim = App.Anim.add({
				duration : releaseDelay,
				action   : function(time)
				{
					letterGroup.position = App.rampPoints(p1,p2,time);
				},
				callback: function()
				{
					letterGroup.data.anim = null;
				}
			});

			if (checkTap)
			{
				var d = letterGroup.position.getDistance(letterGroup.data.position);
				if (d < App.config.tapDistance)
				{
					var clone = _t.getLetterClone(letter);
					App.setStyle(clone,letterStyle);
					clone.opacity = ghostOpacity;
					clone.firstChild.strokeColor = null;
					clone.data.anim = null;

					lettersLayer.appendTop(clone);

					// choose random position
					var margin           = clone.bounds.center.subtract(clone.bounds.topLeft),
						destinationPoint = new paper.Point(Math.random() * (paper.view.bounds.width - margin.x * 2), Math.random() * (paper.view.bounds.height * (1 - height) - margin.y * 2 )).add(margin),
						trajectory       = new paper.Path([clone.position, destinationPoint]);

					var amp = 30;
					trajectory.firstSegment.handleOut = [App.rdmRange(-amp,amp), App.rdmRange(0,-amp)];
					trajectory.lastSegment.handleIn = [App.rdmRange(-amp,amp), App.rdmRange(0,amp)];
					// trajectory.strokeColor = 'red';

					var ghost = clone.clone();
					ghost.opacity = ghostOpacity;
					ghost.position = destinationPoint;

					App.Anim.add({
						duration : Math.min(trajectory.length * tapSpeed, tapMaxDelay),
						easing   : 'easeInQuad',
						data     : [clone.position, destinationPoint],
						action   : function(time, data)
						{
							clone.position = App.rampPoints(data[0],data[1],time);
						},
						callback: function()
						{
							trajectory.remove();
							ghost.remove();
							lettersGroup.appendTop(clone);

							clone.opacity = letterStyle.opacity || 1;

							// accent
							if (accents.indexOf(letter) >= 0)
							{
								var link = checkLinkAccent(clone);
								if (link)
								{
									accentuateLetter(link, clone, function(){
										clone.remove();
									});
								}
								else
								{
									removeItem(clone);
								}
							}
							else
							{
								var link = checkLink(clone);
								if (link)
									compileWord(clone, link[0]);
							}
						}
					})
				}
			}
		}


		_t.getLetter = function(letter)
		{
			return letters[letter];
		}

		_t.getLetterClone = function(letter)
		{
			var clone = letters[letter].clone();
			// remove shadow
			// clone.firstChild.remove();
			return clone;
		}


		// test each letters bounds
		_t.hitTest = function(point)
		{
			for (var k in letters)
			{
				if (letters[k].bounds.contains(point))
				{
					return k;
				}
			}
			return null;
		}

		_t.hitTestZone = function(point)
		{
			return keyboardBackground.contains(point);
		}


		function createLetters()
		{
			var result = new paper.Group();

			for (var i=0; i<keyboardDisposition.length; i++)
			{
				var pos = i == 0 ? paper.view.center : paper.view.center.add(0, (result.children[i-1].bounds.height + interline)),
					line = new Word({word: keyboardDisposition[i], position:pos, space:space, openTypeFeatures:[], letterBox : true, style:keyboardLettersStyle}, t);

				// store letters
				for (var j=0; j<line.children.length; j++)
				{
					var letterGroup = line.children[j],
						name        = letterGroup.name.split('_')[1],
						target      = letterGroup.firstChild,
						prevLetter  = j == 0 ? null : line.children[j-1];


					target.strokeColor = null;
					// target.selected = true;
					
					if (target.bounds.width < minTargetWidth)
					{
						target.bounds.width = minTargetWidth;
						target.position = letterGroup.position;
					}

					else if (target.bounds.width > maxTargetWidth)
					{
						target.bounds.width = maxTargetWidth;
						target.position = letterGroup.position;
					}

					letterGroup.appendBottom(target);

					letters[name] = letterGroup;
				}

				result.appendTop(line);
			}

			return result;
		}


		function placeKeyboard()
		{
			var viewBounds = App.getBounds();
			keyboardBackground.bounds.height = height * viewBounds.height;
			keyboardBackground.bounds.width  = viewBounds.width;
			keyboardBackground.position      = viewBounds.bottomCenter.add(0, -keyboardBackground.bounds.height * .5)

			// set border
			keyboardBorder.firstSegment.point = keyboardBackground.bounds.topLeft;
			keyboardBorder.lastSegment.point = keyboardBackground.bounds.topRight;

			// set letters original position
			resetLettersPosition();

			var scale  = App.getProportionedScale(keyboardLettersGroup, 1 - padding),
				bounds = keyboardBackground.bounds.scale(scale[0], scale[1]);

			keyboardLettersGroup.fitBounds(bounds);

			// store new letters positions
			storeLettersPosition();
		}

		function resetLettersPosition()
		{
			for (var k in letters)
			{
				var letter = letters[k];
				if (letter.data.position)
				{
					letter.position = letter.data.position;
				}
			}
		}

		function storeLettersPosition()
		{
			for (var k in letters)
			{
				var letter = letters[k];
				letter.data.position = letter.position;
			}
		}

		function unMapChars(arr)
		{
			var result = [];
			for (var i=0; i<arr.length; i++)
			{
				result.push(App.unMapChar(arr[i]) || arr[i]);
			}
			return result;
		}
	}
});