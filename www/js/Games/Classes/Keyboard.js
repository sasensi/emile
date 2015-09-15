function Keyboard()
{
	var t = this,

		group,
		rect,
		animId
		;

	function init()
	{
		rect = createRect();
		rect.name = 'keyboardBackground';

		group = new paper.Group([rect]);
		group.name = 'keyboardGroup';
		group.opacity = 0;

		t.resize();
	}

	t.show = function(animate, callback, hide)
	{
		animate = animate != null ? animate : true;

		animId = App.removeAnimation(animId);

		var options =
			{
				duration : animate != null ? App.config.delays.show : 0,
				scale    : false,
				fade     : true,
				callback : function()
				{
					animId = null;
					App.callback(callback);
				}
			},
			appMethod = hide ? 'hideItem' : 'showItem';

		return animId = App[appMethod](group, options);
	}

	t.hide = function(animate, callback)
	{
		return t.show(animate, callback, true);
	}

	t.resize = function()
	{
		var viewBounds = App.getBounds();
		rect.bounds.height = App.config.keyboardHeightCoeff * viewBounds.height;
		rect.bounds.width  = viewBounds.width;
		rect.position      = viewBounds.bottomCenter.subtract(0, rect.bounds.height * .5);
	}

	t.getItem = function()
	{
		return group;
	}

	t.hitTest = function(point)
	{
		return rect.contains(point);
	}





	// 
	// local methods
	// 

	// 
	// items creation
	// 

	function createRect()
	{
		var path = new paper.Path.Rectangle(App.getBounds());
		App.setStyle(path, App.config.styles.keyboard);
		return path;
	}

	init();
}