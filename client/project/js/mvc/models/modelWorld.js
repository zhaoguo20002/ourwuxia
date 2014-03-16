/**
 * @author Suker
 * 世界场景数据结构
 */
define([
	'lib/link'
], function($) {
	return {
		args: {
			world: null,
			width: 1136,
			height: 640,
			tw: 32,
			th: 32,
			ow: 32,
			oh: 32,
			sw: 3,
			sh: 3,
			wordsNum: 30,
			wordsW: 174,
			wordsH: 60,
			bubbleNum: 10, //角色说话气泡数量
			bubbleW: 300, //单元气泡的尺寸
			bubbleH: 100,
			asyncUrl: 'js/lib/asyncAstar.js',
			nodeXStep: 4,
			nodeYStep: 4,
			tiles: sceneDataMapping ? sceneDataMapping.tiles : [],
			callEventTimeout: 100, //事件触发间隔时间
			moveDs: [7, 6, 6, 6, 4, 5, 5, 5],
			stopDs: [3, 2, 2, 2, 0, 1, 1, 1],
			roleStep: 2,
			sceneId: 0, //场景id
			roles: []
		},
		entity: null
	};
});