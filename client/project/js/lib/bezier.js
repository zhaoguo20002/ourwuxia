/**
 * @author Suker
 * 贝塞尔曲线路径算法
 */
define([
    'lib/link'
], function($) {
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
		}
	};
	
	/**
	 * 贝塞尔曲线
     * @namespace
	 */
	var bezier = {
		/**
		 * 贝塞尔控制点实体类
		 * @class
		 * @param {number} x
		 * @param {number} y
		 */
		Point2D: _args.Point2D,
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
		        _curve.push([_point.x - _curX, _point.y - _curY]); 
				if (i > 0) {
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
                    _cp[3].x = _getJ * _ow + (_ow >> 1) - _mapOffX;
                    _cp[3].y = _getI * _oh + (_oh >> 1) - _mapOffY;
                    return this.createPath(_cp, pointNum);
                }
                else { //如果是多段跳的途中变向，目的地又出现是障碍点的情况则不处理路径
                    return null;
                }
            }
            else {
                return _curve;
            }
		},
		/**
		 * 异步回调方式计算创建贝塞尔曲线移动路径
     	 * @returns {bezier}
		 * @param {object} param
		 */
		callPath: (function() {
			var _worker = null, _callBack, _async = false;
			return function(param) {
			    var _props = $.objExtend({
			        id: [],
			        cp: [],
			        pointNum: 10,
			        asyncUrl: '',
			        callBack: null,
			        type: 'createPath',
			        skipMoveDs: false,
			        map: [[]],
			        mapOffX: 0,
			        mapOffY: 0,
			        ow: 32,
			        oh: 32,
			        jumpTimes: 0
			    }, param || {});
				_callBack = _props.callBack;
				if (!_worker) { //初始化，决定在特定浏览器内采用同步还是异步模式
					if (_props.asyncUrl != '' && window.Worker) {
						try {
							_worker = new Worker(_props.asyncUrl);
							_worker.addEventListener('message', function(e) {
								if (_callBack) {
									_callBack(e.data);
									_callBack = null;
								}
							});
							_async = true;
						}
						catch (e) {
							_async = false;
						}
					}
					else {
						_async = false;
					}
				}
				//同步、异步两种模式请求路径的方法不一样
				var _param = { id: _props.id, cp: _props.cp, pointNum: _props.pointNum, type: _props.type, skipMoveDs: _props.skipMoveDs, map: _props.map, mapOffX: _props.mapOffX, mapOffY: _props.mapOffY, ow: _props.ow, oh: _props.oh, jumpTimes: _props.jumpTimes };
				if (_async) { //异步使用WebWorker
					_worker.postMessage(_param);
				}
				else { //同步直接使用实体类
					if (_callBack) {
						if (_param.type == 'create') {
							_param.path = this.create(_props.cp, _props.pointNum);
						}
						else if (_param.type == 'createPath') {
							_param.path = this.createPath(_props.cp, _props.pointNum);
						}
                        else if (_param.type == 'createMapPath') {
                            _param.path = this.createMapPath(_props.cp, _props.pointNum, _props.map, _props.mapOffX, _props.mapOffY, _props.ow, _props.oh, _props.jumpTimes);
                        }
                        else {
                            _param.path = [];
                        }
						_callBack(_param);
						_callBack = null;
					}
				}
				_props = _param = null;
				return this;
			};
		})()
	};
	return bezier;
});
