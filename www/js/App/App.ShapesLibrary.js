App.ShapesLibrary = new function()
{
	// local variables
	var t = this;

	// global variables
	t.drawingsLibrary =
	{
		'castle' : [[[[215.06, -202.50], [230.56, -202.50], [230.56, -175.50], [215.06, -175.50], [215.06, -202.50]], [[167.50, -202.50], [183.00, -202.50], [183.00, -175.50], [167.50, -175.50], [167.50, -202.50]]], [[[335.28, -275.82], [350.78, -275.82], [350.78, -248.82], [335.28, -248.82], [335.28, -275.82]]], [[[47.13, -275.82], [62.63, -275.82], [62.63, -248.82], [47.13, -248.82], [47.13, -275.82]]], [[[117.29, -236.96], [146.92, -283.50], [250.21, -283.50], [279.83, -236.96]], [[94.89, -248.82], [117.30, -248.82], [117.30, -236.96], [141.14, -236.96], [141.14, -248.82], [163.70, -248.82], [163.70, -236.96], [187.38, -236.96], [187.38, -248.82], [210.09, -248.82], [210.09, -236.96], [233.63, -236.96], [233.63, -248.82], [256.49, -248.82], [256.49, -236.96], [279.87, -236.96], [279.87, -248.82], [302.88, -248.82]], [[94.89, -226.67], [303.17, -226.67]]], [[[155.03, -60.38], [155.03, -117.33], [165.80, -146.17], [199.03, -161.33], [232.26, -146.17], [243.03, -117.33], [243.03, -60.38]], [[110.07, -60.38], [287.99, -60.38]]], [[[287.99, -65.79], [398.06, -65.79], [398.06, -52.97], [287.99, -52.97], [287.99, -65.79]]], [[[343.03, -416.53], [343.03, -464.36], [376.49, -464.36], [376.49, -440.44], [342.87, -440.44]], [[299.85, -315.93], [343.03, -416.53], [385.88, -315.93]]], [[[298.88, -305.64], [298.88, -295.35], [387.17, -295.35], [387.17, -305.64]], [[287.99, -305.64], [287.99, -327.79], [299.85, -327.79], [299.85, -315.93], [312.46, -315.93], [312.46, -327.79], [324.40, -327.79], [324.40, -315.93], [336.94, -315.93], [336.94, -327.79], [348.96, -327.79], [348.96, -315.93], [361.41, -315.93], [361.41, -327.79], [373.51, -327.79], [373.51, -315.93], [385.88, -315.93], [385.88, -327.79], [398.06, -327.79], [398.06, -305.64], [287.99, -305.64]]], [[[382.88, -295.35], [382.88, -89.95], [391.79, -65.79]], [[303.17, -295.35], [303.17, -89.95], [294.27, -65.79]]], [[[55.04, -417.53], [55.04, -465.36], [88.50, -465.36], [88.50, -441.44], [54.88, -441.44]]], [[[0, -66.79], [110.07, -66.79], [110.07, -53.97], [0, -53.97], [0, -66.79]]], [[[11.86, -316.93], [55.04, -417.53], [97.89, -316.93]]], [[[94.89, -90.95], [103.80, -66.79]]], [[[15.18, -90.95], [6.27, -66.79]]], [[[0, -306.64], [0, -328.79], [11.86, -328.79], [11.86, -316.93], [24.47, -316.93], [24.47, -328.79], [36.41, -328.79], [36.41, -316.93], [48.95, -316.93], [48.95, -328.79], [60.97, -328.79], [60.97, -316.93], [73.42, -316.93], [73.42, -328.79], [85.52, -328.79], [85.52, -316.93], [97.89, -316.93], [97.89, -328.79], [110.07, -328.79], [110.07, -306.64]]], [[[10.89, -306.64], [10.89, -296.35], [99.18, -296.35], [99.18, -306.64]]], [[[0, -306.64], [110.07, -306.64]]], [[[94.89, -296.35], [94.89, -90.95]]], [[[15.18, -296.35], [15.18, -90.95]]]]
		// 'test'   : [[[[1512.65, 996.00], [1725.00, 930.02]]], [[[1665.80, 736.00], [1479.82, 930.02]]], [[[1275.00, 992.00], [1539.00, 826.00]]]]
	};

	t.figuresLibrary =
	{
		'house' : [[[[1.21, 749.32], [538.26, 749.32], [538.26, 1133.36], [1.21, 1133.36], [1.21, 749.32], [269.73, 480.79], [538.26, 749.32]]]],
		'cube'  : [[[[3948.77, 902.85], [4114.54, 1068.62], [4114.54, 1731.69], [3451.47, 1731.69], [3285.71, 1565.92]], [[3948.77, 1565.92], [4114.54, 1731.69]], [[3285.71, 902.85], [3948.77, 902.85], [3948.77, 1565.92], [3285.71, 1565.92], [3285.71, 902.85]]]],
		'mill'  : [[[[80.53, -163.36], [80.51, -81.76], [61.18, -129.03], [30.66, -131.55], [80.46, -81.73], [25.90, -104.61], [-1.15, -81.68], [80.45, -81.67], [33.18, -62.33], [30.66, -31.82], [80.49, -81.62], [57.60, -27.05], [80.53, 0], [80.54, -81.61], [99.88, -34.33], [130.39, -31.82], [80.59, -81.64], [135.16, -58.75], [162.21, -81.68], [80.60, -81.70], [127.88, -101.04], [130.39, -131.55], [80.57, -81.75], [103.46, -136.31], [80.53, -163.36]]]]
	};

	t.groups           = ['lines','brokenLines','polygons','letters','figures'];

	t.lines       = ['horizontalSegment','verticalSegment','segment','horizontalParrallelSegments','verticalParrallelSegments','parallelSegments','perpendicularSegments','rdmPerpendicularSegments','crossedSegments','multiCrossedSegments'];
	t.brokenLines = ['sawTooth','squared','squaredSawTooth','sonicWave','spiral'];
	t.polygons    = ['equilateralTriangle','rectangleTriangle','triangle','square','rectangle','trapeze','parallelogram','diamond','regularPolygon','star','polygon'];
	t.letters     = ['A','E','F','H','I','K','L','M','N','T','V','W','X','Y','Z'];
	t.figures     = [];
	t.drawings    = [];
	t.movementVectors  = ['slideLeft','slideRight','slideUp','slideDown'];

	// curves
	t.curveProgression = ['curveSingle', 'curveSerie', 'curveLetters'];
	t.curveSingle = ['quartCircle','halfCircle','arc','circle'];
	t.curveSerie = [];
	t.curveLetters = [];


	t.mirrorExceptions = ['letters','figures','movementVectors'];

	// global methods
	t.init = function()
	{
		// set letters functions
		for (var i=0; i<t.letters.length; i++)
		{
			var letter = t.letters[i];
			t[letter] = getLetterFunction(letter);
		}

		// set figures functions
		for (var k in t.figuresLibrary)
		{
			t.figures.push(k);
			t[k] = getClosureFunction(t.figuresLibrary, k);
		}

		// set drawings functions
		for (var k in t.drawingsLibrary)
		{
			t.drawings.push(k);
			t[k] = getClosureFunction(t.drawingsLibrary, k);
		}
	}



	// all shapes methods

	// lines

	t.horizontalSegment = function()
	{
		return new paper.Path([[0,0],[1,0]]);
	}

	t.verticalSegment = function()
	{
		return t.horizontalSegment().rotate(90.1);
	}

	t.segment = function()
	{
		return t.horizontalSegment().rotate(45);
	}

	t.horizontalParrallelSegments = function()
	{
		var p1 = t.horizontalSegment(),
			p2 = p1.clone().translate([0, .5]);

		return new paper.Group(p1, p2);
	}

	t.verticalParrallelSegments = function()
	{
		return t.horizontalParrallelSegments().rotate(90);
	}

	t.parallelSegments = function()
	{
		return t.horizontalParrallelSegments().rotate(45);
	}

	t.perpendicularSegments = function()
	{
		var p1 = t.horizontalSegment(),
			p2 = t.verticalSegment();

		return new paper.Group(p1, p2);
	}

	t.rdmPerpendicularSegments = function()
	{
		return t.perpendicularSegments().rotate(45)
	}

	t.crossedSegments = function()
	{
		var g = t.perpendicularSegments();
		g.children[0].rotate(Math.random() * 45);

		return g;
	}

	t.multiCrossedSegments = function()
	{
		var l = 3,
			g = new paper.Group(),
			baseLine = t.verticalSegment();

		for (var i=0; i<l; i++)
		{
			var angle = i * 180 / l;
			g.appendTop(baseLine.clone().rotate(angle));
		}

		baseLine.remove();

		return g;
	}



	// broken lines
	t.sawTooth = function()
	{
		var nbr             = 3,
			heightVariation = .2,
			width           = 1 / nbr,
			height          = width,
			path            = new paper.Path();

		for (var i=0; i<nbr; i++)
		{
			path.add([i * width, 0]);
			path.add([(i + .5) * width, height]);
		}

		// randomize path
		// if (App.rdm() > .5)
		// 	path.add([nbr * width, 0]);

		return path;
	}


	t.squared = function(options)
	{
		// default options
		if (!options)
		{
			options = {skew:null, height:null, gap:null}
		}

		// map options
		var optionRanges =
		{
			skew   : [[-.25, -.05], [.05, .1], [.4,.75]],
			height : [[0,1]],
			gap    : [[0,.25]]
		}

		mapOptions(options, optionRanges);

		var nbr        = 2,
			skewVar    = options.skew || 0,
			heightVar  = options.height || 0,
			gapVar     = options.gap || 0,

			width      = 1 / nbr,
			skewOffset = width * skewVar,
			height     = width*.5,
			gapSize    = .5,
			path       = new paper.Path();

		for (var i=0; i<nbr; i++)
		{
			var step        = width,
				startOffset = i * step,
				p0 = [startOffset + width * (.5 - gapSize * .5) - skewOffset, 0],
				p1 = [startOffset + width * (.5 - gapSize * .5) + skewOffset, height],
				p2 = [startOffset + width * (.5 + gapSize * .5) - skewOffset, height],
				p3 = [startOffset + width * (.5 + gapSize * .5) + skewOffset, 0];

			path.add(p0);
			path.add(p1);

			// if (i < nbr-1)
			// {
				path.add(p2);
				path.add(p3);
			// }
		}

		path.scale(1,-1);

		return path;
	}


	t.squaredSawTooth = function()
	{
		var args = {skew:App.rdm(), height:App.rdm(), gap:App.rdm()};
		return t.squared(args);
	}


	t.sonicWave = function()
	{
		var nbr        = 5,
			concave    = true,
			coeff      = 2,
			step       = 1,
			baseWidth  = 1,
			baseHeight = baseWidth * coeff,
			stepInc    = .3,
			offset     = 0
			path       = new paper.Path();

		path.add([0,0]);

		for (var i=0; i<nbr; i++)
		{
			var scale = 1 + i,
				mid = Math.floor(nbr/2),
				invertedIndex = nbr - i,
				w = concave && i >= mid ? baseWidth * (1 + invertedIndex * stepInc) : baseWidth * (1 + i * stepInc),
				h = w * coeff,
				x = offset + w * .5,
				y = i % 2 == 0 ? h : -h;

			path.add([x,y])

			if (i == nbr-1)
			{
				path.add([offset + w, 0]);
			}

			offset += w;
		}

		path.scale(1,-1);

		return path;
	}


	t.spiral = function()
	{
		var segmentNbr       = 7,
			path             = new paper.Path(),
			translationArray = [[1,0],[0,1],[-1,0],[0,-1]],
			point            = [0,0];

		path.add(point);

		for (var i=0; i<segmentNbr; i++)
		{
			var translationIndex  = i % translationArray.length,
				translationLength = 1 + Math.floor(i/2),
				translation       = [
					translationArray[translationIndex][0] * translationLength,
					translationArray[translationIndex][1] * translationLength
				],
				point = [point[0] + translation[0], point[1] + translation[1]];

			path.add(point);
		}

		return path;
	}





	// polygons

	t.equilateralTriangle = function()
	{
		return new paper.Path.RegularPolygon([0,0], 3, 1);
	}


	t.rectangleTriangle = function()
	{
		var p0 = [0,0],
			p1 = [0,App.rdm()],
			p2 = [App.rdm(),0];

		return new paper.Path([p0,p1,p2,p0]);
	}


	t.triangle = function()
	{
		var p0 = [App.rdm(),App.rdm()],
			p1 = [App.rdm(),App.rdm()],
			p2 = [App.rdm(),App.rdm()];

		return new paper.Path([p0,p1,p2,p0]);
	}


	t.square = function()
	{
		return new paper.Path.RegularPolygon([0,0], 4, 1);
	}


	t.rectangle = function()
	{
		return new paper.Path.Rectangle([0,0], [App.rdm(),App.rdm()]);
	}


	t.trapeze = function()
	{
		var deltaW = App.rdmRange(.15,.45),
			h = App.rdmRange(.25,1);

		return new paper.Path([
			[0,0],
			[deltaW,h],
			[1-deltaW,h],
			[1,0],
			[0,0]
		]);
	}


	t.parallelogram = function()
	{
		return t.rectangle().shear([App.rdmRange(.25,1),0]);
	}


	t.diamond = function()
	{
		var random = App.rdmRange(.25,1);
		return new paper.Path([
			[-random,0],
			[0,1],
			[random, 0],
			[0,-1],
			[[-random,0]]
		])
	}


	t.regularPolygon = function()
	{
		return new paper.Path.RegularPolygon([0,0], App.rdmIntRange(5,8), 1);
	}


	t.star = function()
	{
		return new paper.Path.Star([0,0], App.rdmIntRange(4,9), App.rdmRange(.25,.6), 1);
	}


	t.polygon = function()
	{
		var nbr = App.rdmIntRange(4,7),
			path = new paper.Path.RegularPolygon([0,0],nbr,1),
			dMax = path.segments[0].point.getDistance(path.segments[1].point) * .5;

		// randomize path
		for (var i=0; i<nbr; i++)
		{
			path.segments[i].point = [path.segments[i].point.x + App.rdmRange(-dMax,dMax), path.segments[i].point.y + App.rdmRange(-dMax,dMax)];
		}

		return path;
	}


	// movement vectors
	t.slideLeft = function()
	{
		return new paper.Group([
			t.horizontalSegment(),
			t.horizontalSegment().translate([0,.25])
		]);
	}


	t.slideRight = function()
	{
		return t.slideLeft().rotate(180);
	}


	t.slideUp = function()
	{
		return t.slideLeft().rotate(-90);
	}


	t.slideDown = function()
	{
		return t.slideUp().rotate(180);
	}


	// other helpful function


	function mapOptions(options, optionRanges)
	{
		for (var k in options)
		{
			if (options[k] && optionRanges[k])
			{
				// adapt to range
				var ranges = optionRanges[k]
					min = ranges[0][0],
					max = ranges[ranges.length-1][1];

				options[k] *= (max - min);

				// look if value is contained in ranges
				var valueChecked = false,
					closestValue,
					closestDelta;

				for (var i=0; i<ranges.length; i++)
				{
					if (options[k] > ranges[i][0] && options[k] < ranges[i][1])
					{
						valueChecked = true;
						break;
					}
					// search closest value
					else
					{
						var delta1      = options[k] - ranges[i][0],
							delta2      = options[k] - ranges[i][1],
							closer      = delta1 < delta2 ? ranges[i][0] : ranges[i][1],
							closerDelta = delta1 < delta2 ? delta1 : delta2;

						if (!closestValue || !closestDelta || closestDelta > closerDelta)
						{
							closestValue = closer;
							closestDelta = closerDelta;
						}
					}
				}

				if (!valueChecked)
				{
					options[k] = closestValue;
				}
			}
		}
	}


	function getLetterFunction(letter)
	{
		return function(){
			if (!letter || !App.Font || !App.Font.glyphs[letter])
			{
				console.log('error, letter',letter,'is not in the font')
				return null;
			}
			
			var pathsData = App.Font.glyphs[letter].paths;

			return App.convertPathsDataToGroup(pathsData);
		}
	}


	function getClosureFunction(object, key)
	{
		return function(){
			return App.groupsArrToGroup(object[key]);
		}
	}
}


