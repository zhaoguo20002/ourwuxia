/**
 * @author Suker
 * 配置页
 */
require.config({
	baseUrl: 'js'
});
require([
	'lib/link',
	'lib/action',
	'index'
], function($, action, index) {
    index.init();
});