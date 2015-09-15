// animation pictograms for each games
App.Games.getAnimationMethods = function()
{
	// params
	var dotWidthCoeff = 1/14,
		strokeCoeff = App.config.styles.stroke.strokeWidth / App.config.dotWidth,
		startDelay = 1000,

		marginCoeff = .15,

		strokeStyle = App.extend(App.config.styles.stroke, {
			strokeWidth : App.config.styles.trajectory.strokeWidth,
			fillColor: null
		}),
		strokeDestinationStyle = App.extend(App.config.styles.strokeDestination,{
			strokeWidth: strokeStyle.strokeWidth
		}),
		movablePathStyle = App.extend(strokeDestinationStyle, {
			opacity: 1
		})
		;

	var obj = {};

	// dot game
	obj.dot = [];
	obj.dot[0] = function (parent)
	{
		// params
		var dotScale = getDotScale(parent);

		var t = this,
			animIds,
			group,
			dot
			;

		function init()
		{
			// init variables
			animIds = [];

			group = createClippedGroup(parent);
			group.name = 'dotAnimation';

			dot = new Dot(parent.position, {scale:dotScale});

			group.appendTop(dot.getItem());
		}

		t.start = function()
		{
			var anims = [],
				delay = 0;
			animIds = [];


			// show dot
			animIds.push(dot.show());
			delay += App.config.delays.dotShow;

			// activate dot
			anims.push( 
			{
				delay: delay,
				action: function()
				{
					dot.activate();
				}
			})
			delay += 200;
			
			// hide
			anims.push(
			{
				delay : delay,
				action  : function()
				{
					captureDot(dot);
					animIds.push(winItem(dot.getItem(), parent, function(){
						dot.remove();
						restart();
					}));
				}
			});

			for (var i=0; i<anims.length; i++)
			{
				// adapt callback
				var anim = anims[i],
					animId = App.Anim.add(anim);
				animIds.push(animId);
			}
		}

		t.stop = function()
		{
			for (var i=0; i<animIds.length; i++)
			{
				var animId = animIds[i];
				App.Anim.removeAnimation(animId);
			}
		}

		t.clear = function()
		{
			group.remove();
		}


		function restart()
		{
			t.stop();
			group.remove();

			animIds.push(App.Anim.add({
				delay: getStartDelay(),
				action: function()
				{
					init();
					t.start();
				}
			}))
		}

		init();
	};






	// brokenLine game
	obj.brokenLine = [];

	// normal mode
	obj.brokenLine[0] = function(parent)
	{
		// params
		var dotScale     = getDotScale(parent),
			marginBounds = getMarginBounds(parent);

		var t = this,
			drawing,
			path
			;

		function init()
		{
			// init variables
			animIds = [];

			group = createClippedGroup(parent);
			group.name = 'dotAnimation';

			path = new paper.Path.Line([0,0], [1,0]);
			path.fitBounds(marginBounds);
			group.appendTop(path);

			drawing = new AnimationDrawing(path, dotScale, true);
		}

		t.start = function()
		{
			drawing.start();
		}

		t.stop = function()
		{
			drawing.stop();
		}

		t.clear = function()
		{
			drawing.remove();
			path.remove();
		}

		init();
	}

	// obj.brokenLine[1] = obj.brokenLine[0];


	// tweak
	// obj.dot = [obj.brokenLine[0]];


	// shapes1
	obj.shape1 = [];
	obj.shape1[0] = function (parent)
	{


		// params
		var dotScale     = getDotScale(parent),
			marginBounds = getMarginBounds(parent);

		var t = this,
			animIds,
			group,
			dots,
			targets,
			path1,
			path2
			;

		function init()
		{
			// init variables
			animIds = [];
			dots = [];
			targets = [];

			group = createClippedGroup(parent);
			group.name = 'dotAnimation';

			path1 = new paper.Path.RegularPolygon(parent.position, 3, marginBounds.width*.5);
			path2 = path1.clone().rotate(60, parent.position);

			App.setStyle(path1, 'filled');
			App.setStyle(path2, 'filledDestination');

			path1.visible = false;
			path2.visible = false;

			group.addChildren([path1, path2]);

			// dots & targets
			for (var i=0; i<path1.segments.length; i++)
			{
				var target = new Target(path2.segments[i].point, {scale:dotScale});
				group.appendTop(target.getItem());
				targets.push(target);

				var dot = new Dot(path1.segments[i].point, {scale:dotScale});
				group.appendTop(dot.getItem());
				dots.push(dot);
			}

		}

		t.start = function()
		{
			var anims = [],
				delay = 0;
			animIds = [];


			// show dots
			for (var i=0; i<dots.length; i++)
			{
				var dot = dots[i];
				animIds.push(dot.show());
			}
			delay += App.config.delays.dotShow + 100;

			// create shape1 & show shape2
			var duration = App.config.delays.show;
			anims.push({
				delay: delay,
				duration: App.config.delays.show,
				init: function()
				{
					for (var i=0; i<dots.length; i++)
					{
						var dot = dots[i];
						dot.activate();

						animIds.push(targets[i].show());
					}

					path1.visible = true;
					path2.visible = true;
					path2.opacity = 0;
				},
				data : path2.opacity,
				action: function(time, data)
				{
					path2.opacity = App.ramp(0,data,time);
				}
			})
			delay += duration;

			// rotate shape
			duration = 800;
			anims.push({
				duration: duration,
				delay: delay,
				init: function()
				{
					path1.pivot = parent.position;
					path1.applyMatrix = false;
				},
				action: function(time)
				{
					var r = App.ramp(0,60,time)
					path1.rotation = r;
					for (var i=0; i<dots.length; i++)
					{
						var p = path1.segments[i].point.rotate(r, parent.position);
						dots[i].position(p);
					}
				},
				// win
				callback: function()
				{
					for (var i=0; i<dots.length; i++)
					{
						animIds.push(dots[i].hide());
						targets[i].remove()
					}
					path2.remove();
					animIds.push(winItem(path1, parent, restart));
				}
			})
			delay += duration;



			for (var i=0; i<anims.length; i++)
			{
				var anim = anims[i],
					animId = App.Anim.add(anim);
				animIds.push(animId);
			}
		}

		t.stop = function()
		{
			for (var i=0; i<animIds.length; i++)
			{
				var animId = animIds[i];
				App.Anim.removeAnimation(animId);
			}
		}

		t.clear = function()
		{
			group.remove();
		}


		function restart()
		{
			t.stop();
			group.remove();

			animIds.push(App.Anim.add({
				delay: getStartDelay(),
				action: function()
				{
					init();
					t.start();
				}
			}))
		}

		init();
	};

	obj.shape1.kinect = [];
	obj.shape1.kinect[0] = function(parent)
	{
		// params
		var dotScale     = getDotScale(parent),
			marginBounds = getMarginBounds(parent),
			wordName = 'T',
			dotMargin = .3

		var t = this,
			animIds,
			group,
			pathsGroup,
			tempPath,
			dotsGroup,
			targetsGroup,
			drawing
			;

		function init()
		{
			// init variables
			animIds = [];
			drawing = null;

			shapesGroup = new paper.Group();

			group = createClippedGroup(parent);
			group.name = 'dotAnimation';

			pathsGroup = new Word({word:wordName});
			App.deGroupAllChildren(pathsGroup);
			App.setChildrenStyle(pathsGroup, strokeDestinationStyle);
			pathsGroup.fitBounds(marginBounds.scale(1-dotMargin*.8));
			pathsGroup.translate(0,marginBounds.height * dotMargin*.8);

			dotsGroup = new paper.Group();
			targetsGroup = new paper.Group();

			for (var i=0; i<pathsGroup.children.length; i++)
			{
				var v = i == 0 ? [-dotMargin * marginBounds.width, 0] : [dotMargin * marginBounds.width, 0],
					dot = new Dot(marginBounds.topCenter.add(v), {scale:dotScale}),
					target = new Target(marginBounds.center, {scale:dotScale}),
					dotItem = dot.getItem(),
					path = pathsGroup.children[i];

				path.opacity = 0;

				// target.show()

				dotItem.data.position = dot.getPosition();

				dotsGroup.appendTop(dotItem);
				targetsGroup.appendTop(target.getItem());
			}

			tempPath = new paper.Path.Line([0,0][0,0]);
			App.setStyle(tempPath, strokeStyle);
			tempPath.opacity = 0;

			group.addChildren([pathsGroup, targetsGroup, tempPath, dotsGroup]);
		}

		t.start = function()
		{
			var anims = [],
				duration= 800,
				delay = 0;
			animIds = [];

			for (var i=0; i<pathsGroup.children.length; i++)
			{
				var path = pathsGroup.children[i],
					callback = i == pathsGroup.children.length-1
						? function(){
							dotsGroup.remove();
							targetsGroup.remove();
							tempPath.remove();
							winItem(pathsGroup, parent, restart);
						}
						: null;
				delay = addAnim(path, delay, callback);
			}
		}

		function addAnim(path, _delay, callback)
		{
			animIds.push(App.Anim.add({
				delay: _delay,
				callback: function()
				{
					var delay = 0;
					// tempPath.visible = true;
					// show dots & temppath
					for (var j=0; j<dotsGroup.children.length; j++)
					{
						var dotItem = dotsGroup.children[j],
							dot = dotItem.data.object;

						dot.position(dotItem.data.position);
						animIds.push(dot.show());

						tempPath.segments[j].point = dotItem.data.position;
					}
					delay += App.config.delays.dotShow;


					// activate dots and show tempPath
					animIds.push(App.Anim.add({
						delay:delay,
						callback: function()
						{
							for (var j=0; j<dotsGroup.children.length; j++)
							{
								var dotItem = dotsGroup.children[j],
									dot = dotItem.data.object;

								dot.activate();
							}

							animIds.push(App.showItem(tempPath, {
								scale:false,
								fade:true,
								total:true
							}));
						}
					}))
					delay += App.config.delays.show;


					// show targets and path
					for (var j=0; j<targetsGroup.children.length; j++)
					{
						var targetItem = targetsGroup.children[j],
							target = targetItem.data.object;

						target.position(path.segments[j].point);

						animIds.push(App.Anim.add({
							delay: delay,
							data: target,
							callback: function(data)
							{
								animIds.push(data.show());
							}
						}));
					}

					animIds.push(App.Anim.add({
						delay: delay,
						duration: App.config.delays.dotShow,
						action: function(time)
						{
							path.opacity = App.ramp(0,strokeDestinationStyle.opacity, time);
						}
					}));
					delay += App.config.delays.dotShow;

					// move
					animIds.push(App.Anim.add({
						delay: delay,
						duration: 800,
						action: function(time)
						{
							for (var j=0; j<dotsGroup.children.length; j++)
							{
								var dotItem = dotsGroup.children[j],
									dot = dotItem.data.object,
									target = targetsGroup.children[j].data.object,
									p1 = dotItem.data.position,
									p2 = target.getPosition();
									p = App.rampPoints(p1,p2,time);
								dot.position(p);
								tempPath.segments[j].point = p;
							}
						},
						callback: function(data)
						{
							tempPath.opacity = 0;

							App.setStyle(path, strokeStyle);
							
							for (var j=0; j<dotsGroup.children.length; j++)
							{
								var dotItem = dotsGroup.children[j],
									dot = dotItem.data.object,
									target = targetsGroup.children[j].data.object
									;
								animIds.push(dot.hide())
								animIds.push(target.hide(false))
							}
						}
					}));
					delay += 800 + App.config.delays.dotShow;

					animIds.push(App.Anim.add({
						delay:delay,
						callback: callback
					}))
				}
			}));
			return _delay + App.config.delays.dotShow*4 + 800;
		}

		t.stop = function()
		{
			for (var i=0; i<animIds.length; i++)
			{
				var animId = animIds[i];
				App.Anim.removeAnimation(animId);
			}
		}

		t.clear = function()
		{
			group.remove();
		}


		function restart()
		{
			t.stop();
			group.remove();

			animIds.push(App.Anim.add({
				delay: getStartDelay(),
				action: function()
				{
					init();
					t.start();
				}
			}))
		}

		init();
	}


	// curves game
	obj.curve = [];
	obj.curve[0] = function(parent)
	{
		// params
		var dotScale = getDotScale(parent),
			marginBounds = getMarginBounds(parent)
			coeff = .5
			;

		var t = this,
			drawing,
			path
			;

		function init()
		{
			// init variables
			animIds = [];

			group = createClippedGroup(parent);
			group.name = 'dotAnimation';


			path = parent.clone().scale(1,-1);
			path.fitBounds(marginBounds);

			path.closed = false;
			path.removeSegment(path.segments.length-1);

			group.appendTop(path);

			drawing = new AnimationDrawing(path, dotScale, true);
		}

		t.start = function()
		{
			drawing.start();
		}

		t.stop = function()
		{
			drawing.stop();
		}

		t.clear = function()
		{
			drawing.remove();
			path.remove();
		}

		init();
	}






	// sticker game
	obj.sticker = [];
	obj.sticker[0] = function(parent)
	{
		// params
		var dotScale     = getDotScale(parent),
			marginBounds = getMarginBounds(parent);

		var t = this,
			animIds,
			group,
			shapesGroup,
			targetsGroup
			;

		function init()
		{
			// init variables
			animIds = [];

			shapesGroup = new paper.Group();

			group = createClippedGroup(parent);
			group.name = 'dotAnimation';

			var square = new paper.Path.Rectangle(parent.position, 50),
				triangle = square.clone().rotate(-45);
				square.scale(1,.6);
			triangle.removeSegment(0);
			App.alignItems(triangle,'bottomCenter',square,'topCenter');

			shapesGroup.addChildren([square, triangle]);
			shapesGroup.fitBounds(marginBounds);
			shapesGroup.position = parent.position;

			targetsGroup = shapesGroup.clone();
			for (var i=0; i<targetsGroup.children.length; i++)
			{
				targetsGroup.children[i].opacity = 0;
			}

			App.setStyle(shapesGroup, 'filled');
			App.setStyle(targetsGroup, 'filledDestination');

			App.alignItems(shapesGroup,'topCenter',parent, 'bottomCenter');
			shapesGroup.translate(0,10);
			// shapesGroup.visible = false;


			group.addChildren([shapesGroup, targetsGroup]);
		}

		t.start = function()
		{
			var anims = [],
				delay = 0;
			animIds = [];

			// show target
			for (var i=0; i<targetsGroup.children.length; i++)
			{
				animIds.push(App.showItem(targetsGroup.children[i], {
					fade:true,
					scale:false,
					total:true
				}));
			}
			delay += App.config.delays.show;

			
			for (var i=0; i<shapesGroup.children.length; i++)
			{
				var shape = shapesGroup.children[i],
					target = targetsGroup.children[i],
					p1 = shape.position,
					p2 = target.position;

				var duration = 900;

				anims.push({
					duration: duration,
					delay: delay,
					data: [shape, p1, p2, target],
					init: function(data)
					{
						animIds.push(App.animateSelection(data[0]));
					},
					action: function(time, data)
					{
						data[0].position = App.rampPoints(data[1],data[2],time);
					},
					callback: function(data)
					{
						animIds.push(App.animateDeselection(data[0]));
						data[3].remove();
					}
				});

				delay += duration + 500;
			}

			// win
			anims.push({
				delay: delay,
				action: function()
				{
					targetsGroup.remove();
					animIds.push(winItem(shapesGroup, parent, restart))
				}
			})



			for (var i=0; i<anims.length; i++)
			{
				var anim = anims[i],
					animId = App.Anim.add(anim);
				animIds.push(animId);
			}
		}

		t.stop = function()
		{
			for (var i=0; i<animIds.length; i++)
			{
				var animId = animIds[i];
				App.Anim.removeAnimation(animId);
			}
		}

		t.clear = function()
		{
			group.remove();
		}


		function restart()
		{
			t.stop();
			group.remove();

			animIds.push(App.Anim.add({
				delay: getStartDelay(),
				action: function()
				{
					init();
					t.start();
				}
			}))
		}

		init();
	}





	// movePanZoom game
	obj.movePanZoom = [];
	obj.movePanZoom[0] = function(parent)
	{
		// params
		var dotScale     = getDotScale(parent),
			marginBounds = getMarginBounds(parent),
			svgId = 'fish'
			;

		var t = this,
			animIds,
			group,
			pathsGroup
			;

		function init()
		{
			// init variables
			animIds = [];

			group = createClippedGroup(parent);
			group.name = 'dotAnimation';

			pathsGroup = paper.project.importSVG(document.getElementById(svgId));
			group.appendTop(pathsGroup);

			App.setStyle(pathsGroup, strokeStyle);
			pathsGroup.fitBounds(marginBounds);

			App.hideAllChildren(pathsGroup);
		}

		t.start = function()
		{
			var anims = [],
				delay = 0,
				duration = 800;

			animIds = [];

			pathsGroup.applyMatrix = false;

			// init
			var item = pathsGroup.children[0],
				item2 = pathsGroup.children[1];

			pathsGroup.pivot = item2.position;

			var v = parent.position.subtract(item2.position),
				p1 = pathsGroup.position,
				p2 = p1.add(v),
				s1 = pathsGroup.scaling.x,
				s2 = marginBounds.width/ item2.bounds.width;

			// trace path
			anims.push({
				duration: duration,
				delay: delay,
				init: function()
				{
					item.visible = true;
					item.dashArray = [item.length, item.length];
					item.dashOffset = -item.length;
				},
				action: function(time)
				{
					item.dashOffset = (1 - time) * item.length;
				},
				callback: function()
				{
					item.dashArray = null;
					item.dashOffset = null;
				}
			})
			delay += duration + 400;


			// // zoom
			anims.push({
				duration : duration,
				delay    : delay,
				easing   : 'easeInQuad',
				action: function(time)
				{
					pathsGroup.scaling = App.ramp(s1,s2,time);
					pathsGroup.position = App.rampPoints(p1,p2,time);
				}
			})
			delay += duration;

			// trace path
			anims.push({
				duration: duration,
				delay: delay,
				init: function()
				{
					item2.visible = true;
					item2.dashArray = [item2.length * pathsGroup.scaling.x, item2.length * pathsGroup.scaling.x];
					item2.dashOffset = -item2.length * pathsGroup.scaling.x;
				},
				action: function(time)
				{
					item2.dashOffset = (1 - time) * item2.length * pathsGroup.scaling.x;
				},
				callback: function()
				{
					item2.dashArray = null;
					item2.dashOffset = null;
				}
			})
			delay += duration + 200;


			// dezoom
			anims.push({
				duration : duration*2,
				delay    : delay,
				easing   : 'easeOutQuad',
				action: function(time)
				{
					pathsGroup.scaling = App.ramp(s2,s1,time);
					pathsGroup.position = App.rampPoints(p2,p1,time);
				},
				callback: function()
				{
					animIds.push(App.hideItem(pathsGroup, {
						scale:false,
						fade: true,
						callback: restart
					}))
				}
			})
			delay += duration;


			for (var i=0; i<anims.length; i++)
			{
				var anim = anims[i],
					animId = App.Anim.add(anim);
				animIds.push(animId);
			}
		}

		t.stop = function()
		{
			for (var i=0; i<animIds.length; i++)
			{
				var animId = animIds[i];
				App.Anim.removeAnimation(animId);
			}
		}

		t.clear = function()
		{
			group.remove();
		}


		function restart()
		{
			t.stop();
			group.remove();

			animIds.push(App.Anim.add({
				delay: getStartDelay(),
				action: function()
				{
					init();
					t.start();
				}
			}))
		}

		init();
	}








	// letter game
	obj.letter = [];
	obj.letter[0] = function(parent)
	{
		// params
		var dotScale     = getDotScale(parent),
			marginBounds = getMarginBounds(parent),
			charArray = ['a.split'],
			wordName = 'a';

		var t = this,
			animIds,
			group,
			pathsGroup,
			targetPath,
			drawing
			;

		function init()
		{
			// init variables
			animIds = [];
			drawing = null;

			shapesGroup = new paper.Group();

			group = createClippedGroup(parent);
			group.name = 'dotAnimation';

			pathsGroup = new Word({charArray:charArray});
			App.deGroupAllChildren(pathsGroup);
			App.setStyle(pathsGroup, movablePathStyle);
			pathsGroup.fitBounds(marginBounds);

			targetPath = new Word({word:wordName});
			App.deGroupAllChildren(targetPath);
			targetPath = targetPath.reduce();
			App.setStyle(targetPath, strokeDestinationStyle);
			targetPath.fitBounds(marginBounds);

			// store position
			for (var i=0; i<pathsGroup.children.length; i++)
			{
				var path = pathsGroup.children[i];
				path.data.position = path.position;
			}

			App.alignItems(pathsGroup, 'topCenter', parent, 'bottomCenter');
			pathsGroup.translate(0, strokeStyle.strokeWidth*2);

			// ligature pathsgroup
			// App.ligatureAndReduce(targetPath);

			targetPath.opacity = 0;

			group.addChildren([targetPath, pathsGroup]);
		}

		t.start = function()
		{
			var anims = [],
				duration= 800,
				delay = 0;
			animIds = [];

			// show targets
			animIds.push(App.Anim.add({
				duration : App.config.delays.show,
				delay    : delay,
				data     : [0, strokeDestinationStyle.opacity],
				action   : function(time, data)
				{
					targetPath.opacity = App.ramp(data[0], data[1], time);
				}
			}));
			delay += App.config.delays.show + 300;


			// place parts
			for (var i=pathsGroup.children.length-1; i>=0; i--)
			{
				var path = pathsGroup.children[i],
					p1 = path.position,
					p2 = path.data.position,
					_callback = i > 0 
						? null
						: function(){
							animIds.push(App.hideItem(pathsGroup, {
								scale:false,
								fade:true,
								callback: function()
								{
									pathsGroup.remove();
									drawing = new AnimationDrawing(targetPath, dotScale);
									
									drawing.start(function(){
										targetPath.remove();
									}, function(){
										drawing.remove();
										restart();
									});
								}
							}));
						};

				animIds.push(App.Anim.add({
					duration: duration,
					delay: delay,
					data: [path, p1, p2],
					action: function(time, data)
					{
						var p = App.rampPoints(data[1], data[2], time);
						data[0].position = p;
					},
					callback: _callback
				}));
				delay += duration + 400;

				

			}



			for (var i=0; i<anims.length; i++)
			{
				var anim = anims[i],
					animId = App.Anim.add(anim);
				animIds.push(animId);
			}
		}

		t.stop = function()
		{
			for (var i=0; i<animIds.length; i++)
			{
				var animId = animIds[i];
				App.Anim.removeAnimation(animId);
			}

			if (drawing)
				drawing.stop();
		}

		t.clear = function()
		{
			group.remove();
			if (drawing)
				drawing.remove();
		}


		function restart()
		{
			t.stop();
			group.remove();

			animIds.push(App.Anim.add({
				delay: getStartDelay(),
				action: function()
				{
					init();
					t.start();
				}
			}))
		}

		init();
	}








	// keyboard game
	obj.keyboard = [];
	obj.keyboard[0] = function(parent)
	{
		// params
		var dotScale     = getDotScale(parent),
			marginBounds = getMarginBounds(parent),
			wordName = 'on';

		var t = this,
			animIds,
			group,
			word,
			ligature,
			drawing
			;

		function init()
		{
			// init variables
			animIds = [];
			drawing = null;

			shapesGroup = new paper.Group();

			group = createClippedGroup(parent);
			group.name = 'dotAnimation';

			word = new Word({word:wordName, style:movablePathStyle});
			word.fitBounds(marginBounds);

			ligature = new Word({word:wordName});
			ligature.fitBounds(marginBounds);
			ligature = App.ligatureAndReduce(ligature);
			App.setStyle(ligature, strokeDestinationStyle);
			ligature.visible = false;

			word.data.object.resetLigature([0]);

			// store position
			for (var i=0; i<word.children.length; i++)
			{
				var letter = word.children[i];
				letter.data.position = letter.position;

				App.alignItems(letter, 'topCenter', parent, 'bottomCenter');
				letter.translate(0, strokeStyle.strokeWidth*2);
			}

			group.addChildren([ligature, word]);
		}

		t.start = function()
		{
			var anims = [],
				duration= 800,
				delay = 0;
			animIds = [];

			// move letters
			for (var i=0; i<word.children.length; i++)
			{
				var letter = word.children[i],
					p1 = letter.position,
					p2 = letter.data.position;

				animIds.push(App.Anim.add({
					duration: duration,
					delay: delay,
					data: [letter, p1, p2],
					action: function(time, data)
					{
						data[0].position = App.rampPoints(data[1], data[2], time);
					}
				}));
				delay += i == word.children.length-1 ? duration : duration + 400;
			}

			// animate ligature
			animIds.push(App.Anim.add({
				delay:delay,
				action: function()
				{
					word.data.object.animateLigature([0], function(){
						animIds.push(App.Anim.add({
							duration: App.config.delays.show,
							action: function(time)
							{
								word.opacity = App.ramp(1,strokeDestinationStyle.opacity, time);
							},
							callback: function()
							{
								word.remove();
								ligature.visible = true;
								drawing = new AnimationDrawing(ligature, dotScale);
								drawing.start(function(){
									drawing.remove();
									App.setStyle(ligature, strokeStyle);

									animIds.push(winItem(ligature, parent, restart))
								})
							}
						}))
					}, 1.5);
					animIds.push(word.firstChild.data.ligatureAnim);
				}
			}))


			for (var i=0; i<anims.length; i++)
			{
				var anim = anims[i],
					animId = App.Anim.add(anim);
				animIds.push(animId);
			}
		}

		t.stop = function()
		{
			for (var i=0; i<animIds.length; i++)
			{
				var animId = animIds[i];
				App.Anim.removeAnimation(animId);
			}

			if (drawing)
				drawing.stop();
		}

		t.clear = function()
		{
			group.remove();
			if (drawing)
				drawing.remove();
		}


		function restart()
		{
			t.stop();
			group.remove();

			animIds.push(App.Anim.add({
				delay: getStartDelay(),
				action: function()
				{
					init();
					t.start();
				}
			}))
		}

		init();
	}









	function createClippedGroup(parent)
	{
		var group = new paper.Group();
		parent.layer.appendTop(group);

		var mask = parent.clone();
		group.appendTop(mask);
		group.clipped = true;
		return group;
	}

	function captureDot(dot)
	{
		dot.desactivate();
		dot.getItem().fillColor = App.config.colors.user;
	}

	function winItem(item, parent, callback)
	{
		item.applyMatrix = false;

		var p1 = item.position,
			p2 = parent.position,
			o1 = item.opacity || 1,
			o2 = 0,
			s1 = item.scaling.x || 1,
			s2 = 0;

		return App.Anim.add({
			duration: App.config.delays.win,
			easing: 'easeInQuad',
			action: function(time)
			{
				item.position = App.rampPoints(p1,p2,time);
				item.opacity = App.ramp(o1,o2,time);
				item.scaling = App.ramp(s1,s2,time);
			},
			callback: function()
			{
				App.callback(callback);
			}
		})
	}

	function getDotScale(parent)
	{
		return getDotWidth(parent) / App.config.dotWidth;
	}

	function getDotWidth(parent)
	{
		return Math.min(parent.bounds.width * dotWidthCoeff, App.config.dotWidth);
	}

	function getMarginBounds(parent)
	{
		var w = parent.bounds.width * (1 - marginCoeff*2) - getDotWidth(parent)*2,
			scale = w / parent.bounds.width;
		return parent.bounds.scale(scale);
	}

	function getStartDelay()
	{
		return App.rdmRange(startDelay*.5, startDelay*1.5);
	}






	// 
	// class
	// 

	function AnimationDrawing(model, dotScale, loop)
	{
		// params
		var trajectoryStyle = App.extend(App.config.styles.trajectory, {
				dashArray: [.01, App.config.styles.trajectory.dashArray[1] * Math.min(dotScale*3.5, 1)]
			}),
			minTrajectoryDelay = 500,
			maxTrajectoryDelay = 1500
			;

		var t = this,
			animIds,
			dot,
			target,
			trajectory,
			path,
			group,

			firstPoint,
			lastPoint,

			parent
			;

		function init()
		{
			animIds = [];

			path = model.clone();
			parent = path.parent;

			firstPoint = path.firstSegment.point;
			lastPoint = path.lastSegment.point;

			dot = new Dot(firstPoint, {scale:dotScale});
			target = new Target(lastPoint, {scale:dotScale});

			trajectory = path.clone();
			App.setStyle(trajectory, trajectoryStyle);
			trajectory.dashOffset = App.getDashOffset(trajectory, true);
			trajectory.visible = false;

			App.setStyle(path, strokeStyle);
			path.dashArray = [path.length, path.length];
			path.dashOffset = -path.length;
			path.visible = false;

			group = new paper.Group();
			group.name = 'animationGroup';
			parent.insertChild(path.index+1, group);
			group.addChildren([trajectory, target.getItem(), path, dot.getItem()]);
		}

		t.init = init;

		t.start = function(endCallback, winCallback)
		{
			var anims = [],
				delay = 0;
			animIds = [];

			// show dot
			animIds.push(dot.show());
			delay += App.config.delays.dotShow;


			// show trajectory
			var duration = trajectory.length * App.config.speeds.trajectory*5;
			if (duration < minTrajectoryDelay)
				duration = minTrajectoryDelay;
			else if (duration > maxTrajectoryDelay)
				duration = maxTrajectoryDelay;

			anims.push({
				duration : duration,
				delay: delay,
				init : function()
				{
					trajectory.visible = true;
				},
				action   : function(time)
				{
					trajectory.dashArray = App.getDashArray(trajectory, trajectoryStyle.dashArray, time, true);
				},
				callback : function()
				{
					animIds.push(target.show());
					trajectory.dashArray = trajectoryStyle.dashArray;
				}
			});
			delay += duration + App.config.delays.dotShow;


			// trace path
			anims.push({
				duration: duration,
				delay: delay,
				init: function()
				{
					path.visible = true;
					dot.activate();
				},
				action: function(time)
				{
					var offset = path.length * time,
						p = path.getPointAt(offset);
						
					path.dashOffset = -path.length - offset;
					dot.position(p);
				},
				callback: function()
				{
					path.dashArray = null;
					trajectory.remove();
					target.remove();
					dot.hide(function(){
						dot.remove();
					});
					App.callback(endCallback);
					if (loop || typeof winCallback === 'function')
					{
						animIds.push(winItem(path, parent, function(){
							restart();
							App.callback(winCallback);
						}))
					}
				}
			})
			delay += duration;



			for (var i=0; i<anims.length; i++)
			{
				var anim = anims[i];
				animIds.push(App.Anim.add(anim));
			}
		}

		t.stop = function()
		{
			for (var i=0; i<animIds.length; i++)
			{
				var anim = animIds[i];
				App.removeAnimation(anim);
			}
			animIds = [];
		}

		t.remove = function()
		{
			group.remove();
		}

		function restart()
		{
			t.stop();
			t.remove();

			animIds.push(App.Anim.add({
				delay: getStartDelay(),
				action: function()
				{
					init();
					t.start();
				}
			}))
		}

		init();
	}

	return obj;
}