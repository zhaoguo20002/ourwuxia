/**
 * @author Suker
 * 与carmark.js、action.js插件耦合
 * 主要处理场景显示、精灵动画、精灵移动
 * 该框架类可以用于回合制RPG游戏和ARPG即时战斗RPG游戏
 */
define([
	'lib/link', 
	'lib/carmark', 
	'lib/astar'
], function($, carmark, astar) {
	var _enums = {
		//碰撞层地砖类型枚举
		oType: {
			stop: 0, //禁止通行
			pass: 1, //正常通行
			shadow: 2 //带阴影效果通行
		}
	}, _collisionCheck = $.commandFuns.collisionCheck;
	$.World = $.extend(function(param) {
		var _props = $.objExtend({
			x: 0, //世界可视界面相对于画布的xy坐标
			y: 0,
			width: 800, //世界可视界面宽高
			height: 480, 
			tw: 100, //地砖宽高
			th: 100,
			ow: 100, //A*节点宽高
			oh: 100,
			sw: 100, //滚屏的宽高速度
			sh: 100,
			asyncUrl: '', //A*异步算法代码路径
			offsetTileNumber: 1, //缓冲地砖数
			nodeXStep: 5,
			nodeYStep: 5,
			wordsNum: 40, //角色头顶文本显示区域数量
			wordsW: 120,
			wordsH: 40,
			bubbleNum: 10, //角色说话气泡数量
			bubbleW: 200, //单元气泡的尺寸
			bubbleH: 100,
			bubbleFont: '14px Arial',
			tiles: [], //地砖图形资源数组
			roleId: '', //等待摄影机关联的角色id
			sortStep: 5, //排序节奏
			onEvent: null, //场景事件触发回调函数
			moveDs: [0, 1, 2, 3, 4, 5, 6, 7], //移动时8方向分别对应的动作索引编号集合 0:面朝北, 1:面朝东北 2:面朝东 3:面朝东南 4:面朝南 5:面朝西南 6:面朝西 7:面朝西北 
			stopDs: [8, 9, 10, 11, 12, 13, 14, 15], //停止时8方向分别对应的动作索引编号集合 索引意义如上
			callEventTimeout: 100, //事件触发间隔时间
			outScreenWH: 0 //检测触屏的扩张宽高
		}, param || {});
		this.x = _props.x;
		this.y = _props.y;
		this.width = _props.width;
		this.height = _props.height;
		this.tw = _props.tw;
		this.th = _props.th;
		this.ow = _props.ow;
		this.oh = _props.oh;
		this.sw = _props.sw;
		this.sh = _props.sh;
		this._owNum = Math.ceil(this.width / this.ow); //主角视野里最大地砖列数
		this._ohNum = Math.ceil(this.height / this.oh); //主角视野里最大地砖行数
		this._asyncUrl = _props.asyncUrl;
		this.offsetTileNumber = _props.offsetTileNumber;
		this._nodeXStep = _props.nodeXStep; //粗路径换算细路径时的步长
		this._nodeYStep = _props.nodeYStep;
		this._wordsNum = _props.wordsNum; //角色描述文字缓存区预创建个数
		this._wordsW = _props.wordsW; //角色描述文字缓存区宽高
		this._wordsH = _props.wordsH;
		this._wordsPassIds = []; //预创建的角色描述文字缓存区
		for (var i = 0; i < this._wordsNum; i++) {
			$.canvas.pass('_wordsPass_' + i, this._wordsW, this._wordsH).pass();
			this._wordsPassIds.push('_wordsPass_' + i);
		}
		this._wordsList = []; //角色头上的文本描述对象数组
		this._bubbleNum = _props.bubbleNum; //角色说话气泡缓存区预创建个数
		this._bubbleW = _props.bubbleW; //角色说话气泡缓存区宽高
		this._bubbleH = _props.bubbleH;
		this._bubbleFont = _props.bubbleFont;
		this._bubblePassIds = []; //预创建的说话气泡缓存区
		for (var i = 0; i < this._bubbleNum; i++) {
			$.canvas.pass('_bubblePass_' + i, this._bubbleW, this._bubbleH).pass();
			this._bubblePassIds.push('_bubblePass_' + i);
		}
		this._bubblesList = []; //角色说话气泡对象数组
		this._aStars = []; //A*寻路检测数组
		this._events = []; //场景事件监听数组
		this._endEvents = []; //主角移动停止事件监听数组
		this._onEvent = _props.onEvent; //场景事件触发回调函数
		this._onEventQueue = []; //场景事件执行队列[需要在action的帧尾执行，以免和角色行走坐标系不同步]
		this._roleObjs = {}; //角色指针映射集合
		this._buildingObjs = {}; //建筑物指针映射集合
		this._frontEffs = []; //前景特效动画数组
		this._backEffs = []; //背景特效动画数组
		this._fontEffs = []; //文本特效
		//综合列表
		//角色列表 [包括玩家角色、NPC或者一切会动的精灵都放到这个列表里]
		//建筑物列表 [包括建筑和场景里一切会发生遮挡效果的摆件都放到这个列表里]
		this._shelters = []; 
		this._context = $.canvas.getContext(); //前景画布上下文
		this._tiles = _props.tiles; //地砖图形资源数组
		this.car = null;
		this.roleId = ''; //等待摄影机关联的角色id
		this._superStar = null; //摄影机关联上的角色
		this._focusPath = []; //摄像机关联到角色时的移动路径
		this._canSort = false; //排序开关
		this._sortStep_ = _props.sortStep; //排序节奏初始值
		this._sortStep = this._sortStep_; //排序节奏
		this.setMoveDs(_props.moveDs);
		this.setStopDs(_props.stopDs);
		this.shakeX = 0; //世界摇动x方向速度
		this.shakeY = 0; //世界摇动y方向速度
		this._shakePath = []; //摇动队列
		this._endEventObj = null; //缓存主角移动停止事件参数
		this._loadingBars = []; //进度条显示队列
		this.callEventTimeout = _props.callEventTimeout; //事件触发间隔时间
		this._callEventDate = Date.now(); //事件触发时间戳
		this._runDownSleepDate = Date.now(); //战斗监听器休眠时间戳
		this._runDownSleepTimeout = 0;
		this._focusLampShelters = []; //聚光灯效果关联的角色id
		this._focusLampBlockColor = '#000';
		this._focusLampTimeout = 0; //聚光灯超时时间
		this._focusLampDate = Date.now(); //聚光灯超时时间戳
		this._outScreenWH = _props.outScreenWH; //检测触屏的扩张宽高
		this._outScreenW = this.width + this._outScreenWH;
		this._outScreenH = this.height + this._outScreenWH;
		this._outScreenX = this.x - (this._outScreenWH >> 1);
		this._outScreenY = this.y - (this._outScreenWH >> 1);
		_props = null;
	}, null, {
		/**
		 * 初始化游戏场景
		 */
		init: function() {
			if (this.car) {
				this.car.mapRender();
			}
			return this;
		},
		/**
		 * 重置世界的屏幕尺寸
		 * @param {number} width
		 * @param {number} height
		 */
		resetScreen: function(width, height) {
			this.width = width;
			this.height = height;
			this._owNum = Math.ceil(this.width / this.ow); //主角视野里最大地砖列数
			this._ohNum = Math.ceil(this.height / this.oh); //主角视野里最大地砖行数
			return this;
		},
		/**
		 * 重置移动时8方向分别对应的动作索引编号集合
		 * @param {array} moveDs
		 */
		setMoveDs: function(moveDs) {
			this._moveDs = moveDs || [0, 1, 2, 3, 4, 5, 6, 7];
			return this;
		},
		/**
		 * 停止时8方向分别对应的动作索引编号集合
		 * @param {array} stopDs
		 */
		setStopDs: function(stopDs) {
			this._stopDs = stopDs || [8, 9, 10, 11, 12, 13, 14, 15];
			return this;
		},
		/**
		 * 世界渲染
		 */
		render: function() {
			this.carRender().shelterRender().wordsRender();
			return this;
		},
		/**
		 * 渲染角色文本描述
		 */
		wordsRender: function() {
			if (this._focusLampShelters.length == 0) { //聚光灯效果下不显示角色名字
				//角色头顶描述星系
				var _wordsObj, _wrDate = Date.now();
				for (var i = this._wordsList.length - 1; i >= 0; i--) {
					_wordsObj = this._wordsList[i];
					if (_wordsObj && !_wordsObj.outScreen) {
						$.canvas.drawCache(_wordsObj._passId, parseInt(_wordsObj.x + _wordsObj._wordsDx), parseInt(_wordsObj.y + _wordsObj._wordsDy));
					}
				}
				_wordsObj = null;
				
				//角色说话气泡
				var bb;
				for (var i = this._bubblesList.length - 1; i >= 0; i--) {
					bb = this._bubblesList[i];
					if (bb && !bb.role.outScreen) {
						if ((_wrDate - bb.data) >= bb.delayMs) {
							this.removeRoleBubbleByIndex(i);
						}
						else {
							$.canvas.drawCache(bb.passId, parseInt(bb.role.x + bb.dx), parseInt(bb.role.y + bb.dy));
						}
					}
				}
				bb = null;
				//处理文本特效动画
				var _eff, _fontFrame;
				for (var i = this._fontEffs.length -1; i >= 0; i--) {
					_eff = this._fontEffs[i];
					if (_eff && !_eff.outScreen) {
						_fontFrame = _eff.getFrame();
						if (_fontFrame[2] != null || _fontFrame[3] != null) {
							$.canvas.save();
							if (_fontFrame[2] >= 0) { //处理透明度
								$.canvas.globalAlpha(_fontFrame[2]);
							}
							if (_fontFrame[3] >= 0) { //处理缩放
								var _textWidth = $.canvas.font(_eff._font).measureText(_eff._text).width;
								$.canvas.translate(_eff.x + (_textWidth >> 1), _eff.y).scale(_fontFrame[3], _fontFrame[3]).translate(-(_eff.x + (_textWidth >> 1)), -_eff.y);
								_textWidth = null;
							}
						}
						$.canvas.drawString(_eff._text, _eff.x + _fontFrame[0], _eff.y + _fontFrame[1], '', true, _eff._color, _eff._strokeColor, _eff._font);
						if (_fontFrame[2] != null || _fontFrame[3] != null) {
							$.canvas.restore();
						}
					}
				}
				_eff = _fontFrame = _wrDate = null;
			}
			return this;
		},
		/**
		 * 渲染场景中的特殊动画[比如进度条、说话气泡等]
		 */
		animationRender: function() {
			//渲染进度条进度
			for (var i = this._loadingBars.length - 1, lb; lb = this._loadingBars[i]; i--) {
				this.loadingBarRender(lb); //渲染进度条
			}
			return this;
		},
		/**
		 * 渲染角色精度条读条动画[可重写]
		 * @param {object} loadingBar
		 */
		loadingBarRender: function(loadingBar) {
			var _role = loadingBar.role;
			if (_role && !_role.outScreen) {
				var _per = loadingBar.curMs / loadingBar.ms, _pstr = parseInt(100 - _per * 100) + '%', _barH = parseInt(loadingBar.font);
				$.canvas.fillStyle('#CCC').fillRect(_role.x - 60, _role.y + loadingBar.dy + 5, 120, _barH + 4)
				.fillStyle('#0F0').fillRect(_role.x - 60, _role.y + loadingBar.dy + 5, 120 - 120 * _per, _barH + 4)
				.drawString(_pstr, _role.x - ($.canvas.font(loadingBar.font).measureText(_pstr).width >> 1), _role.y + loadingBar.dy + 5 + _barH, '', true, loadingBar.color, loadingBar.stroke, loadingBar.font)
				.drawString(loadingBar.desc, _role.x + loadingBar.dx, _role.y + loadingBar.dy, '', true, loadingBar.color, loadingBar.stroke, loadingBar.font);
				_per = _pstr = _barH = null;
			}
			_role = null;
			return this;
		},
		/**
		 * 地图渲染
		 */
		carRender: function() {
			if (this.car) {
				this.car.paint(this._context, this.x + this.shakeX, this.y + this.shakeY);
			}
			return this;
		},
		/**
		 * 渲染遮挡物
		 * 所有能产生遮挡效果的对象都放在这里统一渲染
		 * 如建筑物、角色等
		 */
		shelterRender: function() {
			if (this._focusLampShelters.length == 0 || this._focusLampBlockColor.indexOf('rgba') >= 0) {
				var _eff;
				//处理背景特效动画
				for (var i = this._backEffs.length -1; i >= 0; i--) {
					_eff = this._backEffs[i];
					if (_eff && !_eff.outScreen) {
						_eff.render();
					}
				}
				var _shelter;
				for (var i = this._shelters.length - 1; i >= 0; i--) {
					_shelter = this._shelters[i];
					//只有出现在视野内的对象才会渲染
					if (_shelter && !_shelter.hided && !_shelter.outScreen) {
						_shelter.render();
					}
				}
				_shelter = _eff = null;
			}
			if (this._focusLampShelters.length > 0) {
				$.canvas.fillStyle(this._focusLampBlockColor).fillScreen();
				var _eff;
				//处理背景特效动画
				for (var i = this._backEffs.length -1; i >= 0; i--) {
					_eff = this._backEffs[i];
					if (_eff && _eff.shine && !_eff.outScreen) {
						_eff.render();
					}
				}
				//渲染聚光灯效果关联的角色
				for (var i = this._focusLampShelters.length - 1, shelter; shelter = this._focusLampShelters[i]; i--) {
					if (!shelter.outScreen) {
						shelter.render();
					}
				}
				//处理前景特效动画
				for (var i = this._frontEffs.length -1; i >= 0; i--) {
					_eff = this._frontEffs[i];
					if (_eff && _eff.shine && !_eff.outScreen) {
						_eff.render();
					}
				}
				//处理文本特效动画
				var _eff, _fontFrame;
				for (var i = this._fontEffs.length -1; i >= 0; i--) {
					_eff = this._fontEffs[i];
					if (_eff && _eff.shine && !_eff.outScreen) {
						_fontFrame = _eff.getFrame();
						$.canvas.drawString(_eff._text, _eff.x + _fontFrame[0], _eff.y + _fontFrame[1], '', true, _eff._color, _eff._strokeColor, _eff._font);
					}
				}
				_eff = _fontFrame = null;
			}
			return this;
		},
		//渲染前景特效
		frontEffectRender: function() {
			//处理前景特效动画
			for (var i = this._frontEffs.length -1, _eff; _eff = this._frontEffs[i]; i--) {
				if (!_eff.outScreen) {
					_eff.render();
				}
			}
			return this;
		},
		/**
		 * 清除所有的精灵对象
		 */
		clearShelters: function() {
			var _shelter;
			for (var i = this._shelters.length - 1; i >= 0; i--) {
				_shelter = this._shelters[i];
				if (!_shelter) {
					continue;
				}
				//只有出现在视野内的对象才会渲染
				if (_shelter.type == 'building') {
					this.removeBuilding(_shelter.id);
				}
				else {
					this.removeRole(_shelter.id);
				}
			}
			_shelter = null;
			return this;
		},
		/**
		 * 调试渲染
		 */
		debugRender: function() {
			var _shelter;
			for (var i = this._shelters.length - 1; i >= 0; i--) {
				_shelter = this._shelters[i];
				//只有出现在视野内的对象才会渲染
				if (_shelter && !_shelter.outScreen) {
					var _fa = _shelter._fA, _len = _fa.length;
					$.canvas.fillStyle('rgba(0, 0, 0, 0.2)');
					//动作帧区域
					for (var j = 0; j < _len; j++) {
						$.canvas.fillRect(parseInt(_shelter.x + _fa[j][2] * _shelter.zoom), parseInt(_shelter.y + _fa[j][3] * _shelter.zoom), _shelter.rects[_fa[j][0]][_fa[j][1]][2] * _shelter.zoom, _shelter.rects[_fa[j][0]][_fa[j][1]][3] * _shelter.zoom);
					}
					//身体碰撞区域
					$.canvas.fillStyle('rgba(0, 255, 255, 0.5)').fillRect(
						_shelter.getSprite().trans == $.trans.TRANS_NONE ? parseInt((_shelter.x + _shelter.dx + _shelter.bR[0] * _shelter.zoom)) : parseInt((_shelter.x + _shelter.dx - (_shelter.bR[0] + _shelter.bR[2]) * _shelter.zoom)),
						_shelter.y + _shelter.dy + _shelter.bR[1] * _shelter.zoom, _shelter.bR[2] * _shelter.zoom, _shelter.bR[3] * _shelter.zoom
					)
					//攻击碰撞区域
					.fillStyle('rgba(255, 0, 255, 0.5)').fillRect(
					_shelter.getSprite().trans == $.trans.TRANS_NONE ? parseInt((_shelter.x + _shelter.dx + _shelter.aR[0] * _shelter.zoom)) : parseInt((_shelter.x + _shelter.dx - (_shelter.aR[0] + _shelter.aR[2]) * _shelter.zoom)), 
					_shelter.y + _shelter.dy + _shelter.aR[1] * _shelter.zoom, _shelter.aR[2] * _shelter.zoom, _shelter.aR[3] * _shelter.zoom);
					_fa = _len = null;
				}
			}
			var _cx, _cy, _aimObj;
			$.canvas.fillStyle('rgba(255, 0, 0, 0.5)');
			for (var i = 0; i < this._events.length; i++) {
				if (this._events[i][0] != 'npcRange') {
					_cx = this._events[i][2] - this.car.getMapOffX();
					_cy = this._events[i][3] - this.car.getMapOffY();
				}
				else {
					_aimObj = this._events[i][7];
					if (_aimObj) {
						_cx = _aimObj.x - (this._events[i][4] >> 1);
						_cy = _aimObj.y - (this._events[i][5] >> 1)
					}
				}
				$.canvas.fillRect(_cx, _cy, this._events[i][4], this._events[i][5]);
			}
			_cx = _cy = _aimObj = null;
			$.canvas.fillStyle('rgba(0, 0, 0, 0.6)');
			for (var i = 0; i < this._aStars.length; i++) {
				for (var j = 0; j < this._aStars[i].length; j++) {
					if (this._aStars[i][j] <= 0) {
						$.canvas.fillRect(j * this.ow - this.car.getMapOffX(), i * this.oh - this.car.getMapOffY(), this.ow, this.oh);
					}
				}
			}
			_shelter = null;
			return this;
		},
		/**
		 * 逻辑监听
		 */
		action: function() {
			var _shelter, _focusP, _shakeP, _superStar = this._superStar, _car = this.car;
			if (_superStar) {
				this.eventListener();
				if (_superStar.svx != null && _superStar.svy != null) {
					this.focusRole(_superStar.id);
				}
				if (this._endEvents.length > 0) { //在主角停止移动后再处理场景事件[如进入NPC范围内会和触发战斗、点NPC移动靠近后触发任务界面等]
					if (_superStar.nodes.length == 0 && _superStar.endPath()) {
						var _endEvent;
						for (var i = 0, len = this._endEvents.length; i < len; i++) {
							_endEvent = this._endEvents[i];
							this._onEvent(_endEvent[0], _endEvent[1], _superStar, this, _endEvent[2]);
						}
						_endEvent = null;
						this._endEvents = [];
					}
				}	
			}
			if (this._focusPath.length > 0) { //取摄像机偏移路径
				_focusP = this._focusPath.shift();
				this.carScroll(-_focusP[0], -_focusP[1]); //地图卷动
			}
			if (this._shakePath.length > 0) {
				_shakeP = this._shakePath.shift();
				//设置场景摇动速度
				this.shakeX = _shakeP[0];
				this.shakeY = _shakeP[1];
				if (_focusP) {
					_focusP[0] += this.shakeX;
					_focusP[1] += this.shakeY;
				}
			}
			else if (this.shakeX != 0 || this.shakeY != 0) {
				//下一帧摇动停止
				this.shakeX = 0;
				this.shakeY = 0;
			}
			var _node;
			this._canSort = false;
			for (var i = this._shelters.length - 1; i >= 0; i--) {
				_shelter = this._shelters[i];
				if (_shelter) {
					if (_focusP) { //处理摄像机关联角色时场景内一切物体的偏移路径
						_shelter.x += _focusP[0];
						_shelter.y += _focusP[1];
					}
					else if (_shakeP) { //处理震屏坐标偏移效果
						_shelter.x += _shakeP[0];
						_shelter.y += _shakeP[1];
					}
					_shelter.action();
					if (_shelter.type == 'role' || _shelter.type == 'npc') {
						if (_shelter.endPath()) {
							if (_shelter.nodes.length > 0) {
								//处理二级阶段路径转化事件
								if (this._superStar && this._superStar.id == _shelter.id && this._onEvent) {
									this._onEvent('setNode', _shelter.id, _shelter, this);
								}
								_node = _shelter.nodes.shift();
								//将粗路径换算为细路径
								_shelter.setPath(this.returnRolePathByNode(_shelter.x0, _shelter.y0, _node[0], _node[1], _shelter.nodeXStep, _shelter.nodeYStep));
								_shelter.lastX0 = _shelter.x0; //预先记录上一个节点
								_shelter.lastY0 = _shelter.y0;
								_shelter.x0 = _node[0];
								_shelter.y0 = _node[1];
							}
						}
						else 
							this._canSort = true;
					}
					if (_collisionCheck(_shelter.x + _shelter.bR[0], _shelter.y + _shelter.bR[1], _shelter.bR[2], _shelter.bR[3], this._outScreenX, this._outScreenY, this._outScreenW, this._outScreenH)) {
						_shelter.outScreen = false;
					}
					else {
						_shelter.outScreen = true;
					}
				}
			}
			//处理前景特效动画
			var _eff, _effSprite;
			for (var i = this._frontEffs.length -1; i >= 0; i--) {
				_eff = this._frontEffs[i];
				_effSprite = _eff.getSprite();
				if (_eff && _effSprite) {
					if (_focusP) { //处理摄像机关联角色时场景内一切物体的偏移路径
						_eff.x += _focusP[0];
						_eff.y += _focusP[1];
					}
					else if (_shakeP) { //处理震屏坐标偏移效果
						_eff.x += _shakeP[0];
						_eff.y += _shakeP[1];
					}
					_eff.action();
					if (_eff._aimObj) {
						_eff.mark(_eff._aimObj.x + _eff._effDx, _eff._aimObj.y + _eff._effDy, _eff._aimObj.mapOffx + _eff._effDx, _eff._aimObj.mapOffy + _eff._effDy);
					}
					if (!_eff.loop && ((_eff.aimX != null && _eff.endPath()) || (_eff.aimX == null && _effSprite.endFrame()))) {
						this._frontEffs.splice(i, 1);
					}
					if (_collisionCheck(_eff.x + _eff.bR[0], _eff.y + _eff.bR[1], _eff.bR[2], _eff.bR[3], this._outScreenX, this._outScreenY, this._outScreenW, this._outScreenH)) {
						_eff.outScreen = false;
					}
					else {
						_eff.outScreen = true;
					}
				}
			}
			//背景特效
			for (var i = this._backEffs.length -1; i >= 0; i--) {
				_eff = this._backEffs[i];
				_effSprite = _eff.getSprite();
				if (_eff && _effSprite) {
					if (_focusP) { //处理摄像机关联角色时场景内一切物体的偏移路径
						_eff.x += _focusP[0];
						_eff.y += _focusP[1];
					}
					else if (_shakeP) { //处理震屏坐标偏移效果
						_eff.x += _shakeP[0];
						_eff.y += _shakeP[1];
					}
					_eff.action();
					if (_eff._aimObj) {
						_eff.mark(_eff._aimObj.x + _eff._effDx, _eff._aimObj.y + _eff._effDy, _eff._aimObj.mapOffx + _eff._effDx, _eff._aimObj.mapOffy + _eff._effDy);
					}
					if (!_eff.loop && _eff.endPath() && _effSprite.endFrame()) {
						this._backEffs.splice(i, 1);
					}
					if (_collisionCheck(_eff.x + _eff.bR[0], _eff.y + _eff.bR[1], _eff.bR[2], _eff.bR[3], this._outScreenX, this._outScreenY, this._outScreenW, this._outScreenH)) {
						_eff.outScreen = false;
					}
					else {
						_eff.outScreen = true;
					}
				}
			}
			//文本特效
			for (var i = this._fontEffs.length - 1; i >= 0; i--) {
				_eff = this._fontEffs[i];
				if (_eff) {
					if (_focusP) { //处理摄像机关联角色时场景内一切物体的偏移路径
						_eff.x += _focusP[0];
						_eff.y += _focusP[1];
					}
					else if (_shakeP) { //处理震屏坐标偏移效果
						_eff.x += _shakeP[0];
						_eff.y += _shakeP[1];
					}
					_eff.nextFrame();
					if (_eff._aimObj) {
						_eff.x = _eff._aimObj.x + _eff._effDx;
						_eff.y = _eff._aimObj.y + _eff._effDy;
					}
					if (!_eff.loop && _eff.endFrame()) {
						this._fontEffs.splice(i, 1);
					}
					if (_collisionCheck(_eff.x, _eff.y, _eff.width, _eff.height, this._outScreenX, this._outScreenY, this._outScreenW, this._outScreenH)) {
						_eff.outScreen = false;
					}
					else {
						_eff.outScreen = true;
					}
				}
			}
			_eff = _effSprite = null;
			//进度条进度
			if (this._loadingBars.length > 0) {
				var _loadingNewDate = Date.now();
				for (var i = this._loadingBars.length - 1, lb; lb = this._loadingBars[i]; i--) {
					if (lb.role && lb.curMs > 0) {
						lb.curMs -= _loadingNewDate - lb.date;
						lb.date = _loadingNewDate;
						if (lb.curMs < 0)
							lb.curMs = 0;
					}
					else {
						if (this._onEvent) { //触发读条结束事件通知
							this._onEvent('loadingBarEnd', lb.roleId, lb.role, this, null, lb.data);
						}
						lb.role = null;
						this._loadingBars.splice(i, 1);
					}
				}
				_loadingNewDate = null;
			}
			//聚光灯效果监听
			if (this._focusLampShelters.length > 0) {
				var _newDate = Date.now();
				if (_newDate - this._focusLampDate >= this._focusLampTimeout) {
					this._focusLampDate = _newDate;
					this.turnOffFocusLamp();
				}
				//排序
				this._focusLampShelters.sort(function(a, b) {
	                return b.y - a.y;
	            });
				_newDate = null;
			}
			//排序
			if (this._canSort) {
				if (this._sortStep == 0) {
					this.sortShelters();
				}
				this._sortStep++;
				this._sortStep %= this._sortStep_;
			}
			_car = _shelter = _focusP = _node = null;
			return this;
		},
		/**
		 * 场景中全部精灵排序
		 */
		sortShelters: function() {
			this._shelters.sort(function(a, b) {
                return b.y - a.y;
            });
			return this;
		},
		/**
		 * 打开聚光灯效果
		 * 可以让id队列对应的角色、建筑、NPC等处于高亮状态，其他人全部暗下去
		 * @param {string|string} shelterType 类型有role、building
		 * @param {string|number} id
		 * @param {number} timeout
		 * @param {string} blockColor
		 */
		turnOnFocusLamp: function(shelterType, id, timeout, blockColor) {
			//过滤
			for (var di = this._focusLampShelters.length - 1, shelter; shelter = this._focusLampShelters[di]; di--) {
				if (shelter.id == id) {
					return this;
				}
			}
			switch (shelterType) {
				case 'role':
				default:
					var _getRole = this.getRole(id);
					if (_getRole) {
						this._focusLampShelters.push(_getRole);
					}
					_getRole = null;
					break;
				case 'building':
					var _getBuilding = this.getBuilding(id);
					if (_getBuilding) {
						this._focusLampShelters.push(_getBuilding);
					}
					_getBuilding = null;
					break;
			}
			this._focusLampTimeout = timeout || 1000; //设置超时时间[单位:毫秒]
			this._focusLampDate = Date.now(); //更新聚光灯超时时间戳
			if (blockColor != null) {
				this._focusLampBlockColor = blockColor;
			}
			return this;
		},
		/**
		 * 关闭聚光灯效果
		 */
		turnOffFocusLamp: function() {
			this._focusLampShelters = [];
			return this;
		},
		/**
		 * 换算A*寻路节点差值下的节点路径列表
		 * @param {number} x0
		 * @param {number} y0
		 * @param {number} x1
		 * @param {number} y1
		 */
		returnRolePathByNode: function(x0, y0, x1, y1, nodeXStep, nodeYStep) {
			var _path = [], _nodeXStep = nodeXStep || this._nodeXStep, _nodeYStep = nodeYStep || this._nodeYStep, 
			_xSteps = this.cutNumToSteps((y1 - y0) * this.ow, _nodeXStep), 
			_ySteps = this.cutNumToSteps((x1 - x0) * this.oh, _nodeYStep), 
			_len = _xSteps.length > _ySteps.length ? _xSteps.length : _ySteps.length, 
			_xs, _ys;
			for (var _i = 0; _i < _len; _i++) {
				_xs = _xSteps[_i] || 0;
				_ys = _ySteps[_i] || 0;
				_path.push([_xs, _ys]);
			}
			_nodeXStep = _nodeYStep = _xSteps = _ySteps = _len = _xs = _ys = null;
			return _path;
		},
		//更新场世界
		update: function(map, aStars) {
			this.updateMap(map, aStars).init();
			return this;
		},
		/**
		 * 更新地图数据
		 * @param {array} map
		 * @param {array} aStars
		 */
		updateMap: function(map, aStars) {
			if (map) {
				if (this.car) {
					//重新校正场景中的精灵对象，以免新的地图生成时绝对坐标和相对坐标不匹配出BUG
					var _shelter, _eff;
					for (var i = this._shelters.length - 1; i >= 0; i--) {
						_shelter = this._shelters[i];
						if (_shelter) {
							_shelter.mark(_shelter.mapOffx, _shelter.mapOffy, _shelter.mapOffx, _shelter.mapOffy);
						}
					}
					//处理前景特效动画
					for (var i = this._frontEffs.length -1; i >= 0; i--) {
						_eff = this._frontEffs[i];
						if (_eff) {
							_eff.mark(_eff.mapOffx, _eff.mapOffy, _eff.mapOffx, _eff.mapOffy);
						}
					}
					//背景特效
					for (var i = this._backEffs.length -1; i >= 0; i--) {
						_eff = this._backEffs[i];
						if (_eff) {
							_eff.mark(_eff.mapOffx, _eff.mapOffy, _eff.mapOffx, _eff.mapOffy);
						}
					}
					//文本特效
					for (var i = this._fontEffs.length - 1; i >= 0; i--) {
						_eff = this._fontEffs[i];
						if (_eff) {
							_eff.x = _eff.mapOffx + _eff._effDx - (_eff.width >> 1);
							_eff.y = _eff.mapOffy + _eff._effDy - _eff.height;
						}
					}
					this.car = _shelter = _eff = null;
				}
				//重新初始化卡马克实体类
				this.car = new carmark(this.width, this.height, this.tw, this.th, this.offsetTileNumber, map, this._tiles);
			}
			if (aStars)
				this._aStars = aStars;
			return this;
		},
		/**
		 * 使摄像机移动
		 * @param {number} offX
		 * @param {number} offY
		 * @param {number} scrollW
		 * @param {number} scrollH
		 */
		makeCameraMove: function(offX, offY, scrollW, scrollH) {
//			if (this._focusPath.length > 0)
//				return this;
			this._focusPath.length = 0;
			var _offX = offX || 0, _offY = offY || 0, _car = this.car, _mapOffX = _car.getMapOffX(), _mapOffY = _car.getMapOffY();
			//校正边界偏移路径
			if (_offX < 0) {
				_offX = _car.mapW - _car.scrWidth - _mapOffX < Math.abs(_offX) ? -(_car.mapW - _car.scrWidth - _mapOffX) : _offX;
			}
			else if (_offX > 0) {
				_offX = _mapOffX < _offX ? _mapOffX : _offX;
			}
			if (_offY < 0) {
				_offY = _car.mapH - _car.scrHeight - _mapOffY < Math.abs(_offY) ? -(_car.mapH - _car.scrHeight - _mapOffY) : _offY;
			}
			else if (_offY > 0) {
				_offY = _mapOffY < _offY ? _mapOffY : _offY;
			}
			var _offXStep = this.cutNumToSteps(_offX, scrollW || this.sw),
			_offYStep = this.cutNumToSteps(_offY, scrollH || this.sh), 
			_len = _offXStep.length > _offYStep.length ? _offXStep.length : _offYStep.length, xs = 0, ys = 0;
			for (var _i = 0; _i < _len; _i++) {
				xs = _offXStep[_i] || 0;
				ys = _offYStep[_i] || 0;
				if (xs != 0 || ys != 0) {
					this._focusPath.push([xs, ys]); //添加遮挡物整体偏移坐标
				}
			}
			_offX = _offY = _car = _mapOffX = _mapOffY = _offXStep = _offYStep = _len = xs = ys = null;
			return this;
		},
		/**
		 * 更改卷屏速度
		 * @param {number} sw
		 * @param {number} sh
		 */
		setCameraSpeed: function(sw, sh) {
			this.sw = sw || this.tw;
			this.sh = sh || this.th;
			return this;
		},
		/**
		 * carmark地图卷动
		 * 单次卷动的范围不能超出一个地砖块
		 * @param {number} vx
		 * @param {number} vy
		 */
		carScroll: function(vx, vy) {
			this.car.scroll(vx, vy);
			return this;
		},
		/**
		 * 使场景内角色移动
		 * @param {string} id
		 * @param {array} path
		 */
		makeRoleMove: function(id, path) {
			var _getRole = this.getRole(id);
			if (_getRole) {
				_getRole.setPath(path);
			}
			_getRole = null;
			return this;
		},
		/**
		 * 使角色在两点间飞行
		 * @param {string} id
		 * @param {number} fromX
		 * @param {number} fromY
		 * @param {number} toX
		 * @param {number} toY
		 * @param {string} timing
		 * @param {number} speed
		 * @param {number} during
		 */
		makeRoleFly: function(id, fromX, fromY, toX, toY, timing, speed, during, _skipMoveDs) {
			var _getRole = this.getRole(id);
			if (_getRole) {
				var _fromX = fromX || _getRole.mapOffx, _fromY = fromY || _getRole.mapOffy, 
				_path = [], _car = this.car;
				_path = this.getFly(_fromX, _fromY, toX, toY, timing, speed, during);
				_getRole.mark(_fromX - _car.getMapOffX(), _fromY - _car.getMapOffY(), _fromX, _fromY).setPath(_path, _skipMoveDs);
				_fromX = _fromY = _path = _car = null;
			}
			_getRole = null;
			return this;
		},
		/**
		 * 换算直线飞行路径
		 * @param {number} fromX
		 * @param {number} fromY
		 * @param {number} toX
		 * @param {number} toY
		 * @param {string} timing
		 * @param {number} speed
		 * @param {number} during
		 */
		getFly: function(fromX, fromY, toX, toY, timing, speed, during) {
			var _fromX = fromX, _fromY = fromY, 
			_toX = toX || 0, _toY = toY || 0, 
			_width = _toX - _fromX, _height = _toY - _fromY, _line = Math.sqrt((_width * _width) + (_height * _height)),
			_speed = speed || 100, _timing = timing || 'linear', _during = during || 10, stepX, _stepY, 
			_kx = _width / _line, _ky = _height / _line, //斜率
			_path = [], _car = this.car, _easePath, _outPath;
			_stepX = _width;
			_stepY = _height;
			while(_line > _speed) {
				_line -= _speed;
				_width = (_line * _kx);
				_stepX -= _width;
				_height = (_line * _ky);
				_stepY -= _height;
				_path.push([_stepX, _stepY]);
				_stepX = _width;
				_stepY = _height;
			}
			//微调路径
			if (_line > 0) {
				_width = (_line * _kx);
				_stepX = _width;
				_height = (_line * _ky);
				_stepY = _height;
				_path.push([_stepX, _stepY]);
			}
			switch (_timing) {
				case 'linear': //匀速运动
				default:
					break;
				case 'ease-in': //加速运动
					if (_path.length > 0) {
						_outPath = _path.shift();
						_easePath = this.getEasePath(_outPath[0], _outPath[1], _during);
						while (_easePath.length > 0) {
							_path.unshift(_easePath.pop());
						}
					}
					break;
				case 'ease-out': //减速运动
					if (_path.length > 0) {
						_outPath = _path.pop();
						_easePath = this.getEasePath(_outPath[0], _outPath[1], _during);
						while (_easePath.length > 0) {
							_path.push(_easePath.shift());
						}
					}
					break;
				case 'ease': //先加速再减速
					if (_path.length > 1) {
						_outPath = _path.shift();
						_easePath = this.getEasePath(_outPath[0], _outPath[1], _during);
						while (_easePath.length > 0) {
							_path.unshift(_easePath.pop());
						}
						_outPath = _path.pop();
						_easePath = this.getEasePath(_outPath[0], _outPath[1], _during);
						while (_easePath.length > 0) {
							_path.push(_easePath.shift());
						}
					}
					break;
			}
			_fromX = _fromY = _toX = _toY = _width = _height = _line = _speed = _timing = _during = _stepX = _stepY = _kx = _ky = _car = _easePath = _outPath = null;
			return _path;
		},
		/**
		 * 换算变速路径
		 * @param {number} stepX
		 * @param {number} stepY
		 * @param {number} during
		 */
		getEasePath: function(stepX, stepY, during) {
			var _path = [], _during = during || 10, _curX = stepX, _curY = stepY;
			while(_during-- > 0) {
				_curX /= 2;
				_curY /= 2;
				_path.push([_curX, _curY]);
			}
			_path.push([_curX, _curY]);
			_during = _curX = _curY = null;
			return _path;
		},
		/**
		 * 计算A*节点路径，然后利用缓冲算法算最终路径
		 * @param {string} id
		 * @param {number} x0
		 * @param {number} y0
		 * @param {number} x1
		 * @param {number} y1
		 * @param {number} cutNum
		 * @param {number} sx
		 * @param {number} sy
		 * @param {number} ex
		 * @param {number} ey
		 */
		createAstarNodes: function(id, x0, y0, x1, y1, cutNum, sx, sy, ex, ey) {
			var _role = this.getRole(id);
			if (_role) {
				this.setRole(id, x0, y0);
				_role._cutNum = cutNum || 0; //设置计算结果截取数
				var _checkIJ = this.checkIJ(x1, y1);
				x1 = _checkIJ ? _checkIJ[0]: 0;
				y1 = _checkIJ ? _checkIJ[1]: 0;
				_checkIJ = null;
				var _that = this;
				astar.callPath({
					id: id,
					map: this._aStars,
					x0: _role.x0, y0: _role.y0, x1: x1, y1: y1,
					sx: sx, sy: sy, ex: ex, ey: ey,
					asyncUrl: this._asyncUrl,
					async: true,
					callBack: function(data) {
						var _getRole = _that.getRole(data.id), _path = data.path;
						if (_getRole) {
							if (_path.length > 0)
								_path.shift(); //将起始点坐标干掉，这样在中途变向的时候动作才自然
							if (_path.length > _getRole._cutNum) {
								if (_getRole._cutNum > 0) //从后往前截_cutNum个路径节点
									_path.splice(_path.length - _getRole._cutNum, _getRole._cutNum);
								_getRole.nodes = _path;
								
								if (_that._superStar && _getRole.id == _that._superStar.id && _path.length > 0) {
									var _endPath = _path[_path.length - 1] || [];
									if (_that._onEvent) {
										_that._onEvent('getPath', _getRole.id, _getRole, _that, null, { x0: _getRole.x0, y0: _getRole.y0, x1: _endPath[0], y1: _endPath[1] });
									}
									_endPath = null;
								}
							}
							if (_that._superStar && _that._endEventObj && _getRole.id == _that._superStar.id) {
								//主句寻路算法结束后再真正添加移动停止事件
								_that._endEvents.push(_that._endEventObj);
								_that._endEventObj = null;
							}
						}					
						_getRole = _path = null;
					}
				});
			}
			_role = null;
			return this;
		},
		/**
		 * 获取主角可视界面寻路范围
		 */
		getPathRange: function() {
			var _range = [0, 0, 0, 0], _car = this.car, 
			_startX0 = parseInt(_car.getMapOffY() / this.oh), //可视界面左上角最边界的起始地砖索引
			_startY0 = parseInt(_car.getMapOffX() / this.ow);
			_range[0] = _startX0;
			_range[1] = _startY0;
			_range[2] = _startX0 + this._ohNum - 1; //可视界面右下角最边界目标地砖索引
			_range[3] = _startY0 + this._owNum - 1;
			_car = _startX0 = _startY0 = null;
			return _range;
		},
		/**
		 * 校正寻路二维索引
		 * @param {number} x0
		 * @param {number} y0
		 */
		checkIJ: function(x0, y0) {
			if (x0 == null || y0 == null)
				return null;
			if (x0 < 0)
				x0 = 0;
			else if (x0 >= this._aStars.length) 
				x0 = this._aStars.length - 1;
			if (y0 < 0)
				y0 = 0;
			else if (y0 >= this._aStars[0].length) 
				y0 = this._aStars[0].length - 1;
			return [x0, y0];
		},
		/**
		 * 根据二维索引获取碰撞层地砖块值
		 * @param {number} x0
		 * @param {number} y0
		 */
		getO: function(x0, y0) {
			return this._aStars[x0][y0];
		},
		/**
		 * 修改寻路路径坑号值
		 * @param {number} x0
		 * @param {number} y0
		 * @param {number} value
		 */
		setO: function(x0, y0, value) {
			if (this._aStars[x0] && this._aStars[x0][y0] != null) {
				this._aStars[x0][y0] = value || 0;
			}
			return this;
		},
		/**
		 * 将相对屏幕左上角的XY坐标换算成A*寻路数组目的地索引，使角色移动
		 * @param {string} id
		 * @param {number} offX
		 * @param {number} offY
		 * @param {number} sx
		 * @param {number} sy
		 * @param {number} ex
		 * @param {number} ey
		 */
		aim: function(id, offX, offY, sx, sy, ex, ey) {
			var _getRole = this.getRole(id) || this._superStar || null;
			if (!_getRole)
				return this;
			return this.createAstarNodes(_getRole.id, null, null, this.yToI(offY), this.xToJ(offX), 0, sx, sy, ex, ey);
		},
		/**
		 * 检测是否点中场景中的角色、NPC
		 * @param {number} offX
		 * @param {number} offY
		 */
		selectRole: function(offX, offY) {
			if (!this._superStar)
				return false;
			var _result = null, _shelter;
			//优先点击NPC
			for (var i = 0, len = this._shelters.length; i < len; i++) {
				_shelter = this._shelters[i];
				if (_shelter.outScreen || _shelter.type != 'npc' || _shelter.id == this.roleId) {
					continue;
				}
				if (_collisionCheck(offX, offY, 1, 1, _shelter.x + _shelter.bR[0], _shelter.y + _shelter.bR[1], _shelter.bR[2], _shelter.bR[3])) {
					if (this._onEvent)
						this._onEvent('selectedRole', _shelter.id, this._superStar, this, _shelter);
					_result = _shelter;
					break;
				}
			}
			if (!_result) {
				//再处理玩家角色
				for (var i = 0, len = this._shelters.length; i < len; i++) {
					_shelter = this._shelters[i];
					if (_shelter.outScreen || _shelter.type != 'role' || _shelter.id == this.roleId) {
						continue;
					}
					if (!_shelter.canNotClick && _collisionCheck(offX, offY, 1, 1, _shelter.x + _shelter.bR[0], _shelter.y + _shelter.bR[1], _shelter.bR[2], _shelter.bR[3])) {
						if (this._onEvent)
							this._onEvent('selectedRole', _shelter.id, this._superStar, this, _shelter);
						_result = _shelter;
						break;
					}
				}
			}
			_shelter = null;
			return _result;
		},
		/**
		 * 检测是否点中场景中的特效
		 * @param {number} offX
		 * @param {number} offY
		 * @param {string} type
		 */
		selectEffect: function(offX, offY, type) {
			if (!this._superStar)
				return false;
			var _result = null, _type = type || 'front', _effs;
			if (_type == 'front') {
				_effs = this._frontEffs;
			}
			else if (_type == 'back') {
				_effs = this._backEffs;
			}
			//检测点击的特效
			for (var i = 0, eff; eff = _effs[i]; i++) {
				if (eff.outScreen) {
					continue;
				}
				if (_collisionCheck(offX, offY, 1, 1, eff.x + eff.bR[0], eff.y + eff.bR[1], eff.bR[2], eff.bR[3])) {
					if (this._onEvent)
						this._onEvent('selectedEffect', eff.id, this._superStar, this, eff);
					_result = eff;
					break;
				}
			}
			return _result;
		},
		/**
		 * 换算索引坐标为绝对坐标
		 * @param {object} shelter
		 * @param {number} x0
		 * @param {number} y0
		 */
		setShelter: function(shelter, x0, y0) {
			if (!shelter)
				return this;
			var _checkIJ = this.checkIJ(x0, y0);
			x0 = _checkIJ ? _checkIJ[0]: 0;
			y0 = _checkIJ ? _checkIJ[1]: 0;
			_checkIJ = null;
			shelter.x0 = x0; //A*据点索引
			shelter.y0 = y0;
			//通过据点索引换算最终坐标
			shelter.mark(this.jToX(shelter.y0), this.iToY(shelter.x0), shelter.y0 * this.ow + (this.ow >> 1), shelter.x0 * this.oh + (this.oh >> 1));
			return false;
		},
		/**
		 * 从循环迭代列表移除一个对象
		 * @param {string} id
		 * @param {string} type
		 */
		removeShelter: function(id, type) {
			var _shelter;
			for (var i = this._shelters.length - 1; i >= 0; i--) {
				_shelter = this._shelters[i];
				if (type && type != _shelter.type)
					continue;
				if (_shelter.id == id) {
					this._shelters.splice(i, 1);
					break;
				}
			}
			_shelter = null;
			return this;
		},
		/**
		 * 根据id获取一个建筑物对象
		 * @param {string} id
		 */
		getBuilding: function(id) {
			if (this._buildingObjs['_' + id]) {
				return this._buildingObjs['_' + id];
			}
			return null;
		},
		/**
		 * 添加一个建筑物到场景
		 * @param {string} id
		 * @param {object} building
		 * @param {number} x0
		 * @param {number} y0
		 */
		addBuilding: function(id, building, x0, y0, cr, step) {
			if (id && building && !this.getBuilding(id)) {
				building.id = id;
				building.type = 'building';
				this._buildingObjs['_' + id] = building;
				this._shelters.push(this._buildingObjs['_' + id]); //添加到循环迭代列表
				this.setBuilding(id, x0, y0, cr, step);
			}
			return this;
		},
		/**
		 * 设置建筑物状态
		 * @param {string} id
		 * @param {number} x0
		 * @param {number} y0
		 */
		setBuilding: function(id, x0, y0, cr, step) {
			var _building = this.getBuilding(id);
			if (_building) {
				this.setShelter(_building, x0, y0);
				if (cr != null)
					_building.setSprite(cr);
				if (step != null)
					_building.setStep(step);
			}
			_building = null;
			return this;
		},
		/**
		 * 移除建筑物
		 * @param {string} id
		 */
		removeBuilding: function(id) {
			var _getBuilding = this.getBuilding(id);
			if (_getBuilding) {
				this.removeShelter(id, _getBuilding.type); //从综合列表里移除一个对象
				this._buildingObjs['_' + id] = null; //移除建筑物指针映射
				delete(this._buildingObjs['_' + id]);
			}
			_getBuilding = null;
			return this;
		},
		/**
		 * 根据id获取一个角色对象
		 * @param {string} id
		 */
		getRole: function(id) {
			if (this._roleObjs['_' + id]) {
				return this._roleObjs['_' + id];
			}
			return null;
		},
		/**
		 * 添加一个角色对象
		 * @param {string} id
		 * @param {object} role
		 * @param {array} words
		 * @param {number} x0
		 * @param {number} y0
		 * @param {number} cr
		 * @param {number} step
		 * @param {string} type
		 * @param {Function} onstart
		 * @param {Function} onend
		 * @param {number} x
		 * @param {number} y
		 * @param {number} curHP
		 * @param {number} HP
		 * @param {number} curPower
		 * @param {number} power
		 */
		addRole: function(id, role, words, x0, y0, cr, step, type, onstart, onend, x, y, curHP, HP, curPower, power) {
			if (id && role && !this.getRole(id)) {
				role.id = id;
				role.type = type || 'role'; //role、 npc
				role.words = [];
				role.curHP = 0;
				role.HP = 0;
				role.curPower = 0;
				role.power = 0;
				role.width = role.bR[2];
				role.height = role.bR[3];
				role.setMoveDs(this._moveDs);
				role.setStopDs(this._stopDs);
				role.setSpeed(this._nodeXStep, this._nodeYStep);
				role.hided = false; //显示隐藏状态
				this._roleObjs['_' + id] = role; //映射到角色指针映射集合
				this._shelters.push(this._roleObjs['_' + id]); //添加到循环迭代列表
				this.setRole(id, x0, y0, [], cr, step, onstart, onend, x, y);
				this.setRoleWords(role.id, words, curHP, HP, curPower, power); //添加文本描述信息
			}
			return this;
		},
		/**
		 * 移除一个角色对象
		 * @param {string} id
		 */
		removeRole: function(id) {
			var _getRole = this.getRole(id);
			if (_getRole) {
				this.removeRoleWords(_getRole.id); //移除文本描述信息
				this.removeEventById(_getRole.id); //移除角色对象上绑定的事件
				this.removeShelter(id, _getRole.type); //从综合列表里移除一个对象
				this.removeRoleBubble(_getRole.id); //移除说话气泡
				this.removeRoleLinks(_getRole.id); //移除主角关联对象
				//移除掉角色身上绑的特效队列
				if (_getRole.effects) {
					var roleFff;
					for (var ei = 0; ei < _getRole.effects.length; ei++) {
						roleFff = _getRole.effects[ei];
						if (roleFff) {
							this.removeEffect(roleFff[0], roleFff[1]);
						}
					}
					roleFff = null;
				}
				this._roleObjs['_' + id] = null; //移除角色指针映射
				delete(this._roleObjs['_' + id]);
			}
			_getRole = null;
			return this;
		},
		/**
		 * 移除特定类型的角色[NPC和玩家角色]
		 * @param {string} type
		 */
		clearRoles: function(type) {
			var _shelter;
			if (!type || type == 'role') {
				this.unFocusRole();
			}
			for (var i = this._shelters.length - 1; i >= 0; i--) {
				_shelter = this._shelters[i];
				if (type) {
					if (type == _shelter.type) {
						this.removeRole(_shelter.id);
					}
				}
				else {
					this.removeRole(_shelter.id);
				}
			}
			_shelter = null;
			return this;
		},
		/**
		 * 隐藏除了主角之外的其他角色[NPC和玩家角色]
		 * @param {string} type
		 */
		hideRoles: function(type) {
			var _shelter, _superStarId = this._superStar ? this._superStar.id : '-1';
			for (var i = this._shelters.length - 1; i >= 0; i--) {
				_shelter = this._shelters[i];
				if (_shelter.id == _superStarId || _shelter.canNotHide) {
					continue;
				}
				if (type) {
					if (type == _shelter.type) {
						_shelter.hided = true;
					}
				}
				else {
					_shelter.hided = true;
				}
			}
			_shelter = _superStarId = null;
			return this;
		},
		/**
		 * 显示除了主角之外的其他角色[NPC和玩家角色]
		 * @param {string} type
		 */
		showRoles: function(type) {
			var _shelter, _superStarId = this._superStar ? this._superStar.id : '-1';
			for (var i = this._shelters.length - 1; i >= 0; i--) {
				_shelter = this._shelters[i];
				if (type) {
					if (type == _shelter.type) {
						_shelter.hided = false;
					}
				}
				else {
					_shelter.hided = false;
				}
			}
			_shelter = _superStarId = null;
			return this;
		},
		/**
		 * 设置角色的渲染偏移坐标
		 * @param {string} id
		 * @param {number} dx
		 * @param {number} dy
		 */
		setRoleDxDy: function(id, dx, dy) {
			var _getRole = this.getRole(id);
			if (_getRole) {
				_getRole.dx = dx || 0;
				_getRole.dy = dy || 0;
			}
			_getRole = null;
			return this;
		},
		/**
		 * 设置角色的关联对象[骑宠]
		 * @param {string} id
		 * @param {array} links
		 * @param {array} moveDs
		 * @param {number} dx
		 * @param {number} dy
		 */
		addRoleLinks: function(id, links, moveDs, dx, dy) {
			var _getRole = this.getRole(id);
			if (_getRole) {
				this.removeRoleLinks(id); //添加前先移除就的关联对象
				_getRole.addLinks(links);
				//设置角色的方向动作集合
				if (moveDs != null) {
					_getRole.setMoveDs(moveDs);
				}
				//设置主角偏移坐标
				if (dx != null && dy != null) {
					this.setRoleDxDy(id, dx, dy);
				}
			}
			_getRole = null;
			return this;
		},
		/**
		 * 移除角色的关联对象
		 * @param {string} id
		 * @param {array} moveDs
		 */
		removeRoleLinks: function(id, moveDs) {
			var _getRole = this.getRole(id);
			if (_getRole) {
				_getRole.clearLinks()
				//设置角色的方向动作集合
				.setMoveDs(moveDs || this._moveDs);
				//设置主角偏移坐标
				this.setRoleDxDy(id, 0, 0);
			}
			_getRole = null;
			return this;
		},
		/**
		 * 设置角色状态
		 * @param {string} id
		 * @param {number} x
		 * @param {number} y
		 * @param {number} cr
		 * @param {number} step
		 */
		setRole: function(id, x0, y0, nodes, cr, step, onstart, onend, x, y) {
			var _getRole = this.getRole(id);
			if (_getRole) {
				if (this._aStars[0] && x0 != null && y0 != null) {
					this.setShelter(_getRole, x0, y0);
				}
				else if (x != null && y != null) {
					this.beatRole(id, x, y);
				}
				if (cr != null) {
					//为了解决连续死两次的BUG，暂时做简单处理，不能连续设置相同的动作
					_getRole.setSprite(cr);
				}
				if (step != null)
					_getRole.setStep(step);
				if (nodes)
					_getRole.nodes = nodes;
				if (onstart) {
					if (_getRole.onstart)
						_getRole.onstart = null;
					_getRole.onstart = onstart; //绑定开始回调函数
				}
				if (onend) {
					if (_getRole.onend)
						_getRole.onend = null;
					_getRole.onend = onend; //绑定停止回调函数
				}
			}
			_getRole = null;
			return this;
		},
		/**
		 * 将角色定位在世界中的某个绝对坐标
		 * @param {string} id
		 * @param {number} x
		 * @param {number} y
		 */
		beatRole: function(id, x, y) {
			var _getRole = this.getRole(id);
			if (_getRole) {
				var _car = this.car;
				_getRole.mark(x - _car.getMapOffX(), y - _car.getMapOffY(), x, y);
				_car = null;
			}
			_getRole = null;
			return this;
		},
		/**
		 * 设置角色属性
		 * @param {string} id
		 * @param {string} key
		 * @param {string} value
		 */
		setRoleState: function(id, key, value) {
			var _getRole = this.getRole(id);
			if (_getRole) {
				_getRole[key] = value;
			}
			_getRole = null;
			return this;
		},
		/**
		 * 设置角色的速度
		 * @param {string} id
		 * @param {number} nodeXStep
		 * @param {number} nodeYStep
		 */
		setRoleSpeed: function(id, nodeXStep, nodeYStep) {
			var _getRole = this.getRole(id);
			if (_getRole) {
				_getRole.setSpeed(nodeXStep || this._nodeXStep, nodeYStep || this._nodeYStep);
			}
			_getRole = null;
			return this;
		},
		/**
		 * 设置角色文本描述
		 * @param {string} id
		 * @param {array} words
		 * @param {number} curHP
		 * @param {number} HP
		 * @param {number} curPower
		 * @param {number} power
		 */
		setRoleWords: function(id, words, curHP, HP, curPower, power) {
			var _getRole = this.getRole(id);
			if (_getRole && (_getRole.type == 'role' || _getRole.type == 'npc')) {
				if (words)
					_getRole.words = words;
				if (curHP != null)
					_getRole.curHP = curHP;
				if (HP != null)
					_getRole.HP = HP;
				if (curPower != null)
					_getRole.curPower = curPower;
				if (power != null)
					_getRole.power = power;
				if (!_getRole._passId && this._wordsPassIds.length > 0) {
					//描述内容渲染缓冲区出栈
					_getRole._passId = this._wordsPassIds.pop();
					//换算渲染缓冲区时的偏移坐标
					_getRole._wordsDx = -((_getRole.width * _getRole.zoom) >> 1) + (((_getRole.width * _getRole.zoom) - this._wordsW) >> 1);
					_getRole._wordsDy = -((_getRole.height * _getRole.zoom) + this._wordsH - 20);
					//添加文本描述渲染队列
					this._wordsList.push(_getRole);
				}
				if (_getRole._passId) {
					if (_getRole.words) {
						//初始化渲染缓冲区
						this.initWordsCache(_getRole, this._wordsW, this._wordsH);
					}
					if (_getRole.curHP || _getRole.HP) {
						//初始化生命条渲染缓冲区
						this.initHPCache(_getRole, this._wordsW, this._wordsH);
					}
				}
			}
			_getRole = null;
			return this;
		},
		//设置角色的缩放比例
		setRoleZoom: function(id, zoom, wordsDx, wordsDy) {
			var _getRole = this.getRole(id), _wordsDx = wordsDx || 0, _wordsDy = wordsDy || 0;
			if (_getRole) {
				_getRole.setZoom(zoom);
				//换算渲染缓冲区时的偏移坐标
				_getRole._wordsDx = -((_getRole.width * _getRole.zoom) >> 1) + (((_getRole.width * _getRole.zoom) - this._wordsW) >> 1) + _wordsDx;
				_getRole._wordsDy = -((_getRole.height * _getRole.zoom) + this._wordsH - 20) + _wordsDy;
				this.setRoleWords(id);
			}
			_getRole = _wordsDx = _wordsDy = null;
			return this;
		},
		/**
		 * 移除角色文本描述
		 * @param {string} id
		 */
		removeRoleWords: function(id) {
			var _wordsObj;
			for (var i = this._wordsList.length - 1; i >= 0; i--) {
				_wordsObj = this._wordsList[i];
				if (_wordsObj && _wordsObj.id == id && _wordsObj._passId) {
					_wordsObj.words = [];
					//描述内容渲染缓冲区入栈
					this._wordsPassIds.push(_wordsObj._passId);
					_wordsObj._passId = null;
					//将文本描述从渲染队列中移除
					this._wordsList.splice(i, 1);
					break;
				}
			}
			_wordsObj = null;
			return this;
		},
		/**
		 * 设置角色说话气泡
		 * @param {string} id
		 * @param {array} bubble
		 * @param {number} delayMs
		 * @param {number} direction
		 * @param {number} radius
		 * @param {string} color
		 * @param {string} stroke
		 * @param {string} bgColor
		 * @param {string} borderColor
		 * @param {number} dx
		 * @param {number} dy
		 */
		addRoleBubble: function(id, bubble, delayMs, direction, radius, color, stroke, bgColor, borderColor, dx, dy) {
			if (!bubble || !bubble.length) {
				return this;
			}
			var _getRole = this.getRole(id);
			if (_getRole && (_getRole.type == 'role' || _getRole.type == 'npc')) {
				this.removeRoleBubble(_getRole.id); //移除自身的上一条气泡
				if (this._bubblePassIds.length == 0) { //如果气泡队列为满载
					this.removeRoleBubbleByIndex(0); //强行把第一个说话气泡回收
				}
				if (this._bubblePassIds.length > 0) {
					//说话气泡渲染缓冲区出栈
					var _bubblePassId = this._bubblePassIds.pop(), 
					//设置基准字体
					_bubbleFirst = bubble[0], 
					_bMT = $.canvas.font(this._bubbleFont).measureText(_bubbleFirst), 
					_dx = dx || 0, _dy = dy || 0, _rowH = _bMT.height * bubble.length + 5, _lineWidth = 2, _padding = 10, 
					_pointerW = 20, _pronterH = 20, //标识箭头矩形尺寸
					_bw = _bMT.width > this._bubbleW - _padding * 2 - _pointerW ? this._bubbleW - _padding * 2 - _pointerW : _bMT.width, 
					_bh = _rowH > this._bubbleH - _padding * 2 ? this._bubbleH - _padding * 2 : _rowH, _sx, _fillLineHeight, _radius = radius || 5;
					_bw += 2 * _padding;
					_bh += 2 * _padding;
					//计算填充线高度
					_fillLineHeight = (_bh - _radius * 2 ) > _pronterH ? _pronterH : _bh - _radius * 2;
					//根据方向换算渲染缓冲区时的偏移坐标[0为角色左上角、1为角色右上角]
					if (direction == 1) { //右上角
						_dx += (_getRole.width >> 1);
						_dy += -_getRole.height;
						_sx = _pointerW;
					}
					else { //左上角
						_dx += -(_getRole.width >> 1) - _bw - _pointerW;
						_dy += -_getRole.height;
						_sx = 0;
					}
					//添加说话气泡渲染队列
					this._bubblesList.push({ id: _getRole.id, role: _getRole, passId: _bubblePassId, delayMs: delayMs, data: Date.now(), dx: _dx, dy: _dy, width: _bw, height: _bh });
					//初始化缓冲区
					var _color = color || '#000', _stroke = stroke || '', 
					_bgColor = bgColor || '#FFF', _borderColor = borderColor || '#000';
					$.canvas.pass(_bubblePassId).clearScreen()
					.beginPath()
					.moveTo(_sx + _lineWidth + _radius, _lineWidth)
					.lineTo(_sx + _bw - _radius - _lineWidth, _lineWidth)
					.quadraticCurveTo(_sx + _bw - _lineWidth, _lineWidth, _sx + _bw - _lineWidth, _lineWidth + _radius)
					.lineTo(_sx + _bw - _lineWidth, _bh - _radius - _lineWidth)
					.quadraticCurveTo(_sx + _bw - _lineWidth, _bh - _lineWidth, _sx + _bw - _radius - _lineWidth, _bh - _lineWidth)
					.lineTo(_sx + _lineWidth + _radius, _bh - _lineWidth)
					.quadraticCurveTo(_sx + _lineWidth, _bh - _lineWidth, _sx + _lineWidth, _bh - _radius - _lineWidth)
					.lineTo(_sx + _lineWidth, _lineWidth + _radius)
					.quadraticCurveTo(_sx + _lineWidth, _lineWidth, _sx + _lineWidth + _radius, _lineWidth)
					.closePath()
					.lineWidth(_lineWidth)
					.strokeStyle(_borderColor)
					.stroke()
					.fillStyle(_bgColor)
					.fill();
					//处理标识箭头
					var _p1, _p2, _p3, _p4, _p5;
					if (direction == 1) { //右上角气泡的标识箭头是位于气泡左侧
						_p1 = { x: _pointerW + _lineWidth - 1, y: _bh - _radius - (_fillLineHeight >> 1) };
						_p2 = { x: _pointerW + _lineWidth - 1, y: _bh - _radius - _fillLineHeight };
						_p3 = { x: 0, y: _bh - _radius - parseInt(_fillLineHeight / 3) };
						_p4 = { x: _pointerW + _lineWidth, y: _bh - _radius - (_fillLineHeight >> 1) };
						_p5 = { x: _pointerW + _lineWidth, y: _bh - _radius - _fillLineHeight };
					}
					else { //左上角气泡的标识箭头是位于气泡右侧
						_p1 = { x: _bw - _lineWidth + 1, y: _bh - _radius - (_fillLineHeight >> 1) };
						_p2 = { x: _bw - _lineWidth + 1, y: _bh - _radius - _fillLineHeight };
						_p3 = { x: _bw - _lineWidth + _pointerW, y: _bh - _radius - parseInt(_fillLineHeight / 3) };
						_p4 = { x: _bw - _lineWidth, y: _bh - _radius - (_fillLineHeight >> 1) };
						_p5 = { x: _bw - _lineWidth, y: _bh - _radius - _fillLineHeight };
					}
					$.canvas.beginPath()
					.moveTo(_p1.x, _p1.y)
					.lineTo(_p2.x, _p2.y)
					.lineTo(_p3.x, _p3.y)
					.lineTo(_p1.x, _p1.y)
					.closePath()
					.strokeStyle(_borderColor)
					.stroke()
					.fillStyle(_bgColor)
					.fill()
					.strokeStyle(_bgColor)
					.drawLine(_p4.x, _p4.y, _p5.x, _p5.y);
					_p1 = _p2 = _p3 = _p4 = _p5 = null;
					//处理文字
					for (var fi = 0, ft; ft = bubble[fi]; fi++) {
						var _descX = _sx + _padding, _descY = _padding + (fi + 1) * _bMT.height + fi * 2;
						if (_stroke != '') {
							$.canvas.fillStyle(_stroke).fillText(ft, _descX - 1, _descY - 1)
							.fillText(ft, _descX + 1, _descY - 1)
							.fillText(ft, _descX - 1, _descY + 1)
							.fillText(ft, _descX + 1, _descY + 1);
						}
						$.canvas.fillStyle(_color).fillText(ft, _descX, _descY);
						_descX = _descY = null;
					}
					$.canvas.pass();
					_bubblePassId = _bubbleFirst = _bMT = _dx = _dy = _rowH = _lineWidth = _padding = _pointerW = _pointerH = _bw = _bh = _sx = _fillLineHeight = 
					_radius = _color = _stroke = _bgColor = _borderColor = null;
				}
			}
			_getRole = null;
			return this;
		},
		/**
		 * 移除玩家说话气泡
		 * @param {string} id
		 */
		removeRoleBubble: function(id) {
			var bb;
			for (var i = this._bubblesList.length - 1; i >= 0; i--) {
				bb = this._bubblesList[i];
				if (bb && bb.id == id) {
					//缓冲区id重新入栈
					this._bubblePassIds.push(bb.passId);
					//从说话气泡总队列里移除
					this._bubblesList.splice(i, 1);
					break;
				}
			}
			bb = null;
			return this;
		},
		/**
		 * 移除第N个说话气泡
		 * @param {number} index
		 */
		removeRoleBubbleByIndex: function(index) {
			var bb;
			for (var i = this._bubblesList.length - 1; i >= 0; i--) {
				bb = this._bubblesList[i];
				if (bb && i == index) {
					//缓冲区id重新入栈
					this._bubblePassIds.push(bb.passId);
					//从说话气泡总队列里移除
					this._bubblesList.splice(i, 1);
					break;
				}
			}
			bb = null;
			return this;
		},
		/**
		 * 清空说话气泡
		 */
		clearRoleBubble: function() {
			var bb;
			for (var i = this._bubblesList.length - 1; i >= 0; i--) {
				bb = this._bubblesList[i];
				if (!bb) {
					continue;
				}
				//缓冲区id重新入栈
				this._bubblePassIds.push(bb.passId);
				//从说话气泡总队列里移除
				this._bubblesList.splice(i, 1);
			}
			bb = null;
			return this;
		},
		/**
		 * 初始化文本描述缓冲区[可重写]
		 * @param {object} role
		 * @param {number} width
		 * @param {number} height
		 */
		initWordsCache: function(role, width, height) {
			if (role && role.words) {
				role._wordsDx = -(role.width >> 1) + ((role.width - width) >> 1);
				role._wordsDy = -(role.height + height + 5);
				//处理渲染缓冲区
//				$.canvas.pass(role._passId).clearScreen()
//				.font('12px Arial')
//				.drawString(role.words[1] || '', 0, 14, $.graphics.VCENTER, true, '#FF0', '#000')
//				.font('14px Arial')
//				.drawString(role.words[0] || '', 0, 30, $.graphics.VCENTER, true, role.words[2] || '#FFF', '#000')
//				.pass();
				$.canvas.pass(role._passId).clearScreen().font('12px Arial');
				var _desc = role.words[1], _descW = $.canvas.measureText(_desc), _descX = (width - _descW.width) >> 1, _descY = 20;
				$.canvas.fillStyle('#000').fillText(_desc, _descX - 1, _descY - 1)
				.fillText(_desc, _descX + 1, _descY - 1)
				.fillText(_desc, _descX - 1, _descY + 1)
				.fillText(_desc, _descX + 1, _descY + 1)
				.fillStyle('#FF0').fillText(_desc, _descX, _descY);
				_desc = _descW = _descX = _descY = null;
				$.canvas.font('14px Arial');
				var _name = role.words[0], _nameW = $.canvas.measureText(_name), _nameX = (width - _nameW.width) >> 1, _nameY = 38;
				$.canvas.fillStyle('#000').fillText(_name, _nameX - 1, _nameY - 1)
				.fillText(_name, _nameX + 1, _nameY - 1)
				.fillText(_name, _nameX - 1, _nameY + 1)
				.fillText(_name, _nameX + 1, _nameY + 1)
				.fillStyle(role.words[2] || '#FFF').fillText(_name, _nameX, _nameY);
				_name = _nameW = _nameX = _nameY = null;
				$.canvas.pass();
			}
			return this;
		},
		/**
		 * 初始化生命条缓冲区[可重写]
		 * @param {object} role
		 * @param {number} width
		 * @param {number} height
		 */
		initHPCache: function(role, width, height) {
			if (role) {
				var _curHP = role.curHP >= 0 ? role.curHP : 0, _HP = role.HP >= 0 ? role.HP : 0,
				_w = 60, _h = 2, _step = 4, _m = ((_curHP + 0.1) / (_HP + 0.1));
				//处理渲染缓冲区
				$.canvas.pass(role._passId)
				.fillStyle('rgba(0, 0, 0, 1)').fillRect((width - _w) >> 1, height - _h - _step, _w, _h)
				.fillStyle('rgba(0, 255, 0, 1)').fillRect((width - _w) >> 1, height - _h - _step, parseInt(_w * (_m > 1 ? 1 : _m)), _h)
				.pass();
				_curHP = _HP = _w = _h = _step = _m = null;
			}
			return this;
		},
		/**
		 * 将角色关联到摄影机
		 * @param {string} id
		 * @param {number} scrollW
		 * @param {number} scrollH
		 */
		focusRole: function(id, scrollW, scrollH) {
			if (!this._superStar) {
				var _getRole = this.getRole(id);
				if (_getRole) {
					this.roleId = id;
					this._superStar = this.getRole(this.roleId);
				}
				_getRole = null;
			}
			if (!this._superStar)
				return this;
			var _centerScrX = this.car.scrWidth >> 1, _centerScrY = this.car.scrHeight >> 1, 
			_offX = _centerScrX - this._superStar.x, _offY = _centerScrY - this._superStar.y;
			this.makeCameraMove(_offX, _offY, scrollW, scrollH); //屏幕的移动路径
			_centerScrX = _centerScrY = _offX = _offY = null;
			return this;
		},
		/**
		 * 从摄像机取消关联角色
		 */
		unFocusRole: function() {
			if (this._superStar) {
				//移除主角移动监听回调事件
				this._superStar.onstart = null;
				this._superStar.onend = null;
				this.roleId = '';
				this._superStar = null;
				this.clearEndEvents();
			}
			return this;
		},
		/**
		 * 获取当前的主角
		 */
		getSuperStar: function() {
			return this._superStar;
		},
		/**
		 * 将数字分段通用方法
		 * @param {number} num
		 * @param {number} step
		 */
		cutNumToSteps: function(num, step) {
			var _steps = [], _s, _f = num > 0 ? 1 : -1, _num = num < 0 ? -num : num;
//			console.log(_num);
			while (_num > 0) {
				if (_num / step >= 1) {
					_s = step;
					_num -= step;
				}
				else {
					_s = _num % step;
					_num -= _s;
				}
				_steps.push(_s * _f);
			}
			_s = _f = _num = null;
			return _steps;
		},
		/**
		 * 将A*寻路索引转换为X坐标
		 * @param {number} j
		 */
		jToX: function(j) {
			return j * this.ow + (this.ow >> 1) - this.car.getMapOffX();
		},
		/**
		 * 将A*寻路索引转换为Y坐标
		 * @param {number} i
		 */
		iToY: function(i) {
			return i * this.oh + (this.oh >> 1) - this.car.getMapOffY();
		},
		/**
		 * 将x坐标转换为A*寻路索引
		 * @param {number} x
		 */
		xToJ: function(x) {
			return parseInt((x + this.car.getMapOffX()) / this.ow);
		},
		/**
		 * 将y坐标转换为A*寻路索引
		 * @param {number} y
		 */
		yToI: function(y) {
			return parseInt((y + this.car.getMapOffY()) / this.oh);
		},
		/**
		 * 添加一个场景事件
		 * @param {enum} type
		 * @param {number|string} eventId
		 * @param {number} x0
		 * @param {number} y0
		 * @param {number} width
		 * @param {number} height
		 * @param {bool} loop
		 * @param {number|string} aimId
		 */
		addEvent: function(type, eventId, x0, y0, width, height, loop, aimId) {
			var _aimObj = this.getRole(aimId), //将事件绑定到对应的目标角色上
			_checkIJ = this.checkIJ(x0, y0),
			_width = width || this.ow, _height = height || this.oh,
			_x = _checkIJ ? ((_checkIJ[1] * this.ow + (this.ow >> 1)) - (_width >> 1)) : 0, _y = _checkIJ ? ((_checkIJ[0] * this.oh + (this.oh >> 1)) - (_height >> 1)) : 0;
			this._events.push([type, eventId, _x, _y, _width, _height, loop, _aimObj, aimId]);
			_aimObj = _checkIJ = _width = _height = _x = _y = null;
			return this;
		},
		/**
		 * 添加一个主角移动停止监听事件
		 * @param {string} type
		 * @param {number|string} eventId
		 * @param {object} data
		 */
		addEndEvent: function(type, eventId, data) {
			if (!this._superStar)
				return this;
			this._endEventObj = [type, eventId, data]; //缓存主角移动停止事件参数，等寻路算法结束后再真正往停止事件队列中添加事件
			return this;
		},
		/**
		 * 清空主角移动停止监听事件
		 */
		clearEndEvents: function() {
			this._endEvents = null;
			this._endEvents = [];
			return this;
		},
		/**
		 * 根据id移除一个场景事件
		 * @param {number} id
		 */
		removeEventById: function(id) {
			var _ev;
			//先删除正在执行的事件
			for (var i = this._onEventQueue.length - 1; i >= 0; i--) {
				_ev = this._onEventQueue[i];
				if (_ev && _ev[1] == id) {
					this._onEventQueue.splice(i, 1);
				}
			}
			//再删除未执行的事件
			for (var i = this._events.length - 1; i >= 0 ; i--) {
				_ev = this._events[i];
				if (_ev && _ev[1] == id) {
					this._events.splice(i, 1);
					break;
				}
			}
			_ev = null;
			return this;
		},
		/**
		 * 根据枚举类型移除一类场景事件
		 * @param {enum} type
		 */
		removeEventByType: function(type) {
			var _ev;
			//先删除正在执行的事件
			for (var i = this._onEventQueue.length - 1; i >= 0; i--) {
				_ev = this._onEventQueue[i]
				if (_ev && _ev[0] == type) {
					this._events._onEventQueue(i, 1);
				}
			}
			//再删除未执行的事件
			for (var i = this._events.length - 1; i >= 0; i--) {
				_ev = this._events[i]
				if (_ev && _ev[0] == type) {
					this._events.splice(i, 1);
				}
			}
			_ev = null;
			return this;
		},
		/**
		 * 检测单个事件的碰撞结果
		 * @param {Object} event
		 * @param {Object} cx
		 * @param {Object} cy
		 * @param {Object} cw
		 * @param {Object} ch
		 */
		checkEventCollision: function (event, dx, dy, dw, dh) {
			var _event = event || [], _cx, _cy, _aimObj, _result = true;
			if (_event[0] != 'npcRange') { //npc视野需要特殊处理，因为npc的坐标是会变的
				_aimObj = null;
				_cx = _event[2];
				_cy = _event[3];
			}
			else {
				_aimObj = _event[7];
				if (_aimObj) {
					_cx = _aimObj.mapOffx - (_event[4] >> 1);
					_cy = _aimObj.mapOffy - (_event[5] >> 1);
				}
			}
			_result = _collisionCheck(dx, dy, dw, dh, _cx, _cy, _event[4], _event[5]);
			_event = _cx = _cy = _aimObj = null;
			return _result;
		},
		/**
		 * 场景事件监听
		 */
		eventListener: function() {
			//处理事件触发间隔时间
			if (!this._superStar || !this._onEvent) { //第一次移动不触发事件
				return this;
			}
			//监听当前已触发事件队列
			var _event, _superStar = this._superStar, _cx, _cy, _aimObj, _newEventDate = Date.now();
			if (_newEventDate - this._callEventDate >= this.callEventTimeout) {
				for (var i = this._onEventQueue.length - 1; _event = this._onEventQueue[i]; i++) {
					if (!this.checkEventCollision(_event, _superStar.mapOffx, _superStar.mapOffy,  1, 1)) {
						//从已触发事件列表中将事件放回未触发事件列表中
						this._events.push(_event);
						this._onEventQueue.splice(i, 1);
					}
				}
				for (var i = this._events.length - 1; _event = this._events[i]; i--) {
					if (this.checkEventCollision(_event, _superStar.mapOffx, _superStar.mapOffy,  1, 1)) {
//						$.canvas.fillStyle('#F00').fillRect(_superStar.mapOffx + _superStar.bR[0], _superStar.mapOffy - this._nodeYStep, _superStar.bR[2], this._nodeYStep);
						if (_event[6]) //如果是循环监听的事件则移除事件需要添加进已触发事件队列中
							this._onEventQueue.push(_event);
						//触发的事件则移除
						this._events.splice(i, 1);
						//角色出生时就触发事件则忽略执行
						if (this._superStar.lastX0 != null && this._superStar.lastY0 != null) {
							this._onEvent(_event[0], _event[1], _superStar, this, _event[0] == 'npcRange' ? _event[7] : null, null, _event[8]);
						}
					}
				}
				this._callEventDate = _newEventDate; //更新时间戳
			}
			_event = _superStar = _cx = _cy = _aimObj = _newEventDate = null;
			return this;
		},
		/**
		 * 清除掉所有场景事件
		 */
		clearEvents: function() {
			this._events = null;
			this._events = [];
			this._onEventQueue = null;
			this._onEventQueue = [];
			return this;
		},
		/**
		 * 场景事件回调绑定
		 * @param {string} eventType
		 * @param {Function} fn
		 */
		bind: function(eventType, fn) {
			if (typeof fn != 'function')
				return this;
			if (eventType == 'event') {
				this._onEvent = fn;
			}
			return this;
		},
		/**
		 * 获取一个文本特效
		 * @param {number|string} id
		 */
		getFontEffect: function(id) {
			var _eff, _getEff = null;
			for (var i = this._fontEffs.length - 1; i >= 0; i--) {
				_eff = this._fontEffs[i];
				if (_eff && _eff.id == id) {
					_getEff = _eff;
					break;
				}
			}
			_eff = null;
			return _getEff;
		},
		/**
		 * 移除一个文本特效
		 * @param {number|string} id
		 */
		removeFontEffect: function(id) {
			var _eff;
			for (var i = this._fontEffs.length - 1; i >= 0; i--) {
				_eff = this._fontEffs[i];
				if (_eff && _eff.id == id) {
					this._fontEffs.splice(i, 1);
					break;
				}
			}
			_eff = null;
			return this;
		},
		/**
		 * 添加一个文本特效
		 * @param {number|string} id
		 * @param {string} text
		 * @param {number} x
		 * @param {number} y
		 * @param {bool} loop
		 * @param {number} step
		 * @param {number} hold
		 * @param {string} color
		 * @param {string} strokeColor
		 * @param {string} font
		 * @param {string} type
		 * @param {string} aimId
		 * @param {number} dx
		 * @param {number} dy
		 */
		addFontEffect: function(id, text, x, y, loop, step, hold, color, strokeColor, font, type, aimId, dx, dy, shine) {
			if (id) {
				this.removeFontEffect(id);
				var _type = type || 'normal', _step = step || 0, _text = text || '', _x = x || 0, _y = y || 0, 
				_color = color || '#000', _strokeColor = strokeColor || '#FFF', _font = font || '12px Arial';
				_hold = hold || _step; //播放完后停留多少帧时间
				
				var _frames, 
				_endF, _measureText = $.canvas.font(_font).measureText(_text), 
				_fontEff, _car = this.car;
				//处理文字动画帧
				switch (_type) {
					case 'normal': //普通向上飘
					default:
						_endF = [0, -20];
						_frames = [[0, -2], [0, -4], [0, -6], [0, -7], [0, -10], [0, -12], [0, -14], [0, -16], [0, -18], _endF];
						break;
					case 'upDown': //上下跳动
						_endF = [0, -49];
						_frames = [[0, -15], [0, -60], [0, -58], [0, -56], [0, -54], [0, -53], [0, -52], [0, -51], [0, -50], _endF];
						break;
					case 'jumpUp': //向上跳动
						_endF = [0, -51, null, 1];
						_frames = [[0, -15, null, 0.4], [0, -45, null, 1.6], [0, -45, null, 1], [0, -46, null, 1], [0, -47, null, 1], [0, -48, null, 1], [0, -49, null, 1], [0, -50, null, 1], _endF];
						break;
					case 'static':
						_frames = [[0, 0]];
						break;
				}
				if (_endF)
					_endF.step = _hold;
				_fontEff = new $.action.sprite(_frames, false, 0, _step);
				_fontEff.id = id;
				_fontEff._text = (_text > 0 ? '+' + _text : _text);
				_fontEff.width = _measureText.width;
				_fontEff.height = _measureText.height;
				_fontEff.loop = loop;
				_fontEff._color = _color;
				_fontEff._aimObj = this.getRole(aimId); //将特效绑定到对应的目标角色上
				_fontEff._effDx = dx || 0;
				_fontEff._effDy = dy || 0;
				_fontEff.mapOffx = _x;
				_fontEff.mapOffy = _y;
				_fontEff.x = _fontEff.mapOffx - _car.getMapOffX() + _fontEff._effDx - (_fontEff.width >> 1);
				_fontEff.y = _fontEff.mapOffy - _car.getMapOffY() + _fontEff._effDy - _fontEff.height;
				_fontEff._strokeColor = _strokeColor;
				_fontEff._font = _font;
				_fontEff.shine = shine; //判定特效是否可以显示在聚光灯之上
				this._fontEffs.unshift(_fontEff);
				_type = _step = _text = _x = _y = _color = _strokeColor = _hold = _frames = _endF = _measureText = _fontEff = _font = _car = null;
			}
			return this;
		},
		/**
		 * 清除全部的文本特效
		 */
		clearFontEffects: function() {
			this._fontEffs = [];
			return this;
		},
		/**
		 * 获取一个技能特效精灵
		 * @param {number|string} id
		 */
		getEffect: function(id) {
			var _eff, _getEff = null;
			for (var i = this._frontEffs.length - 1; i >= 0; i--) {
				_eff = this._frontEffs[i];
				if (_eff && _eff.id == id) {
					_getEff = _eff;
					break;
				}
			}
			for (var i = this._backEffs.length - 1; i >= 0; i--) {
				_eff = this._backEffs[i];
				if (_eff && _eff.id == id) {
					_getEff = _eff;
					break;
				}
			}
			_eff = null;
			return _getEff;
		},
		/**
		 * 移除一个技能特效精灵
		 * @param {number|string} id
		 * @param {string} type
		 */
		removeEffect: function(id, type) {
			var _type = type || 'front',
			_effs = [], _eff;
			if (_type == 'front') {
				_effs = this._frontEffs;
			}
			else if (_type == 'back') {
				_effs = this._backEffs;
			}
			for (var i = _effs.length - 1; i >= 0; i--) {
				_eff = _effs[i];
				if (_eff && _eff.id == id) {
					_effs.splice(i, 1);
					break;
				}
			}
			_type = _effs = _eff = null;
			return this;
		},
		/**
		 * 添加一个场景特效
		 * @param {number|string} id
		 * @param {object} sprite
		 * @param {number} x0
		 * @param {number} y0
		 * @param {bool} loop
		 * @param {number} cr
		 * @param {number} step
		 * @param {string} type
		 * @param {number} x
		 * @param {number} y
		 * @param {number} aimX
		 * @param {number} aimY
		 * @param {string} timing
		 * @param {number} speed
		 * @param {number} during
		 * @param {number|string} aimId
		 * @param {number} dx
		 * @param {number} dy
		 * @param {bool} shine
		 */
		addEffect: function(id, role, x0, y0, loop, cr, step, type, x, y, aimX, aimY, timing, speed, during, aimId, dx, dy, shine) {
			var _type = type || 'front', _x = x || -1000, _y = y || -1000;
			if (role && !this.getEffect(id)) {
				var _checkIJ = this.checkIJ(x0, y0), _cutXY = (x0 == null && y0 == null && x == null && y == null) ? -1000 : 0;
				x0 = _checkIJ ? _checkIJ[0]: 0;
				y0 = _checkIJ ? _checkIJ[1]: 0;
				_checkIJ = null;
				role.x0 = x0; //A*据点索引
				role.y0 = y0;
				if (x == null && y == null) {
					if (y0 != null)
						_x = y0 * this.ow + (this.ow >> 1) + _cutXY;
					if (x0 != null)
						_y = x0 * this.oh + (this.oh >> 1) + _cutXY;
				}
				_cutXY = null;
				var _car = this.car;
				role.id = id;
				role.loop = loop;
				role.type = _type;
				role._aimObj = this.getRole(aimId); //将特效绑定到对应的目标角色上
				if (role._aimObj) { //如果有关联的角色将特效id和类型绑定到角色上，等到角色被删除的时候方便统一删除
					if (!role._aimObj.effects) {
						role._aimObj.effects = [];
					}
					role._aimObj.effects.push([role.id, role.type]);
				}
				role._effDx = dx || 0;
				role._effDy = dy || 0;
				role.shine = shine; //判定特效是否可以显示在聚光灯之上
				if (cr != null)
					role.setSprite(cr);
				if (step != null)
					role.setStep(step);
				role.mark(_x - _car.getMapOffX(), _y - _car.getMapOffY(), _x, _y);
				if (aimX != null && aimY != null) {
					var _path = this.getFly(_x, _y, aimX, aimY, timing, speed, during);
					role.setPath(_path);
					role.aimX = aimX;
					role.aimY = aimY;
					_path = null;
				}
				if (_type == 'front') {
					this._frontEffs.unshift(role);
				}
				else if (_type == 'back') {
					this._backEffs.unshift(role);
				}
				_car = null;
			}
			_type = _x = _y = null;
			return this;
		},
		/**
		 * 清空特效
		 * @param {string} type
		 */
		clearEffects: function(type) {
			if (type == 'front') {
				this._frontEffs = [];
			}
			else if (type == 'back') {
				this._backEffs = [];
			}
			else {
				this._frontEffs = [];
				this._backEffs = [];
			}
			return this;
		},
		/**
		 * 添加角色进度条
		 * @param {string} roleId
		 * @param {number} ms
		 * @param {string} desc
		 * @param {string} color
		 * @param {string} stroke
		 * @param {string} font
		 * @param {number} dy
		 * @param {object} data
		 */
		addLoadingBar: function(roleId, ms, desc, color, stroke, font, dy, data) {
			var _getRole = this.getRole(roleId);
			if (_getRole) {
				if (this._loadingBars.indexOfAttr('roleId', _getRole.id) < 0) {
					var _font = font || '14px Arial';
					this._loadingBars.push({ 
						roleId: _getRole.id, role: _getRole, 
						color: color || '#000', stroke: stroke || '#FFF', font: _font, dx: -($.canvas.font(_font).measureText(desc).width >> 1), dy: dy || 0,
						curMs: ms, ms: ms, desc: desc, date: Date.now(), data: data 
					});
					if (this._onEvent) { //触发读条开始事件通知
						this._onEvent('loadingBarStart', _getRole.id, _getRole, this, null, data);
					}
					_font = null;
				}
			}
			_getRole = null;
			return this;
		},
		/**
		 * 移除角色进度条
		 * @param {string} roleId
		 */
		removeLoadingBar: function(roleId) {
			var _arrIndex = this._loadingBars.indexOfAttr('roleId', roleId);
			if (_arrIndex >= 0) {
				this._loadingBars.splice(_arrIndex, 1);
			}
			_arrIndex = null;
			return this;
		},
		/**
		 * 场景摇动效果
		 * @param {string} type
		 */
		makeShake: function(type) {
			if (this._shakePath.length > 0) {
				return this;
			}
			var _type = type;
			switch (_type) {
				case 'earthquake': //地震效果
					this._shakePath = [
						[0, 8],
						[0, -8],
						[0, -8],
						[0, 8],
						[0, 5],
						[0, -5],
						[0, -5],
						[0, 5]
					];
					break;
				case 'shake': //左右摇晃
					this._shakePath = [
						[8, 0],
						[-8, 0],
						[-8, 0],
						[8, 0],
						[5, 0],
						[-5, 0],
						[-5, 0],
						[5, 0]
					];
					break;
				case 'oblique': //倾斜摇晃[升级等UI产生的场景震动]
					this._shakePath = [
						[5, 5],
						[-5, -5],
						[-5, -5],
						[5, 5],
						[2, 2],
						[-2, -2],
						[-2, -2],
						[2, 2]
					];
					break;
				case 'smallEarthquake': //轻微地震效果
					this._shakePath = [
						[0, 2],
						[0, -2],
						[0, -2],
						[0, 2],
						[0, 1],
						[0, -1],
						[0, -1],
						[0, 1]
					];
					break;
				case 'severeEarthquake': //剧烈的地震效果
					this._shakePath = [];
					var _sdx, _sdy;
					for (var i = 0; i < 5; i++) {
						_sdx = $.commandFuns.getRandom(-5, 5);
						_sdy = $.commandFuns.getRandom(-5, 5);
						this._shakePath.push([_sdx, _sdy]);
						this._shakePath.push([-_sdx, -_sdy]);
						this._shakePath.push([-_sdx, -_sdy]);
						this._shakePath.push([_sdx, _sdy]);
					}
					this._shakePath.push([2, 2]);
					this._shakePath.push([-2, -2]);
					this._shakePath.push([-2, -2]);
					this._shakePath.push([2, 2]);
					this._shakePath.push([1, 1]);
					this._shakePath.push([-1, -1]);
					this._shakePath.push([-1, -1]);
					this._shakePath.push([1, 1]);
					_sdx = _sdy = null;
					break;
				default:
					break;
			}
			_type = null;
			return this;
		},
		/**
		 * 判断场景移动是否停止
		 */
		endPath: function() {
			return this._focusPath.length == 0;
		},
		/**
		 * 清空卷屏路径
		 */
		clearPath: function() {
			this._focusPath.length = 0;
			return this;
		},
		/**
		 * 获取场景中全部的对象
		 */
		getShelters: function() {
			return this._shelters;
		},
		/**
		 * 获取碰撞层数据
		 */
		getAStars: function() {
			return this._aStars;
		},
		/**
		 * 回收场景中的全部资源
		 */
		disposed: function() {
			this._aStars = null;
			this._roleObjs = null;
			this._buildingObjs = null;
			this._effectObjs = null;
			this._shelters = null;
			this._focusPath = null;
			this.unFocusRole(); 
			this.clearEvents();
			this.clearEndEvents();
			this._runDownObjs = null;
			this._runDowns = null;
			this.clearEffects();
			this._frontEffs = null;
			this._backEffs = null;
			this.clearFontEffects();
			this._fontEffs = null;
			for (var i = this._wordsPassIds.length - 1; i >= 0; i--) {
				$.canvas.del(this._wordsPassIds[i]);
			}
			this._wordsPassIds = null; 
			this._wordsList = null;
			for (var i = this._bubblePassIds.length - 1; i >= 0; i--) {
				$.canvas.del(this._bubblePassIds[i]);
			}
			this._bubblePassIds = null; 
			this._bubblesList = null; 
			this._endEvents = null;
			this._onEvent = null; 
			this._endEventObj = null;
			this._loadingBars = null;
			this._canSort = false;
			return this;
		}
	});
	$.World.enums = _enums;
	return $.World;
	
});
