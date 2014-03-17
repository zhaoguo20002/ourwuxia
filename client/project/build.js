({
    appDir: './',
    baseUrl: 'js',
    dir: '../release',
	optimize: 'uglify', // none 合并不压缩、  uglify 压缩
    paths: {
        
    },
    modules: [
        {
            name: 'main'
        }
    ],
	removeCombined: true //是否移除分散文件
})