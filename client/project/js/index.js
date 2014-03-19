/**
 * @author Suker
 * 游戏入口
 */
define([
	'lib/link',
	'global',
	'notifys/notifyWorld',
	'mvc/models/modelWorld'
], function($, gl, notify, modelWorld) {
	return {
		init: function() {
			$.init(gl.sys.w, gl.sys.h)
			.pushImage([], function(loaded, count, type) {
				console.error('下载完成');
			})
			.loadingCallBack(function(loaded, count) {
				console.error(loaded, count);
			})
			.main(function() {
				$.active(function(args) {
					switch (args.to) {
						case 'start':
							if (modelWorld.entity) {
								modelWorld.entity.action();
							}
							break;
						default:
						
							break;
					}
				}).events.mouseDown(function(e, offX, offY) {
					if (modelWorld.entity) {
						modelWorld.entity.touchStart(offX, offY);
					}
				});
				notify.notify('createWorld');
			});
		}
	};
});
