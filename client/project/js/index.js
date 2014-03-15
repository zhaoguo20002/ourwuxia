/**
 * @author Suker
 * 游戏入口
 */
define([
	'lib/link',
	'statics'
], function($, statics) {
	return {
		init: function() {
			$.pageLoad(function() {
				console.error(44444);
			});
			statics.init();
		}
	};
});
