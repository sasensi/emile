function Dot(point, config, isTarget)
{
	// config
	var defaultConfig =
		{
			kinectMode: null,
			helperScale: 1,
			visible: null,
			scale: 1
		};

	config = App.extendObject(defaultConfig, config);

	// params
	var circleStyle = isTarget ? App.config.styles.target : App.config.styles.dot,
		activeStyle = App.config.styles.activeTarget,
		helperStyle = App.config.styles.helper,
		touchWidth = config.kinectMode ? circleStyle.kinectTouchWidth : circleStyle.touchWidth,

		showDelay = App.config.delays.dotShow,

		fadeOpacity = App.config.fadeOpacity
		;

	// local variables
	var t = this,
		group,
		circle,
		helper,

		animId
		;

	function init()
	{
		point = point || [0,0];

		group = new paper.Group();
		group.name = isTarget ? 'targetGroup' : 'dotGroup';
		group.data.object = t;
		group.applyMatrix = false;

		// adapt styles
		circleStyle = App.extend(circleStyle,{
			width: circleStyle.width * config.scale / paper.view.zoom
		});
		helperStyle = App.extend(helperStyle,{
			width: helperStyle.width * config.helperScale * config.scale / paper.view.zoom
		});

		// adapt to view zoom
		touchWidth = touchWidth / paper.view.zoom;

		if (!isTarget)
		{
			helper = new paper.Path.Circle(point, helperStyle.width);
			App.setStyle(helper, helperStyle);
			helper.opacity = 0;
			group.appendTop(helper);
		}

		circle = new paper.Path.Circle(point, circleStyle.width);
		App.setStyle(circle, circleStyle);
		if (!config.visible)
		{
			circle.scaling = App.config.minScaling;
			circle.opacity = 0;
		}
		group.appendTop(circle);
	}

	t.show = function(animate, callback)
	{
		animate = animate != null ? animate : true;
		cancelAnim();
		circle.opacity = 1;
		if (animate)
		{
			animId = App.showItem(circle,
			{
				callback: function(){
					animId = null;
					App.callback(callback)
				}
			});
		}
		else
		{
			circle.scaling = 1;
			App.callback(callback);
		}

		return animId;
	}

	t.hide = function(animate, callback)
	{
		animate = animate != null ? animate : true;
		cancelAnim();
		t.desactivate();
		var _callback = function()
		{
			circle.opacity = 0;
			App.callback(callback);
			animId = null;
		}
		if (animate)
		{
			animId = App.hideItem(circle,
			{
				callback : _callback
			});
		}
		else
		{
			circle.scaling = App.config.minScaling;
			_callback();
		}

		return animId;
	}

	t.fade = function()
	{
		group.opacity = fadeOpacity;
	}

	t.unfade = function()
	{
		group.opacity = 1;
	}

	t.activate = function()
	{
		if (isTarget)
		{
			App.setStyle(circle, activeStyle);
		}
		else
		{
			helper.opacity = helperStyle.opacity;
		}
	}

	t.desactivate = function()
	{
		if (isTarget)
		{
			App.setStyle(circle, circleStyle);
		}
		else
		{
			helper.opacity = 0;
		}
	}

	t.remove = function()
	{
		cancelAnim();
		group.remove();
	}


	t.position = function(point)
	{
		group.position = point;
	}

	t.translate = function(point)
	{
		group.translate(point);
	}


	t.getPosition = function()
	{
		return group.position;
	}

	t.getItem = function()
	{
		return group;
	}

	t.getClone = function()
	{
		var clone = new paper.Path.Circle(group.position, circleStyle.width);
		App.setStyle(circle, circleStyle);
		return clone;
	}

	t.hitTest = function(point)
	{
		return group.position.getDistance(point) < touchWidth;
	}


	// extra methods to show holding gesture on dot
	if (!isTarget)
	{
		t.loadHelper = function(time)
		{
			var w1 = circleStyle.width,
				w2 = helperStyle.width,
				w = App.ramp(w1,w2,time),
				s = w / w2;

			helper.scaling = s;
		}
	}

	function cancelAnim()
	{
		if (animId)
		{
			App.Anim.removeAnimation(animId);
			animId = null;
		}
	}

	init();
}