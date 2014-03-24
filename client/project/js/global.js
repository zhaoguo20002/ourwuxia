/**
 * @author Suker
 * 全局变量 - 全局变量放这里统一管理
 * 强制遵守的规范:
 * 获取图形资源路径必须使用gl.getImgUrl、gl.getImgSrc静态方法，严禁直接使用'img/pic.png'这样的硬编码格式获取图形资源路径
 */
define(['lib/link'], function($) {
	var CDN = '', versionId = '0.1', gl = {};
	//获取图片url路径切片
	gl.getImgUrl = function(src, sx, sy) {
		sx = sx || 0;
		sy = sy || 0;
		return 'url(' + this.getImgSrc(src) + ') -' + sx + 'px -' + sy + 'px';
	};
	//获取图片src路径切片
	gl.getImgSrc = function(src) {
		return CDN + src + '?v=' + versionId;
	};
    // 图片声音资源
    gl.resource = {
		//同步加载[游戏一开始就必须要的图]
		imgs: [
			
		],
		//分步加载[这里的图主要用于按钮，dataURL背景,在canvas中需要drawCache的资源]
        loadImgs: [
			
        ],
        //异步资源图[这里面的图只能用于canvas渲染，且是直接drawImg的资源]
        asyncImgs: [
		],
        audios: []
    };
	var _screenW = 320, _screenH = 480;
	window.glsysw = window.glsysw > _screenW ? _screenW : window.glsysw;
    // 系统参数
    gl.sys = {
		innerWidth: window.innerWidth, // 初始浏览器窗口宽度
        // 屏幕大小
//		w: $.canvas.screen.getTouch() ? (window.glsysw || 1136) : (window.innerWidth > _screenW ? _screenW : window.innerWidth),
//		h: $.canvas.screen.getTouch() ? 640 : (window.innerHeight > _screenH ? _screenH : window.innerHeight),
		w: _screenW,
		h: _screenH,
        // canvas画布的offset偏移量
        left: 0,
        top: 0,
        // 全局唯一id，递增以保持唯一性
        id: 0,
		alertStyle: 'pop', //弹出提示框的弹出样式
		requestSingal: false,//向服务器端请求1004，只在第一次登陆成功后置为true
		callIn999: false, //标识是否弹出过999提示信息面板
		loadedSceneImgSceneId: null, //预加载场景资源图的场景id
		loadedSceneImgLayerId: null, //预加载场景资源图的场景层数
		notReConnectedYet: true, //标识是否没有重连过服务器
		device: '',
		initSys: function() {
			if ($.canvas.screen.getTouch()) {
				gl.sys.h = window.innerHeight;
				//重写UI窗口对齐尺寸
				$.ui.core.prototype.getScreenWidth = function() {
					return gl.sys.w;
				};
				$.ui.core.prototype.getScreenHeight = function() {
					return gl.sys.h;
				}
				if ($.canvas.screen.getDevice() != 'ipad') { //除了ipad外其他的移动设备的弹出样式都用普通的
					gl.sys.alertStyle = 'normal';
				}
			}
            this.resetCanvasStyle();
		},
		//设置屏幕的宽高参数[只对PC游泳]
		resetScreen: function(width, height) {
			if (!$.canvas.screen.getTouch()) {
				gl.sys.w = width > _screenW ? _screenW : width;
				gl.sys.w = window.innerWidth > gl.sys.w ? gl.sys.w : window.innerWidth;
				gl.sys.w = gl.sys.w < 960 ? 960 : gl.sys.w;
				gl.sys.h = height > _screenH ? _screenH : height;
				gl.sys.h = window.innerHeight > gl.sys.h ? gl.sys.h : window.innerHeight;
				gl.sys.h = gl.sys.h < 540 ? 540 : gl.sys.h;
			}
			this.resetCanvasStyle();
		},
		//重置canvas样式参数
		resetCanvasStyle: function() {
			$.canvas.screen.setWidth(gl.sys.w);
            $.canvas.screen.setHeight(gl.sys.h);
			var _canvasDom = $.getDom('linkScreen'), _marginTop = (window.innerHeight - gl.sys.h) >> 1;
			_canvasDom.style.marginTop = (_marginTop >= 0 ? _marginTop : 0) + 'px';
            gl.sys.left = _canvasDom.offsetLeft;
            gl.sys.top = _canvasDom.offsetTop;
			_canvasDom = _marginTop = null;
		},
        // 初始化canvas
        initCanvas: function() {
			this.initSys();
			this.device = $.canvas.screen.getDevice();
        }
    };
	return gl;
});
	
