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
				    var dt1 = new Date();
					switch (args.to) {
						case 'start':
							if (modelWorld.entity) {
								modelWorld.entity.action();
							}
							break;
						default:
						
							break;
					}
				    dt = parseInt(1000 / ((new Date() - dt1) + 1));
                    $.canvas.drawString('角色数:' + (modelWorld.args.world ? modelWorld.args.world.getShelters().length : 0) + ' FPS: ' + dt, 35, 130, '', true, '#FF0000', '#FFFFFF', '20px 宋体');
                    $.canvas.strokeStyle('#FF6699')
                    .lineWidth(1)
                    .drawLine(gl.sys.w >> 1, 0, gl.sys.w >> 1, gl.sys.h)
                    .drawLine(0, gl.sys.h >> 1, gl.sys.w, gl.sys.h >> 1);
				})
				.setKeyCode('a', 65)
				.setKeyCode('s', 83)
				.setKeyCode('d', 68)
				.setKeyCode('jump', 32)
				.events
//				.keyDown(function(e) {
//					console.error(e.keyCode);
//				})
				.touchStart(function(e, offX, offY) {
					if (modelWorld.entity) {
						modelWorld.entity.touchStart(offX, offY);
					}
				})
				.touchEnd(function(e, offX, offY) {
					if (modelWorld.entity) {
						modelWorld.entity.touchEnd(offX, offY);
					}
				})
				.mouseDown(function(e, offX, offY) {
					if (modelWorld.entity) {
						modelWorld.entity.touchStart(offX, offY);
					}
				})
				.mouseUp(function(e, offX, offY) {
					if (modelWorld.entity) {
						modelWorld.entity.touchEnd(offX, offY);
					}
				}).swipe(function(startX, startY, offX, offY) {
					if (modelWorld.entity) {
					    //主角轻功跳跃
						modelWorld.entity.fly(startX, startY, offX, offY);
					}
				});
				notify.notify('createWorld');
			});
		}
	};
});
