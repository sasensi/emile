// config
App.config = {};

// App main parametters
App.config.fullScreen = false;
App.config.tryKinect = false;
App.config.title = true;

App.config.testGame = '';
App.config.testKinectGame = '';




// 
// colors
// 

App.config.colors =
{
	app         : App.createColor(255,0,85),
	menu        : App.createColor(255,225,166),
	game        : App.createColor(0,165,255),
	user        : App.createColor(16,13,26),
	machine     : App.createColor(255,255,255),
	kinectUser1 : App.createColor(51,255,170),
	kinectUser2 : App.createColor(251,255,102),
	extra1 : App.createColor(51,255,255),
	extra2 : App.createColor(51,51,255)
};




// 
// games
// 

App.config.gamesInfos =
{
	'dot':
	{
		name: 'points',
		notions: ['tracer','manipuler'],
		offset : 1,
		instructions : ["Expérimenter le comportement de chaque point."]
	},
	'brokenLine':
	{
		name: 'droites',
		notions: ['tracer'],
		offset : 2,
		instructions : ["Déplacer le point jusqu'à la cible."],
		kinectInstruction: ["Déplacer le point jusqu'à la cible."],
		kinectParametters: {useBothHands:false, multiplayer:false}
	},
	'shape1':
	{
		name: 'formes 1',
		notions: ['manipuler'],
		offset : 0,
		instructions : ["Placer un doigt sur chaque point puis déplacer la forme."],
		kinectInstruction: ["Placer une main sur chaque point puis déplacer la forme."],
		kinectParametters: {useBothHands:true, multiplayer:false}
	},
	'curve':
	{
		name: 'courbes',
		notions: ['tracer'],
		offset : 2,
		instructions : ["Déplacer le point en suivant la trajectoire."]
	},
	'sticker':
	{
		name: 'formes 2',
		notions: ['manipuler'],
		offset : 0,
		instructions : ["Recomposer la forme."]
	},
	'movePanZoom':
	{
		name: 'dessins',
		notions: ['tracer','manipuler'],
		offset : 1,
		instructions : ["Dessiner et manipuler l'espace."]
	},
	'letter':
	{
		name: 'lettres',
		notions: ['tracer','manipuler'],
		offset : 1,
		instructions : ["Construire et tracer les lettres."]
	},
	'keyboard':
	{
		name: 'mots',
		notions: ['tracer','manipuler'],
		offset : 1,
		instructions : ["Composer et tracer des mots."]
	}
};





// 
// interface
// 

// global
App.config.cornerOffset = 50;

// app
App.config.margin = .1;

// game
App.config.winMargin = .025;
App.config.winBoxHeight = .07;

// dots
App.config.dotWidth                 = 30;
App.config.helperOpacity            = .25;
App.config.dotHelperScaleCoeff      = 1.5;

App.config.littleDotCoeff = .1;

App.config.dotTouchScaleCoeff       = 1.5;
App.config.kinectDotTouchScaleCoeff = 3;

// target
App.config.targetWidth = App.config.dotWidth;

// keyboard
App.config.keyboardHeightCoeff = .35;
App.config.tapDistance = App.config.dotWidth;

App.config.fadeOpacity = App.config.helperOpacity;






// 
// animation delays
// 

App.config.delays = {};
App.config.delays.show         = 500;
App.config.delays.hide         = 500;
App.config.delays.dotReset     = 800;
App.config.delays.win          = 1200;
App.config.delays.winGroup     = 2500;
App.config.delays.select       = 300;

App.config.delays.kinectTarget = 800;
App.config.delays.layerSwitch  = 1000;

App.config.delays.morphDrawing = 1000;
App.config.delays.morphTarget  = 500;

App.config.delays.dotShow      = App.config.delays.show;
App.config.delays.dotHide      = App.config.delays.hide;

App.config.delays.trajectory   = 800;

App.config.dotShowDelay = App.config.delays.dotShow;

App.config.delays.tap       = 1000;

App.config.delays.capture = 300;



// 
// animation speed (ms / px)
// 
App.config.speeds = {};
App.config.speeds.trajectory = 2;
App.config.speeds.dotReset   = 1.5;
App.config.speeds.tap        = 2;
App.config.speeds.capture    = 1.5;

App.config.speed = 1;



// 
// animation easing
// 
App.config.easings = {};
App.config.easings.dotReset    = 'easeInQuad';
App.config.easings.show        = 'easeOutQuad';
App.config.easings.morphTarget = 'easeOutQuad';





// 
// styles
// 

App.config.styles = {};

App.config.styles.stroke =
{
	strokeColor   : App.config.colors.user,
	strokeWidth   : 4.8,
	strokeJoin    : 'round',
	strokeCap     : 'round',
	strokeScaling : false,
	opacity : 1
};

