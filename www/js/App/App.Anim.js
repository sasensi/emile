//// animation object ////

// options => {duration, delay, action, callback}
	// duration => animation time
	// delay    => time before animation
	// action   => function to execute during animation
	// callback => function to execute after animation
	// data     => argument stored and passed to action and callback function
	
App.Anim = new function()
{
	// params
	var defaultConfig =
		{
			duration : 0,
			delay    : 0,
			easing   : null,
			loop     : null,
			init     : null,
			action   : null,
			callback : null
		};

	// local variables
	var t = this,
		queue = [],
		endIdQueue = {},
		removeIdQueue = {},
		uniqueId = 0,
		updating = false,

		customGroup,
		customEasings
		;

	t.init = function()
	{
		customEasings = {};

		// custom anims
		customGroup = new paper.Group();
		customGroup.name = 'customGroupAnim';
		
		var customPathData = [[[2012.60, 690.49], [0, 43.75], [0.00, -92.67]], [[2071.21, 519.50], [-22.57, 0], [21.79, 0]], [[2105.27, 597.82], [0, -23.17], [0, 43.75]]],
			customPath = new paper.Path(customPathData);
		customEasings['custom'] = customPath;
		customGroup.appendTop(customPath);

		setCustomEasings();
	}
	

	// global methods
	t.add = function(options)
	{
		// adjust config to default
		options = options || defaultConfig;
		for (var k in defaultConfig)
		{
			options[k] = options[k] != null ? options[k] : defaultConfig[k];
		}
		options.loop = parseInt(options.loop) > 0 || options.loop == true ? options.loop : defaultConfig.loop;


		options.date = Date.now();
		var id = uniqueId;
		options.id = id;
		uniqueId++;

		queue.push(options);

		return id;
	}

	t.update = function()
	{
		if (updating)
		{
			return;
		}

		updating = true;

		var indexToRemove = [];

		// loop queue
		for (var i=0; i<queue.length; i++)
		{
			var a     = queue[i],
				id    = a.id,
				d     = Date.now(),
				delta = d - a.date;

			// if there is a delay before anim
			if (delta > a.delay)
			{
				var	_t = (delta - a.delay) / a.duration;

				// end animation
				if (_t >= 1 || endIdQueue[id] || removeIdQueue[id])
				{
					if (!removeIdQueue[id])
					{
						_t = 1;
						if (typeof(a.action) === 'function')
						{
							a.action(_t, a.data);
						}
						if (typeof(a.callback) === 'function')
						{
							a.callback(a.data);
						}
					}

					// loop case
					if (a.loop && !endIdQueue[id] && !removeIdQueue[id])
					{
						a.date = Date.now();
						a.executedinit = null;
						if (a.loop !== true)
						{
							a.loop--;
						}
					}
					else
					{
						if (endIdQueue[id])
							delete endIdQueue[id];

						if (removeIdQueue[id])
							delete removeIdQueue[id];

						indexToRemove.push(i);
					}
				}

				// continue animation
				else
				{
					// init anim
					if (a.init && typeof(a.init) === 'function' && !a.executedinit)
					{
						a.init(a.data);
						a.executedinit = true;
					}

					// check for easing
					if (a.easing && t.Easing[a.easing])
					{
						_t = t.Easing[a.easing](_t);
					}

					// launch action
					if (typeof(a.action) === 'function')
					{
						a.action(_t, a.data);
					}
				}
			}
		}

		// remove ended animations
		for (var i=indexToRemove.length-1; i>=0; i--)
		{
			queue.splice(indexToRemove[i],1);
		}

		updating = false;
	}

	function printQueue()
	{
		var msg = 'print queue : ';
		for (var i=0; i<queue.length; i++)
		{
			msg += queue[i].id + '  ';
		}

		console.log(msg);
	}

	t.clear = function()
	{
		queue = [];
	}

	t.subRange = function(_t, params)
	{
		for(var i=0; i<params.stops.length-1; i++)
		{
			var s1 = params.stops[i],
				s2 = params.stops[i+1];

			// check interval
			if (_t > s1 && _t < s2)
			{
				var __t = (_t - s1) / (s2 - s1),
					v1 = params.values[i],
					v2 = params.values[i+1];

				// check easing
				if (params.easings && params.easings[i] && t.Easing[params.easings[i]])
				{
					__t = t.Easing[params.easings[i]](__t);
				}

				return v1 + (v2 - v1) * __t;
			}
		}

		return null;
	}


	// end animation executing last action and callback
	t.endAnimation = function(animId)
	{
		if (isQueued(animId))
			endIdQueue[animId] = true;
	}


	// stop animation before callback
	t.removeAnimation = function(animId)
	{
		if (isQueued(animId))
			removeIdQueue[animId] = true;
	}

	function isQueued(animId)
	{
		for (var i=0; i<queue.length; i++)
		{
			if (queue[i].id == animId)
				return true;
		}
		return null;
	}

	// global variables
	t.Easing = {
	  // no easing, no acceleration
	  linear: function (t) { return t },
	  // accelerating from zero velocity
	  easeInQuad: function (t) { return t*t },
	  // decelerating to zero velocity
	  easeOutQuad: function (t) { return t*(2-t) },
	  // acceleration until halfway, then deceleration
	  easeInOutQuad: function (t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t },
	  // accelerating from zero velocity 
	  easeInCubic: function (t) { return t*t*t },
	  // decelerating to zero velocity 
	  easeOutCubic: function (t) { return (--t)*t*t+1 },
	  // acceleration until halfway, then deceleration 
	  easeInOutCubic: function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 },
	  // accelerating from zero velocity 
	  easeInQuart: function (t) { return t*t*t*t },
	  // decelerating to zero velocity 
	  easeOutQuart: function (t) { return 1-(--t)*t*t*t },
	  // acceleration until halfway, then deceleration
	  easeInOutQuart: function (t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t },
	  // accelerating from zero velocity
	  easeInQuint: function (t) { return t*t*t*t*t },
	  // decelerating to zero velocity
	  easeOutQuint: function (t) { return 1+(--t)*t*t*t*t },
	  // acceleration until halfway, then deceleration 
	  easeInOutQuint: function (t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t }
	}


	function setCustomEasings()
	{
		for (var k in customEasings)
		{
			var customPath = customEasings[k];
			t.Easing[k] = function(t)
			{
				var p = t < 1 ? customPath.getPointAt(t * customPath.length) : customPath.lastSegment.point,
					p1 = customPath.firstSegment.point,
					p2 = customPath.lastSegment.point,
					h = p.y - p1.y,
					H = p2.y - p1.y,
					delta = h/H;

				return delta || t;
			}
		}
	}
}