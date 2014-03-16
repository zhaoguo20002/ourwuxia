/**
 * @author Suker
 * 游戏入口
 */
define([
	'lib/link',
	'statics',
	'global',
	'notifys/notifyBase',
	'data/role10001',
	'data/sceneData'
], function($, statics, gl, notify) {
	return {
		init: function() {
			$.init(gl.sys.w, gl.sys.h)
			.main(function() {
				statics.init();
			});
		}
	};
});
