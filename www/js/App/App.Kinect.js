App.Kinect = new function()
{
    var t = this,

        canvas,

        // web socket
        idArr,
        splitChar1 = '/',
        splitChar2 = ';',
        rightHansAsDefault = true,

        // pointer
        pointers,
        pointerAnimId,
        pointerCircleStyle =
        {
            fillColor : App.config.colors.user,
            opacity   : .35,
            width     : 30
        },
        pointerCurveStyle =
        {
            strokeColor    : App.config.colors.kinectUser1,
            strokeWidth    : 3,
            strokeCap      : 'round',
            alternateColor : App.config.colors.kinectUser2
        },
        pointerDotStyle =
        {
            fillColor : App.config.colors.user,
            opacity   : 1,
            width     : 5
        },
        pointerPrimaryStyle =
        {
            fillColor : App.config.colors.user,
            opacity   : .3,
            width     : 15
        },
        secondaryPointersOpacity = .15,

        pointerShapeCounter,
        pointerShapes,
        pointerShapesFunctions,

        primaryPointer;



    // global params
    t.multiplayer = false;
    t.useBothHands = true;

    t.pointersMenuMode = true;


    t.init = function(_canvas)
    {
        if (!window.WebSocket) {
            return false;
        }

        idArr = [];
        canvas = _canvas;
        primaryPointer = null;

        initWebSocket();

        initPointers();

        return true;
    }


    function initWebSocket()
    {
        console.log("Connecting to server...");

        // Initialize a new web socket.
        var socket = new WebSocket("ws://localhost:8181");

        // Connection established.
        socket.onopen = function () {
            console.log("Connection successful.");
            App.onKinectConnection();
        };

        // Connection closed.
        socket.onclose = function () {
            console.log("Connection closed.");
            App.onKinectDisconnection();

            App.kinectLayer.visible = false;
        }

        // Receive data FROM the server!
        socket.onmessage = function (e) {
            handleMessage(e.data);
        };
    }


    function initPointers()
    {
        // kinect version
        pointerAnimId = null;
        pointers = {};
        pointerShapes = [];
        pointerShapeCounter = 0;
        pointerShapesFunctions = [];

        // create specific layer for pointers
        App.kinectLayer = new paper.Layer();
        App.kinectLayer.bringToFront();
        App.kinectLayer.name = 'kinectLayer';

        // user 1 left hand
        pointerShapesFunctions[0] = function(point, alternateColor)
        {
            var group = new paper.Group(),
                groupParent = new paper.Group();

            group.applyMatrix = false;
            groupParent.applyMatrix = false;
            groupParent.appendTop(group);

            var circle = new paper.Path.Circle(point, pointerCircleStyle.width);
            circle.style = pointerCircleStyle;
            circle.opacity = pointerCircleStyle.opacity;
            
            var dot = new paper.Path.Circle(point, pointerDotStyle.width);
            dot.style = pointerDotStyle;
            dot.opacity = pointerDotStyle.opacity;
            dot.applyMatrix = false;

            var primaryCircle = new paper.Path.Circle(point, pointerPrimaryStyle.width);
            primaryCircle.style = pointerPrimaryStyle;
            primaryCircle.opacity = 0;

            group.addChildren([circle, primaryCircle, dot]);

            // if both hands are used, show difference with a colored curve
            if (t.useBothHands)
            {
                var curve = new paper.Path.Circle(point, pointerCircleStyle.width + pointerCurveStyle.strokeWidth);
                curve.style = pointerCurveStyle;
                if (alternateColor)
                {
                    curve.strokeColor = pointerCurveStyle.alternateColor;
                }
                curve.rotate(135);
                curve.removeSegments(0,2);
                curve.closed = false;

                group.appendTop(curve);
            }

            // in multiplayer but only one hand mode, color circle
            if (t.multiplayer && !t.useBothHands)
            {
                circle.fillColor = alternateColor ? pointerCurveStyle.alternateColor : pointerCurveStyle.strokeColor;
            }

            App.kinectLayer.appendTop(groupParent);

            return groupParent;
        };

        // user 1 right hand
        pointerShapesFunctions[1] = function(point)
        {
            return pointerShapesFunctions[0](point).rotate(180);
        }

        // user 2 left hand
        pointerShapesFunctions[2] = function(point)
        {
            return pointerShapesFunctions[0](point, true);
        }

        // user 2 right hand
        pointerShapesFunctions[3] = function(point)
        {
            return pointerShapesFunctions[2](point).rotate(180);
        }

        // create all pointers and hide them
        for (var i=0; i<4; i++)
        {
            var pointer = pointerShapesFunctions[i]([-50,-50]);
            pointerShapes.push(pointer);
        }

        // fake user to test
        // handleMessage('move/15;50;50;150;38/');

        // setTimeout(function(){
        //     handleMessage('move/15;25;150;150;50/');
        // },500)
        // pointerShapeCounter = 2;
    }


    // handle message sent by kinect app
    function handleMessage(msg)
    {
        if (msg == 'userLeft')
        {
            // check skeleton disparition
            var removedUser = false;
            for (var i=0; i<idArr.length; i++)
            {
                console.log('remove skeleton',idArr[i])
                t.removeUser(idArr[i]);
                idArr.splice(i, 1);
                i--;

                removedUser = true;
            }

            // when last user is left
            if (removedUser)
            {
                // tell app
                App.onKinectUserLeft();

                // reset user index so next user is considered as first
                pointerShapeCounter = 0;
            }
        }
        else
        {
            var skeletonsArr = msg.split(splitChar1),
                _idArr = [];

            for (var i=0; i<skeletonsArr.length; i++)
            {
                var skeletonArr = skeletonsArr[i].split(splitChar2),
                    skeletonId = skeletonArr[0],
                    lx = parseInt(skeletonArr[1]),
                    ly = parseInt(skeletonArr[2]),
                    rx = parseInt(skeletonArr[3]),
                    ry = parseInt(skeletonArr[4]),
                    points = [[lx, ly], [rx, ry]];

                if (skeletonId)
                {
                    // new skeleton
                    if (idArr.indexOf(skeletonId) < 0)
                    {
                        // check multiplayer
                        if (t.multiplayer || idArr.length == 0)
                        {
                            console.log('new skeleton',points,skeletonId)
                            t.newUser(skeletonId, points);
                            idArr.push(skeletonId);
                        }
                    }

                    else
                    {
                        // console.log('update skeleton',skeletonId)
                        t.updateUser(skeletonId, points);
                    }

                    _idArr.push(skeletonId);
                }
            }

            // check skeleton disparition
            for (var i=0; i<idArr.length; i++)
            {
                if (_idArr.indexOf(idArr[i]) < 0)
                {
                    console.log('remove skeleton',idArr[i])
                    t.removeUser(idArr[i]);
                    idArr.splice(i, 1);
                    i--;
                }
            }
        }
    }


    // manage users

    t.newUser = function(id, points)
    {
        var lp = screenToCanvas(points[0]),
            rp = screenToCanvas(points[1]);

        pointerShapeCounter = pointerShapeCounter % 4; 

        if (t.useBothHands)
        {
            pointers[id] = [createPointer(lp, pointerShapeCounter), createPointer(rp, pointerShapeCounter + 1)];
        }
        else
        {
            pointers[id] = rightHansAsDefault ? [createPointer(rp, pointerShapeCounter + 1)] : [createPointer(lp, pointerShapeCounter)];
        }

        // store shape index to track cursor id
        var userIndex = pointerShapeCounter / 2;
        pointers[id].userIndex = userIndex;

        if (getUserCount() == 1)
        {
            if (primaryPointer)
            {
                removePrimaryPointer();
            }

            setPrimaryPointer(id);
            // console.log('after setting primary pointer',primaryPointer)
        }

        pointerShapeCounter += 2;

        // adapt pointers to menu mode
        t.setPointersMenuMode(t.pointersMenuMode);
    }

    t.updateUser = function(id, points)
    {
        if (!pointers[id])
            return;

        var l = pointers[id].length;

        for (var i=0; i<l; i++)
        {
            if (!pointers[id])
                return;

            var pointer = pointers[id][i],
                pointIndex = t.useBothHands || !rightHansAsDefault ? i : i+1,
                point = screenToCanvas(points[pointIndex]),
                handIndex = t.useBothHands && !rightHansAsDefault ? Math.abs(i-1) : pointIndex,
                cursorId = 'user_' + pointers[id].userIndex + '-hand_' + handIndex,
                primaryCursor = primaryPointer && primaryPointer[0] == id && primaryPointer[1] == i;

            // move pointer
            pointer.position = paper.view.viewToProject(point);

            // send event to app
            App.onKinectPointerMove({id:cursorId, point:point, clientX:point[0], clientY:point[1], primaryCursor:primaryCursor, skeletonId:id, pointerIndex:i})
        }
    }

    t.removeUser = function(id)
    {
        // if last user, remove primary pointer
        var userCount = getUserCount();
        if (userCount == 1)
        {
            if (primaryPointer)
                removePrimaryPointer();
        }

        // transfer primary pointer to other user
        else
        {
            for (var k in pointers)
            {
                if (k != id)
                {
                    setPrimaryPointer(k);
                    break;
                }
            }
        }

        for (var i=0; i<pointers[id].length; i++)
        {
            var pointerGroup = pointers[id][i],
                pointer = pointerGroup.firstChild;

            var scale0 = pointer.scaling.x,
                scale2 = .01;

            pointerAnimId = App.Anim.add({
                duration: 500,
                data: [pointer, scale0, pointerGroup],
                action: function(_t, data)
                {
                    var scale1 = data[1] + (scale2 - data[1]) * _t;
                    data[0].scaling = [scale1, scale1];
                },
                callback: function(data)
                {
                    data[2].position = [-50,-50];
                }
            });
        }

        delete pointers[id];
    }


    // global check methods
    function getUserCount()
    {
        var counter = 0;
        for (var k in pointers)
        {
            counter++;
        }
        return counter;
    }




    // primary pointer gestion

    function setPrimaryPointer(id)
    {
        var handId = t.useBothHands && rightHansAsDefault ? 1 : 0,
            userIndex     = pointers[id].userIndex,
            primaryCircle = getPrimaryCircle(id, handId);

        primaryCircle.opacity = pointerPrimaryStyle.opacity;
        primaryPointer = [id, handId, userIndex];
    }

    function removePrimaryPointer()
    {
        var primaryCircle = getPrimaryCircle(primaryPointer[0], primaryPointer[1]);

        primaryCircle.opacity = 0;

        resetPrimaryDotStyle();

        primaryPointer = null;
    }
    

    // external
    t.onPrimaryPointerHover = function()
    {
        if (!primaryPointer)
            return;

        var dot = getDot(primaryPointer[0], primaryPointer[1]);
        dot.fillColor = primaryPointer[2] == 0 ? App.config.colors.kinectUser1 : App.config.colors.kinectUser2;
    }

    t.onPrimaryPointerLooseTarget = function()
    {
        resetPrimaryDotStyle()
    }

    t.onPrimaryPointerTarget = function(_t)
    {
        if (!primaryPointer)
            return;

        var dot = getDot(primaryPointer[0], primaryPointer[1]),
            v1 = 1,
            v2 = pointerCircleStyle.width / pointerDotStyle.width,
            val = App.ramp(v1, v2, _t);

        dot.scaling = [val,val];
    }

    t.onPrimaryPointerClick = function()
    {
        resetPrimaryDotStyle();
    }


    // only show primary pointer in menus
    t.setPointersMenuMode = function(menuMode)
    {
        t.pointersMenuMode = menuMode;
        
        // in menu mode, hide all exept primary
        // in game mode, show all
        for (var k in pointers)
        {
            for (var i=0; i<pointers[k].length; i++)
            {
                var pointerGroup = pointers[k][i],
                    primary = primaryPointer && primaryPointer[0] == k && primaryPointer[1] == i;

                pointerGroup.opacity = !menuMode || primary ? 1 : secondaryPointersOpacity;
            }
        }
    }

    t.setPointersParametters = function(params)
    {
        var hasChanged = false;
        for (var k in params)
        {
            if (t[k] != params[k])
            {
                t[k] = params[k];
                hasChanged = true;
            }
        }
        if (hasChanged)
            resetPointers();
    }

    function resetPointers()
    {
        var removedUser = false;
        for (var i=0; i<idArr.length; i++)
        {
            console.log('remove skeleton',idArr[i])
            t.removeUser(idArr[i]);
            idArr.splice(i, 1);
            i--;

            removedUser = true;
        }

        // when last user is left
        if (removedUser)
        {
            // reset user index so next user is considered as first
            pointerShapeCounter = 0;
        }
    }



    function getPrimaryCircle(id, handId)
    {
        return pointers[id][handId].firstChild.children[1];
    }

    function getDot(id, handId)
    {
        return pointers[id][handId].firstChild.children[2];
    }

    function resetPrimaryDotStyle()
    {
        if (!primaryPointer)
            return;

        // reset dot style
        var dot = getDot(primaryPointer[0], primaryPointer[1]);
        dot.style = pointerDotStyle;
        dot.scaling = [1,1];
    }




    function createPointer(point, shapeIndex)
    {
        point = paper.view.viewToProject(point);

        var pointerGroup = pointerShapes[shapeIndex],
            pointer = pointerGroup.firstChild;

        pointerGroup.position = point;
        pointer.scaling = [.01,.01]

        // anim
        var scale0 = pointer.scaling.x,
            scale2 = 1;

        App.Anim.add({
            duration: 500,
            action: function(_t)
            {
                var scale1 = scale0 + (scale2 - scale0) * _t;
                pointer.scaling = [scale1, scale1];
            }
        });

        return pointerGroup;
    }


    


    // convert point data from screen to view size
    function screenToCanvas(arr)
    {
        var screenW = screen.width,
            screenH = screen.height,
            canvasW = canvas.clientWidth,
            canvasH = canvas.clientHeight;

        arr[0] = arr[0] * canvasW / screenW;
        arr[1] = arr[1] * canvasH / screenH;

        // don't do out of the screen
        if (arr[0] > canvasW)
        {
            arr[0] = canvasW;
        }
        if (arr[1] > canvasH)
        {
            arr[1] = canvasH;
        }

        return arr;
    }
}