App.config.styles.dot = App.extendObject(App.config.styles.stroke,
{
	fillColor        : App.config.colors.machine,
	strokeColor      : null,
	width            : App.config.dotWidth,
	touchWidth       : App.config.dotWidth * App.config.dotTouchScaleCoeff,
	kinectTouchWidth : App.config.dotWidth * App.config.kinectDotTouchScaleCoeff,
	applyMatrix      : false
});

App.config.styles.littleDot = App.extend(App.config.styles.stroke,
{
	fillColor : App.config.colors.user,
	width : App.config.dotWidth * App.config.littleDotCoeff
});

App.config.styles.helper = 
{
	fillColor : App.config.colors.user,
	width     : App.config.styles.dot.width * App.config.dotHelperScaleCoeff,
	opacity   : App.config.helperOpacity
};

App.config.styles.target = App.extendObject(App.config.styles.dot,
{	
	fillColor   : null,
	strokeColor : App.config.colors.machine,
	strokeWidth : 2
});

App.config.styles.activeTarget = App.extendObject(App.config.styles.target,
{
	strokeColor : App.config.colors.user,
});

App.config.styles.trajectory = App.extendObject(App.config.styles.target,
{
	strokeWidth: 3.5,
	dashArray: [.1,10]
});

App.config.styles.filled = App.extendObject(App.config.styles.stroke,
{
	strokeWidth : 3,
	fillColor : App.config.colors.user
});

App.config.styles.selected = App.extendObject(App.config.styles.filled,
{
	strokeColor: App.config.colors.machine
});

App.config.styles.filledDestination = App.extendObject(App.config.styles.filled,
{
	fillColor   : App.config.colors.machine,
	strokeColor : App.config.colors.machine,
	opacity     : .3
});

App.config.styles.strokeDestination = App.extendObject(App.config.styles.filledDestination,
{
	strokeWidth: App.config.styles.stroke.strokeWidth,
	fillColor: null
});

// win
App.config.styles.filledWin = App.extendObject(App.config.styles.filled,
{
	strokeWidth: 1,
	opacity: .3
})

App.config.styles.strokeWin = App.extendObject(App.config.styles.filledWin,
{
	strokeWidth: 2,
	fillColor   : null
});

App.config.styles.text =
{
	fillColor  : App.config.colors.user,
	fontFamily : 'sassoon',
	fontSize   : 30
};

App.config.styles.movableStroke = App.extendObject(App.config.styles.stroke,
{
	strokeColor:App.config.colors.machine
});

App.config.styles.keyboard = App.extendObject(App.config.styles.helper);




App.config.basicStrokeStyle = App.config.styles.stroke;
App.config.targetStyle = App.config.styles.target;
App.config.targetLineStyle = App.config.styles.trajectory;
App.config.filledStyle = App.config.styles.filled;
App.config.filledDestinationStyle = App.config.styles.filledDestination;
App.config.winStyle = App.config.styles.strokeWin;
App.config.filledWinStyle = App.config.styles.filledWin;
App.config.textStyle = App.config.styles.text;





// 
// characters config
// 

App.config.charMap =
{
	'´': 'acute',
	'`': 'grave',
	'ˆ': 'circumflex',
	'¨': 'dieresis',

	'á': 'aacute',
	'à': 'agrave',
	'â': 'acircumflex',
	'ä': 'adieresis',
	'é': 'eacute',
	'è': 'egrave',
	'ê': 'ecircumflex',
	'ë': 'edieresis',
	'í': 'iacute',
	'ì': 'igrave',
	'î': 'icircumflex',
	'ï': 'idieresis',
	'ó': 'oacute',
	'ò': 'ograve',
	'ô': 'ocircumflex',
	'ö': 'odieresis',
	'ú': 'uacute',
	'ù': 'ugrave',
	'û': 'ucircumflex',
	'ü': 'udieresis',
	'ý': 'yacute',
	'ÿ': 'ydieresis',
	' ': 'space',
	',': 'comma',
	';': 'semicolon',
	'.': 'period',
	':': 'colon',
	'!': 'exclam',
	'?': 'question',
	'&': 'ampersand',
	'\'': '',
	'(': 'parenleft',
	')': 'parenright',
	'+': 'plus',
	'-': 'minus',
	'*': 'asterisk',
	'$': 'dollar',
	'€': 'euro',
	'=': 'equal',
	'@': 'at'
}

App.config.ligatureSegments =
{
	'abcdefhklmnpqrsuvwx' : [0,1],
	'o'                  : [0,2],
	'gyz'                : [0,3],
	'it'                 : [1,1],
	'j'                  : [1,2]
}




// 
// tweaks
// 

App.config.minScaling = .001;

App.config.drawingAccuracy = 35;