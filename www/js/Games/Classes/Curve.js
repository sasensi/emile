function Curve(model, Game, config)
{
	var defaultConfig =
		{

		};

	config = App.extend(defaultConfig, config);

	// params
	var helpPathStyle = App.extendObject(App.config.styles.stroke,
		{
			strokeColor : App.config.colors.machine,
			strokeWidth : App.config.dotWidth * 6,
			opacity     : .12
		}),
		trajectoryStyle = App.config.styles.trajectory,
		captureTolerance = App.config.dotWidth*1.3,
		limitTolerance = .5
		;

	var t = this,
		path,
		dot,
		target,
		trajectory,
		helpPath,
		tempPath,
		curvePath,
		winPath,
		group,

		gamePlaying,
		dragging,

		animTrajectory,

		curveCounter,

		avancement
		;

	function init()
	{
		dragging = null;
		gamePlaying = false;
		animTrajectory = null;
		curveCounter = 0;
		avancement = 0;

		path = model.clone();
		path.name = 'curvePath';
		App.setStyle(path, 'strokeDestination');

		dot = new Dot(path.firstSegment.point);

		target = new Target(path.lastSegment.point);

		trajectory = path.clone();
		trajectory.name = 'curveTrajectory';
		App.setStyle(trajectory, trajectoryStyle);

		helpPath = path.clone();
		helpPath.name = 'curveHelpPath';
		App.setStyle(helpPath, helpPathStyle);

		tempPath = new paper.Path([path.firstSegment.point, path.firstSegment.point]);
		tempPath.name = 'curveTempPath';
		App.setStyle(tempPath, 'stroke');

		curvePath = new paper.Path();
		curvePath.name = 'curveCurvePath';
		setCurvePath();

		winPath = path.clone();
		winPath.name = 'winPath';
		App.setStyle(winPath, 'stroke');
		winPath.dashArray = [winPath.length, winPath.length];
		winPath.dashOffset = -winPath.length;

		group = new paper.Group([helpPath, path, trajectory, target.getItem(), winPath, tempPath, curvePath, dot.getItem()]);
		group.name = 'Curve';

		// App.hideAllChildren(group);
	}


	// 
	// scenario
	// 

	t.start = function()
	{
		gamePlaying = true;
		show();
	}

	function win()
	{
		winPath.dashArray = null;
		winPath.dashOffset = null;

		dot.hide();
		target.hide();
		tempPath.remove();

		group.parent.insertChild(group.index+1, winPath);

		App.hideItem(group, {
			scale:false,
			fade:true,
			callback: function()
			{
				t.remove();
			}
		})


		// send win
		if (typeof Game.onCurveWin === 'function')
		{
			Game.onCurveWin(winPath);
		}
		else
		{
			console.log('curve win, but missing methods on Game : onCurveWin');
		}
	}



	// 
	// misc
	// 

	t.remove = function()
	{
		App.removeAnimation(animTrajectory)
		group.remove();
	}



	// 
	// interactions
	// 

	t.onCursorDown = function(e)
	{
		if (!gamePlaying || dragging != null)
			return;

		if (dot.hitTest(e.point))
		{
			dot.activate();

			dragging = e.id;

			showTarget();
		}
	}

	t.onCursorMove = function(e)
	{
		if (!gamePlaying || dragging != e.id)
			return;

		dot.translate(e.delta);

		if (hitTestLimit(dot.getPosition()))
		{
			// check avancement
			var arr = hitTestCurve(dot.getPosition());
			// console.log(arr)
			if (arr)
			{
				var point = arr[0],
					time = arr[1],
					delta = arr[2],
					previousOffset = path.segments[curveCounter].location.offset,
					curveLength = path.curves[curveCounter].length,
					pathOffset = previousOffset + curveLength * time,
					avancementDelta = pathOffset - avancement;

				avancement = pathOffset;

				// show avancement
				winPath.dashOffset = -winPath.length - pathOffset;

				tempPath.firstSegment.point = point;
				tempPath.lastSegment.point = dot.getPosition();


				// manage curve path
				if (delta <= captureTolerance)
				{
					if (curveCounter < path.curves.length-1)
					{
						curveCounter++;
						setCurvePath();
					}
					else
					{
						gamePlaying = false;
						dragging = null;
						win();
					}
				}
				else if (avancementDelta <= 0 && time == 0 && curveCounter > 0)
				{
					curveCounter--;
					setCurvePath();
				}
			}
			else
			{
				dragging = null;
				resetDot();
			}
		}
		else
		{
			dragging = null;
			resetDot();
		}


		
	}

	t.onCursorUp = function(e)
	{
		if (!gamePlaying || dragging != e.id)
			return;

		dragging = null;
		resetDot();
	}


	// 
	// animations
	// 

	function show()
	{
		winPath.visible = true;

		dot.show();

		showHelpPath();

		showPath();
	}

	function showHelpPath()
	{
		var v1 = App.config.minScaling,
			v2 = helpPathStyle.strokeWidth;

		helpPath.strokeWidth = v1;
		helpPath.visible     = true;

		App.Anim.add({
			duration : App.config.delays.show,
			easing   : 'easeInQuad',
			action   : function(time)
			{
				helpPath.strokeWidth = App.ramp(v1,v2,time);
			}
		});
	}

	function showPath()
	{
		var v1 = 0,
			v2 = path.opacity;

		path.opacity = v1;
		path.visible = true;

		App.Anim.add({
			duration : App.config.delays.show,
			action   : function(time)
			{
				path.opacity = App.ramp(v1,v2,time);
			}
		});
	}

	function showTarget()
	{
		trajectory.dashArray = App.getDashArray(trajectory, trajectoryStyle.dashArray, 0);
		trajectory.visible = true;

		var delay = Math.max(trajectory.length * App.config.speeds.trajectory, App.config.delays.trajectory);

		animTrajectory = App.Anim.add({
			duration : delay,
			action   : function(time)
			{
				trajectory.dashArray = App.getDashArray(trajectory, trajectoryStyle.dashArray, time);
			},
			callback : function()
			{
				animTrajectory = null;
				target.show();
			}
		});
	}

	function resetDot()
	{
		dot.desactivate();
		trajectory.visible = false;
		target.hide();

		// temp path
		var p1 = dot.getPosition(),
			_p2 = tempPath.firstSegment.point.clone(),
			d = p1.getDistance(_p2);

		gamePlaying = false;

		App.Anim.add({
			duration: d * App.config.speeds.dotReset,
			action: function(time)
			{
				var p = App.rampPoints(p1,_p2,time);
				dot.position(p);
				tempPath.lastSegment.point = p;
			},
			callback: function()
			{
				var offset1 = winPath.dashOffset,
					offset2 = -winPath.length,
					d = Math.abs(offset1 - offset2),
					delay = Math.min(d * App.config.speeds.dotReset, App.config.delays.dotReset);

				tempPath.firstSegment.point = path.firstSegment.point;
				tempPath.lastSegment.point = path.firstSegment.point;
				tempPath.visible = false;

				App.Anim.add({
					duration: delay,
					easing: App.config.easings.dotReset,
					action: function(time)
					{
						var off = App.ramp(offset1, offset2, time);
							p = winPath.getPointAt(-path.length - off);

						winPath.dashOffset = off;
						dot.position(p);
					},
					callback: function()
					{
						tempPath.visible = true;

						curveCounter = 0;
						setCurvePath();

						gamePlaying = true;
					}
				})
			}
		})
	}



	// 
	// hit test
	// 

	function hitTestLimit(point)
	{
		return path.getNearestPoint(point).getDistance(point) < helpPathStyle.strokeWidth*.5;
	}

	function hitTestCurve(point)
	{
		var nP = curvePath.getNearestPoint(point),
			d  = nP.getDistance(point);

		// App.showPoint(nP);
		// App.showPoint(point);

		if (d > helpPathStyle.strokeWidth * (.5 + limitTolerance))
		{
			return null;
		}
		else
		{
			var offset = curvePath.getOffsetOf(nP),
				delta = curvePath.length - offset,
				time = offset / curvePath.length;
			return [nP, time, delta];
		}
	}

	function setCurvePath()
	{
		curvePath.removeSegments();

		var curve = path.curves[curveCounter],
			s1 = curve.segment1,
			s2 = curve.segment2;

		curvePath.addSegments([s1, s2]);
	}


	init();
}