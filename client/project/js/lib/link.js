/**
 * @author Suker
 * link引擎
 * 版本1.1
 */
var link, jsGame;
(function() {
	var _linkEval = window.eval, 
	_extend = function(subClass, superClass, methods) {
        var _methods = methods || {};
        if (superClass) {
            var _f = function() {};
            _f.prototype = superClass.prototype;
            subClass.prototype = new _f();
            subClass.prototype.constructor = subClass;
            subClass.prototype.superClass = superClass.prototype;
            _f = null;
        }
        //扩展原型链
        for (var key in _methods) {
           subClass.prototype[key] = _methods[key]; 
        }
        _methods = null;
        return subClass;
    };
	//重写eval
	//window.eval = function(str) {};
	//重写requestAnimationFrame
	window.requestAnimationFrame = (function(){
	    return  window.requestAnimationFrame       || 
	            window.webkitRequestAnimationFrame || 
	            window.mozRequestAnimationFrame    || 
	            window.oRequestAnimationFrame      || 
	            window.msRequestAnimationFrame     || 
				window.setTimeout;
    })();
	//重写cancelAnimationFrame
	window.cancelAnimationFrame = (function() {
		return window.cancelAnimationFrame         ||
			   window.webkitCancelAnimationFrame   ||
			   window.mozCancelAnimationFrame      ||
			   window.oCancelAnimationFrame        ||
			   window.msCancelAnimationFrame       ||
			   window.clearTimeout;
	})();
    //如果不存在String则重写
    if (!String) {
        String = { };
    }
    if (!String.format)
        /**
         * 通配符替换字符串
         * @returns {string}
         * @param {string} wildcard
         * @param {arguments} arguments
         */
        String.format = function() {
            if( arguments.length == 0 )
                return null;
            var str = arguments[0] || '', re; 
            for(var i = 1, len = arguments.length; i < len; i++) {
                re = new RegExp('\\{' + (i - 1) + '\\}', 'gm');
                str = str.replace(re, arguments[i]);
            }
            re = null;
            return str;
        };
    if (!String.getByteLength) {
        /**
         * 精确换算字符串和数字、英文字母的长度
         * @returns {number}
         * @param {string|number} str
         */
        String.getByteLength = function(str) {
            var _i, _sum = 0, _str = str || '', _len = _str.length;
            for(_i = 0; _i < _len; _i++) {  
                if ((_str.charCodeAt(_i) >= 0) & (_str.charCodeAt(_i) <= 255))  
                    _sum = _sum + 1;  
                else  
                    _sum = _sum + 2;  
            }  
            _i = _str = _len = null;
            return _sum;  
        };       
    }
    if (!Array || !Array.prototype) {
        Array.prototype = {};
    }
    /**
     * 扩展数组的prototype方法
     * 判断数组里的特定的数字或者特定的属性的对象是否存在,存在则返回索引值
     * @returns {number}
     * @param {string} key
     * @param {string|number} value
     */
    Array.prototype.indexOfAttr = function(key, value) {
        var _typeOf = (typeof key).toLowerCase(), _result = -1;
        for (var i = 0, len = this.length; i < len; i++) {
            if ((_typeOf == 'string' && this[i][key] == value) ||
            (_typeOf == 'number' && this[i] == key)) {
                _result = i;
                break;
            }
        }
        _typeOf = null;
        return _result;
    };
	/**
	 * 静态参数集合
	 */
	var _args = {
		/**
		 * 画布相关参数集合
		 */
		canvas: {
			/**
			 * 当前画布Id
			 */
			id: 'linkScreen',
			/**
			 * 默认画布Id
			 */
			defaultId: 'linkScreen',
			/**
			 * 默认字体
			 */
			defaultFont: '12px Arial',
			/**
			 * 默认屏幕宽度
			 */
			defaultWidth: 240,
			/**
			 * 默认屏幕高度
			 */
			defaultHeight: 320,
			/**
			 * 默认颜色
			 */
			defaultColor: 'rgb(0, 0, 0)',
			/**
			 * 背景颜色
			 */
			bgColor: '#000',
			/**
			 * canvas Dom对象集合
			 */
			cavansDoms: [],
			/**
		     * canvas的getContext('2d')对象集合
			 */
			ctxs: [],
			/**
			 * 设备名称
			 */
			device: '',
			/**
			 * 频率倍数
			 */
			fps: 1,
			/**
			 * 是否为触屏设备
			 */
			touch: false,
			/**
			 * 分辨率倍数
			 */
			zoom: 1
		},
		
		/**
		 * 系统参数
		 */
		system: {
			/**
			 * 加载资源逻辑
			 */
			loadRes: null,
			/**
			 * 初始化逻辑
			 */
			pageLoad: null,
			/**
			 * 游戏菜单
			 */
			menu: null,
			/**
			 * 循环体
			 */
			run: null,
			/**
			 * 循环体逻辑
			 */
			runFn: function () { },
			/**
			 * requestAnimationFrame主循环逻辑
			 */
			rafRun: null,
			/**
			 * 游戏暂停
			 */
			stop: null,
			/**
			 * 游戏结束
			 */
			over: null,
			/**
			 * 扩展流程
			 */
			zone: null,
			/**
			 * 控制流程
			 */
			active: null,
			/**
			 * 时间节点[处理requestAnimationFrame下一帧触发条件用]
			 */
			lastDate: Date.now(),
			/**
			 * 循环频率
			 */
			timeout: 30,
			/**
			 * 循环体控制器
			 */
			isPause: false,
			/**
			 * 游戏当前流程
			 */
			gameFlow: -1,
			/**
			 * 记录分布加载资源开始时系统所处的流程位置，加载完成后自动回到该流程
			 */
			loadedImageToGameFlow: -1,
			/**
			 * 扩展流程参数
			 */
			zoneArgs: null,
			/**
			 * 控制流程参数
			 */
			activeArgs: null,
			/**
			 * 每帧消耗时间
			 */
			spendTime: 0,
			/**
			 * 资源加载计时器
			 */
			loadResTimer: null,
            /**
             * 主循环计时器
             */
            playTimer: null
		},
		
		/**
		 * 事件参数
		 */
		event: {
			key: 0,
			/**
			 * 连续按键状态
			 */
			keys: {
				up: false,
				down: false,
				left: false,
				right: false,
				a: false,
				b: false,
				c: false,
				menu: false,
				quit: false
			},
			/**
			 * 上次按键状态
			 */
			lastKey: {
				up: false,
				down: false,
				left: false,
				right: false,
				a: false,
				b: false,
				c: false,
				menu: false,
				quit: false
			},
			/**
			 * 单次按键状态
			 */
			pressedKey: {
				up: false,
				down: false,
				left: false,
				right: false,
				a: false,
				b: false,
				c: false,
				menu: false,
				quit: false
			},
			/**
			 * 单次按键控制器
			 */
			keyPressCtrl: {
				up: true,
				down: true,
				left: true,
				right: true,
				a: true,
				b: true,
				c: true,
				menu: true,
				quit: true
			},
			/**
			 * 连续按键初始化开关
			 */
			keyDownGo: false,
			/**
			 * 上次按键初始化开关
			 */
			keyUpGo: false,
			/**
			 * 单次按键初始化开关
			 */
			keyPressedGo: false,
			/**
			 * 按下键盘事件回调
			 * @param {Object} event
			 */
			keyDownCallBack: null,
			/**
			 * 离开键盘事件回调
			 * @param {Object} event
			 */
			keyUpCallBack: null,
			/**
			 * 重力感应事件回调
			 */
			orientationChange: null,
			/**
			 * 单点触屏事件回调
			 */
			touchStart: null,
			/**
			 * 离开屏幕事件回调
			 */
			touchEnd: null,
			/**
			 * 单点触屏拖拽事件回调
			 */
			touchMove: null,
			/**
			 * 取消touch事件回调
			 */
			touchCancel: null,
			/**
			 * 鼠标点击事件回调
			 */
			clickCallBack: null,
			/**
			 * 鼠标按下事件回调
			 */
			mouseDownCallBack: null,
			/**
			 * 鼠标抬起事件回调
			 */
			mouseUpCallBack: null,
			/**
			 * 鼠标移动事件回调
			 */
			mouseMoveCallBack: null,
			/**
			 * 因为IOS只能用pageshow事件来模拟页面获得焦点事件，但是pageshow在游戏第一次加载时会触发所以需要特殊处理一下以免造成BUG
			 */
			focused: false,
			/**
			 * 获得页面焦点事件回调
			 */
			pageFocusCallBack: null,
			/**
			 * 失去页面焦点事件回调
			 */
			pageUnFocusCallBack: null,
			/**
			 * 滑动事件回调
			 */
			swipeCallBack: null,
			/**
			 * 记录松开手时的X坐标
			 */
			pageOffX: 0,
			/**
			 * 记录松开手时的Y坐标
			 */
			pageOffY: 0,
			/**
			 * 按下时的x坐标
			 */
			pageStarOffX: 0,
			/**
			 * 按下时的y坐标
			 */
			pageStarOffY: 0,
			/**
			 * 滑动即时时间戳
			 */
			swipeDate: null,
			/**
			 * 滑动事件响应时间范围
			 */
			swipeTimeout: 200,
			/**
			 * 最小拖动范围(宽高,像素)
			 */
			swipeRange: 50
		},
		/**
		 * 图形资源相关参数
		 */
		image: {
			/**
			 * Image集合
			 */
			imgs: {},
			/**
			 * 待加载图形数据集合
			 */
			imgObjs: [],
            /**
             * 用于缓存Image集合对象的id，防止集合中有Image的id重名造成进不了游戏的BUG
             */
            initImgs: {},
            /**
             * 异步加载Image集合
             */
            asyncImgObjs: {},
			/**
			 * 待加载资源数
			 */
			imgCount: 0,
			/**
			 * 已经加载完成数
			 */
			countLoaded: 0,
			/**
			 * 图片资源版本号
			 */
			version: '',
			/**
			 * 标记同步图形资源加载完毕
			 */
			inited: false
		},
		/**
		 * 音频资源相关参数
		 */
		audio: {
			/**
			 * 音频资源集合
			 */
			audios: {}
		},
		/**
		 * ajax调用机制相关参数
		 */
		ajax: {
			/**
			 * 当前处理的AJAX参数对象
			 */
			xhrObj: null,
			/**
			 * ajax连接池
			 */
			pool: [],
			/**
			 * 连接池默认长度
			 */
			poolLength: 5,
			/**
			 * ajax超时参照时间
			 */
			date: null,
			/**
			 * 标记是否超时
			 */
			isTimeout: false,
			/**
			 * 默认参数
			 */
			param: {
				type: 'get',
                data: null,
                dataType: 'json',
                url: '',
				xhr: null, //ajax实例
				timeout: 5000,
                before: function(param) { },
                success: function(data, param) { },
                error: function(param, msg) { },
                complete: function(param) { }
			}
		},
		/**
		 * 获取http参数命名空间相关
		 */
		request: {
			/**
			 * 以get方式传递过来的参数集合
			 */
			gets: []
		},
		/**
		 * 按钮布局相关参数
		 */
		buttonLayout: {
		    /**
		     * 按钮集合 
		     */
		    buttons: [],
		    /**
		     * 按钮实体类 
             * @param {object} obj
		     */
		    Button: _extend(function(obj) {
		        this.id = obj.id;
                this.value = obj.value; //渲染文字
                this.x = obj.x;
                this.y = obj.y;
                this.width = obj.width; //点击对象宽高
                this.height = obj.height; 
                this.bgColor = obj.bgColor; //背景色
                this.bgStroke = obj.bgStroke; //背景外框颜色
                this.stroke = obj.stroke; //文字描边颜色
                this.font = obj.font; //字体
                this.imageId = obj.imageId; //点击对象图片id
                this.sx = obj.sx; //点击对象三种状态的切片坐标
                this.sy = obj.sy;
                this.color = obj.color; 
                this.hx = obj.hx;
                this.hy = obj.hy;
                this.hColor = obj.hColor;
                this.dex = obj.dex;
                this.dey = obj.dey;
                this.deColor = obj.deColor;
                this.hided = obj.hided;
                this.disabled = obj.disabled;
                this.path = obj.path; //动画路径
                this.hovered = false;
                this.repeated = false;
                this.pressed = false;
                this.released = false;
                this.goned = false; //标记是否即将飘走
                this.cacheId = 'buttonLayoutCache_' + this.id;
                this.setDelay(obj.delay)
                .refresh();
            }, null, {
                //刷新缓冲区
                refresh: function() {
                    //将按钮的3中状态都画入缓冲区
                    _that.canvas.pass(this.cacheId, this.width * 3, this.height);
                    if (this.imageId == '') {
                        if (this.bgColor != '') {
                            _that.canvas.fillStyle(this.bgColor).fillRect(0, 0, this.width, this.height)
                            .fillRect(this.width, 0, this.width, this.height)
                            .fillRect(this.width * 2, 0, this.width, this.height);
                            
                        }
                        if (this.bgStroke != '') {
                            _that.canvas.strokeStyle(this.bgStroke).strokeRect(1, 1, this.width - 2, this.height - 2)
                            .strokeRect(this.width + 1, 1, this.width - 2, this.height - 2)
                            .strokeRect(this.width * 2 + 1, 1, this.width - 2, this.height - 2);
                        }
                    }
                    else {
                        _that.canvas.drawImage(this.imageId, this.sx, this.sy, this.width, this.height, 0, 0, this.width, this.height)
                        .drawImage(this.imageId, this.hx, this.hy, this.width, this.height, this.width, 0, this.width, this.height)
                        .drawImage(this.imageId, this.dex, this.dey, this.width * 2, this.height, this.width * 2, 0, this.width, this.height);
                    }
                    if (this.value != '') {
                        //处理文字
                        var _mt = _that.canvas.font(this.font).measureText(this.value), 
                        _baseX = (this.width - _mt.width) >> 1, _baseY = ((this.height - _mt.height) >> 1) + parseInt(this.font) - 2;
                        //处理文字描边
                        if (this.stroke != '') {
                            _that.canvas.fillStyle(this.stroke).fillText(this.value, _baseX - 1, _baseY)
                            .fillText(this.value, _baseX, _baseY - 1)
                            .fillText(this.value, _baseX + 1, _baseY)
                            .fillText(this.value, _baseX, _baseY + 1)
                            .fillText(this.value, _baseX + this.width - 1, _baseY)
                            .fillText(this.value, _baseX + this.width, _baseY - 1)
                            .fillText(this.value, _baseX + this.width + 1, _baseY)
                            .fillText(this.value, _baseX + this.width, _baseY + 1)
                            .fillText(this.value, _baseX + this.width * 2 - 1, _baseY)
                            .fillText(this.value, _baseX + this.width * 2, _baseY - 1)
                            .fillText(this.value, _baseX + this.width * 2 + 1, _baseY)
                            .fillText(this.value, _baseX + this.width * 2, _baseY + 1);
                        }
                        _that.canvas.fillStyle(this.color).fillText(this.value, _baseX, _baseY)
                        .fillStyle(this.hColor).fillText(this.value, _baseX + this.width, _baseY)
                        .fillStyle(this.deColor).fillText(this.value, _baseX + this.width * 2, _baseY);
                        _mt = _baseX = _baseY = null;
                    }
                    _that.canvas.pass();
                    return this;
                },
                //显示
                show: function() {
                    this.hided = false;
                    return this;
                },
                //隐藏
                hide: function() {
                    this.hided = true;
                    return this;
                },
                //禁用、取消禁用
                disable: function(disabled) {
                    this.disabled = disabled;
                    return this;
                },
                //设置路径
                setPath: function(path, delay) {
                    this.setDelay(delay).path = path || [];
                    return this;
                },
                //是否停止
                endPath: function() {
                    return this.path.length == 0;
                },
                //使按钮即将飘走
                gone: function(path, delay) {
                    this.setPath(path, delay).goned = true;
                    return this;
                },
                //设置按钮路径延迟
                setDelay: function(delay) {
                    this.delay = delay || 0;
                    this.delayDate = null;
                    if (this.delay > 0) {
                        this.delayDate = Date.now();
                    }
                    return this;
                },
                //监听器
                action: function() {
                    if (this.hided) {
                        return this;
                    }
                    if (this.delayDate) {
                        if (Date.now() - this.delayDate >= this.delay) {
                            this.delayDate = null;
                        }
                    }
                    if (!this.delayDate) {
                        if (this.path.length > 0) {
                            var _node = this.path.shift();
                            this.x += _node[0];
                            this.y += _node[1];
                            _node = null;
                        }
                    }
                    return this;
                },
                //渲染器
                render: function() {
                    if (this.hided) {
                        return this;
                    }
                    _that.canvas.drawCache(
                        this.cacheId, 
                        this.hovered ? this.width : (this.disabled ? this.width * 2 : 0),
                        0, this.width, this.height, this.x, this.y, this.width, this.height
                    );
                    return this;
                },
                //回收器
                disposed: function() {
                    
                    return this;
                }
            })
		}
	};
	
	/**
	 * 静态枚举集合
	 */
	var _enums = {
		/**
		 * 画布相关枚举集合
		 */
		canvas: {
			/**
			 * canvas的getContext('2d')对象集合索引
			 */
			context: {
				/**
				 * 默认
				 */
				base: 0
			},
			/**
			 * 图形锚点操作类型枚举
			 */
			graphics: {
				HCENTER: 1,
				VCENTER: 2,
				LEFT: 4,
				RIGHT: 8,
				TOP: 16,
				BOTTOM: 32,
				ANCHOR_LT: 20,
				ANCHOR_LV: 6,
				ANCHOR_LB: 36,
				ANCHOR_HT: 17,
				ANCHOR_HV: 3,
				ANCHOR_HB: 33,
				ANCHOR_RT: 24,
				ANCHOR_RV: 10,
				ANCHOR_RB: 40
			},
			/**
			 * 图形翻转类型枚举
			 */
			trans: {
				TRANS_MIRROR: 2,
			    TRANS_NONE: 0,
			    TRANS_ROT90: 5,
			    TRANS_ROT180: 3,
			    TRANS_ROT270: 6,
			    TRANS_MIRROR_ROT90: 7,
			    TRANS_MIRROR_ROT180: 1,
			    TRANS_MIRROR_ROT270: 4
			}
		},
		/**
		 * 事件相关枚举集合
		 */
		event: {
			/**
			 * 按键编号
			 */
			key: {
				up: 38,
				down: 40,
				left: 37,
				right: 39,
				a: 90,
				b: 88,
				c: 67,
				menu: 49,
				quit: 50
			}
		},
		/**
		 * 系统相关枚举集合
		 */
		system: {
			/**
			 * 游戏流程
			 */
			gameFlowType: {
				menu: 0,
				run: 1,
				stop: 2,
				over: 3,
				zone: 4,
				active: 5,
				loadImage: 6, //分部资源加载
				loadedImage: 7 //分部资源加载完毕
			}
		}
	};
	
	/**
	 * 静态封装事件集合
	 */
	var _events = {
		/**
		 * 获取canvas dom节点
		 */
		getCanvasDom: (function() {
			var _canvasDom;
			return function() {
				if (!_canvasDom)
					_canvasDom =  _that.getDom(_args.canvas.defaultId);
				return _canvasDom;
			};
		})(),
		/**
		 * 换算x坐标
		 * @param {object} e
		 */
		getOffsetX: function(e) {
			return e.offsetX || 
			((e.changedTouches && e.changedTouches[0]) ? (e.changedTouches[0].clientX - _events.getCanvasDom().offsetLeft) : (e.clientX - _events.getCanvasDom().offsetLeft)) || 0;
		},
		/**
		 * 换算y坐标
		 * @param {object} e
		 */
		getOffsetY: function(e) {
			return e.offsetY || 
			((e.changedTouches && e.changedTouches[0]) ? (e.changedTouches[0].clientY - _events.getCanvasDom().offsetTop) : (e.clientY - _events.getCanvasDom().offsetTop)) || 0;
		},
		/**
		 * 按下键盘
		 * @param {Object} event
		 */
		keydown: function(event) {
			var _key = _events.checkKey(event.keyCode);
			if (_args.event.keyDownGo) {
				if (_args.event.keys[_key]!= undefined)
					_args.event.keys[_key] = true;
			}
			if (_args.event.keyUpGo) {
				if (_args.event.lastKey[_key] != undefined)
					_args.event.lastKey[_key] = false;
			}	
			if (_args.event.keyPressCtrl[_key] && _args.event.keyPressedGo) {
				if (_args.event.pressedKey[_key] != undefined)
					_args.event.pressedKey[_key] = true;
				_args.event.keyPressCtrl[_key] = false;
			}
			if (_args.event.keyDownCallBack != null)
				_args.event.keyDownCallBack(event);
			_key = null;
		},
		/**
		 * 离开按键
		 * @param {Object} event
		 */
		keyup: function(event) {
			var _key = _events.checkKey(event.keyCode);
			if (_args.event.keyDownGo) {
				if (_args.event.keys[_key]!= undefined)
					_args.event.keys[_key] = false;
			}
			if (_args.event.keyUpGo) {
				if (_args.event.lastKey[_key] != undefined)
					_args.event.lastKey[_key] = true;
			}	
			if (_args.event.keyPressedGo) {
				if (_args.event.pressedKey[_key] != undefined)
					_args.event.pressedKey[_key] = false;
				_args.event.keyPressCtrl[_key] = true;
			}
			if (_args.event.keyUpCallBack != null)
				_args.event.keyUpCallBack(event);
			_key = null;
		},
		/**
		 * 重力感应
		 * @param {Object} e
		 */
		orientationchange: function(e) {
			if (_args.event.orientationChange != null) {
				_args.event.orientationChange(e);
			}
		},
		/**
		 * 滑动开始监听
		 * @param {number} offX
		 * @param {number} offY
		 */
		swipeStart: function(offX, offY) {
			if (_args.event.swipeCallBack != null) {
				_args.event.swipeDate = Date.now();
				_args.event.pageStarOffX = offX;
				_args.event.pageStarOffY = offY;
			}
		},
		/**
		 * 滑动结束判定是否滑动成功
		 * @param {number} offX
		 * @param {number} offY
		 */
		swipeSuccess: function(offX, offY) {
			if (_args.event.swipeDate) {
				if (Date.now() - _args.event.swipeDate < _args.event.swipeTimeout) {
					if (Math.abs(offX - _args.event.pageStarOffX) >= _args.event.swipeRange || Math.abs(offY - _args.event.pageStarOffY) >= _args.event.swipeRange) {
						_args.event.swipeCallBack(_args.event.pageStarOffX, _args.event.pageStarOffY, offX, offY);
						return true;
					}
				}
				_args.event.swipeDate = null;
			}
			return false;
		},
		/**
		 * 单点触摸屏幕
		 * @param {Object} e
		 */
		touchstart: function(e) {
            e.preventDefault();
			_args.event.pageOffX = _events.getOffsetX(e);
			_args.event.pageOffY = _events.getOffsetY(e);
			if (_args.event.touchStart != null) {
				_args.event.touchStart(e, _args.event.pageOffX, _args.event.pageOffY);
			}
			if (_events.buttonLayoutEventHandler(e.type, _args.event.pageOffX, _args.event.pageOffY)) {
                return false;
            }
			_events.swipeStart(_args.event.pageOffX, _args.event.pageOffY);
		},
		/**
		 * 离开屏幕
		 * @param {Object} e
		 */
		touchend: function(e) {
			e.preventDefault();
			if (_events.swipeSuccess(_args.event.pageOffX, _args.event.pageOffY)) {
				return false;
			}
			if (_events.buttonLayoutEventHandler(e.type, _args.event.pageOffX, _args.event.pageOffY)) {
                return false;
            }
			if (_args.event.touchEnd != null) {
				_args.event.touchEnd(e, _args.event.pageOffX, _args.event.pageOffY);
			}
		},
		/**
		 * 触屏拖拽
		 * @param {Object} e
		 */
		touchmove: function(e) {
			e.preventDefault();
			_args.event.pageOffX = _events.getOffsetX(e);
			_args.event.pageOffY = _events.getOffsetY(e);
			if (_args.event.touchMove != null) {
				_args.event.touchMove(e, _args.event.pageOffX, _args.event.pageOffY);
			}
		},
		/**
		 * 取消触屏事件
		 * @param {Object} e
		 */
		touchcancel: function(e) {
			_args.event.pageOffX = _events.getOffsetX(e);
			_args.event.pageOffY = _events.getOffsetY(e);
			if (_args.event.touchCancel != null) {
				_args.event.touchCancel(e, _args.event.pageOffX, _args.event.pageOffY);
			}
		},
		/**
		 * 鼠标点击事件
		 * @param {Object} e
		 */
		click: function(e) {
			if (_args.event.clickCallBack != null) {
				_args.event.clickCallBack(e, _events.getOffsetX(e), _events.getOffsetY(e));
			}
		},
		/**
		 * 鼠标按下事件
		 * @param {Object} e
		 */
		mouseDown: function(e) {
			var _offX = _events.getOffsetX(e), _offY = _events.getOffsetY(e);
            if (_events.buttonLayoutEventHandler(e.type, _offX, _offY)) {
                return false;
            }
			if (_args.event.mouseDownCallBack != null) {
				_args.event.mouseDownCallBack(e, _offX, _offY);
			}
			_events.swipeStart(_offX, _offY);
			_offX = _offY = null;
		},
		/**
		 * 鼠标抬起事件
		 * @param {Object} e
		 */
		mouseUp: function(e) {
			var _offX = _events.getOffsetX(e), _offY = _events.getOffsetY(e);
            if (_events.buttonLayoutEventHandler(e.type, _offX, _offY)) {
                return false;
            }
			if (_events.swipeSuccess(_offX, _offY)) {
				return false;
			}
			if (_args.event.mouseUpCallBack != null) {
				_args.event.mouseUpCallBack(e, _offX, _offY);
			}
			_offX = _offY = null;
		},
		/**
		 * 鼠标移动事件
		 * @param {Object} e
		 */
		mouseMove: function(e) {
			if (_args.event.mouseMoveCallBack != null) {
				_args.event.mouseMoveCallBack(e, _events.getOffsetX(e), _events.getOffsetY(e));
			}
		},
		/**
		 * 页面初次加载时间
		 * @param {Object} e
		 */
		pageFocus: function (e) {
			if (_args.event.focused) {
				_args.event.focused = false;
				return false;
			}
			if (_args.event.pageFocusCallBack != null) {
				_args.event.pageFocusCallBack(e);
			}
		},
		/**
		 * 页面切到后台事件
		 * @param {Object} e
		 */
		pageUnFocus: function (e) {
			if (_args.event.pageUnFocusCallBack != null) {
				_args.event.pageUnFocusCallBack(e);
			}
		},
		/**
		 * 键值转换
		 * @param {number} keyCode
		 */
		checkKey: function(keyCode) {
			var _key = '0';
			for (var key in _enums.event.key) {
				if (_enums.event.key[key] == keyCode) {
					_key = key;
					break;
				}
			}
			return _key;
		},
		/**
		 * 识别设备
		 */
		getDeviceConfig:function() { 
			var _getUA = navigator.userAgent.toLowerCase();
            if (_getUA.indexOf("duopaosafari")!=-1)
                return {device:"duopaoSafari",fps:1,touch:true,zoom:1};
		    else if (_getUA.indexOf("iphone")!=-1 || //iphone
			     _getUA.indexOf("ipod")!=-1) //ipod
			   return {device:"iphone",fps:1,touch:true,zoom:1};		
			else if (_getUA.indexOf("ipad")!=-1) //ipad
			   return {device:"ipad",fps:1,touch:true,zoom:1};
			else if (_getUA.indexOf("duopaoandroid")!=-1) //duopao android
			   return {device:"duopaoAndroid",fps:1,touch:true,zoom:1};		
			else if (_getUA.indexOf("duopaowindowsphone")!=-1) //duopao windows phone
			   return {device:"duopaoWindowsPhone",fps:1,touch:true,zoom:1};
			else if (_getUA.indexOf("opera mobi")!=-1) //opera mobile
			   return {device:"operamobile",fps:1,touch:true,zoom:1};	
			else if (_getUA.indexOf("flyflow")!=-1) //baidu mobile
			   return {device:"flyflow",fps:1,touch:true,zoom:1};		
			else if (_getUA.indexOf("android")!=-1) //android
			   return {device:"android",fps:1,touch:true,zoom:1};			
			else if (_getUA.indexOf("iemobile")!=-1) //WP IE
			   return {device:"iemobile",fps:1,touch:false,zoom:1};		
			else if (_getUA.indexOf("j2me")!=-1) //kjava
			   return {device:"j2me",fps:1,touch:false,zoom:1};
			else if (_getUA.indexOf("symbian v5")!=-1) //symbian v5
			   return {device:"symbian5",fps:1,touch:true,zoom:1};
			else if (_getUA.indexOf("symbian v3")!=-1) //symbian v3
			   return {device:"symbian3",fps:1,touch:false,zoom:1};
			else if (_getUA.indexOf("chrome")!=-1) //chrome
			   return {device:"chrome",fps:1,touch:false,zoom:1};
//			else if (_getUA.indexOf("gecko")!=-1) //FireFox
			else if (_getUA.indexOf("firefox")!=-1) //FireFox
			   return {device:"firefox",fps:1,touch:false,zoom:1}; 
			else if (_getUA.indexOf("msie")!=-1) //IE
			   return {device:"ie",fps:0.5,touch:false,zoom:1};
			else if (_getUA.indexOf("windows")!=-1) //IE
			   return {device:"ie",fps:0.5,touch:false,zoom:1};
			else if (_getUA.indexOf("safari")!=-1) //safari
			   return {device:"safari",fps:1,touch:false,zoom:1};
			else if (_getUA.indexOf("opera")!=-1) //Opera
			   return {device:"opera",fps:1,touch:false,zoom:1};  
			else
			   return {device:"",fps:1,touch:false,zoom:1};
		},
        /**
         * 初始化图片资源
         * @param {string} id
         * @param {string} src
         * @param {string} benchId
         * @param {object} bench
         * @param {bool} cache
         */
        setImage: function(id, src, benchId, bench, cache) {
            if (!id || !src)
                return false;
            if (!_args.image.imgs[id]) {
                _args.image.imgs[id] = new Image();
    			_args.image.imgs[id].onload = function() {
    				_args.image.countLoaded++;
                    this.loaded = true; //给加载成功的图形做上标记
					//如果图形存在cache属性，则表示采用缓冲区贴图模式，将图形贴到缓冲区后将图形文件从内存中移除
					if (this.cache) {
						_that.canvas.pass(this.id, this.width, this.height)
						.drawImage(this.id, 0, 0)
						.pass()
						.base()
						.delImage(this.id, true);
					}
    			};
    			_args.image.imgs[id].src = src + (_args.image.version != '' ? ('?v=' + _args.image.version) : '');
    			_args.image.imgs[id].id = id;
    			_args.image.imgs[id].url = src;
    			_args.image.imgs[id].benchId = benchId;
    			_args.image.imgs[id].bench = bench;
				_args.image.imgs[id].cache = cache;
				_args.image.imgs[id].refreshed = false; //标记是否写入缓冲区
            }
        },
		/**
		 * 初始化音频资源
		 * @param {string} id
		 * @param {string} src
		 * @param {bool} loop
		 * @param {bool} autoplay
		 * @param {bool} preload
		 * @param {bool} autobuffer
		 */
		setAudio: function(id, src, loop, autoplay, preload, autobuffer) {
			if (!id || !src)
                return false;
			if (!_args.audio.audios[id]) {
				var _newAudio = new Audio(src + (_args.image.version != '' ? ('?v=' + _args.image.version) : ''));
                _newAudio.id = id;
                _newAudio.autoplay = autoplay; //是否加载完自动播放
                _newAudio.preload = preload; //是否预加载
                _newAudio.autobuffer = autobuffer; //是否进行缓冲加载
                _newAudio.loop = loop;
				_args.audio.audios[_newAudio.id] = _newAudio;
				_newAudio = null;
			}
		},
		/**
		 * 加载资源通用回调
		 * @param {number} loaded
		 * @param {number} count
		 * @param {string} type
		 */
		loadingCallBack: function(loaded, count, type) {
			var screenW = _that.canvas.screen.getWidth(), 
			screenH = _that.canvas.screen.getHeight(), 
			pw = screenW, 
			ph = 5, 
			sLeft = parseInt((screenW - pw) >> 1), 
			sTop = screenH - ph,
			loaded = loaded > count ? count : loaded,
            loadStor = parseInt(loaded / count * 100) + '%';
			_that.canvas.fillStyle(_args.canvas.bgColor).fillRect(0, 0, screenW, screenH)
			.fillStyle('#00FFFF').fillRect(sLeft, sTop, parseInt((loaded / count) * pw), ph)
			.fillStyle('#FFF').fillText('loading ' + type, 5, screenH - 10)
			.fillText(loadStor, screenW - _that.canvas.measureText(loadStor).width - 5,  screenH - 10);
            screenW = screenH = pw = ph = sLeft = sTop = loadStor = null;
		},
		//加载资源完毕回调事件
		loadingEndCallBack: null,
		/**
		 * 获取锚点坐标
         * @returns {object}
		 * @param {number} x
		 * @param {number} y
		 * @param {number} width
		 * @param {number} height
		 * @param {number} anchor
		 */
		getAnchor: function(x, y, width, height, anchor) {
			var _x = x, _y = y;
			switch (anchor) {
				case _enums.canvas.graphics.ANCHOR_HV://HCENTER | VCENTER  center
     				_x -= parseInt(width / 2);
					_y -= parseInt(height / 2);
			    	break;
					
			    case _enums.canvas.graphics.ANCHOR_LV://LEFT | VCENTER
					_y -= parseInt(height / 2);
			    	break;
					
			    case _enums.canvas.graphics.ANCHOR_RV://RIGHT | VCENTER
     				_x -= width;
					_y -= parseInt(height / 2);
			    	break;
					
			    case _enums.canvas.graphics.ANCHOR_HT://TOP | HCENTER
     				_x -= parseInt(width / 2);
			    	break;
					
			    case 0://默认值
			    case _enums.canvas.graphics.ANCHOR_LT://LEFT | TOP
			    default:
			    	break;
					
			    case _enums.canvas.graphics.ANCHOR_RT://RIGHT | TOP
     				_x -= width;
			    	break;
					
			    case _enums.canvas.graphics.ANCHOR_HB://BOTTOM | HCENTER
     				_x -= parseInt(width / 2);
					_y -= height;
			    	break;
					
			    case _enums.canvas.graphics.ANCHOR_LB://LEFT | BOTTOM
					_y -= height;
			    	break;
					
			    case _enums.canvas.graphics.ANCHOR_RB://RIGHT | BOTTOM
     				_x -= width;
					_y -= height;
			    	break;
			}
			return { x: _x, y: _y };
		},
		/**
		 * 初始化以get方式传递过来的参数集合
		 */
		initUrlParams: function(str) {
			if (str.indexOf('?') >= 0) {
				var fen1 = str.split('?');
				var fen2 = [];
				if (fen1[1].indexOf('&') >= 0) {
					fen2 = fen1[1].split('&');
				}
				else
					fen2.push(fen1[1]);
				var fen3 = [];
				for (var i = 0; i < fen2.length; i++) {
					if (fen2[i].indexOf('=') >= 0) {
						fen3 = fen2[i].split('=');
						_args.request.gets[fen3[0]] = fen3[1];
					}
				}
				fen3 = null;
				fen2 = null;
				fen1 = null;
			}
		},
		/**
		 * 音频文件播放结束后需要立即重新播放
		 */
		audioEnded: function() {
			_that.audio.replay(this.id); //结束后立即重播
		},
		/**
		 * 同步资源加载成功后回调
		 */
		pageLoaded: function() {
			_args.image.inited = true; //同步资源加载完毕
			_args.system.pageLoad(_that);
		},
		/**
		 * 按钮布局监听器 
		 */
		buttonLayoutAction: function() {
		    var _buttons = _args.buttonLayout.buttons, _button;
            for (var i = _buttons.length - 1; i >= 0; i--) {
                if (_button = _buttons[i]) {
                    _button.action().render();
                    if (_button.goned && _button.endPath()) {
                        _buttons.splice(i, 1);
                    }
                }
            }
            _buttons = _button = null;
		},
		/**
		 *  按钮布局事件监听器
         * @returns {bool}
         * @param {string} type
         * @param {number} offX
         * @param {number} offY
		 */
		buttonLayoutEventHandler: function(type, offX, offY) {
		    var _buttons = _args.buttonLayout.buttons, _button, _result = false;
            for (var i = _buttons.length - 1; i >= 0; i--) {
                if (_button = _buttons[i]) {
                    if (_that.comm.collision(_button.x, _button.y, _button.width, _button.height, offX - 5, offY - 5, 10, 10)) {
                        switch (type) {
                            case 'mousedown':
                            case 'touchstart':
                                _button.hovered = true;
                                _button.repeated = true;
                                _button.pressed = true;
                                _button.released = false;
                                break;
                            case 'mouseup':
                            case 'touchend':
                                if (_button.hovered) {
                                    _button.released = true;
                                    _button.hovered = false;
                                }
                                _button.repeated = false;
                                _button.pressed = false;
                                break;
                            default:
                                break;
                        }
                        _result =  true;
                    }
                    else if (type == 'mouseup' || type == 'touchend') {
                        _button.hovered = false;
                        _button.repeated = false;
                    }
                }
            }
            _buttons = _button = null;
            return _result;
		}
	};
	
	var _ctx, _drawImageArgs, _setColorArgs, _strokeRectArgs, _fillRectArgs, _drawStringArgs, _canvasDom, _deviceInfo, 
	_currentW, _currentH, _getArrayArgs = { arr: [], len: 0, v: 0 };
	/** @namespace */
	link = {
		/**
		 * 初始化引擎库
		 * 属性全部集中在此定义
     	 * @returns {link}
		 */
		init: function(width, height) {
			if (!width && !height) {
				this.version = 1.0;
				this.request.init(); //get参数初始化
				this.canvas.initDevice(); //初始化设备参数
				this.localStorage.init();
				this.sessionStorage.init();
			}
			else {
				_args.canvas.defaultWidth = width;
				_args.canvas.defaultHeight = height;
			}
			return this;
		},
		/**
         * 类继承方法
     	 * @returns {class}
		 * @param {object} subClass
		 * @param {object} superClass
		 * @param {object} methods
		 */
		extend: _extend,
		/**
		 * 设置ajax默认参数
     	 * @returns {link}
		 * @param {object} param
		 */
		setAjax: function(param) {
			_args.ajax.param = this.objExtend(_args.ajax.param, param || {});
			return this;
		},
        /**
         * ajax异步通信封装方法
     	 * @returns {link}
         * @param {object} args
         */
        ajax: function(args) {
			if (args && _args.ajax.pool.length < _args.ajax.poolLength) {
				_args.ajax.pool.push(args);
			}
			if (args && args.clear)
				_args.ajax.pool = [];
			if (!_args.ajax.xhr) {
				_args.ajax.xhr = new XMLHttpRequest();
				_args.ajax.xhr.onreadystatechange = function() {
					//请求超时
					if (_args.ajax.isTimeout) 
						return false;
					var _xhr = _args.ajax.xhr, 
					_xhrObj = _args.ajax.xhrObj;
	                if (_xhrObj && _xhr.readyState == 4) {
                        if (_args.ajax.date) {
                            clearTimeout(_args.ajax.date);
                            _args.ajax.date = null;
                        }
	                    if (_xhr.status == 200) {
	                        var _data;
	                        switch (_xhrObj.dataType) {
	                            case 'HTML':
	                            case 'SCRIPT':
	                            case 'XML':
	                                _data = _xhr.responseText;
                                    break;
	                            case 'TEXT':
	                            default:
                                    _data = _xhr.responseText.replace(/<[^>].*?>/g, "");
	                                break;
	
	                            case 'JSON':
	                                _data = _that.getJson(_xhr.responseText);
	                                break;
	                        }
	                        _xhrObj.success(_data, _xhrObj);
	                        _xhrObj.complete(_xhrObj);
	                    }
	                    else {
	                        _xhrObj.error(_xhrObj, 'error');
						}
                        _args.ajax.xhrObj = null;
						_that.ajax(); //检测通信队列
	                }
					_xhr = _xhrObj = null;
	            };
			}
			if (_args.ajax.xhrObj == null && _args.ajax.pool.length > 0) {
				_args.ajax.xhrObj = this.objExtend(_args.ajax.param, _args.ajax.pool.shift() || {});
				var _xhr = _args.ajax.xhr, 
				_xhrObj = _args.ajax.xhrObj, 
				_url = _args.ajax.xhrObj.url, 
				_sendStr = null, 
				_sendData = _xhrObj.data;
				_xhrObj.type = _xhrObj.type.toUpperCase();
				_xhrObj.dataType = _xhrObj.dataType.toUpperCase();
				//每次请求前都更新超时状态
				_args.ajax.isTimeout = false;
				
	            if (typeof _sendData == 'string')
                    _sendStr = _sendData;
                else if (typeof _sendData == 'object') {
                    _sendStr = [];
                    for (var key in _sendData) {
                        _sendStr.push(key + '=' + _sendData[key]);
                    }
                    _sendStr = _sendStr.join('&');
                }
				if (_xhrObj.type == 'GET') {
					_url += '?' + _sendStr;
				}
				_xhr.open(_xhrObj.type, _url, true);
	            _xhrObj.before(_args.ajax.xhrObj);
				if (_xhrObj.type == 'POST') {
	                _xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
	            }
	            _xhr.send(_sendStr);
                _xhr = _xhrObj = _sendStr = _sendData = _url = null;
                
				//计算ajax超时
                _args.ajax.date = setTimeout(function() {
                    //某次超时后将ajax请求队列全部清空
					_that.ajax( { clear: true } );
					//通知ajax回调函数已经超时
					_args.ajax.isTimeout = true;
					if (_args.ajax.xhrObj) {
						_args.ajax.xhrObj.error(_args.ajax.xhrObj, 'timeout'); //执行超时回调
						_args.ajax.xhrObj = null; //结束本次ajax通信
					}
                },  _args.ajax.xhrObj.timeout);
			}
			return this;
        },

        /**
         * 获取Dom的兼容方法
     	 * @returns {dom}
         * @param {string} id
         */
        getDom: function(id) {
            try {
                return document.getElementById(id);
            }
            catch (e) {
                return document.all[id];
            }
        },
		
        /**
        * 单体对象继承封装方法
     	 * @returns {object}
		 * @param {object} param1
		 * @param {object} param2
        */
        objExtend: function() {
            var target = this.clone(arguments[0]) || {}, i = 1, length = arguments.length, deep = false, options;
            if (typeof target === "boolean") {
                deep = target;
                target = arguments[1] || {};
                i = 2;
            }
            if (typeof target !== "object")
                target = {};
            if (length == i) {
                target = this;
                --i;
            }
			if (!arguments[1]) {
				return target;
			}
            for (; i < length; i++)
                if ((options = arguments[i]) != null)
	                for (var name in options) {
		                var src = target[name], copy = options[name];
		                if (target === copy)
		                    continue;
		                if (deep && copy && typeof copy === "object" && !copy.nodeType)
		                    target[name] = this.objExtend(deep, src || (copy.length != null ? [] : {}), copy);
		
		                else if (copy !== undefined)
		                    target[name] = copy;
		
		            }
            return target;
        },

        /**
         * 将字符串转换为Json
     	 * @returns {json}
         * @param {string} str
         */
        getJson: function(str) {
            var _json = {};
            try {
                if (window.JSON)
                    _json = JSON.parse(str);
                else {
                    _json = _linkEval('(' + str + ')');
                }
            }
            catch(e) { }
            return _json;
        },

        /**
         * 克隆一个对象<br />
         * 非深度克隆，只能克隆对象里值类型的属性，引用类型属性不能克隆
     	 * @returns {object}
         * @param {object} superObject
         */
        clone: function() {
			var f = arguments[0], superObject = f || [];
			if (typeof superObject == 'object') {
				if (superObject.length != undefined) {
					f = [];
					for (var i = 0, ilen = superObject.length; i < ilen; i++) {
						if (superObject[i] === undefined)
							continue;
						if (superObject[i] != null && typeof superObject[i] == 'object') {
							if (superObject[i].length != undefined) {
								f[i] = superObject[i].slice(0);
							}
							else {
//								f[i] = arguments.callee(superObject[i]);
								f[i] = superObject[i];
							}
						}
						else
							f[i] = superObject[i];
					}
				}
				else {
					f = {};
					for (var i in superObject) {
						if (superObject[i] === undefined)
							continue;
						if (superObject[i] != null && typeof superObject[i] == 'object') {
							if (superObject[i].length != undefined) {
								f[i] = superObject[i].slice(0);
							}
							else {
//								f[i] = arguments.callee(superObject[i]);
								f[i] = superObject[i];
							}
						}
						else
							f[i] = superObject[i];
					}
				}
			}
			superObject = null;
            return f;
        },
        /**
        * 实体类集合
        * @namespace
        */
        classes: {},
        /**
        * 通用方法集合
        * @namespace
        */
        comm: {
            /**
             * 订阅事件
     		 * @returns {void}
             * @param {object} observer
             * @param {Function} fn
             */
            registerNotify: function(observer, fn) {
                if (observer != null)
                    observer.register(fn);
            },

            /**
             * 批量订阅
     		 * @returns {void}
             * @param {object} observer
             * @param {array} range
             */
            rangeRegisterNotify: function(observer, range) {
                for (var i = 0; i < range.length; i++) {
                    _that.commandFuns.registerNotify(observer, range[i]);
                }
            },

            /**
             * 取消订阅事件
     		 * @returns {void}
             * @param {object} observer
             * @param {Function} fn
             */
            unRegisterNotify: function(observer, fn) {
                if (observer != null)
                    observer.unregister(fn);
            },

            /**
             * 批量取消
     		 * @returns {void}
             * @param {object} observer
             * @param {array} range
             */
            rangeUnRegisterNotify: function(observer, range) {
                for (var i = 0; i < range.length; i++) {
                    _that.commandFuns.unRegisterNotify(observer, range[i]);
                }
            },
			/**
			 * 取随机数
     		 * @returns {number}
			 * @param {number} min
			 * @param {number} max
			 */
			getRandom: function(min, max) {
				if (!max) {
					var _seed = min;
					if (!_seed || _seed < 0)
						_seed = 0;
					return Math.round(Math.random() * _seed);
				}
				else {
					return Math.round(Math.random() * (max - min) + min);
				}
			},
			/**
			 * 将数字转换为数组
     		 * @returns {array}
			 * @param {number} num
			 * @param {bool} isReverse
			 */
			getArray: function(num, isReverse) {
				_getArrayArgs.arr = [];
				_getArrayArgs.len = num.toString().length;
				_getArrayArgs.v = num;
				for (var i = 0; i < _getArrayArgs.len; i++) {
					_getArrayArgs.arr.push(_getArrayArgs.v % 10);
					_getArrayArgs.v = parseInt(_getArrayArgs.v / 10);
				}
				if (!isReverse)
					_getArrayArgs.arr.reverse();
				return _getArrayArgs.arr;
			},
			/**
			 * 取得特定元素在数组中的索引通用方法
     		 * @returns {number}
			 * @param {object} obj
			 * @param {array} arr
			 */
			inArray: function(obj, arr) {
				var _ii, _len = arr.length;
				for(_ii = 0; _ii < _len; _ii++) {
					if (obj == arr[_ii])
						return _ii;
				}
				return -1;
			},
			/**
			 * 矩形碰撞检测
     		 * @returns {bool}
			 * @param {number} x1
			 * @param {number} y1
			 * @param {number} w1
			 * @param {number} h1
			 * @param {number} x2
			 * @param {number} y2
			 * @param {number} w2
			 * @param {number} h2
			 */
			collision: function(x1, y1, w1, h1, x2, y2, w2, h2) {
				//_that.canvas.fillStyle('#FF0000').fillRect(x1, y1, w1, h1).fillStyle('#0000FF').fillRect(x2, y2, w2, h2);
				if(w2 && Math.abs((x1 + (w1 >> 1)) - (x2 + (w2 >> 1))) < ((w1 + w2) >> 1) && Math.abs((y1 + (h1 >> 1)) - (y2 + (h2 >> 1))) < ((h1 + h2) >> 1)) {
			  		return true;
				}
				return false;
			},
			/**
			 * 圆形碰撞检测
     		 * @returns {bool}
			 * @param {number} x1
			 * @param {number} y1
			 * @param {number} radius1
			 * @param {number} x2
			 * @param {number} y2
			 * @param {number} radius2
			 */
			circleCollision: function(x1, y1, radius1, x2, y2, radius2) {
				var _mx = Math.abs(x1 - x2), _my = Math.abs(y1 - y2);
				if ((Math.sqrt(_mx * _mx + _my * _my)) < (radius1 + radius2)) {
				return true;
				     
				}
				return false;
			},
			/**
             * 矩形和圆形的碰撞检测
             * @returns {bool}
             * @param {number} x1
             * @param {number} y1
             * @param {number} w1
             * @param {number} h1
             * @param {number} x2
             * @param {number} y2
             * @param {number} radius2
             */
			rect2CircleCollision: function(x1, y1, w1, h1, x2, y2, radius2) {
			    //矩形小于圆形的情况下检测矩形4个点是否与圆形发生碰撞
			    var _result = false;
			    if (!(_result = this.circleCollision(x1, y1, 1, x2, y2, radius2))) { //左上角
			        if (!(_result = this.circleCollision(x1 + w1, y1, 1, x2, y2, radius2))) { //右上角
			            if (!(_result = this.circleCollision(x1 + w1, y1 + h1, 1, x2, y2, radius2))) { //右下角
                            if (!(_result = this.circleCollision(x1, y1 + h1, 1, x2, y2, radius2))) { //左下角
                                //最后处理当矩形大于圆形时是否出现矩形包围圆形的情况
                                _result = this.collision(x1, y1, w1, h1, x2 - (radius2 >> 1), y2 - (radius2 >> 1), radius2, radius2);
                            }
                        }
			        }
			    }
			    return _result;
			},
			/**
             *  多边形碰撞检测
             *  @returns {bool}
             *  @param {array} poly1
             *  @param {array} poly2
             *  @param {number} x1
             *  @param {number} y1
             *  @param {number} x2
             *  @param {number} y2
			 */
			polygonCollision: function(poly1, poly2, x1, y1, x2, y2, v1, v2) {
			    return this.polygonSAT(poly1, poly2, x1, y1, x2, y2, v1, v2) && this.polygonSAT(poly2, poly1, x2, y2, x1, y1, v2, v1);
			},
			/**
			 *  分离轴算法
             *  @returns {bool}
             *  @param {array} poly1
             *  @param {array} poly2
             *  @param {number} x1
             *  @param {number} y1
             *  @param {number} x2
             *  @param {number} y2
			 */
			polygonSAT: function(poly1, poly2, x1, y1, x2, y2, v1, v2) {
			    var alen = poly1.length, 
			    blen = poly2.length, 
			    _x1 = x1 || 0, _y1 = y1 || 0, _x2 = x2 || 0, _y2 = y2 || 0, _v1 = v1, _v2 = v2,
			    px = _x1 + poly1[poly1.length - 1][0], 
                py = _y1 + poly1[poly1.length - 1][1], 
                qx, qy, nx, ny, NdotP, allOutside, vx, vy, det, i, j;
                //检测poly1的每条边
                for (i = 0; i < alen; i++) {
                    qx = _x1 + poly1[i][0];
                    qy = _y1 + poly1[i][1];
            
                    // Compute normal vector of the hyperplane for edge PQ
                    // Assume winding orders of the polygons are counterclockwise
					//求法向量
                    nx = qy - py; 
                    ny = px - qx;
					//根据边的向量(其实就是向量坐标对应的点)计算在法向量上的投影向量[边qp的向量为(px,py),为固定向量]
                    NdotP = nx * px + ny * py;
                    // Test if all vertices V in B are outside of the hyperplane
                    allOutside = true;
                    for (j = 0; j < blen; j++) {
                        vx = _x2 + poly2[j][0];
                        vy = _y2 + poly2[j][1];
            
                        // det = N dot (V - P) = N dot V - N dot P
                        det = nx * vx + ny * vy - NdotP;
                        if (det < 0) {  // V is inside
                            allOutside = false;
                            break;
                        }
                    }
            
                    if (allOutside) {
                        //检测到可以切分两个多边形的向量后再检测该向量的推力向量,防止速度过快产生穿越
                        if (_v1[0] != 0 || _v1[1] != 0 || _v2[0] != 0 || _v2[1] != 0) {
                            //推力向量在法向量上的投影
                            NdotP = nx * (px + _v1[0]) + ny * (py + _v1[1]);
                            for (j = 0; j < blen; j++) {
                                vx = _x2 + poly2[j][0] + _v2[0];
                                vy = _y2 + poly2[j][1] + _v2[1];
                                //判断推力向量投影是否与目标物体的投影是否重叠
                                det = nx * vx + ny * vy - NdotP;
                                if (det < 0) {
                                    allOutside = false;
                                    break;
                                }
                            }
                        }
                        if (allOutside) {
                            return false;
                        }
                    }
            
                    px = qx;
                    py = qy;
                }
                
                // _that.canvas.strokeStyle('#FF0')
                // .beginPath()
                // .moveTo(_x1 + poly1[0][0], _y1 + poly1[0][1])
                // .lineTo(_x1 + poly1[1][0], _y1 + poly1[1][1])
                // .lineTo(_x1 + poly1[2][0], _y1 + poly1[2][1])
                // .lineTo(_x1 + poly1[3][0], _y1 + poly1[3][1])
                // .lineTo(_x1 + poly1[0][0], _y1 + poly1[0][1])
                // .stroke();
                // _that.canvas.strokeStyle('#F0F')
                // .beginPath()
                // .moveTo(_x2 + poly2[0][0], _y2 + poly2[0][1])
                // .lineTo(_x2 + poly2[1][0], _y2 + poly2[1][1])
                // .lineTo(_x2 + poly2[2][0], _y2 + poly2[2][1])
                // .lineTo(_x2 + poly2[3][0], _y2 + poly2[3][1])
                // .lineTo(_x2 + poly2[0][0], _y2 + poly2[0][1])
                // .stroke();
                return true;
			},
			/**
			 *  使矩阵旋转N度
             *  @returns {link.comm}
             *  @param {array} p
             *  @param {number} angle
			 */
			setMatrixRotate: function(p, angle) {
			    if (!p || !p[0]) {
                    return null;
                }
                var w = 50, h = 50, x, y, 
                radian = Math.PI / 180 * angle, 
                sin = Math.sin(radian), cos = Math.cos(radian);
                for (var i = 0; i < p.length; i++) {
                    x = p[i][0];
                    y = p[i][1];
                    //逆时针
                    // p0[i][0] = cos * x + sin * y;
                    // p0[i][1] = -sin * x + cos * y;
                    //顺时针
                    p[i][0] = cos * x - sin * y;
                    p[i][1] = sin * x + cos * y;
                }
                return this;
			},
			/**
			 * 计算两点间的路径
     		 * @returns {array}
			 * @param {number} x1
			 * @param {number} x2
			 * @param {number} y1
			 * @param {number} y2
			 * @param {number} step
			 */
			createPath: function(x1, y1, x2, y2, step) {
				var _path = [],
				_x1 = x1 || 0,
				_y1 = y1 || 0,
				_x2 = x2 || 0,
				_y2 = y2 || 0,
				_a = _x2 - _x1,
				_b = _y2 - _y1,
				_c = Math.sqrt(Math.pow(_a, 2) + Math.pow(_b, 2)), //圆半径
				_step = step || 5,
				_r = _step, _lx = 0, _ly = 0, _px, _py,
				_rotate = (Math.atan2(_b, _a) / Math.PI * 180);  //角度[90度开始为0度]
				_rotate = _rotate >= 0 ? _rotate : _rotate + 360;
				if (_r >= _c) {
				    //如果移动的速度大于了两点间的距离,则需要将速度变为两点间距离的一半,至少保证有两段路径
				    _r = _c >> 1;
				}
				while (_r < _c + _step) {
					//半径逐渐变大，换算出路径上的坐标集合
					_r = _r > _c ? _c : _r;
					_px = _r * Math.cos(_rotate / 180 * Math.PI);
					_py = _r * Math.sin(_rotate / 180 * Math.PI);
					_path.unshift([_px - _lx, _py - _ly]);
					_lx = _px;
					_ly = _py;
					_r += _step;
				}
				_path.angle = _rotate + 90; //将路径对应的旋转角度绑定到路径上的angle属性
				_x1 = _y1 = _x2 = _y2 = _a = _b = _c = _step = _r = _rotate = null;
				return _path;
			}
        },
		/**
		 * 本地存储[永久]<br />
		 * 目前只能存储number/string类型数据 <br />
		 * link.localStorage.setItem(key, value); //设置存储键值<br />
		 * link.localStorage.getItem(key); //获取存储键值<br />
		 * link.localStorage.removeItem(key); //移除存储键值<br />
		 * link.localStorage.clear(key); //清空存储数据<br />
		 * link.localStorage.key(index); //根据索引获取键名称<br />
		 * link.localStorage.getLength(); //返回存储记录数<br />
		 * link.localStorage.base(); //将方法链交给link<br />
		 * @namespace
		 */
		localStorage: (function() {
			var _localStorage;
			var _constructor;
			var _returnLocalStorage = function() {
				var _ls;
				try {
					_ls = window.localStorage;
					if (!_ls.getItem)
						_ls.getItem = function() { return null; };
					if (!_ls.setItem)
						_ls.setItem = function() { };
				}
				catch(e1) {
					_ls = { getItem: function() { return null; }, setItem: function() { } };
				}
				return _ls;
			};
			
			return {
				/**
				 * 初始化
				 */
				init: function() {
					_localStorage = this;
					if (!_constructor)
						_constructor = _returnLocalStorage();
						return _localStorage;
				},
				/**
				 * 设置存储键值
				 * @param {string} key
				 * @param {number/string} value
				 */
				setItem: function(key, value) {
					try {
						_constructor.setItem(key, value);
					}
					catch (e) { }
					return _localStorage;
				},
				/**
				 * 获取存储键值
				 * @param {string} key
				 */
				getItem: function(key) {
					return _constructor.getItem(key);
				},
				/**
				 * 移除存储键值
				 * @param {string} key
				 */
				removeItem: function(key) {
					_constructor.removeItem(key);
					return _localStorage;
				},
				/**
				 * 清空存储数据
				 */
				clear: function() {
					_constructor.clear();
					return _localStorage;
				},
				/**
				 * 根据索引获取键名称
				 * @param {number} index
				 */
				key: function(index) {
					return _constructor.key(index);
				},
				/**
				 * 返回存储记录数
				 */
				getLength: function() {
					return _constructor.length;
				},
				/**
				 * 将方法链交给link
				 */
				base: function() {
					return _that;
				}
			};
		})(),
		
		/**
		 * 本地存储[session周期]<br />
		 * 目前只能存储number/string类型数据<br />
		 * link.sessionStorage.setItem(key, value); //设置存储键值<br />
		 * link.sessionStorage.getItem(key); //获取存储键值<br />
		 * link.sessionStorage.removeItem(key); //移除存储键值<br />
		 * link.sessionStorage.clear(key); //清空存储数据<br />
		 * link.sessionStorage.key(index); //根据索引获取键名称<br />
		 * link.sessionStorage.getLength(); //返回存储记录数<br />
		 * link.sessionStorage.base(); //将方法链交给link<br />
		 * @namespace
		 */
		sessionStorage: (function() {
			var _sessionStorage;
			var _constructor;
			var _returnSessionStorage = function() {
				var _ss;
				try {
					_ss = window.sessionStorage;
					if (!_ss.getItem)
						_ss.getItem = function() { return null; };
					if (!_ss.setItem)
						_ss.setItem = function() { };
				}
				catch(e1) {
					_ss = { getItem: function() { return null; }, setItem: function() { } };
				}
				return _ss;
			};
			return {
				/**
				 * 初始化
				 */
				init: function() {
					_sessionStorage = this;
					if (!_constructor)
						_constructor = _returnSessionStorage();
					return _sessionStorage;
				},
				/**
				 * 设置存储键值
				 * @param {string} key
				 * @param {number/string} value
				 */
				setItem: function(key, value) {
					_constructor.setItem(key, value);
					return _sessionStorage;
				},
				/**
				 * 获取存储键值
				 * @param {string} key
				 */
				getItem: function(key) {
					return _constructor.getItem(key);
				},
				/**
				 * 移除存储键值
				 * @param {string} key
				 */
				removeItem: function(key) {
					_constructor.removeItem(key);
					return _sessionStorage;
				},
				/**
				 * 清空存储数据
				 */
				clear: function() {
					_constructor.clear();
					return _sessionStorage;
				},
				/**
				 * 根据索引获取键名称
				 * @param {number} index
				 */
				key: function(index) {
					return _constructor.key(index);
				},
				/**
				 * 返回存储记录数
				 */
				getLength: function() {
					return _constructor.length;
				},
				/**
				 * 将方法链交给link
				 */
				base: function() {
					return _that;
				}
			};
		})(),
		
		/**
		 * 系统入口(window.onload事件执行后执行)
		 * <br /><a href="#">demo</a>
     	 * @returns {link}
		 * @param {Function} fn
		 */
		pageLoad: function(fn) {
			if (_args.system.pageLoad == null) {
				_args.system.pageLoad = fn; //游戏初始化逻辑
				window.addEventListener('load', function() {
					_that.main(_args.system.pageLoad);
				}, false);
			}
			return _that;
		},
		/**
		 * 系统入口(立即执行)
		 * <br /><a href="#">demo</a>
     	 * @returns {link}
		 * @param {Function} fn
		 */
		main: function(fn) {
			if (_args.system.pageLoad == null) {
				_args.system.pageLoad = fn; //游戏初始化逻辑
			}
			this.canvas.init();
			//锚点类型扩展
			this.graphics.ANCHOR_LT = _enums.canvas.graphics.ANCHOR_LT;
			this.graphics.ANCHOR_LV = _enums.canvas.graphics.ANCHOR_LV;
			this.graphics.ANCHOR_LB = _enums.canvas.graphics.ANCHOR_LB;
			this.graphics.ANCHOR_HT = _enums.canvas.graphics.ANCHOR_HT;
			this.graphics.ANCHOR_HV = _enums.canvas.graphics.ANCHOR_HV;
			this.graphics.ANCHOR_HB = _enums.canvas.graphics.ANCHOR_HB;
			this.graphics.ANCHOR_RT = _enums.canvas.graphics.ANCHOR_RT;
			this.graphics.ANCHOR_RV = _enums.canvas.graphics.ANCHOR_RV;
			this.graphics.ANCHOR_RB = _enums.canvas.graphics.ANCHOR_RB;
			var _getCanvasDom = this.getDom(_args.canvas.defaultId);
			if (_getCanvasDom) {
				//集中定义触屏设备事件
				if (!this.canvas.screen.getTouch()) {
					document.onkeydown = _events.keydown;
					document.onkeyup = _events.keyup;
					_getCanvasDom.addEventListener('click', _events.click, false);
					_getCanvasDom.addEventListener('mousedown', _events.mouseDown, false);
					_getCanvasDom.addEventListener('mouseup', _events.mouseUp, false);
					_getCanvasDom.addEventListener('mousemove', _events.mouseMove, false);
				}
				else {
					window.addEventListener('orientationchange', _events.orientationchange, false);
					_getCanvasDom.addEventListener('touchstart', _events.touchstart, false);
					_getCanvasDom.addEventListener('touchend', _events.touchend, false);
					_getCanvasDom.addEventListener('touchmove', _events.touchmove, false);
					_getCanvasDom.addEventListener('touchcancel', _events.touchcancel, false);
				}
			}
			_getCanvasDom = null;
			var _getDevice = this.canvas.screen.getDevice();
			//处理页面焦点事件
			if (_getDevice == 'ipad' || _getDevice == 'iphone') {
				_args.event.focused = true;
				window.addEventListener('pageshow', _events.pageFocus, false);
				window.addEventListener('pagehide', _events.pageUnFocus, false);
			}
			else {
				if (_getDevice == 'firefox') {
					_args.event.focused = true;
				}
				window.addEventListener('focus', _events.pageFocus, false);
				window.addEventListener('blur', _events.pageUnFocus, false);
			}
			//初始化背景颜色
			this.canvas.fillStyle(_args.canvas.bgColor).fillRect(0, 0, this.canvas.screen.getWidth(), this.canvas.screen.getHeight());
			//开始加载同步资源
			_args.image.inited = false;
			this.gameFlow.run().base().play();
			if (_args.image.imgObjs.length > 0) {
				this.loadImage(_args.image.imgObjs);
			}
			else {
				_events.pageLoaded(); //标示同步资源加载完毕，开始初始化游戏
			}
			return this;
		},
		/**
		 * 游戏菜单逻辑生命周期
     	 * @returns {link}
		 * @param {Function} fn
		 */
		menu: function(fn) {
			if (typeof fn == 'function') {
				_args.system.menu = fn;
			}
			return this;
		},
		
		/**
		 * 游戏主循环生命周期
     	 * @returns {link}
		 * @param {Function} fn
		 */
		run: function(fn) {
			if (typeof fn == 'function') {
				_args.system.runFn = fn;
			}
			return this;
		},
		/**
		 * 游戏暂停逻辑生命周期
     	 * @returns {link}
		 * @param {Function} fn
		 */
		stop: function(fn) {
			if (typeof fn == 'function') {
				_args.system.stop = fn;
			}
			return this;
		},
		/**
		 * 游戏结束逻辑生命周期
     	 * @returns {link}
		 * @param {Function} fn
		 */
		over: function(fn) {
			if (typeof fn == 'function') {
				_args.system.over = fn;
			}
			return this;
		},
		/**
		 * 流程扩展逻辑生命周期(和active功能相同)
     	 * @returns {link}
		 * @param {Function} fn
		 */
		zone: function(fn) {
			if (typeof fn == 'function') {
				_args.system.zone = fn;
			}
			return this;
		},
		/**
		 * 流程控制逻辑生命周期（建议使用）
     	 * @returns {link}
		 * @param {Function} fn
		 */
		active: function(fn) {
			if (typeof fn == 'function') {
				_args.system.active = fn;
			}
			return this;
		},
		/**
		 * 开始主生命周期
     	 * @returns {link}
		 */
		play: function() {
			//初始化成功后启动游戏主生命周期
			if (!_args.system.run) {
				_args.system.run = function() {
					var dt1 = Date.now();
					switch (_args.system.gameFlow) {
						case _enums.system.gameFlowType.menu:
							_args.system.menu();
							break;
						case _enums.system.gameFlowType.run:
							_args.system.runFn();
							break;
						case _enums.system.gameFlowType.stop:
							_args.system.stop();
							break;
						case _enums.system.gameFlowType.over:
							_args.system.over();
							break;
						case _enums.system.gameFlowType.zone:
							_args.system.zone(_args.system.zoneArgs);
							break;
						case _enums.system.gameFlowType.active:
							_args.system.active(_args.system.activeArgs);
							break;
						case _enums.system.gameFlowType.loadImage:
							if (_events.loadingCallBack != null) {
								var _count = _args.image.imgCount, _loaded = _args.image.countLoaded > _count ? _count : _args.image.countLoaded;
                                if (_loaded == _count) {
                                    _args.system.gameFlow = _enums.system.gameFlowType.loadedImage;
        						}
								if (_count > 0) {
									_events.loadingCallBack(_loaded, _count, 'image'); //适时返回图形资源的加载进度
								}
								if (_loaded == _count && _events.loadingEndCallBack) {
									_events.loadingEndCallBack(_loaded, _count, 'image'); //适时返回图形资源的加载进度
									_events.loadingEndCallBack = null;
								}
								_loaded = _count = null;
							}
							break;
						case _enums.system.gameFlowType.loadedImage: //分部资源加载完毕
							_args.system.gameFlow = _args.system.loadedImageToGameFlow; //记录分布加载资源开始时系统所处的流程位置，加载完成后自动回到该流程
							_args.image.imgObjs = [];
							_args.image.countLoaded = 0;
							//同步资源加载只有一次
							if (!_args.image.inited) {
								_events.pageLoaded(); //标示同步资源加载完毕，开始初始化游戏
							}
							break;
						default:
							break;	
					};
                    _events.buttonLayoutAction();
					_args.system.spendTime = Date.now() - dt1;
					dt1 = null;
				};
			}
			if (!_args.system.playTimer) {
				_args.system.isPause = false;
				(_args.system.rafRun = function() { //requestAnimationFrame主循环逻辑
					var _newDate = Date.now();
					if ((_newDate - _args.system.lastDate) >= (_args.system.timeout - _args.system.spendTime)) {
						_args.system.lastDate = _newDate;
						if (!_args.system.isPause)
							_args.system.run();
					}
					_newDate = null;
					if (_args.system.rafRun)
						_args.system.playTimer = requestAnimationFrame(_args.system.rafRun);
				})();
			}
			return this;
		},
		
		/**
		 * 停止主生命周期
     	 * @returns {link}
		 */
		pause: function() {
			if (_args.system.playTimer) {
				_args.system.isPause = true;
				_args.system.rafRun = null;
				cancelAnimationFrame(_args.system.playTimer);
				_args.system.playTimer = null;
			}
			return this;
		},
		/**
		 * 游戏生命周期控制方法集
		 * @namespace
		 */
		gameFlow: {
			/**
			 * 切换到游戏菜单逻辑生命周期
			 * @returns {link.gameFlow}
			 */
			menu: function() {
				if (_args.system.menu != null) {
					_args.system.gameFlow = _enums.system.gameFlowType.menu;
					_that.resetKeys();					
				}
				return this;
			},
			/**
			 * 切换到游戏主循环生命周期
			 * @returns {link.gameFlow}
			 */
			run: function() {
				if (_args.system.runFn != null) {
					_args.system.gameFlow = _enums.system.gameFlowType.run;
					_that.resetKeys();
				}
				return this;
			},
			/**
			 * 切换到游戏暂停逻辑生命周期
			 * @returns {link.gameFlow}
			 */
			stop: function() {
				if (_args.system.stop != null) {
					_args.system.gameFlow = _enums.system.gameFlowType.stop;
					_that.resetKeys();
				}
				return this;
			},
			/**
			 * 切换到游戏结束逻辑生命周期
			 * @returns {link.gameFlow}
			 */
			over: function() {
				if (_args.system.over != null) {
					_args.system.gameFlow = _enums.system.gameFlowType.over;
					_that.resetKeys();
				}
				return this;
			},
			/**
			 * 切换到流程扩展逻辑生命周期
			 * @returns {link.gameFlow}
			 * @param {Object} args
			 */
			zone: function(args) {
				if (_args.system.zone != null) {
					_args.system.gameFlow = _enums.system.gameFlowType.zone;
					_args.system.zoneArgs = args;
					_that.resetKeys();
				}
				return this;
			},
			/**
			 * 切换到流程控制逻辑生命周期
			 * @returns {link.gameFlow}
			 * @param {Object} args
			 */
			active: function(args) {
				if (_args.system.active != null) {
					_args.system.gameFlow = _enums.system.gameFlowType.active;
					_args.system.activeArgs = args;
					_that.resetKeys();
				}
				return this;
			},
			/**判断当前是否处于对应生命周期
			 * @returns {bool}
			 * @param {string} key
			 */
			isIn: function (key) {
				return _args.system.gameFlow == _enums.system.gameFlowType[key];
			},
			/**
			 * 将方法链交给link
			 * @returns {link}
			 */
			base: function() {
				return _that;
			}
		},
		
		/**
		 * 判断按键是否被按下(连续触发)
		 * @returns {bool}
		 * @param {string} key
		 */
		keyRepeated: function(key) {
			if (!_args.event.keyDownGo) 
				_args.event.keyDownGo = true;
			return _args.event.keys[key];
		},
		/**
		 * 判断按键是否被按下(触发一次)
		 * @returns {bool}
		 * @param {string} key
		 */
		keyPressed: function(key) {
			if (!_args.event.keyPressedGo) 
				_args.event.keyPressedGo = true;
			var press = _args.event.pressedKey[key];
			_args.event.pressedKey[key] = false;
			return press;
		},
		/**
		 * 判断按键是否被按下后又放开
		 * @returns {bool}
		 * @param {string} key
		 */
		keyReleased: function(key) {
			if (!_args.event.keyUpGo) 
				_args.event.keyUpGo = true;
			var unpress = _args.event.lastKey[key];
			_args.event.lastKey[key] = false;
			return unpress;
		},
		/**
		 * 将键盘上的按键值赋值到键位<br />
		 * 例: <br />
		 * $.setKeyCode('run', 65); //将键盘上的a键设置成游戏中的跑按键<br />
		 * $.setKeyCode('fire', 68); //将键盘上的d键设置成游戏中的射击按键<br />
		 * $.setKeyCode('quit', 27); //将键盘上的esc键设置成游戏中的退出按键<br />
		 * $.setKeyCode('jump', 32); //将键盘上的空格键设置成游戏中的跳跃按键<br />
		 * @returns {link}
		 * @param {string} key
		 * @param {number} keyCode
		 */
		setKeyCode: function(key, keyCode) {
			_args.event.keys[key] = false;
			_args.event.lastKey[key] = false;
			_args.event.pressedKey[key] = false;
			_args.event.keyPressCtrl[key] = true;
			_enums.event.key[key] = keyCode;
			return this;
		},
		/**
		 * 清除所有按键
		 */
		resetKeys: function() {
			for (var key in _args.event.keys) {
				_args.event.keys[key] = false;
			}
			for (var key in _args.event.lastKey) {
				_args.event.lastKey[key] = false;
			}
			for (var key in _args.event.pressedKey) {
				_args.event.pressedKey[key] = false;
			}
			for (var key in _args.event.keyPressCtrl) {
				_args.event.keyPressCtrl[key] = true;
			}
			return this;
		},
		/**
		 * 画布
		 * @namespace
		 */
		canvas: {
			/**
			 * 初始化
			 * @returns {link.canvas}
			 */
			init: function() {
				_drawImageArgs = { x: 0, y: 0 };
				_setColorArgs = { fillColor: '#000000', strokeColor: '#000000' };
				_strokeRectArgs = { x: 0, y: 0 };
				_fillRectArgs = { x: 0, y: 0 };
				_drawStringArgs = { x: 0, y: 0, fillStyle: '#FFFFFF', strokeStyle: '#CCCCCC' };
				return this.pass();
			},
			/**
			 * 初始化设备
			 * @returns {link.canvas}
			 */
			initDevice: function() {
				_deviceInfo = _events.getDeviceConfig();
				_args.canvas.device = _deviceInfo.device;
				_args.canvas.fps = _deviceInfo.fps;
				_args.canvas.touch = _deviceInfo.touch;
				_args.canvas.zoom = _deviceInfo.zoom;
				return this;
			},
			/**
			 * 移交画布根
			 * @returns {link.canvas}
			 * @param {string} id
			 * @param {number} width
			 * @param {number} height
			 */
			pass: function(id, width, height) {
				var _id, _c;
				if (!id || id == '')
					_id = _args.canvas.defaultId;
				else
					_id = id;
				
				if (!_args.canvas.ctxs[_id]) {
					//不指定id的话则取前台canvas，否则创建缓冲区
					_c = this.base().getDom(_id) || document.createElement('canvas');
					_args.canvas.ctxs[_id] = null;
					delete(_args.canvas.ctxs[_id]);
					_args.canvas.ctxs[_id] = _c.getContext('2d');
					_c.width = width ? width : _args.canvas.defaultWidth;
					_c.style.width = parseInt(_c.width * _args.canvas.zoom) + 'px'; //等比缩放宽
					_c.height = height ? height : _args.canvas.defaultHeight;
					_c.style.height = parseInt(_c.height * _args.canvas.zoom) + 'px'; //等比缩放高
					_args.canvas.cavansDoms[_id] = null;
					delete(_args.canvas.cavansDoms[_id]);
					_args.canvas.cavansDoms[_id] = _c;
				}
				_ctx = _args.canvas.ctxs[_id];
				_ctx.font = _args.canvas.defaultFont;
				_canvasDom = _args.canvas.cavansDoms[_id];
				_currentW = parseInt(_canvasDom.width);
				_currentH = parseInt(_canvasDom.height);
				this.screen.setId(_id);
				return this;
			},
			/**
			 * 设置字体
			 * @returns {link.canvas}
			 * @param {string} font
			 */
			font: function(font) {
				_args.canvas.defaultFont = font;
				_ctx.font = _args.canvas.defaultFont;
				return this;
			},
			/**
			 * 移除缓冲区
			 * @returns {link.canvas}
			 * @param {string} id
			 */
			del: function(id) {
				if (_args.canvas.ctxs[id]) {
					_args.canvas.ctxs[id] = null;
					delete(_args.canvas.ctxs[id]);
					_args.canvas.cavansDoms[id] = null;
					delete(_args.canvas.cavansDoms[id]);
				}
				return this;
			},
			/**
			 * 移交画布根
			 * @returns {link.canvas}
			 * @param {string} id
			 */
			setCurrent: function(id) {
				return _canvas.pass(id);
			},
			/**
			 * 当前焦点画布数据
			 * @namespace 
			 */
			screen: {
				/**
				 * 设置焦点画布Id
			 	 * @returns {link.canvas.screen}
				 * @param {Object} id
				 */
				setId: function(id) {
					if (_args.canvas.ctxs[id])
						_args.canvas.id = id;
					return this;
				},
				/**
				 * 获取焦点画布Id
			 	 * @returns {string}
				 */
				getId: function() {
					return _args.canvas.id;
				},
				/**
				 * 获取焦点画布宽度
			 	 * @returns {number}
				 */
				getWidth: function() {
					return _currentW;
				},
				/**
				 * 设置画布宽度
			 	 * @returns {link.canvas.screen}
				 * @param {number} width
				 */
				setWidth: function(width) {
					_args.canvas.defaultWidth = width;
					if (_canvasDom) {
						_canvasDom.width = _args.canvas.defaultWidth;
						_canvasDom.style.width = _canvasDom.width + 'px';
						_currentW = parseInt(_canvasDom.width);
					}
					return this;
				},
				/**
				 * 获取焦点画布高度
			 	 * @returns {number}
				 */
				getHeight: function() {
					return _currentH;
				},
				/**
				 * 设置画布高度
			 	 * @returns {link.canvas.screen}
				 * @param {number} height
				 */
				setHeight: function(height) {
					_args.canvas.defaultHeight = height;
					if (_canvasDom) {
						_canvasDom.height = _args.canvas.defaultHeight;
						_canvasDom.style.height = _canvasDom.height + 'px';
						_currentH = parseInt(_canvasDom.height);
					}
					return this;
				},
				/**
				 * 获取设备名
			 	 * @returns {string}
				 */
				getDevice: function() {
					return _args.canvas.device;
				},
				/**
				 * 获取频率倍数
			 	 * @returns {number}
				 */
				getFps: function() {
					return _args.canvas.fps;
				},
				/**
				 * 设置频率倍数
			 	 * @returns {link.canvas.screen}
				 * @param {number} fps
				 */
				setFps: function(fps) {
					if (fps > 0)
						_args.canvas.fps = fps;
					return this;
				},
				/**
				 * 识别是否为触屏设备
			 	 * @returns {bool}
				 */
				getTouch: function() {
					return _args.canvas.touch;
				},
				/**
				 * 获取分辨率倍数
			 	 * @returns {number}
				 */
				getZoom: function() {
					return _args.canvas.zoom;
				}
			},
			/**
			 * 设置填充颜色
			 * @returns {link.canvas}
			 * @param {string} color
			 */
			fillStyle: function(color) {
				_ctx.fillStyle = color;
				return this;
			},
			/**
			 * 填充矩形
			 * @returns {link.canvas}
			 * @param {number} x
			 * @param {number} y
			 * @param {number} width
			 * @param {number} height
			 * @param {number} anchor
			 */
			fillRect: function(x, y, width, height, anchor) {
				width = width ? width : 0;
				height = height ? height : 0;
				if (anchor) {
					_fillRectArgs = _events.getAnchor(x, y, width, height, anchor);
				}
				else {
					_fillRectArgs.x = x;
					_fillRectArgs.y = y;
				}
				_ctx.fillRect(_fillRectArgs.x, _fillRectArgs.y, width, height);
				return this;
			},
			/**
			 * 输出文本
			 * @returns {link.canvas}
			 * @param {string} text
			 * @param {number} x
			 * @param {number} y
			 * @param {string} font
			 */
			fillText: function(text, x, y, font) {
				_ctx.font = font || _args.canvas.defaultFont;
				_ctx.fillText(text, x, y);
				return this;
			},
			/**
			 * 清除矩形
			 * @returns {link.canvas}
			 * @param {number} x
			 * @param {number} y
			 * @param {number} width
			 * @param {number} height
			 */
			clearRect: function(x, y, width, height) {
				_ctx.clearRect(x, y, width, height);
				return this;
			},
			/**
			 * 清除整个屏幕
			 * @returns {link.canvas}
			 */
			clearScreen: function() {
				return this.clearRect(0, 0, _currentW, _currentH);
			},
			/**
			 * 填充整个屏幕
			 * @returns {link.canvas}
			 */
			fillScreen: function() {
				return this.fillRect(0, 0, _currentW, _currentH);
			},
			/**
			 * 设置边框颜色
			 * @returns {link.canvas}
			 * @param {string} color
			 */
			strokeStyle: function(color) {
				_ctx.strokeStyle = color;
				return this;
			},
			/**
			 * 设置边线宽度
			 * @returns {link.canvas}
			 * @param {number} width
			 */
			lineWidth: function(width) {
				_ctx.lineWidth = width || 1;
				return this;
			},
			/**
			 * 绘制矩形边框
			 * @returns {link.canvas}
			 * @param {number} x
			 * @param {number} y
			 * @param {number} width
			 * @param {number} height
			 * @param {number} anchor
			 */
			strokeRect: function(x, y, width, height, anchor) {
				if (anchor) {
					_strokeRectArgs = _events.getAnchor(x, y, width, height, anchor);
				}
				else {
					_strokeRectArgs.x = x;
					_strokeRectArgs.y = y;
				}
				_ctx.strokeRect(_strokeRectArgs.x, _strokeRectArgs.y, width, height);
				return this;
			},
			/**
			 * 绘制文字边框
			 * @returns {link.canvas}
			 * @param {string} text
			 * @param {number} x
			 * @param {number} y
			 * @param {string} font
			 */
			strokeText: function(text, x, y, font) {
				_ctx.font = font || _args.canvas.defaultFont;
				_ctx.strokeText(text, x, y);
				return this;
			},
			/**
			 * 设置填充和边框颜色<br />
			 * 重载(+3)<br />
			 * setColor(color);<br />
			 * setColor(fillColor, strokeColor);<br />
			 * setColor(r, g, b);<br />
			 * @returns {link.canvas}
			 * @param {string/number} fillColor
			 * @param {string/number} strokeColor
			 * @param {number} rgbCtrl
			 */
			setColor: function(fillColor, strokeColor, rgbCtrl) {
				if (rgbCtrl == null) {
					_setColorArgs.fillColor = fillColor;
					_setColorArgs.strokeColor = strokeColor ? strokeColor : fillColor;
				}
				else {
					_setColorArgs.fillColor = 'rgb(' + fillColor + ', ' + strokeColor + ', ' + rgbCtrl + ')';
					_setColorArgs.strokeColor = _setColorArgs.fillColor;
				}
				return this.fillStyle(_setColorArgs.fillColor).strokeStyle(_setColorArgs.strokeColor);
			},
			/**
			 * 绘制图像<br />
			 * 重载(+4)<br />
			 * drawImage(imageid, x, y);<br />
			 * drawImage(imageid, x, y, anchor);<br />
			 * drawImage(imageid, sx, sy, sWidth, sHeight, x, y, width, height);<br />
			 * drawImage(imageid, sx, sy, sWidth, sHeight, x, y, width, height, anchor);<br />
			 * @returns {link.canvas}
			 * @param {string} imageid
			 * @param {number} sx
			 * @param {number} sy
			 * @param {number} sWidth
			 * @param {number} sHeight
			 * @param {number} x
			 * @param {number} y
			 * @param {number} width
			 * @param {number} height
			 * @param {number} anchor
			 */
			drawImage: function(imageid, sx, sy, sWidth, sHeight, x, y, width, height, anchor) {
//				console.log(imageid + ',' + sx + ',' + sy + ',' + sWidth + ',' + sHeight + ',' + x + ',' + y + ',' + width + ',' + height + ',' + anchor);
				var _getImg = _that.getImage(imageid);
				if (_getImg.refreshed) { //如果标记已经写入缓冲区则直接调用drawCache
					this.drawCache(imageid, sx, sy, sWidth, sHeight, x, y, width, height, anchor);
				}
                else if (_getImg.src != null) {
                    if (width != null) {
                        sx = sx < 0 ? 0 : sx;
                        width = width <= 0 ? 0.1 : width;
					}
					if (height != null) {
						sy = sy < 0 ? 0 : sy;
                        height = height <= 0 ? 0.1 : height;
					}
					if (sWidth != null && width != null) {
                    	sWidth = sWidth <= 0 ? 0.1 : (sx + sWidth <= _getImg.width ? sWidth : _getImg.width - sx);
					}
					if (sHeight != null && height != null) {
                        sHeight = sHeight <= 0 ? 0.1 : (sy + sHeight <= _getImg.height ? sHeight : _getImg.height - sy);
					}
                    if (_getImg.loaded) {
                        if (!sWidth)
    						_ctx.drawImage(_getImg, sx, sy);
    					else if (!sHeight) {
    						_drawImageArgs = _events.getAnchor(sx, sy, _getImg.width, _getImg.height, sWidth);
    						_ctx.drawImage(_getImg, _drawImageArgs.x, _drawImageArgs.y);
    					}
    					else if (!anchor)
    						_ctx.drawImage(_getImg, sx, sy, sWidth, sHeight, x, y, width, height);
    					else {
    						_drawImageArgs = _events.getAnchor(x, y, width, height, anchor);
    						_ctx.drawImage(_getImg, sx, sy, sWidth, sHeight, _drawImageArgs.x, _drawImageArgs.y, width, height);
    					}	
                    }
                }
                else { //处理异步加载图形
                    var _getAsyncImg = _args.image.asyncImgObjs[imageid];
                    if (_getAsyncImg && !_getAsyncImg.inited) {
                        _events.setImage(_getAsyncImg.id, _getAsyncImg.src, _getAsyncImg.benchId, _getAsyncImg.bench, _getAsyncImg.cache);
                        //将图形路径资源标识为已经初始化状态
						_getAsyncImg.inited = true;
                    }
                    _getAsyncImg = null;
                }
                _getImg = null;
				return this;
			},
			/**
			 * 旋转图形
			 * @returns {link.canvas}
			 * @param {string} id
			 * @param {number} sx
			 * @param {number} sy
			 * @param {number} sWidth
			 * @param {number} sHeight
			 * @param {number} x
			 * @param {number} y
			 * @param {number} width
			 * @param {number} height
			 * @param {number} rot
			 */
			drawRotate: function(id, sx, sy, sWidth, sHeight, x, y, width, height, rot) {
				var _hw = parseInt(width >> 1), _hh = parseInt(height >> 1), 
				_getImage = _that.getImage(id), _image = _getImage.src ? _getImage : _args.canvas.cavansDoms[id];
				x -= _hw; //换算中心店坐标
				y -= _hh;
				_ctx.save();
				_ctx.translate(x + _hw, y + _hh);
				_ctx.rotate(rot * Math.PI / 180);
				_ctx.translate(-(x + _hw), -(y + _hh));
				_ctx.drawImage(_image,  sx, sy, sWidth, sHeight, x, y, width, height);
				_ctx.restore();
				_image = null;
				_getImage = null;
				_hh = null;
				_hw = null;
				return this;
			},
			/**
			 * 渲染缓冲区
			 * @returns {link.canvas}
			 * @param {string} id
			 * @param {number} sx
			 * @param {number} sy
			 * @param {number} sWidth
			 * @param {number} sHeight
			 * @param {number} x
			 * @param {number} y
			 * @param {number} width
			 * @param {number} height
			 * @param {number} anchor
			 */
			drawCache: function(id, sx, sy, sWidth, sHeight, x, y, width, height, anchor) {
				var _cache = _args.canvas.cavansDoms[id];
				if (_cache) {
					if (width != null) {
                        sx = sx < 0 ? 0 : sx;
                        width = width <= 0 ? 0.1 : width;
					}
					if (height != null) {
						sy = sy < 0 ? 0 : sy;
                        height = height <= 0 ? 0.1 : height;
					}
					if (sWidth != null && width != null) {
                    	sWidth = sWidth <= 0 ? 0.1 : (sx + sWidth <= _cache.width ? sWidth : _cache.width - sx);
					}
					if (sHeight != null && height != null) {
                        sHeight = sHeight <= 0 ? 0.1 : (sy + sHeight <= _cache.height ? sHeight : _cache.height - sy);
					}
					if (!sWidth)
						_ctx.drawImage(_cache, sx, sy);
					else if (!sHeight) {
						_drawImageArgs = _events.getAnchor(sx, sy, _cache.width, _cache.height, sWidth);
						_ctx.drawImage(_cache, _drawImageArgs.x, _drawImageArgs.y);
					}
					else if (!anchor)
						_ctx.drawImage(_cache, sx, sy, sWidth, sHeight, x, y, width, height);
					else {
						_drawImageArgs = _events.getAnchor(x, y, width, height, anchor);
						_ctx.drawImage(_cache, sx, sy, sWidth, sHeight, _drawImageArgs.x, _drawImageArgs.y, width, height);
					}	
				}
				_cache = null;
				return this;
			},
			/**
			 * 绘制翻转图形
			 * @returns {link.canvas}
			 * @param {string} imageid
			 * @param {number} sx
			 * @param {number} sy
			 * @param {number} sw
			 * @param {number} sh
			 * @param {number} trans
			 * @param {number} x
			 * @param {number} y
			 * @param {number} anchor
			 */
			drawRegion: function(imageid, sx, sy, sw, sh, trans, x, y, anchor){
				switch (trans) {
		            case _enums.canvas.trans.TRANS_NONE:
					default:
		                _ctx.transform(1, 0, 0, 1, x, y);
		                break;
		            case _enums.canvas.trans.TRANS_ROT90:
		                _ctx.transform(0, 1, -1, 0, sh + x, y);
		                break;
		            case _enums.canvas.trans.TRANS_ROT180:
		                _ctx.transform(-1, 0, 0, -1, sw + x, sh + y);
		                break;
		            case _enums.canvas.trans.TRANS_ROT270:
		                _ctx.transform(0, -1, 1, 0, x, sw + y);
		                break;
		            case _enums.canvas.trans.TRANS_MIRROR:
		                _ctx.transform(-1, 0, 0, 1, sw + x, y);
		                break;
		            case _enums.canvas.trans.TRANS_MIRROR_ROT90:
		                _ctx.transform(0, -1, -1, 0, sh + x, sw + y);
		                break;
		            case _enums.canvas.trans.TRANS_MIRROR_ROT180:
		                _ctx.transform(1, 0, 0, -1, x, sh + y);
		                break;
		            case _enums.canvas.trans.TRANS_MIRROR_ROT270:
		                _ctx.transform(0, 1, 1, 0, x, y);
		                break;
		        }
				var _image = _that.getImage(imageid), _drawMethod = !_image.cache ? this.drawImage : this.drawCache;
		        _drawMethod(imageid, sx, sy, sw, sh, 0, 0, sw, sh);
		        _ctx.setTransform(1, 0, 0, 1, 0, 0); //重置坐标系
				_drawMethod = null;
				_image = null;
				return this;
		    },
		    /**
			 * 绘制翻转&缩放图形
			 * @returns {link.canvas}
			 * @param {string} imageid
			 * @param {number} sx
			 * @param {number} sy
			 * @param {number} sw
			 * @param {number} sh
			 * @param {number} trans
			 * @param {number} x
			 * @param {number} y
			 * @param {number} anchor
			 * @param {number} w
			 * @param {number} h
			 */
			drawRegionAndZoom: function(imageid, sx, sy, sw, sh, trans, x, y, anchor, w, h){
				switch (trans) {
		            case _enums.canvas.trans.TRANS_NONE:
					default:
		                _ctx.transform(1, 0, 0, 1, x, y);
		                break;
		            case _enums.canvas.trans.TRANS_ROT90:
		                _ctx.transform(0, 1, -1, 0, h + x, y);
		                break;
		            case _enums.canvas.trans.TRANS_ROT180:
		                _ctx.transform(-1, 0, 0, -1, w + x, h + y);
		                break;
		            case _enums.canvas.trans.TRANS_ROT270:
		                _ctx.transform(0, -1, 1, 0, x, w + y);
		                break;
		            case _enums.canvas.trans.TRANS_MIRROR:
		                _ctx.transform(-1, 0, 0, 1, w + x, y);
		                break;
		            case _enums.canvas.trans.TRANS_MIRROR_ROT90:
		                _ctx.transform(0, -1, -1, 0, h + x, w + y);
		                break;
		            case _enums.canvas.trans.TRANS_MIRROR_ROT180:
		                _ctx.transform(1, 0, 0, -1, x, h + y);
		                break;
		            case _enums.canvas.trans.TRANS_MIRROR_ROT270:
		                _ctx.transform(0, 1, 1, 0, x, y);
		                break;
		        }
				var _image = _that.getImage(imageid), _drawMethod = !_image.cache ? this.drawImage : this.drawCache;
		        _drawMethod(imageid, sx, sy, sw, sh, 0, 0, w, h);
		        _ctx.setTransform(1, 0, 0, 1, 0, 0); //重置坐标系
				_drawMethod = null;
				_image = null;
				return this;
		    },
			/**
			 * 绘制数字图形
			 * @returns {link.canvas}
			 * @param {number} numbers
			 * @param {string} imageid
			 * @param {number} numberWidth
			 * @param {number} numberHeight
			 * @param {number} x
			 * @param {number} y
			 * @param {bool} against
			 * @param {number} scaleWidth
			 * @param {number} scaleHeight
			 */
			drawNumber: function(numbers, imageid, numberWidth, numberHeight, x, y, against, scaleWidth, scaleHeight) {
				var _num = numbers.toString(), _len = _num.length, _showW = scaleWidth ? scaleWidth : numberWidth, _showH = scaleHeight ? scaleHeight : numberHeight;
				if (against == 'center') { //居中对齐
				    var _startX = x + parseInt((_currentW - (_showW * _len)) >> 1);
                    for (var i = 0; i < _len; i++) {
                        this.drawImage(imageid, parseInt(_num.charAt(i)) * numberWidth, 0, numberWidth, numberHeight, _startX + (i * _showW), y, _showW, _showH);
                    }
                    _startX = null;
                }
                else if (against == true) //左对齐
					for (var i = 0; i < _len; i++) {
						this.drawImage(imageid, parseInt(_num.charAt(i)) * numberWidth, 0, numberWidth, numberHeight, x + (i * _showW), y, _showW, _showH);
					}
				else if (against == false) //右对齐
					for (var i = _len - 1; i >= 0; i--) {
						this.drawImage(imageid, parseInt(_num.charAt(i)) * numberWidth, 0, numberWidth, numberHeight, x - ((_len - 1 - i) * _showW), y, _showW, _showH, _that.graphics.ANCHOR_RT);
					}
				_showH = null;
				_showW = null;
				_len = null;
				_num = null;
				return this;
			},
			/**
			 * 设置笔触
			 * @returns {link.canvas}
			 * @param {number} x
			 * @param {number} y
			 */
			moveTo: function(x, y) {
				_ctx.moveTo(x, y);
				return this;
			},
			/**
			 * 绘制直线
			 * @returns {link.canvas}
			 * @param {number} x
			 * @param {number} y
			 */
			lineTo: function(x, y) {
				_ctx.lineTo(x, y);
				return this;
			},
			/**
			 * 描边
			 * @returns {link.canvas}
			 */
			stroke: function() {
				_ctx.stroke();
				return this;
			},
			/**
			 * 填充
			 * @returns {link.canvas}
			 */
			fill: function() {
				_ctx.fill();
				return this;
			},
			/**
			 * 开始路径
			 * @returns {link.canvas}
			 */
			beginPath: function() {
				_ctx.beginPath();
				return this;
			},
			/**
			 * 关闭路径
			 * @returns {link.canvas}
			 */
			closePath: function() {
				_ctx.closePath();
				return this;
			},
			/**
			 * 绘制弧线
			 * @returns {link.canvas}
			 * @param {number} x
			 * @param {number} y
			 * @param {number} radius
			 * @param {number} startAngle
			 * @param {number} endAngle
			 * @param {number} anticlockwise
			 */
			arc: function(x, y, radius, startAngle, endAngle, anticlockwise) {
				_ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise);
				return this;
			},
			/**
			 * 绘制二次方曲线
			 * @returns {link.canvas}
			 * @param {number} cp1x
			 * @param {number} cp1y
			 * @param {number} x
			 * @param {number} y
			 */
			quadraticCurveTo: function(cp1x, cp1y, x, y) {
				_ctx.quadraticCurveTo(cp1x, cp1y, x, y);
				return this;
			},
			/**
			 * 绘制贝塞尔曲线
			 * @returns {link.canvas}
			 * @param {number} cp1x
			 * @param {number} cp1y
			 * @param {number} cp2x
			 * @param {number} cp2y
			 * @param {number} x
			 * @param {number} y
			 */
			bezierCurveTo: function(cp1x, cp1y, cp2x, cp2y, x, y) {
				_ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
				return this;
			},
			/**
			 * 返回文本宽度
			 * @returns {link.canvas}
			 * @param {string} text
			 */
			measureText: function(text) {
				var _mt = _ctx.measureText(text), _tw = _mt.width, _th = _mt.height ? _mt.height : parseInt(_ctx.font);
				return { width: this.screen.getDevice() == 'j2me' ? _ctx.measureText(text) : _tw, height: _th };
			},
			/**
			 * 画布偏移
			 * @returns {link.canvas}
			 * @param {number} x
			 * @param {number} y
			 */
			translate: function(x, y) {
				_ctx.translate(x, y);
				return this;
			},
			/**
			 * 绘一条直线
			 * @returns {link.canvas}
			 * @param {number} x1
			 * @param {number} y1
			 * @param {number} x2
			 * @param {number} y2
			 */
			drawLine: function(x1, y1, x2, y2) {
				return this.beginPath().moveTo(x1, y1).lineTo(x2, y2).closePath().stroke();
			},
			/**
			 * 绘制矩形框(支持锚点)
			 * @returns {link.canvas}
			 * @param {number} x
			 * @param {number} y
			 * @param {number} width
			 * @param {number} height
			 * @param {number} anchor
			 */
			drawRect: function(x, y, width, height, anchor) {
				return this.strokeRect(x, y, width, height, anchor);
			},
			/**
			 * 按照对齐方式绘制文字
			 * @returns {link.canvas}
			 * @param {string} str
			 * @param {number} x
			 * @param {number} y
			 * @param {number} align
			 * @param {bool} drawStroke
			 * @param {string} fillStyle
			 * @param {string} strokeStyle
			 * @param {string} font
			 */
			drawString: function(str, x, y, align, drawStroke, fillStyle, strokeStyle, font) {
				_drawStringArgs.x = x;
				_drawStringArgs.y = y;
				_ctx.font = font || _args.canvas.defaultFont;
				if (align) {
					switch (align) {
						case _enums.canvas.graphics.LEFT:
							_drawStringArgs.x = 0;
							break;
						case _enums.canvas.graphics.VCENTER:
							_drawStringArgs.x = parseInt((this.screen.getWidth() - this.measureText(str).width) >> 1);
							break;
						case _enums.canvas.graphics.RIGHT:
							_drawStringArgs.x = this.screen.getWidth() - this.measureText(str).width;
							break;
						default:
							break;
					}
				}
				
				if (drawStroke) {
					if (fillStyle)
						_drawStringArgs.fillStyle = fillStyle;
					else
						_drawStringArgs.fillStyle = '#000000';
					if (strokeStyle)
						_drawStringArgs.strokeStyle = strokeStyle;
					else
						_drawStringArgs.strokeStyle = '#CCCCCC';
					this.fillStyle(_drawStringArgs.strokeStyle).fillText(str, _drawStringArgs.x + 1, _drawStringArgs.y + 1, font).fillStyle(_drawStringArgs.fillStyle);
				}
				
				return this.fillText(str, _drawStringArgs.x, _drawStringArgs.y, font).fillStyle(_args.canvas.defaultColor);
			},
			/**
			 * 切割文字后按照对齐方式绘制文字
			 * @returns {link.canvas}
			 * @param {string} str
			 * @param {number} offset
			 * @param {number} len
			 * @param {number} x
			 * @param {number} y
			 * @param {number} align
			 * @param {bool} drawStroke
			 * @param {string} fillStyle
			 * @param {string} strokeStyle
			 * @param {string} font
			 */
			drawSubstring: function(str, offset, len, x, y, align, drawStroke, fillStyle, strokeStyle, font) {
				return this.drawString(str.substring(offset, offset + len), x, y, align, drawStroke, fillStyle, strokeStyle, font);
			},
			/**
			 * 使用当前路径作为连续绘制操作的剪切区域
			 * @returns {link.canvas}
			 */
			clip: function() {
				_ctx.clip();
				return this;
			},
			/**
			 * 保存 CanvasRenderingContext2D 对象的属性、剪切区域和变换矩阵
			 * @returns {link.canvas}
			 */
			save: function() {
				_ctx.save();
				return this;
			},
			/**
			 * 为画布重置为最近保存的图像状态
			 * @returns {link.canvas}
			 */
			restore: function() {
				_ctx.restore();
				return this;
			},
			/**
			 * 为当前路径添加一条矩形子路径
			 * @returns {link.canvas}
			 * @param {number} x
			 * @param {number} y
			 * @param {number} width
			 * @param {number} height
			 */
			rect: function(x, y, width, height) {
				_ctx.rect(x, y, width, height);
				return this;
			},
			/**
			 * 旋转画布的坐标系统
			 * @returns {link.canvas}
			 * @param {number} angle - 旋转的量，用弧度表示。正值表示顺时针方向旋转，负值表示逆时针方向旋转。
			 */
			rotate: function(angle) {
				_ctx.rotate(angle);
				return this;
			},
			/**
			 * 绘制变形图形
			 * @returns {link.canvas}
			 * @param {number} m11
			 * @param {number} m12
			 * @param {number} m21
			 * @param {number} m22
			 * @param {number} dx
			 * @param {number} dy
			 */
			setTransform: function(m11, m12, m21, m22, dx, dy) {
				_ctx.setTransform(m11, m12, m21, m22, dx, dy);
				return this;
			},
			/**
			 * 标注画布的用户坐标系统 缩放画布
			 * @returns {link.canvas}
			 * @param {number} sx
			 * @param {number} sy
			 */
			scale: function(sx, sy) {
				_ctx.scale(sx, sy);
				return this;
			},
			/**
			 * 指定在画布上绘制的内容的不透明度
			 * @returns {link.canvas}
			 * @param {number} alpha
			 */
			globalAlpha: function(alpha) {
				_ctx.globalAlpha = alpha;
				return this;
			},
			/**
			 * 获取画布原生 CanvasRenderingContext2D 对象
			 * @returns {link.canvas}
			 */
			getContext: function() {
				return _ctx;
			},
			/**
			 * 将方法链交给link
			 * @returns {link}
			 */
			base: function() {
				return _that;
			}
		},
		/**
		 * 同步加载图形资源<br />
		 * 注意: 此方法只能在pageLoad方法体外调用<br />
		 * 同步加载资源只有一次机会，之后想要加载资源可以使用loadImage进行分步资源加载<br />
		 * 如果想要在pageLoad内加载同步图形资源可以用loadImage<br />
		 * @returns {link}
		 * @param {array} imgs
		 * @param {Function} fn
		 */
		pushImage: function(imgs, fn) {
			//同步加载资源只有一次机会，之后想要加载资源可以使用loadImage进行分步资源加载
			if (_args.image.inited) {
				return this;
			}
            var _img;
			for (var i = 0, len = imgs.length; i < len; i++) {
                _img = imgs[i];
                if (_img && !_args.image.initImgs[_img.id]) {
                    _args.image.initImgs[_img.id] = true;
                    _args.image.imgObjs.push(imgs[i]);
                }
			}
			this.loadingEndCallBack(fn);
            _img = null;
			return this;
		},
		/**
		 * 分步加载图形资源<br />
		 * 注意:此方法必须放在pageLoad入口方法内部执行<br />
		 * 如果想要在pageLoad方法体外加载同步资源可以用pushImage<br />
		 * 因为加载图形资源涉及到canvas渲染操作，所以在pageLoad方法体内执行才能确保canvas初始化完全。<br />
		 * @returns {link}
		 * @param {array} imgs
		 * @param {Function} fn
		 */
		loadImage: function(imgs, fn) {
			if (_args.system.gameFlow != _enums.system.gameFlowType.loadImage && imgs.length > 0) {
				_args.system.loadedImageToGameFlow = _args.system.gameFlow; //记录分布加载资源开始时系统所处的流程位置，加载完成后自动回到该流程
				_args.system.gameFlow = _enums.system.gameFlowType.loadImage;
				_args.image.imgObjs = imgs;
				_args.image.imgCount = _args.image.imgObjs.length;
				_args.image.countLoaded = 0;
				for (var i = 0, imgObj; imgObj = _args.image.imgObjs[i]; i++) {
					if (!_args.image.imgs[imgObj.id]) {
						_events.setImage(imgObj.id, imgObj.src, imgObj.benchId);
					}
					else {
						_args.image.countLoaded++;
					}
				}
				this.loadingEndCallBack(fn);
			}
			return this;
		},
        /**
         * 异步加载图形资源
         * 注意: 此方法可以在任何地方进行调用
		 * @returns {link}
         * @param {array} imgs
         */
        asyncImage: function(imgs) {
            var _img;
            for (var i = 0, len = imgs.length; i < len; i++) {
                _img = imgs[i] || {};
				if (!_args.image.asyncImgObjs[_img.id]) {
					_args.image.asyncImgObjs[_img.id] = _img;
				}
			}
            _img = null;
            return this;
        },
		/**
		 * 批量修改所有图形资源的版本号
		 * @returns {link}
		 * @param {string} v
		 */
		verImage: function(v) {
			if (_args.image.version == '') {
				_args.image.version = v;
			}
			return this;
		},
		/**
		 * 加载资源通用回调
		 * @param {Object} fn
		 */
		loadingCallBack: function(fn) {
			if (typeof fn === 'function') {
				_events.loadingCallBack = fn;
			}
			return this;
		},
		/**
		 * 加载资源完成后回调
		 * @returns {link}
		 * @param {Function} fn
		 */
		loadingEndCallBack: function(fn) {
			if (typeof fn === 'function') {
				_events.loadingEndCallBack = fn;
			}
			return this;
		},
		/**
		 * 动态添加一个Image实例
		 * @returns {link}
		 * @param {string} id
		 * @param {image} img
		 */
		addImage: function(id, img) {
			if (id && img && !_args.image.imgs[id]) {
	       		_args.image.imgs[id] = img;
	        }
			return this;
		},
		/**
		 * 获取一个Image实例
		 * @returns {object}
		 * @param {string} id
		 */
		getImage: function(id) {
			if (_args.image.imgs[id])
				return _args.image.imgs[id];
            else
                return { src: null };
		},
		/**
		 * 删除一个Image实例
		 * @returns {link}
		 * @param {string} id
		 * @param {bool} mark
		 */
		delImage: function(id, mark) {
			if (_args.image.imgs[id]) {
				_args.image.imgs[id] = null;
				delete(_args.image.imgs[id]);
				if (mark) { //将资源指针指向缓冲区
					_args.image.imgs[id] = { id: id, loaded: true, cache: true, refreshed: true };
				}
			}
			return this;
		},
		/**
		 * 获取一个未加载的异步渲染Image实例
		 * @returns {object}
		 * @param {string} id
		 */
		getAsyncImage: function(id) {
			if (_args.image.asyncImgObjs[id])
				return _args.image.asyncImgObjs[id];
			else
				return { src: null };
		},
		/**
		 * 清空异步加载并存储到缓冲区中的全部图形资源
		 * @returns {link}
		 */
		clearAsyncImageCache: function() {
			try {
				var _imgs = _args.image.imgs, _img, _asyncImgObj;
				for (var key in _imgs) {
					_img = _imgs[key];
					if (_img) { //判断图形是否为异步加载并存储到缓冲区中的图形资源
						_asyncImgObj = _args.image.asyncImgObjs[key];
						if (_asyncImgObj) { //判定异步加载资源的路径信息是否合法
							_asyncImgObj.inited = false; //将信息标识为未初始化状态
							this.delImage(key) //删除旧的图形标识数据
							.canvas.del(key); //删除缓冲区中的数据
						}
					}
				}
				_imgs = _img = _asyncImgObj = null;
			}
			catch (e) { }
			return this;
		},
		/**
		 * 音频<br />
		 * 注意：所有音频文件必须放在支持音频文件MIMEType的静态服务器上,否则音频循环和重播会有问题<br />
		 * @namespace
		 */
		audio: {
			/**
			 * 播放音效
     		 * @returns {link.audio}
			 * @param {stringt} id
			 */
			play: function(id) {
				var _audio = _args.audio.audios[id];
				if (_audio) {
					try {
						if (_audio.currentTime >= _audio.duration) { //如果播放完则从头播放
							this.replay(id);
						}
						else if (_audio.paused) {
						    _audio.play();
						}
					}
					catch(e) {}
				}
				_audio = null;
				return this;
			},
			/**
			 * 播放音频区间
			 * @param {string} id
			 * @param {number} form
			 * @param {number} to
			 */
			playRange: function(id, from, to) {
				var _audio = _args.audio.audios[id];
				if (_audio) {
					try {
						if (!_audio.__timeupdateCallBack__) {
							_audio.addEventListener('timeupdate', _audio.__timeupdateCallBack__ = function() {
								if (this.currentTime >= this.__to__) {
									if (this.loop) {
										this.currentTime = this.__from__;
									}
									else {
										this.pause();
									}
								}
							}, false);
						}
						_audio.__from__ = from == null ? 0 : from;
						_audio.__to__ = to == null ? _audio.duration : to;
						this.setCurrentTime(_audio.id, _audio.__from__)
						.play(_audio.id);;
					}
					catch(e) {}
				}
				_audio = null;
				return this;
			},
			/**
			 * 停止音效
     		 * @returns {link.audio}
			 * @param {string} id
			 */
			pause: function(id) {
				if (_args.audio.audios[id]) {
					try {
						_args.audio.audios[id].pause();
					}
					catch(e) {}
				}
				return this;
			},
			/**
			 * 停止所有音乐
     		 * @returns {link.audio}
			 */
			pauseAll: function() {
				for (var id in _args.audio.audios) {
					this.pause(id);
				}
				return this;
			},
			/**
			 * 设置是否静音
     		 * @returns {link.audio}
			 * @param {string} id
			 * @param {bool} muted
			 */
			mute: function (id, muted) {
				if (_args.audio.audios[id]) {
					try {
						_args.audio.audios[id].muted = muted;
					}
					catch(e) {}
				}
			},
			/**
			 * 设置音量
     		 * @returns {link.audio}
			 * @param {string} id
			 * @param {float} volume
			 */
			vol: function(id, volume) {
				if (_args.audio.audios[id]) {
					try {
						_args.audio.audios[id].volume = volume;
					}
					catch(e) {}
				}
				return this;
			},
			/**
			 * 设置音乐是否可循环
     		 * @returns {link.audio}
			 * @param {string} id
			 * @param {bool} loop
			 */
			loop: function(id, loop) {
				if (_args.audio.audios[id]) {
					try {
						_args.audio.audios[id].loop = loop;
					}
					catch(e) {}
				}
				return this;
			},
            /**
             * 重播
     		 * @returns {link.audio}
             * @param {string} id
             */
            replay: function(id) {
				this.setCurrentTime(id, 0).play(id);
                return this;
            },
			/**
			 * 设置播放起始时间
     		 * @returns {link.audio}
			 * @param {string} id
			 * @param {number} currentTime
			 */
			setCurrentTime: function(id, currentTime) {
				var _audio = _args.audio.audios[id];
				if (_audio) {
					try {
						if (currentTime < 0) {
							currentTime = 0;
						}
						else if (currentTime > _audio.duration) {
							currentTime = _audio.duration;
						}
						_audio.currentTime = currentTime || 0;
					}
					catch(e) {}
				}
				_audio = null;
				return this;
			},
            /**
             * 获取音频对象
     		 * @returns {link.audio}
             * @param {string} id
             */
            getAudio: function(id) {
                return _args.audio.audios[id];
            },
			/**
			 * 删除音频
     		 * @returns {link.audio}
			 * @param {string} id
			 */
			del: function(id) {
				var _audio = _args.audio.audios[id];
				if (_audio) {
					if (_audio.__timeupdateCallBack__) {
						_audio.pause();
						_audio.removeEventListener('timeupdate', _audio.__timeupdateCallBack__, false);
						_args.audio.audios[id] = null;
						delete(_args.audio.audios[id]);
					}
				}
				_audio = null;
				return this;
			},
			/**
			 * 将方法链交给link
     		 * @returns {link}
			 */
			base: function() {
				return _that;
			}
		},
		/**
		 * 预加载音频资源<br />
		 * 注意：所有音频文件必须放在支持音频文件MIMEType的静态服务器上,否则音频循环和重播会有问题<br />
     	 * @returns {link}
		 * @param {array} audios
		 */
		initAudio: function(audios) {
			if (!window.Audio) {
				return this;
			}
			if (audios.length > 0) {
				_args.audio.audios = {};
                var _audio, _loop, _preload, _autoplay, _autobuffer;
				for (var i = 0; i < audios.length; i++) {
                    _audio = audios[i];
                    if (_audio) {
						_events.setAudio(_audio.id, _audio.src, _audio.loop, _audio.autoplay, _audio.preload, _audio.autobuffer);
                    }
				}
                _audio = _loop = _preload = _autoplay = _autobuffer = null;
			}
			return this;
		},
		/**
		 * 更新主循环频率<br />
		 * time的单位为帧/秒
		 * @returns {link}
		 * @param {number} time
		 */
		setRunFrequency: function(time) {
			_args.system.timeout = time;
			return this;
		},
		/**
		 * 回调事件集合
		 * @namespace
		 */
		events: {
			/**
			 * 按下键盘事件
     		 * @returns {link.events}
			 * @param {Function} fn
			 */
			keyDown: function(fn) { 
				if (!_args.event.keyDownGo)
					_args.event.keyDownGo = true;
				if (!_args.event.keyUpGo)
					_args.event.keyUpGo = true;
				if (!_args.event.keyPressedGo)
					_args.event.keyPressedGo = true;
				_args.event.keyDownCallBack = fn;
				return this;
			},
			/**
			 * 离开按键事件
     		 * @returns {link.events}
			 * @param {Function} fn
			 */
			keyUp: function(fn) { 
				if (!_args.event.keyDownGo)
					_args.event.keyDownGo = true;
				if (!_args.event.keyUpGo)
					_args.event.keyUpGo = true;
				if (!_args.event.keyPressedGo)
					_args.event.keyPressedGo = true;
				_args.event.keyUpCallBack = fn;
				return this;
			},
			/**
			 * 重力感应事件
     		 * @returns {link.events}
			 * @param {Function} fn
			 */
			orientationChange: function(fn) {
				_args.event.orientationChange = fn;
				return this;
			},
			/**
			 * 单点触摸屏幕事件
     		 * @returns {link.events}
			 * @param {Function} fn
			 */
			touchStart: function(fn) {
				_args.event.touchStart = fn;
				return this;
			},
			/**
			 * 离开屏幕事件
     		 * @returns {link.events}
			 * @param {Function} fn
			 */
			touchEnd: function(fn) {
				_args.event.touchEnd = fn;
				return this;
			},
			/**
			 * 触摸拖拽事件
     		 * @returns {link.events}
			 * @param {Function} fn
			 */
			touchMove: function(fn) {
				_args.event.touchMove = fn;
				return this;
			},
			/**
			 * 取消触屏事件
     		 * @returns {link.events}
			 * @param {Function} fn
			 */
			touchCancel: function(fn) {
				_args.event.touchCancel = fn;
				return this;
			},
			/**
			 * 鼠标点击事件
     		 * @returns {link.events}
			 * @param {Function} fn
			 */
			click: function(fn) {
				_args.event.clickCallBack = fn;
				return this;
			},
			/**
			 * 鼠标按下事件
     		 * @returns {link.events}
			 * @param {Function} fn
			 */
			mouseDown: function(fn) {
				_args.event.mouseDownCallBack = fn;
				return this;
			},
			/**
			 * 鼠标抬起事件
     		 * @returns {link.events}
			 * @param {Function} fn
			 */
			mouseUp: function(fn) {
				_args.event.mouseUpCallBack = fn;
				return this;
			},
			/**
			 * 鼠标移动事件
     		 * @returns {link.events}
			 * @param {Function} fn
			 */
			mouseMove: function(fn) {
				_args.event.mouseMoveCallBack = fn;
				return this;
			},
			/**
			 * 针对特定dom节点模拟特定事件
     		 * @returns {link.events}
			 * @param {string} id
			 * @param {string} eventType
			 */
			createEvent: function (id, eventType) {
				 var _getDom = document.getElementById(id);
				 if (_getDom) {
					 var ev = document.createEvent('HTMLEvents');
					 ev.initEvent(eventType, false, true);
					 _getDom.dispatchEvent(ev);
					 ev = null;
				 }
				 _getDom = null;
			},
			/**
			 * 获取页面焦点事件
     		 * @returns {link.events}
			 * @param {Function} fn
			 */
			pageFocus: function(fn) {
				_args.event.pageFocusCallBack = fn;
				return this;
			},
			/**
			 * 失去页面焦点事件
     		 * @returns {link.events}
			 * @param {Function} fn
			 */
			pageUnFocus: function(fn) {
				_args.event.pageUnFocusCallBack = fn;
				return this;
			},
			/**
			 * 滑动事件
     		 * @returns {link.events}
			 * @param {Function} fn
			 * @param {number} swipeTimeout
			 * @param {number} swipeRange
			 */
			swipe: function(fn, swipeTimeout, swipeRange) {
				_args.event.swipeCallBack = fn;
				if (swipeTimeout != null) {
					_args.event.swipeTimeout = swipeTimeout;
				}
				if (swipeRange != null) {
					_args.event.swipeRange = swipeRange;
				}
			},
			/**
			 * 将方法链交给link
     		 * @returns {link}
			 */
			base: function() {
				return _that;
			}
		},
		/**
		 * ui扩展接口
		 */
		ui: {},
		/**
		 * 图形锚点操作常量命名空间<br />
		 * 扩展枚举，可以从6种常规锚点中扩展出更多的锚点<br />
		 * link.graphics.ANCHOR_HV //HCENTER & VCENTER<br />
		 * link.graphics.ANCHOR_LV //LEFT & VCENTER<br />
		 * link.graphics.ANCHOR_RV //RIGHT & VCENTER<br />
     	 * link.graphics.ANCHOR_HT //TOP & HCENTER<br />
		 * link.graphics.ANCHOR_LT //LEFT & TOP<br />
		 * link.graphics.ANCHOR_RT //RIGHT & TOP<br />
     	 * link.graphics.ANCHOR_HB //BOTTOM & HCENTER<br />
     	 * link.graphics.ANCHOR_LB //LEFT & BOTTOM<br />
		 * link.graphics.ANCHOR_RB //RIGHT & BOTTOM<br />
 		 * @enum {number}
		 * @namespace
		 * @readonly
		 */
		graphics: {
			/**
			 * 垂直居中
			 */
			HCENTER: _enums.canvas.graphics.HCENTER,
			/**
			 * 水平居中
			 */
			VCENTER: _enums.canvas.graphics.VCENTER,
			/**
			 * 左对齐
			 */
			LEFT: _enums.canvas.graphics.LEFT,
			/**
			 * 右对齐
			 */
			RIGHT: _enums.canvas.graphics.RIGHT,
			/**
			 * 顶部对齐
			 */
			TOP: _enums.canvas.graphics.TOP,
			/**
			 * 底部对齐
			 */
			BOTTOM: _enums.canvas.graphics.BOTTOM
		},
		/**
		 * 图形翻转操作常量命名空间
 		 * @enum {number}
		 * @namespace
		 * @readonly
		 */
		trans: {
			/**
			 * 不翻转
			 */
			TRANS_NONE: _enums.canvas.trans.TRANS_NONE,
			/**
			 * 旋转90度
			 */
			TRANS_ROT90: _enums.canvas.trans.TRANS_ROT90,
			/**
			 * 旋转180度
			 */
			TRANS_ROT180: _enums.canvas.trans.TRANS_ROT180,
			/**
			 * 旋转270度
			 */
			TRANS_ROT270: _enums.canvas.trans.TRANS_ROT270,
			/**
			 * 镜像翻转
			 */
			TRANS_MIRROR: _enums.canvas.trans.TRANS_MIRROR,
			/**
			 * 镜像旋转90度
			 */
			TRANS_MIRROR_ROT90: _enums.canvas.trans.TRANS_MIRROR_ROT90,
			/**
			 * 镜像旋转180度
			 */
			TRANS_MIRROR_ROT180: _enums.canvas.trans.TRANS_MIRROR_ROT180,
			/**
			 * 镜像旋转270度
			 */
			TRANS_MIRROR_ROT270: _enums.canvas.trans.TRANS_MIRROR_ROT270
		},
		/**
		 * 获取http参数命名空间
		 * @namespace
		 */
		request: {
			/**
			 * 初始化
     		 * @returns {void}
			 */
			init: function() {
				//初始化url参数集合
				_events.initUrlParams(window.leiyooHref ? window.leiyooHref : location.href);
			},
			/**
			 * 获取get方式传递过来的参数值
     		 * @returns {string}
			 * @param {string} key
			 */
			get: function(key) {
				return _args.request.gets[key] ? _args.request.gets[key] : '';
			}
		},
        /**
         * 处理建议按钮交互接口
         * @namespace
         */
		buttonLayout: {
		    /**
		     *添加一个 点击对象
             * @returns {link.buttonLayout}
             * @param {object} obj
		     */
		    create: function(obj) {
		        var _props = this.base()
		        .objExtend({
		            id: '',
		            value: '', //渲染文字
		            x: 0,
		            y: 0,
		            width: 60, //点击对象宽高
		            height: 30,
		            bgColor: '#000', //背景颜色
		            bgStroke: '#FFF', //背景框颜色
		            stroke: '#000', //文字描边颜色
		            font: '12px Arial',
		            imageId: '', //点击对象图片id
		            sx: 0, //点击对象三种状态的切片坐标
		            sy: 0,
		            color: '#FFF',
		            hx: 0,
		            hy: 0,
		            hColor: '#0FF',
		            dex: 0,
		            dey: 0,
		            deColor: '#CCC',
		            hided: false,
		            disabled: false,
		            path: []
		        }, obj || {});
		        if (!this.get(_props.id)) {
		            _args.buttonLayout.buttons.push(new _args.buttonLayout.Button(_props));
		        }
		        _props = null;
		        return this;
		    },
		    /**
		     * 移除一个点击对象
             * @returns {link.buttonLayout}
             * @param {string} id
		     */
		    destroy: function(id) {
		        var _buttons = _args.buttonLayout.buttons, _button;
		        for (var i = _buttons.length - 1; i >= 0; i--) {
		            if (_button = _buttons[i]) {
		                if (_button.id == id) {
		                    _button.disposed();
		                    _buttons.splice(i, 1);
		                    break;
		                }
		            }
		        }
		        _buttons = _button = null;
		        return this;
		    },
		    /**
		     * 清空所有点击对象
             * @returns {link.buttonLayout}
		     */
		    clear: function() {
		        var _buttons = _args.buttonLayout.buttons, _button;
                for (var i = _buttons.length - 1; i >= 0; i--) {
                    if (_button = _buttons[i]) {
                        _button.disposed();
                        _buttons.splice(i, 1);
                    }
                }
                _buttons = _button = null;
		        return this;
		    },
		    /**
		     *  使点击对象飘走[停止移动后删除]
             * @returns {link.buttonLayout}
             * @param {string} id
             * @param {array} path
             * @param {number} delay
		     */
		    gone: function(id, path, delay) {
		        var _button = this.get(id);
                if (_button) {
                    var _path = path || [];
                    _button.gone(_path, delay);
                    _path = null;
                }
                _button = null; 
		        return this;
		    },
		    /**
		     * 获取一个 点击对象 
             * @returns {_args.buttonLayout.Button}
             * @param {string} id
		     */
		    get: function(id) {
		        var _buttons = _args.buttonLayout.buttons;
		        return _buttons[_buttons.indexOfAttr('id', id)];
		    },
            /**
             * 显示点击对象
             * @returns {link.buttonLayout}
             * @param {string} id
             */
		    show: function(id) {
		        var _button = this.get(id);
		        if (_button) {
		            _button.show();
		        }
		        _button = null;
		        return this;
		    },
            /**
             * 隐藏点击对象
             * @returns {link.buttonLayout}
             * @param {string} id
             */
            hide: function(id) {
                var _button = this.get(id);
                if (_button) {
                    _button.hide();
                }
                _button = null;
                return this;
            },
            /**
             * 禁用、取消禁用点击对象
             * @returns {link.buttonLayout}
             * @param {string} id
             * @param {bool} disabled
             */
            disable: function(id, disabled) {
                var _button = this.get(id);
                if (_button) {
                    _button.disable(disabled);
                }
                _button = null;
                return this;
            },
            /**
             * 点击对象是否被按住
             * @returns {bool}
             * @param {string} id
             */
            repeated: function(id) {
                var _button = this.get(id);
                if (_button) {
                    return _button.repeated;
                }
            },
            /**
             * 点击对象是否被按下
             * @returns {bool}
             * @param {string} id
             */
            pressed: function(id) {
                var _button = this.get(id);
                if (_button) {
                    var _result = _button.pressed;
                    _button.pressed = false;
                    return _result;
                }
            },
            /**
             * 点击对象是否被松开
             * @returns {bool}
             * @param {string} id
             */
            released: function(id) {
                var _button = this.get(id);
                if (_button) {
                    var _result = _button.released;
                    _button.released = false;
                    return _result;
                }
            },
            /**
             * 将方法链交给link
             * @returns {link}
             */
            base: function() {
                return _that;
            }
		}
		
	}.init();
	var _that = jsGame = link;
	
	//静态方法
	
	var _headDom = document.getElementsByTagName('head')[0],
	_scriptDom = null,
	_timeout = null,
	_success = null, _error = null, 
	_disposed = function() {
		if (_timeout) {
			clearTimeout(_timeout);
			_timeout = null;
		}
	};
	/**
	 * 动态获取脚本[支持跨区传输交互]
 	 * @returns {link}
	 * @param {object} param
	 */
	link.getScript = function(args) {
		if (!_headDom || _scriptDom) //不允许连续请求
			return false;
		var _props = _that.objExtend({
			url: '',
			before: function() {},
			success: function() {},
			error: function(erro) {},
			timeout: 5000,
			contentType: 'text/javascript',
			destroyed: true //是否销毁script标签
		}, args || {});
		if (_props.url != '') {
			_props.before();
			_scriptDom = document.createElement('script');
			_scriptDom.type = _props.contentType;
			_scriptDom.async = true;
			_scriptDom.src = _props.url;
			_scriptDom.destroyed = _props.destroyed;
			_success = _props.success;
			_error = _props.error;
			_scriptDom.onload = function() {
				_disposed();
				if (_success) {
					_success();
					_success = null;							
				}
				if (this.destroyed)
					_headDom.removeChild(this);
				_scriptDom = null;
			};
			_headDom.appendChild(_scriptDom);
			//检测超时
			_disposed();
			_timeout = setTimeout(function() {
				_disposed();
				if (_error) {
					_error('timeout');
					_error = null;
				}
				if (_scriptDom && _scriptDom.destroyed) 
					_headDom.removeChild(_scriptDom);
				_scriptDom = null;
			}, _props.timeout);
		}
		_props = null;
		return _that;
	};
	
	var _s4 = function() {
       return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
	/**
	 * 获取一个GUID值
 	 * @returns {string}
	 */
	link.getNewGuid = function() {
		return _s4() + _s4() + '-' + _s4() + '-' + _s4() + '-' + _s4() + '-' + _s4() + _s4() + _s4(); 
	};
	
	//实体类
	/**
	 * 观察者实例
     * @class
	 */
	link.classes.Observer = function() {
		this.group = [];
	};
	/**
	 * 订阅消息
 	 * @returns {Observer}
	 * @param {Function} fn
	 */
	link.classes.Observer.prototype.register = function(fn) {
        if (fn == null)
            return this;
        var _index = _that.comm.inArray(fn, this.group);
        if (_index == -1)
            this.group.push(fn);
        return this;
    };
	/**
	 * 取消订阅
 	 * @returns {Observer}
	 * @param {Function} fn
	 */
    link.classes.Observer.prototype.unregister = function(fn) {
        if (fn == null)
            return this;
        var _index = _that.commandFuns.inArray(fn, this.group);
        if (_index > -1)
            this.group.splice(_index, 1);
        return this;
    };

	/**
	 * 发送消息
 	 * @returns {Observer}
	 * @param {object} data
	 */
    link.classes.Observer.prototype.notify = function(data) {
        for (var i = 0; i < this.group.length; i++) {
            if (this.group[i] != null) {
                this.group[i](data);
			}
        }
        return this;
    };

	/**
	 * 清空消息
 	 * @returns {Observer}
	 */
    link.classes.Observer.prototype.clear = function() {
        if (this.group.length > 0)
            this.group.splice(0, this.group.length);
        return this;
    };
	
	/**
	 * 计时器实体类
	 * @class
	 * @param {string} id
	 * @param {number} time
	 * @param {Function} callBack
	 * @param {number} millisec
	 * @param {object} data
	 */
	 link.classes.Timer = function(id, time, callBack, millisec, data) {
		this.id = id;
		this._initTime = time;
        this._dateTime = Date.now(); //参照时间
		this.time = this._initTime;
		this.callBack = callBack;
		this.millisec = millisec || 1000;
		this.data = data;
		this.timeout = null;
	};
	//计时器停止方法
	link.classes.Timer.prototype.stop = function() {
        if (this.timeout) {
            clearTimeout(this.timeout);
		    this.timeout = null;
        }
	};
	//计时器开启方法
	link.classes.Timer.prototype.start = function(reset) {
		if (reset) {
            this.time = this._initTime;
            this._dateTime = Date.now();
        } //是否重头计时
			
		this.stop(); //先关闭再开启
		this.timeout = setTimeout(function(that) {
            var _newTime = Date.now(), _cutTime = parseInt(Math.round((_newTime - that._dateTime) / that.millisec));
            that._dateTime = _newTime;
			that.time -= _cutTime;
			if (that.callBack)
				that.callBack(that);
			else
				that.stop();
			if (that.time >= 0)
				that.start();
			else {
				that.stop();
				that.time = 0;
			}
            _newTime = _cutTime = null;
		}, this.millisec, this);
	};
	
	/**
	 * WebSocket实体类
	 * @class
	 * @param {string} ipPort
	 * @param {Function} onOpen
	 * @param {Function} onMessage
	 * @param {Function} onClose
	 * @param {Function} onError
	 */
	link.classes.WebSocket = function(ipPort, onOpen, onMessage, onClose, onError) {
		this.ipPort = ipPort || ''; //ip、端口
		//初始化
		this.socket = new WebSocket(this.ipPort);
		this.socket.onopen = onOpen;
		this.socket.onmessage = onMessage;
		this.socket.onclose = onClose;
		this.socket.onerror = onError;
	};
	/**
	 * WebSocket发送消息方法
	 * @param {object|string} data
	 */
	link.classes.WebSocket.prototype.send = function(data) {
		this.socket.send(data);
	};
	//WebSocket关闭连接方法
	link.classes.WebSocket.prototype.close = function() {
		this.socket.close();
	};
	
	link.classes.observer = link.classes.Observer; //兼容小写
	link.classes.timer = link.classes.Timer; //兼容小写
	link.classes.webSocket = link.classes.websocket = link.classes.WebSocket; //兼容小写
	//旧的api向下兼容
	link.commandFuns = link.comm;
	link.commandFuns.collisionCheck = link.commandFuns.collision;
	link.commandFuns.circleCollisionCheck = link.commandFuns.circleCollision;
	
	link.initImage = link.pushImage;
	
	if (typeof define === "function") {
	    define(function () { return link; } );
	}
	
})();
