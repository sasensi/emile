function Word (config, Game)
{
	// parametters
	var defaultConfig =
		{
			word             : 'test',
			position         : paper.view.center,
			size             : App.Font.info.ascender - App.Font.info.descender,
			space            : 1,
			openTypeFeatures : ['calt'],
			letterBox        : false,
			style            : null,
			charArray        : null,
			pivotPoint       : null
		},

		ligatureSpeed    = 1,
		ligatureMinDelay = 300
		;

	// optional arguments
	if (!config)
	{
		config = defaultConfig;
	}
	else
	{
		for (var k in defaultConfig)
		{
			config[k] = config[k] != null ? config[k] : defaultConfig[k];
		}
	}


	// local variables
	var t = this,
		word,
		avaiableAccents
		;

	// global variables
	t.active;
	t.slider;
	t.word;

	// fires before deleting word, remove audio and paper data
	t.clear = function()
	{
		word.remove();
		if (t.slider)
			t.slider.clear();
	}
	t.remove = t.clear;

	// init interaction with word
	t.activate = function()
	{
		t.active = true;
		t.slider = new Slider(word, t);
	}

	t.animateLigature = function(indexArr, callback, delayCoeff)
	{
		delayCoeff = delayCoeff || 1;

		var callbackExecuted = false,
			validAnim        = false,
			delayOffset      = 0;

		for (var i=0; i<indexArr.length; i++)
		{
			var letter       = t.word.children[indexArr[i]],
				charName     = letter.data.charName,
				radical      = charName[0],
				isLigature   = charName.indexOf('.lig') >= 0,
				ligatureAnim = null,
				accentOffset = avaiableAccents.indexOf(charName.split('.')[0]) >= 0 ? -1 : 0
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
				validAnim = true;

				// hide segment
				var path    = letter.children[letter.children.length - 1 - ligatureAnim[0] + accentOffset],
					segment = path.segments[path.segments.length - 1 - ligatureAnim[1]],
					l1      = segment.location.offset,
					l2      = path.length;

				// init anim
				path.dashArray = [l1, path.length];

				var delay = Math.max((l2 - l1) * ligatureSpeed, ligatureMinDelay) * delayCoeff;

				letter.data.ligatureAnim = App.Anim.add({
					duration : delay,
					delay    : delayOffset,
					data     : [path,l1,l2,letter],
					easing   : 'easeInQuad',
					action   : function(time, data)
					{
						var _path = data[0],
							l     = App.ramp(data[1],data[2],time);
						_path.dashArray = [l,path.length];
					},
					callback : function(data)
					{
						data[0].dashArray = null;
						data[3].data.ligatureAnim = null;
						if (!callbackExecuted && typeof callback === 'function')
						{
							callbackExecuted = true;
							callback();
						}
					}
				});

				delayOffset += delay;
			}
		}

		if (!validAnim && typeof callback === 'function')
		{
			callback();
		}
	}

	t.resetLigature = function(indexArr)
	{
		var callbackExecuted = false,
			validAnim        = false,
			delayOffset      = 0;

		for (var i=0; i<indexArr.length; i++)
		{
			var letter       = t.word.children[indexArr[i]],
				charName     = letter.data.charName,
				radical      = charName[0],
				isLigature   = charName.indexOf('.lig') >= 0,
				ligatureAnim = null,
				accentOffset = avaiableAccents.indexOf(charName.split('.')[0]) >= 0 ? -1 : 0
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
				validAnim = true;

				// hide segment
				var path    = letter.children[letter.children.length - 1 - ligatureAnim[0] + accentOffset],
					segment = path.segments[path.segments.length - 1 - ligatureAnim[1]],
					l1      = segment.location.offset;

				// init anim
				path.dashArray = [l1, path.length];
			}
		}
	}

	// local methods
	function init()
	{
		t.active = false;

		charArray = config.charArray || getCharArray(config.word);


		// init variables
		word           = new paper.Group();
		word.name      = 'word_' + config.word;
		word.data.name = config.word;
		word.data.charName = charArray.join(',');

		avaiableAccents = App.getFontAccents(['acute','grave','dieresis','circumflex']);
		// console.log('new word',config.word,charArray)

		var prevGlyph = null,
			prevChar  = null,
			offset    = 0;

		// loop characters
		for (var i=0; i<charArray.length; i++)
		{
			var ch = charArray[i];

			// check if character is in the font
			if (App.Font.glyphs[ch])
			{
				// loop paths
				var paths = App.Font.glyphs[ch].paths,
					glyph = new paper.Group();

				glyph.name = 'glyph_' + ch;
				glyph.data.charName = ch;
				glyph.data.name = config.word[i];
				// console.log('new glyph',config.word[i])

				// store following letter
				// var followingLetter = i == charArray.length-1 ? null : 

				for (var j=0; j<paths.length; j++)
				{
					var pathData = paths[j],
						path     = new paper.Path(pathData);

					// check path
					if (path.segments.length > 1)
					{
						glyph.appendTop(path);
					}
				}

				if (config.style)
				{
					App.setStyle(glyph, config.style);
				}

				
				// check kerning
				var kerningLeft = prevChar ? getKerningLeft(ch, prevChar) : 0;

				// move glyph
				var offset_before = App.Font.glyphs[ch].left + kerningLeft,
					offset_after  = App.Font.glyphs[ch].right,
					offset_width  = ch == 'space' ? App.Font.glyphs[ch].width * config.space : glyph.bounds.width,
					offset_total  = offset_before + offset_width + offset_after;


				// 
				// tweak change spacing values to avoid an export from glyphs bug
				// 

				var tweakArr = ['acute','grave','dieresis','circumflex'];
				for (var k=0; k<tweakArr.length; k++)
				{
					var str = tweakArr[k];
					if (ch.indexOf(str) > 0)
					{
						var newCh = ch.replace(str, '');
						// console.log('tweaked',ch,newCh);
						offset_before = App.Font.glyphs[newCh].left + kerningLeft,
						offset_after  = App.Font.glyphs[newCh].right,
						offset_total  = offset_before + offset_width + offset_after;
						break;
					}
				}



				// space box
				var p1 = new paper.Point(-kerningLeft, -App.Font.info.ascender),
					p2 = new paper.Point(offset_total - kerningLeft, -App.Font.info.descender),
					p3 = p1.add(p2.multiply(.5));

				if (config.letterBox && ch != 'space')
				{
					var box = new paper.Path.Rectangle(p1,p2);
					glyph.appendBottom(box);

					glyph.pivot = box.bounds.center;
				}
				else
				{
					if (config.pivotPoint)
					{
						glyph.pivot = p3;
					}
					else
					{
						glyph.pivot = glyph.bounds.center;
					}
				}

				

				

				// move glyph
				glyph.translate([offset + kerningLeft, 0]);
				offset += offset_total;


				// store glyph for next operations
				// check glyph
				if (glyph.children.length > 0)
				{
					word.appendTop(glyph);

					prevGlyph = glyph;
					prevChar = ch;
				}
				else
				{
					glyph.remove();
				}
			}
			else
			{
				// check space
				if (ch == ' ' && prevGlyph)
				{
					offset += config.space || 70;
				}
				else
				{
					console.log('the character',ch,'isn\'t in the font');
				}
			}
		}

		// word properties
		var posX = 0;
		for (var i=0; i<word.children.length; i++)
		{
			posX += word.children[i].pivot.x;
		}
		posX /= word.children.length;

		word.pivot = [posX,word.position.y];

		word.position = config.position;
		word.scaling = config.size / defaultConfig.size;

		word.data.object = t;

		t.word = word;

		return word;
	}

	// search for ligatures in the font and return an array with replaced characters
	function getCharArray(str)
	{
		var result    = [],
			prevChar = null;

		// get clean char array with mapped characters and only char that are in the font
		var cleanCharArray = [];
		for (var i=0; i<str.length; i++)
		{
			var currentChar = str[i];

			// apply char map
			currentChar = App.mapChar(currentChar) || currentChar;

			// check if char is in the font
			if (App.Font.glyphs[currentChar])
			{
				cleanCharArray.push(currentChar);
			}
		}

		// loop char
		for (var i=0; i<cleanCharArray.length; i++)
		{
			var currentChar = cleanCharArray[i];

			// apply open type features
			// loop features
			if (config.openTypeFeatures && config.openTypeFeatures.length > 0)
			{
				for (var j=0; j<App.Font.features.length; j++)
				{
					var featureType = App.Font.features[j][0],
						featuresArr = App.Font.features[j][1];

					if (config.openTypeFeatures.indexOf(featureType) >= 0)
					{
						// loop features array
						for (var k=0; k<featuresArr.length; k++)
						{
							var feature = featuresArr[k];

							switch (featureType)
							{
								case 'salt':
									var searchArr   = feature[0],
										replaceArr  = feature[1],
										searchIndex = getSearchIndex(searchArr, currentChar);

									if (searchIndex[0])
									{
										// replace current character with salt char
										// console.log('salt feature replacing ',currentChar,'with',getReplaceChar(replaceArr, searchIndex[1])[1])
										currentChar = getReplaceChar(replaceArr, searchIndex[1])[1];
									}

									break;

								case 'calt':
									var target     = feature[3],
										searchArr  = target == 0 ? feature[0] : feature[1],
										compareArr = target == 0 ? feature[1] : feature[0],
										replaceArr = feature[2];

									// search after
									if (target == 0 && i < cleanCharArray.length-1)
									{
										var searchIndex = getSearchIndex(searchArr, currentChar);

										if (searchIndex[0])
										{
											var compareChar  = cleanCharArray[i+1],
												compareIndex = getSearchIndex(compareArr, compareChar);
											if (compareIndex[0])
											{
												// replace current character with calt
												// console.log('calt feature replacing ',currentChar,'with',getReplaceChar(replaceArr, searchIndex[1])[1])
												currentChar = getReplaceChar(replaceArr, searchIndex[1])[1];
											}
										}
									}

									// search before
									else if (target == 1 && prevChar)
									{
										var searchIndex = getSearchIndex(searchArr, currentChar);

										if (searchIndex[0])
										{
											var compareChar  = prevChar,
												compareIndex = getSearchIndex(compareArr, compareChar);
											if (compareIndex[0])
											{
												// replace current character with calt
												// console.log('calt feature replacing ',currentChar,'with',getReplaceChar(replaceArr, searchIndex[1])[1])
												currentChar = getReplaceChar(replaceArr, searchIndex[1])[1];
											}
										}
									}

									break;
							}
						}
					}
				}
			}

			// store current character
			prevChar = currentChar;
			result.push(currentChar);			
		}

		return result;
	}


	// Open Type
	function isGroup(term)
	{
		if (term[0] == '@' && term.length > 1 && App.Font.groups[term.substr(1,term.length)])
		{
			return App.Font.groups[term.substr(1,term.length)];
		}
		else
		{
			return false;
		}
	}

	function getSearchIndex(arr, ch, counter)
	{
		var globalCounter = counter || 0;
		for (var i=0; i<arr.length; i++)
		{
			// if is array
			var group = isGroup(arr[i]);
			if (group)
			{
				var result = getSearchIndex(group, ch, globalCounter);
				if (result[0] === true)
				{
					return [true, result[1]];
				}
				else
				{
					globalCounter = result[1];
				}
			}
			else if (arr[i] == ch)
			{
				return [true, globalCounter]
			}
			else
			{
				globalCounter++;
			}
		}
		return [false, globalCounter];
	}


	function getReplaceChar(arr, index, counter)
	{
		var globalCounter = counter || 0;
		for (var i=0; i<arr.length; i++)
		{
			// if is array
			var group = isGroup(arr[i]);
			if (group)
			{
				var result = getReplaceChar(group, index, globalCounter);
				if (result[0] === true)
				{
					return [true, result[1]];
				}
				else
				{
					globalCounter = result[1];
				}
			}
			else if (globalCounter == index)
			{
				return [true, arr[i]]
			}
			else
			{
				globalCounter++;
			}
		}
		return [false, globalCounter];
	}


	// Kerning
	function getKerningLeft(ch, prevChar)
	{
		// check if chars are part of kerning groups
		var prevKerningGroup = checkKerningGroup(prevChar, true),
			kerningGroup     = checkKerningGroup(ch, false);

		// check if the pair as a kerning value
		var queryString = prevKerningGroup + '/' + kerningGroup;
		if (App.Font.kerning[queryString])
		{
			return App.Font.kerning[queryString];
		}
		else
		{
			return 0;
		}
	}

	function checkKerningGroup(ch, right)
	{
		var pattern = right ? '@MMK_L' : '@MMK_R';

		for (var k in App.Font.groups)
		{
			if (k.indexOf(pattern) >= 0 && App.Font.groups[k].indexOf(ch) >= 0)
			{
				return k;
			}
		}

		return ch;
	}

	// launch init
	return init();
}