function MorphPath(path1, path2)
{
	var t = this,
		clone1,
		clone2,
		path;

	t.path;

	function init()
	{
		clone1 = path1.clone();
		clone1.name = 'morphClone1';
		clone2 = path2.clone();
		clone2.name = 'morphClone2';

		if (!checkModels())
		{
			return null;
		}

		t.path = createMorphPath();
		// t.path.strokeColor = 'black';
		clone1.visible = false;
		clone2.visible = false;
	}


	t.update = function(time)
	{
		var segments = [];
		for (var i=0; i<t.path.segments.length; i++)
		{
			var s1    = clone1.segments[i],
				s2    = clone2.segments[i],
				p1    = s1.point,
				p2    = s2.point,
				hIn1  = s1.handleIn,
				hIn2  = s2.handleIn,
				hOut1 = s1.handleOut,
				hOut2 = s2.handleOut,
				p     = App.rampPoints(p1,p2,time),
				hIn   = App.rampPoints(hIn1,hIn2,time),
				hOut  = App.rampPoints(hOut1,hOut2,time);

			segments.push(new paper.Segment(p,hIn,hOut));
		}
		t.path.segments = segments;
	}

	t.clear = function()
	{
		clone1.remove();
		clone2.remove();
		// t.path.remove();
	}

	t.remove = t.clear;


	function checkModels()
	{
		var arr = [clone1, clone2];
		for (var i=0; i<arr.length; i++)
		{
			var path = arr[i],
				otherPath = i == 0 ? arr[i+1] : arr[0];

			if (path.segments.length == 0)
			{
				path.segments = otherPath.segments;
				if (path.segments.length == 0)
				{
					console.log('empty paths !!');
					return false;
				}
			}

			if (path.segments.length == 1)
			{
				path.add(path.firstSegment);
			}
		}

		return true;
	}
	

	function createMorphPath()
	{
		var paths   = [clone1, clone2],
			offsets = [[], []];

		// store paths degments offsets (except first and last)
		// loop paths
		for (var i=0; i<paths.length; i++)
		{
			var path = paths[i];
			// loop segments
			for (var j=1; j<path.segments.length-1; j++)
			{
				var segment = path.segments[j],
					offset  = segment.location.offset / path.length;
				offsets[i].push(offset);
			}
		}

		// add points
		for (var i=0; i<paths.length; i++)
		{
			// point to the other path
			var path = i == 0 ? paths[i+1] : paths[0],
				offsetArr = offsets[i];
			// loop segments
			for (var j=0; j<offsetArr.length; j++)
			{
				var offset  = offsetArr[j];
				App.addPoint(path, offset);
			}
		}

		var result = clone1.clone();
		result.name = 'morphResult';
		return result;
	}

	init();
}