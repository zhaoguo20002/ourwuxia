/**
 * @author Suker
 * 贝塞尔曲线路径算法异步模式支持
 * 这个插件必须给予WebWorker使用
 */
(function() {
	var _args = {
		/**
		 * 贝塞尔控制点实体类
		 * @param {number} x
		 * @param {number} y
		 */
		Point2D: function(x, y) {
			this.x = x || 0.0;  
    		this.y = y || 0.0; 
		},
		/**
		 cp在此是四個元素的阵列:  
		 cp[0]为起始点  
		 cp[1]为第一个控制点 
		 cp[2]为第二个控制点  
		 cp[3]为結束点  
		 t为参数值，0 <= t <= 1  
		 * @param {array} cp
		 * @param {number} t
		 */
		pointOnCubicBezier: function(cp, t) {
			var ax, bx, cx, 
		    ay, by, cy, 
		    tSquared, tCubed, 
		    result = new this.Point2D();  
		    /*计算多項式系数*/  
		    cx = 3.0 * (cp[1].x - cp[0].x);  
		    bx = 3.0 * (cp[2].x - cp[1].x) - cx;  
		    ax = cp[3].x - cp[0].x - cx - bx;  
		  
		    cy = 3.0 * (cp[1].y - cp[0].y);  
		    by = 3.0 * (cp[2].y - cp[1].y) - cy;  
		    ay = cp[3].y - cp[0].y - cy - by;  
		    /*计算位于参数值t的曲线点*/  
		    tSquared = t * t;  
		    tCubed = tSquared * t;  
		    result.x = (ax * tCubed) + (bx * tSquared) + (cx * t) + cp[0].x;  
		    result.y = (ay * tCubed) + (by * tSquared) + (cy * t) + cp[0].y;  
		    return result; 
		},
		/**
		 * 创建贝塞尔曲线节点路径
     	 * @returns {array}
		 * @param {array} cp
		 * @param {number} pointNum
		 */
		create: function(cp, pointNum) {
			var dt, i, _curve = [], 
			_pointNum = pointNum || 10,
		    dt = 1.0 / ( _pointNum - 1 );  
		    for( i = 0; i < _pointNum; i++) {
		        _curve.push(_args.pointOnCubicBezier(cp, i * dt)); 
			}
			return _curve;
		},
		/**
		 * 创建贝塞尔曲线移动路径
     	 * @returns {array}
		 * @param {array} cp
		 * @param {number} pointNum
		 */
		createPath: function(cp, pointNum) {
			var dt, i, _curve = [], 
			_pointNum = pointNum || 10,
		    dt = 1.0 / ( _pointNum - 1 ), _cp = cp || [], _point, _curX = _cp[0].x, _curY = _cp[0].y;  
		    for( i = 0; i < _pointNum; i++) { 
				//第一个点不需要处理
				_point = _args.pointOnCubicBezier(_cp, i * dt);
				if (i > 0) {
			        _curve.push([_point.x - _curX, _point.y - _curY]); 
					_curX = _point.x;
					_curY = _point.y;
				}
			}
			return _curve;
		},
        /**
         * 创建世界地图中贝塞尔曲线移动路径[考虑障碍物]
         * @returns {array}
         * @param {array} cp
         * @param {number} pointNum
         * @param {array} map
         * @param {number} mapOffX
         * @param {number} mapOffY
         * @param {number} ow
         * @param {number} oh
         * @param {jumpTimes} oh
         */
        createMapPath: function(cp, pointNum, map, mapOffX, mapOffY, ow, oh, jumpTimes) {
            var dt, i, _curve = [], 
            _pointNum = pointNum || 10,
            dt = 1.0 / ( _pointNum - 1 ), _cp = cp || [], _point, _curX = _cp[0].x, _curY = _cp[0].y, 
            _nodes = [], _map = map || [[]], _mapOffX = mapOffX || 0, _mapOffY = mapOffY || 0, _ow = ow || 32, _oh = oh || 32;  
            for( i = 0; i < _pointNum; i++) { 
                //第一个点不需要处理
                _point = _args.pointOnCubicBezier(_cp, i * dt);
                _nodes.push(_point);
                _curve.push([_point.x - _curX, _point.y - _curY]); 
                if (i > 0) {
                    _curX = _point.x;
                    _curY = _point.y;
                }
            }
            //检测路径的最后一个点是否是非障碍点，如果是则移除，知道找到最后一个路径是非障碍点
            var _getI = null, _getJ = null; 
            while (_nodes[_nodes.length - 1] && _map[~~((_nodes[_nodes.length - 1].y + _mapOffY) / _oh)] && !_map[~~((_nodes[_nodes.length - 1].y + _mapOffY) / _oh)][~~((_nodes[_nodes.length - 1].x + _mapOffX) / _ow)]) {
                _nodes.pop();
                _curve.pop();
                if (_nodes[_nodes.length - 1]) {
                    _getI = ~~((_nodes[_nodes.length - 1].y + _mapOffY) / _oh);
                    _getJ = ~~((_nodes[_nodes.length - 1].x + _mapOffX) / _ow);
                }
            }
            _nodes = null;
            //如果中途有障碍物那么用上面算出的非障碍点重新计算路径
            if (_getI != null && _getJ != null) {
                //如果第一跳的话处理往回飞的路径
                if (jumpTimes == 0) {
                    _cp[3].x = ~~(_getJ * _ow + (_ow >> 1) - _mapOffX);
                    _cp[3].y = ~~(_getI * _oh + (_oh >> 1) - _mapOffY);
                    return this.createMapPath(_cp, pointNum);
                }
                else { //如果是多段跳的途中变向，目的地又出现是障碍点的情况则不处理路径
                    return null;
                }
            }
            else {
                return _curve;
            }
        }
	};
	addEventListener('message', function(e) {
		var _data = e.data, 
		_cp = _data.cp, 
		_pointNum = _data.pointNum, 
		_type = _data.type;
		if (_type == 'create') {
			_data.path = _args.create(_cp, _pointNum);
		}
		else if (_type == 'createPath') {
			_data.path = _args.createPath(_cp, _pointNum);
		}
        else if (_type == 'createMapPath') {
            _data.path = _args.createMapPath(_cp, _pointNum, _data.map, _data.mapOffX, _data.mapOffY, _data.ow, _data.oh, _data.jumpTimes);
        }
		else {
			_data.path = [];
		}
		postMessage(_data);
		_data = _cp = _pointNum = _type = null;
	}, true);
})();
