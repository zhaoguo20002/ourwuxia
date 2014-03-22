/**
 * @author Suker
 * 静态方法集合
 */
define([
	'lib/link',
	'lib/bezier'
], function($, BZ) {
	return {
		//将秒换算后返回
        getTime: function(s) {
            var h, m, s = ~~s;
            h = s < 3600 ? 0 : ~~(s / 3600);
            h = h < 10 ? '0' + h : h;
            m = ~~((s % 3600) / 60);
            m = m < 10 ? '0' + m : m;
            s = s % 60;
            s = s < 10 ? '0' + s : s;
            return h + ':' + m + ':' + s;
        },
		//将毫秒换算后返回
		getShortTime: function(s) {
			var m, s = ~~s;
            m = ~~((s % 3600) / 60);
            m = m < 10 ? '0' + m : m;
            s = s % 60;
            s = s < 10 ? '0' + s : s;
            return m + ':' + s;
		},
        //将描述换算成完整时间
		getFullTime: function(s, format) {
			var h, m, s = parseInt(s), _format = format || '{0}小时{1}分{2}秒';
            h = s < 3600 ? 0 : parseInt(s / 3600);
            h = h < 10 ? '0' + h : (h > 24 ? (parseInt(h / 24) + '天' + (h % 24)) : h);
            m = parseInt((s % 3600) / 60);
            m = m < 10 ? '0' + m : m;
            s = s % 60;
            s = s < 10 ? '0' + s : s;
            return String.format(_format, h, m, s);
		},
		//获取13位时间戳
		getTimeStamp: function() {
			var _stamp = (new Date()).getTime().toString(), _difference = 13 - _stamp.length;
			if (_difference > 0)
				_stamp += (new Date()).getTime().toString().substring(0, _difference);
			else if (_difference < 0)
				_stamp = _stamp.substring(0, 13);
			_difference = null;
			return _stamp;
		},
		//获取特定枚举映射
        getMapping: (function() {
			var _mapping_ = { name: '', bg: '', color: '', img: null, id: 0, sx: 0, sy: 0, width: 70, height: 70, w: 10, h: 10, type: 0, ui: {}, getData: function() { return null; } };
			return function(mappingsName, type) {
				if (mappingsName == 'pet') {
					mappingsName = 'role';
				}
	            if (!mappingsName || (!sceneDataMapping[mappingsName] && !mappings[mappingsName]))
	                return _mapping_;
				var _mapping = sceneDataMapping[mappingsName];
				if (!_mapping) {
					_mapping = mappings[mappingsName] || _mapping_;
				}
				return _mapping['mp' + type] || _mapping['mp1'] || _mapping_;
	        };
		})(),
		//创建贝塞尔曲线路径
		createBezier: function(x1, y1, x2, y2, num) {
			//距离越远弧度越高
			var _a = x2 - x1, _b = y2 - y1, _distance = Math.sqrt(Math.pow(_a, 2) + Math.pow(_b, 2)), 
			_dy = _distance / 50 * 20, //距离越远弧度越高
			_num = num || _distance / 80 * 8; //距离越远路径越长
			_num  = _num < 15 ? 15 : _num; //保证最小路径数
			_num = _num > 30 ? 30 : _num; //保证最大路径数
			_curX = x1;
			_curY = y1;
			return BZ.createPath([new BZ.Point2D(x1, y1), new BZ.Point2D(x1, y1 - _dy), new BZ.Point2D(x2, y2 - _dy), new BZ.Point2D(x2, y2)], _num);
		}
	};
});
