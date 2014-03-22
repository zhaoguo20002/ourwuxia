/**
 * @author Suker
 * 贝塞尔曲线路径算法
 */
define(function() {
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
				if (i > 0) {
			        _curve.push([_point.x - _curX, _point.y - _curY]); 
					_curX = _point.x;
					_curY = _point.y;
				}
			}
			return _curve;
		}
	};
	return bezier;
});
