function Drawing(groupOfGroups, Game, config)
{
	// params
	var defaultConfig =
		{
			showPath    : false,
			name        : 'drawing',
			morph       : .7,
			limit       : 4,
			checkPoints : true,
			helpPath    : true,
			ghostGroup  : false,
			accuracy    : false
		};

	// set config
	config = App.extendObject(defaultConfig, config);

	// _Curve params
	// params
	var layerScale = paper.project.activeLayer.scaling.x
		zoomCoeff  = 1/layerScale,

		helpPathStyle = App.extendObject(App.config.styles.stroke,
		{
			strokeColor : App.config.colors.machine,
			strokeWidth : config.limit ? App.config.dotWidth * config.limit : App.config.dotWidth * 6,
			opacity     : .12,
			visible     : false
		}),
		trajectoryStyle = App.extendObject(App.config.styles.trajectory,
		{
			visible: false
		}),
		tempPathStyle   = App.config.basicStrokeStyle,
		littleDotStyle  =
		{
			fillColor : App.config.colors.machine,
			width     : 6,
			visible: false
		},
		targetStyle = App.config.targetStyle,
		dotStyle    =
		{
			fillColor: App.config.colors.machine
		},
		dotHelpStyle =
		{
			fillColor : App.config.colors.user,
			opacity   : App.config.helperOpacity
		},
		ghostStyle =
		{
			// strokeWidth : 3,
			blendMode : 'multiply',
			opacity   : .1
		},
		originalPathStyle = App.config.styles.strokeDestination,

		dotDelay           = App.config.delays.dotShow,
		trajectorySpeed    = App.config.speeds.trajectory,
		trajectoryMinDelay = App.config.delays.trajectory,
		targetDelay        = dotDelay,
		helpPathDelay      = dotDelay,
		dotResetSpeed   = App.config.speeds.dotReset,
		dotResetDelay   = App.config.delays.dotReset,
		fadeDelay          = 300,
		morphDelay         = App.config.delays.morphDrawing,

		accuracyIterations = 20,
		accuracyLimit = App.config.drawingAccuracy,
		accuracyGhostKeepLimit = 100,

		checkPointsNbr = 3,
		showCheckpoints = false

		;

	var t = this,
		shapes,
		shapecounter,

		currentShape,
		current_Curve,

		dragging,
		capturingTarget,

		drawingPlaying
		;

	t.group;

	function init()
	{
		// init variables
		shapes = [];
		shapeCounter = 0;

		currentShape    = null;
		current_Curve    = null;
		dragging        = null;
		capturingDot    = null;
		capturingTarget = null;

		drawingPlaying     = false;

		t.group = new paper.Group();
		t.group.name = config.name;

		// scale and position drawing
		// groupOfGroups.fitBounds(paper.view.bounds.scale(.8));
		// groupOfGroups.strokeColor = 'black';

		// create shapes
		for (var i=0; i<groupOfGroups.children.length; i++)
		{
			shapes[i] = new Shape(groupOfGroups.children[i]);
		}

		// remove original group
		groupOfGroups.remove();
	}

	t.start = function()
	{
		drawingPlaying = true;
		// console.log('start drawing');
		startShape();
	}

	t.onShapeWin = function(shapeGroup)
	{
		// store shape
		t.group.addChildren(shapeGroup.children);
		shapeGroup.remove();

		if (shapeCounter < shapes.length-1)
		{
			shapeCounter++;
			startShape();
		}
		else
		{
			currentShape = null;

			var delay = config.morph ? Math.max(morphDelay, fadeDelay) : fadeDelay;
			setTimeout(function(){

				Game.onDrawingWin(t.group);
			}, delay)
		}
	}


	// interactions
	t.onCursorDown = function(e)
	{
		if (!drawingPlaying || dragging || !current_Curve)
			return;

		// hit test current curve
		if (current_Curve.hitTestDot(e.point))
		{
			dragging = true;
			// current_Curve.drawing = false;
			capturingDot = current_Curve.getDotDistance(e.point);
			current_Curve.drawing = true;
			current_Curve.touch(e.point);
		}
	}

	t.onCursorMove = function(e)
	{
		if (!drawingPlaying || !current_Curve)
			return;


		if (!dragging)
		{
			t.onCursorDown(e);
			return;
		}

		// test path checkpoints to avoid orientation error
		if (!current_Curve.orientationChecked)
		{
			current_Curve.hitTestCheckPoints(e.point);
		}

		// capturing dot
		if (capturingDot)
		{

			var d = current_Curve.getDotDistance(e.point);
			if (!d || d > capturingDot)
			{
				current_Curve.drawing = true;
				current_Curve.captureDot();
				capturingDot = null;
			}
			else
			{
				capturingDot = d;
			}

			current_Curve.drag(e.point);
		}

		// capturing target
		else if (capturingTarget)
		{
			var d = current_Curve.getTargetDistance(e.point);
			if (d > capturingTarget)
			{
				dragging = null;
				capturingTarget = null;

				if (!config.accuracy || current_Curve.checkAccuracy())
				{
					current_Curve.win();

					// check next curve dot
					if (current_Curve && current_Curve.hitTestDot(e.point))
					{
						// console.log('/// next is good')
						dragging = true;
						current_Curve.drawing = true;
						// capturingDot = current_Curve.getDotDistance(e.point);
						current_Curve.touch(e.point);
					}
				}
				
				else
				{
					current_Curve.restart();
				}
			}
			else
			{
				capturingTarget = d;
				current_Curve.drag(e.point);
			}
		}

		// check target if orientation is checked
		else if (current_Curve.orientationChecked && current_Curve.hitTestTarget(e.point))
		{
			capturingTarget = current_Curve.getTargetDistance(e.point);
			current_Curve.drag(e.point);
		}

		// check limits
		else if (current_Curve.hitTestLimit(e.point))
		{
			current_Curve.drag(e.point);
		}
		
		// remove touch
		else
		{
			current_Curve.removeTouch();
			dragging = null;
		}
	}

	t.onCursorUp = function(e)
	{
		if (!drawingPlaying || !dragging)
			return;

		// check target
		if (current_Curve.orientationChecked && current_Curve.hitTestTarget(e.point))
		{
			current_Curve.win();
		}
		else
		{
			current_Curve.removeTouch();
		}
		
		dragging = null;
	}


	function startShape()
	{
		currentShape = shapes[shapeCounter];
		currentShape.start();
	}



	// Drawing Classes
	function Shape(group)
	{
		var _t = this,
			curves,
			curveCounter;

		_t.init = function()
		{
			curves       = [];
			curveCounter = 0;
			ghost        = null;

			_t.group = new paper.Group();
			_t.group.name = 'shapeGroup';
			t.group.appendTop(_t.group);

			// create curves
			for (var i=0; i<group.children.length; i++)
			{
				curves.push(new _Curve(group.children[i], _t));
				if (config.showPath)
				{
					i--;
				}
			}
		}

		_t.start = function()
		{
			// tweak
			t.group.appendTop(_t.group);
			
			start_Curve();
		}

		_t.on_CurveWin = function(path)
		{
			_t.group.appendTop(path);

			if (curveCounter < curves.length-1)
			{
				curveCounter++;
				start_Curve();
			}
			else
			{
				current_Curve = null;
				t.onShapeWin(_t.group);
			}
		}

		_t.on_CurveRestart = function(path)
		{
			if (ghost)
				ghost.remove();

			ghost         = path;
			ghost.style   = ghostStyle;
			ghost.opacity = ghostStyle.opacity;
			_t.group.appendTop(ghost);

			start_Curve();
		}


		function start_Curve()
		{
			curves[curveCounter].start();
			current_Curve = curves[curveCounter];
		}

		_t.init();
	}












	function _Curve(path, _Shape)
	{
		if (!path || path.segments.length < 2)
			alert();

		var _t = this,

			group,
			helpPath,
			trajectory,
			tempPath,
			littleDot,
			target,
			targetTouch,
			dot,
			dotCircle,
			dotTouch,
			dotHelp,
			ghostGroup,
			halfChecker,
			checkPoints,

			checkPointsCounter,

			dotAnim,
			trajectoryAnim,
			targetAnim,
			helpPathAnim,

			firstPoint,
			lastPoint
			;

		// global variables
		_t.drawing;
		_t.orientationChecked;

		_t.init = function()
		{
			checkPointsCounter = 0;

			dotAnim        = null;
			trajectoryAnim = null;
			targetAnim     = null;

			_t.drawing     = false;
			_t.orientationChecked = config.checkPoints ? false : true;

			firstPoint = path.firstSegment.point;
			lastPoint  = path.lastSegment.point;

			group = new paper.Group();
			group.name = 'curveGroup';
			_Shape.group.appendTop(group);

			helpPath = path.clone();
			helpPath.name = 'helpPath';
			group.appendTop(helpPath);
			App.setStyle(helpPath, helpPathStyle);

			trajectory = path.clone();
			trajectory.name = 'trajectory';
			App.setStyle(trajectory, trajectoryStyle);
			trajectory.dashOffset = App.getDashOffset(trajectory);

			tempPath = new paper.Path(path.firstSegment.point);
			tempPath.name = 'tempPath';
			App.setStyle(tempPath, tempPathStyle);

			littleDot = new paper.Path.Circle(path.firstSegment.point, littleDotStyle.width);
			littleDot.name = 'littleDot';
			App.setStyle(littleDot, littleDotStyle);

			target = new Target(lastPoint);

			dot = new Dot(firstPoint);

			// create checkpoints
			if (config.checkPoints)
			{
				checkPoints = new paper.Group();
				checkPoints.name = 'checkPointsGroup';
				for (var i=1; i<=checkPointsNbr; i++)
				{
					var time = i/(checkPointsNbr+1),
						p = helpPath.getPointAt(helpPath.length * time),
						checkPoint = new paper.Path.Circle(p, helpPathStyle.strokeWidth*.5);
					checkPoints.appendTop(checkPoint);

					// console.log('creating checkpoints',showCheckpoints)
					if (showCheckpoints)
					{
						checkPoint.fillColor = 'red';
						checkPoint.opacity = .5;
						checkPoint.visible = true;
					}
				};
				group.appendTop(checkPoints);
			}

			if (config.ghostGroup)
			{
				ghostGroup = new paper.Group();
				ghostGroup.name = 'ghostGroup';
				group.appendTop(ghostGroup);
			}
			
			if (config.showPath)
			{
				App.setStyle(path, originalPathStyle);
				path.name = 'originalPath';
				group.appendTop(path);
			}
			else
			{
				path.visible = false;
			}


			group.addChildren([trajectory, littleDot, tempPath, target.getItem(), dot.getItem()]);

		}

		_t.start = function()
		{
			showDot();
			if (config.helpPath)
				showHelpPath();
		}

		_t.restart = function()
		{
			tempPath.simplify();

			if (config.ghostGroup)
			{
				var ghost     = tempPath.clone();
				App.setStyle(ghost, ghostStyle);
				ghostGroup.appendTop(ghost);
			}

			_t.removeTouch();
		}


		_t.win = function()
		{
			// cancel anims
			if (trajectoryAnim)
				App.Anim.removeAnimation(trajectoryAnim);
			if (targetAnim)
				App.Anim.removeAnimation(targetAnim);
			if (helpPathAnim)
				App.Anim.removeAnimation(helpPathAnim);

			tempPath.simplify();

			// morph to get a better shape
			if (config.morph)
			{
				var morph = new MorphPath(tempPath, path);
				tempPath.visible = false;
			}

			var savePath = config.morph ? morph.path : tempPath;

			currentShape.on_CurveWin(savePath);

			// fade
			App.Anim.add({
				duration : fadeDelay,
				action   : function(time)
				{
					group.opacity = App.ramp(1,0,time);
				},
				callback: function()
				{
					_t.remove();
				}
			});

			// morph
			if (config.morph)
			{
				App.Anim.add({
					duration : morphDelay,
					// easing   : 'easeOutQuad',
					action   : function(time)
					{
						morph.update(time * config.morph);
					},
					callback: function()
					{
						morph.clear();
					}
				});
			}
		}


		_t.touch = function(point)
		{
			if (dotAnim)
			{
				App.Anim.endAnimation(dotAnim);
			}

			// show dot helper
			dot.activate();

			littleDot.visible = true;

			// show target
			showTarget();

			_t.drag(point);
		}

		_t.removeTouch = function()
		{
			// reset dot
			dot.desactivate();

			_t.orientationChecked =  config.limit ? false : true;
			checkPointsCounter = 0;

			// hide target
			hideTarget();

			// send dot back
			dotReset();

		}

		_t.captureDot = function()
		{
			tempPath.removeSegments();
		}


		_t.drag = function(point)
		{
			dot.position(point);

			if (_t.drawing && tempPath)
			{
				tempPath.add(point);
			}
		}


		_t.checkHalf = function()
		{
			_t.halfChecked = true;
			halfChecker.fillColor = 'blue';
		}


		// hit test methods
		_t.hitTestDot = function(point)
		{
			return dot.hitTest(point);
		}

		_t.hitTestTarget = function(point)
		{
			return target.hitTest(point);
		}

		_t.hitTestLimit = function(point)
		{
			if (!config.limit || !helpPath || !helpPath.segments || helpPath.segments.length < 2)
				return true;

			return helpPath.getNearestPoint(point).getDistance(point) < helpPathStyle.strokeWidth*.5;
		}

		_t.hitTestCheckPoints = function(point)
		{
			if (checkPoints.children[checkPointsCounter].contains(point))
			{
				if (showCheckpoints)
				{
					console.log('checker',checkPointsCounter)
					checkPoints.children[checkPointsCounter].fillColor = 'blue';
				}

				if (checkPointsCounter < checkPoints.children.length-1)
					checkPointsCounter++;
				else
					_t.orientationChecked = true;
			}
		}


		_t.getTargetDistance = function(point)
		{
			return lastPoint.getDistance(point);
		}

		_t.getDotDistance = function(point)
		{
			return firstPoint.getDistance(point);
		}


		_t.checkAccuracy = function()
		{
			var accuracy = getAccuracy();
			return accuracy != null && accuracy < accuracyLimit;
		}

		_t.remove = function()
		{
			group.remove();
			dot.remove();
			target.remove();
		}


		function getAccuracy()
		{
			var path1 = tempPath,
				path2 = path,
				med = 0;

			if (!path1 || !path2 || !path1.segments || !path2.segments || path1.segments.length < 2 || path2.segments.length < 2)
				return null;

			for (var i=0; i<accuracyIterations; i++)
			{
				var time = i/(accuracyIterations-1)
					p1   = path1.getPointAt(time * path1.length),
					p2   = path2.getPointAt(time * path2.length),
					d    = p1.getDistance(p2);
				med += d;
			}

			med /= accuracyIterations;
			return med;
		}


		// local methods
		function showDot()
		{
			dot.show();
		}

		function showTarget()
		{
			// little dot
			littleDot.visible = true;
			showTrajectory();
		}

		function showHelpPath(callback)
		{
			var s1 = App.config.minScaling,
				s2 = helpPathStyle.strokeWidth;

			helpPath.strokeWidth = s1;
			helpPath.visible     = true;

			helpPathAnim = App.Anim.add({
				duration : helpPathDelay,
				easing   : 'easeInQuad',
				action   : function(time)
				{
					helpPath.strokeWidth = App.ramp(s1,s2,time);
				},
				callback : function()
				{
					helpPathAnim = null;
					App.callback(callback);
				}
			});
		}

		function showTrajectory(callback)
		{
			// trajectory
			trajectory.dashArray = App.getDashArray(trajectory, trajectoryStyle.dashArray, 0);
			trajectory.visible = true;

			var trajectoryDelay = Math.max(trajectory.length * trajectorySpeed, trajectoryMinDelay);

			trajectoryAnim = App.Anim.add({
				duration : trajectoryDelay,
				action   : function(time)
				{
					trajectory.dashArray = App.getDashArray(trajectory, trajectoryStyle.dashArray, time);
				},
				callback : function()
				{
					trajectoryAnim = null;
					target.show();
				}
			});
		}


		function hideTarget()
		{
			// clear anims
			if (trajectoryAnim)
			{
				App.Anim.removeAnimation(trajectoryAnim);
				trajectoryAnim = null;
			}

			trajectory.visible = false;
			target.hide(false);
			// helpPath.visible   = false;
			littleDot.visible  = false;
		}


		function dotReset()
		{
			if (tempPath.segments.length < 2)
			{
				dot.position(littleDot.position);
				return;
			}

			// prevent interactions
			drawingPlaying = false;

			tempPath.dashArray = [tempPath.length, tempPath.length];

			var delay = Math.min(dotResetSpeed * tempPath.length, dotResetDelay);

			// dot anim
			App.Anim.add({
				duration : delay,
				easing   : App.config.easings.dotReset,
				action   : function(time)
				{
					var p = time == 0 ? tempPath.lastSegment.point : tempPath.getPointAt((1 - time) * tempPath.length);
					dot.position(p);

					tempPath.dashOffset = time * tempPath.length;
				},
				callback: function()
				{
					dot.position(littleDot.position);
					tempPath.removeSegments();
					tempPath.dashArray = null;
					drawingPlaying = true;
				}
			});
		}

		_t.init();
	}
	
	init();
}