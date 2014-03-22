/**
 * @author Suker
 * 配置页
 */
require.config({
	baseUrl: 'js'
});
require([
	'lib/link',
	'index',
	'data/man_001',
	'data/man_002',
	'data/sceneData'
], function($, index) {
    index.init();
});