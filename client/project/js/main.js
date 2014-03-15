/**
 * @author Suker
 * 配置页
 */
require.config({
	baseUrl: 'js'
});
require([
	'index'
], function(index) {
    index.init();
});