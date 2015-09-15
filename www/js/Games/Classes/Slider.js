function Slider(word, Word)
{
	// params
	var offset        = .22,
		distanceLimit = App.config.dotWidth * 2,
		timeLimit     = .99,

		trajectoryDelay  = App.config.delays.trajectory,
		trajectorySpeed  = App.config.speeds.trajectory,
		sendDotBackDelay = App.config.delays.dotReset,

		trajectoryStyle = App.config.styles.trajectory,
		tempPathStyle   = App.config.styles.stroke,
		littleDotStyle  =
		{
			fillColor : App.config.colors.machine,
			width     : 6
		}
		;

	var t = this,

		group,
		dot,
		dotItem,

		littleDot,
		trajectory,
		tempPath,
		target,
		targetItem,

		dotAnim,
		trajectoryAnim,
		targetAnim,
		dotBackAnim
		;

	t.word = Word;

	function init()
	{
		dotAnim        = null;
		trajectoryAnim = null;
		targetAnim     = null;
		dotBackAnim     = null;

		group = new paper.Group();

		trajectory = new paper.Path.Line(word.strokeBounds.bottomLeft.add(0,-offset * word.strokeBounds.height), word.strokeBounds.bottomRight.add(0,-offset * word.strokeBounds.height));
		App.setStyle(trajectory, trajectoryStyle);
		trajectory.visible    = false;

		littleDot = new paper.Path.Circle(trajectory.firstSegment.point, littleDotStyle.width);
		App.setStyle(littleDot, littleDotStyle);
		littleDot.visible = false;

		tempPath = new paper.Path(trajectory.firstSegment.point);
		tempPath.add(trajectory.firstSegment.point)
		App.setStyle(tempPath, tempPathStyle);

		dot = new Dot(trajectory.firstSegment.point);
		dotItem = dot.getItem();

		target = new Target(trajectory.lastSegment.point)
		targetItem = target.getItem();

		group.addChildren([trajectory, littleDot, targetItem, tempPath, dotItem]);

		// showDot();
		showTarget();

		return t;
	}

	t.clear = function()
	{
		dot.remove();
		target.remove();
		group.remove();
	}


	t.touch = function(point)
	{
		if (dotAnim)
			App.Anim.endAnimation(dotAnim);
		if (dotBackAnim)
			App.Anim.removeAnimation(dotBackAnim);

		// show dot helper
		littleDot.fillColor = App.config.colors.user;
		dot.activate();

		littleDot.visible = true;

		t.drag(point);

		// show target
		// showTarget();
	}

	t.removeTouch = function()
	{
		// reset dot
		dot.desactivate();

		// send dot back
		sendDotBack();
	}

	t.drag = function(point)
	{
		var nP = trajectory.getNearestPoint(point),
			d = nP.getDistance(trajectory.lastSegment.point),
			l = trajectory.length,
			time = (l - d) / l;

		tempPath.lastSegment.point = nP;
		dot.position(nP);

		if (time > timeLimit)
		{
			return true;
		}
		return null;
	}


	t.hitTestDot = function(point)
	{
		return dot.hitTest(point);
	}

	t.hitTestZone = function(point)
	{
		return trajectory.getNearestPoint(point).getDistance(point) < distanceLimit;
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

		// trajectory
		trajectory.dashArray = App.getDashArray(trajectory, trajectoryStyle.dashArray, 0);
		trajectory.visible = true;

		var delay =  Math.min(trajectory.length * trajectorySpeed, trajectoryDelay);

		trajectoryAnim = App.Anim.add({
			duration : delay,
			action   : function(time)
			{
				trajectory.dashArray = App.getDashArray(trajectory, trajectoryStyle.dashArray, time);
			},
			callback : function()
			{
				trajectoryAnim = null;
			}
		});
	}

	function hideTarget()
	{
		// clear anims
		if (trajectoryAnim)
			App.Anim.removeAnimation(trajectoryAnim);
		if (targetAnim)
			App.Anim.removeAnimation(targetAnim);

		trajectory.visible = false;
		littleDot.visible  = false;
	}


	function sendDotBack()
	{
		// dot anim
		var p1 = dot.getPosition(),
			p2 = littleDot.position;

		dotBackAnim = App.Anim.add({
			duration : sendDotBackDelay,
			easing   : App.config.easings.dotReset,
			action   : function(time)
			{
				var p = App.rampPoints(p1,p2,time);

				dot.position(p);
				tempPath.lastSegment.point = p;
			},
			callback: function()
			{
				littleDot.style = littleDotStyle;
				dotBackAnim = null;
			}
		});
	}

	init();
}