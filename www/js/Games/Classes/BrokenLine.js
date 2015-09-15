function BrokenLine(points, Game, config)
{
	// check pointsArr
	if (!Array.isArray(points) || points.length < 2)
	{
		console.log('wrong argument given to BrokenLine class : ',pointsArr);
		return;
	}

	// config
	var defaultConfig =
		{
			littleDots: false
		};

	config = App.extend(defaultConfig, config);

	// params
	var trajectoryStyle    = App.config.styles.trajectory,
		pathStyle          = App.config.styles.stroke,
		littleDotStyle     = App.extend(App.config.styles.littleDot,{
			width: App.config.styles.littleDot.width / paper.view.zoom
		}),

		trajectorySpeed    = App.config.speeds.trajectory * .8,
		trajectoryMaxDelay = App.config.delays.trajectory,
		dotResetSpeed      = App.config.speeds.dotReset,
		dotResetDelay      = App.config.delays.dotReset
		;


	var t = this,

		group,
		trajectory,
		littleDotsGroup,
		mainPath,
		tempPath,
		dot,
		target,

		dotIndex,
		targetIndex,

		animDotReset,
		animTrajectory,

		dragging,
		gamePlaying
		;

	function init()
	{
		animDotReset = null;
		animTrajectory = null;
		dragging    = null;
		dotIndex    = 0;
		targetIndex = 1;
		gamePlaying = false;

		// adapt for segments data
		if (points[0].point)
		{
			var arr = [];
			for (var i=0; i<points.length; i++)
			{
				var point = points[i].point;
				arr.push(point);
			}
			points = arr;
		}


		// adapt to view zoom


		group = new paper.Group();
		group.name = 'brokenLineGroup';

		trajectory = new paper.Path.Line(points[0], points[1]);
		trajectory.name = 'trajectory';
		App.setStyle(trajectory, trajectoryStyle);

		if (config.littleDots)
		{
			littleDotsGroup = new paper.Group();
			littleDotsGroup.name = 'littleDotsGroup';
			for (var i=0; i<points.length; i++)
			{
				var littleDot = new paper.Path.Circle(points[i], littleDotStyle.width);
				App.setStyle(littleDot, littleDotStyle);
				littleDot.visible = i == 0;
				littleDotsGroup.appendTop(littleDot);
			}
			group.appendTop(littleDotsGroup);
		}

		mainPath = new paper.Path(points[0]);
		mainPath.name = 'mainPath';
		App.setStyle(mainPath, pathStyle);

		tempPath = mainPath.clone();
		tempPath.name = 'tempPath';
		tempPath.add(points[0]);

		dot = new Dot(points[0]);

		target = new Target();

		group.addChildren([trajectory, mainPath, tempPath, target.getItem(), dot.getItem()]);

		hideItems();

		positionTarget();
	}

	t.show = function()
	{
		gamePlaying = true;
		dot.show(true);
	}

	t.remove = function()
	{
		group.remove();
	}

	t.getPath = function()
	{
		return mainPath;
	}



	// 
	// interactions
	// 

	t.onCursorDown = function(e)
	{
		if (dragging != null)
			return;

		var point = paper.view.viewToProject(e.point);

		if (dot.hitTest(point))
		{
			animDotReset = App.removeAnimation(animDotReset);

			dot.activate();
			showTarget();
			
			dragging = e.id;

			return true;
		}
	}

	t.onCursorMove = function(e)
	{
		if (dragging != e.id )
			return;

		var point = paper.view.viewToProject(e.point),
			delta = [e.delta[0] / paper.view.zoom, e.delta[1] / paper.view.zoom];

		dot.translate(delta);

		point = dot.getPosition();

		tempPath.lastSegment.point = point;

		if (target.hitTest(point))
		{
			var targetPoint = target.getPosition();

			mainPath.add(targetPoint);
			tempPath.firstSegment.point = targetPoint;
			if (config.littleDots)
			{
				littleDotsGroup.children[targetIndex].visible = true;
			}

			// if this is not the last point
			if (targetIndex < points.length-1)
			{
				targetIndex++;
				dotIndex++;

				positionTarget();
				hideTarget(false);
				showTarget();
			}

			// win
			else
			{
				win();
				dragging = null;
			}
		}
	}

	t.onKinectMove = function(e)
	{
		if (!gamePlaying)
			return;

		// check dot
		if (dragging == null)
		{
			if (t.onCursorDown(e))
			{
				dot.position(e.point);
			}
		}
		else
		{
			t.onCursorMove(e);
		}
	}

	t.onKinectUserLeft = function()
	{
		hideTarget();
		resetDot();

		dragging = null;
	}


	t.onCursorUp = function(e)
	{
		if (dragging != e.id)
			return;

		hideTarget();
		resetDot();

		dragging = null;
	}


	// 
	// local methods
	// 

	function win()
	{
		gamePlaying = false;

		var winItem = config.littleDots
				? new paper.Group(littleDotsGroup, mainPath)
				: mainPath;
		group.parent.insertChild(group.index, winItem);

		dot.position(points[targetIndex]);
		removeHelpers(function(){
			Game.onBrokenLineWin(winItem);
		});
	}

	function hideItems()
	{
		trajectory.visible = false;

	}

	function removeHelpers(callback)
	{
		dot.hide(true, function(){
			App.callback(callback);
			dot.remove();
			group.remove();
		});
		target.remove();
		trajectory.remove();
		tempPath.remove();
	}


	// 
	// items animation
	// 

	function positionTarget()
	{
		// position target
		var p1 = points[dotIndex],
			p2 = points[targetIndex];

		target.position(p2);

		trajectory.firstSegment.point = p1;
		trajectory.lastSegment.point = p2;
		trajectory.dashOffset = App.getDashOffset(trajectory);
	}

	function showTarget()
	{
		animTrajectory = App.removeAnimation(animTrajectory);

		trajectory.visible = true;

		var p1 = points[dotIndex],
			p2 = points[targetIndex],
			d = p1.getDistance(p2) * paper.view.zoom;

		// animate line
		animTrajectory = App.Anim.add({
			duration: Math.min(d * trajectorySpeed, trajectoryMaxDelay),
			action: function(time)
			{
				trajectory.lastSegment.point = App.rampPoints(p1,p2,time);
			},
			callback: function()
			{
				animTrajectory = null;
				target.show();
			}
		});
	}

	function hideTarget(animate)
	{
		animTrajectory = App.removeAnimation(animTrajectory);

		trajectory.visible = false;
		target.hide(animate);
	}

	function resetDot()
	{
		dot.desactivate();

		var p1 = dot.getPosition(),
			p2 = points[dotIndex],
			d  = p1.getDistance(p2) * paper.view.zoom;
		animDotReset = App.Anim.add({
			duration : Math.min(dotResetSpeed * d, dotResetDelay),
			easing   : App.config.easings.dotReset,
			action   : function(time)
			{
				var p = App.rampPoints(p1,p2,time);
				dot.position(p);
				tempPath.lastSegment.point = p;
			},
			callback : function()
			{
				animDotReset = null;
			}
		})
	}



	init();
}