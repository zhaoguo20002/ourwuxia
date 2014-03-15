/**
 * @author Suker
 * notify
 * 消息集中定义
 */
//var notifyId;
define(['lib/link'], function($) {
	notifyId = 0;
	var notify = {
		observers: {},
        type: {
		},
		//初始化投送消息函数
		notify: function(type, data) {
			var _nn_type = notify.type[type];
			if ((_nn_type || _nn_type == 0) &&
			notify.observers[_nn_type]) {
				notify.observers[_nn_type].notify(data);
			}
			_nn_type = null;
		},
		//初始化消息订阅函数
		register: function(type, fns){
			var _nn_type = notify.type[type];
			if (_nn_type || _nn_type == 0) {
				if (!notify.observers[_nn_type])
					notify.observers[_nn_type] = new $.classes.observer();
				if (typeof fns == 'function')
					$.commandFuns.registerNotify(notify.observers[_nn_type], fns);
				else
					if (fns.length > 0)
						$.commandFuns.rangeRegisterNotify(notify.observers[_nn_type], fns);
			}
			_nn_type = null;
		},
		//初始化取消订阅函数
		unregister: function(type, index) {
			var _nn_type = notify.type[type];
			if ((_nn_type || _nn_type == 0) &&
			notify.observers[_nn_type] &&
			index >= 0) {
				var _groupLength = notify.observers[_nn_type].group.length;
//				if (_groupLength > 0) {
//					if (_groupLength <= index)
//						index = _groupLength - 1;
//					notify.observers[_nn_type].group.splice(index, 1);
//				}
				if (_groupLength > 0 && _groupLength > index) {
					notify.observers[_nn_type].group.splice(index, 1);
				}
				_groupLength = null;
			}
			_nn_type = null;
		}
	};

	//初始化观察者集合
	notify.observers = [];
	
	return notify;
});

