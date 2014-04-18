/**
 * @author Suker
 */
define([
	'lib/link',
	'notifys/notifyBase',
	'mvc/models/modelWorld',
	'mvc/views/viewWorld',
	'mvc/controllers/controllerWorld'
], function($, notify, modelWorld, ViewWorld, ControllerWorld) {
	notify.markKey('createWorld') //创建世界
	.markKey('createWorldEcho'); //创建世界回调
	
	//订阅 创建世界 消息
	notify.register('createWorld', function(param) {
		var _props = $.objExtend({
			sceneId: 0
		}, param || {});
		notify.notify('createWorldEcho', { data: [] });
		_props = null;
	});
	
	//订阅 创建世界回调 消息
	notify.register('createWorldEcho', function(param) {
		var _props = $.objExtend({
			data: [1]
		}, param || {});
		$.gameFlow.active({ to: 'start' });
		if (!modelWorld.entity) {
			modelWorld.entity = new ControllerWorld(new ViewWorld(modelWorld.args));
		}
		modelWorld.entity.updateScene(_props.data).refreshScene()
		.updateRoles().refreshRoles();
		_props = null;
	});
	
	return notify;
});