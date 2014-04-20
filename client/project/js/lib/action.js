/**
 * @author Suker
 * link引擎动画组件
 * 版本1.1
 */
define([
	'lib/link'
], function($) { 
	//根据速度返回精灵动作索引集合里对应方位的索引值
	var _returnDIndex = function(vx, vy) {
		if (vx == 0 && vy == 0) 
			return 0; //面朝北
		else if (vx > 0 && vy < 0) 
			return 1; //面朝东北
		else if (vx > 0 && vy == 0) 
			return 2; //面朝东
		else if (vx > 0 && vy > 0) 
			return 3; //面朝东南
		else if (vx == 0 && vy > 0) 
			return 4; //面朝南
		else if (vx < 0 && vy > 0) 
			return 5; //面朝西南
		else if (vx < 0 && vy == 0) 
			return 6; //面朝西
		else if (vx < 0 && vy < 0) 
			return 7; //面朝西北
		else
			return 0;
	};
	var _returnSprite = function(sprites, imageNames, rects, frames, actions) {
		var _sprites = [];
		if (actions.length > 0) {
			var frames, _act;
			for (var i = 0; i < actions.length; i++) {
				frames = []; //取帧
				_act = actions[i].frames;
				for (var j = 0; j < _act.length; j++) {
					frames.push({ args: [_act[j][0], _act[j][1], _act[j][2]], step: _act[j][3] });
				}
				_sprites.push(new $.action.sprite(frames, actions[i].loop, 0)); //取精灵
			}
			frames = _act = null;
			return _sprites;
		}
		else
			return sprites;
	};
	
	$.action = {};
	
	//-------------------link.action.Role 实体类定义开始--------------------------------------------
	/**
	 * 角色实体类
	 * @class
	 * @param {array} sprites [一个角色由多个精灵组成]
	 * @param {number} x
	 * @param {number} y
	 * @param {number} current
	 * @param {array} imageNames [角色模型图片资源名规范序列]
	 * @param {array} rects [角色模型切片规范序列]
	 * @param {array} frames [角色模型动画帧规范序列]
	 * @param {array} actions [角色模型动作规范序列]
	 */
	$.action.Role = function(sprites, x, y, current, imageNames, rects, frames, actions) {
		this.imageNames = imageNames || [];
		this.rects = rects || [];
		this.frames = frames || [];
		this.actions = actions || [];
		this.sprites = _returnSprite(sprites, this.imageNames, this.rects, this.frames, this.actions) || [];
		this.x = x || 0;
		this.y = y || 0;
		this.dx = 0;
		this.dy = 0;
		this.step = 0;
		this.id = '';
		this.mapOffx = this.x; //场景中绝对坐标
		this.mapOffy = this.y;
		this.svx = null; //记录停止时前一帧的速度值
		this.svy = null;
		this.current = current || 0;
		this._cr = this.current; //用于记录重复动作的标识
		this.zoom = 1;
		this.angle = 0;
		this._zooms = []; //缩放比例变换序列
		this._angles = []; //旋转角度变换序列
		this._moveDs = [4, 7, 5, 5, 6, -5, -5, -7]; //移动时8方向分别对应的动作索引编号集合 0:面朝北, 1:面朝东北 2:面朝东 3:面朝东南 4:面朝南 5:面朝西南 6:面朝西 7:面朝西北 
		this._stopDs = [0, -3, 1, 1, 2, -1, -1, -3]; //停止时8方向分别对应的动作索引编号集合 索引意义如上
		this.dsIndex = 4; //方向索引 0:面朝北, 1:面朝东北 2:面朝东 3:面朝东南 4:面朝南 5:面朝西南 6:面朝西 7:面朝西北
		this._path = [];
		var _sprite = this.getSprite(), 
		_frame = _sprite.getFrame(), 
		_frameAll = this.frames[_frame.args[0]];
		this._fA = _frameAll.fA; //缓存动作动画帧，以免在动作切换的时候出现跳帧的情况
		this.aR = _frameAll.aR; //攻击矩形
		this.bR = _frameAll.bR; //身体矩形
		this._skipMoveDs = false; //判断是否忽略角色8方向移动时自动切换的动作
		this._stopedAction = null; //角色静止后执行的动作
		_frameAll = _frame = _sprite = null;
		this.onend = null; //停止后回调
		this.onstart = null; //开始时回调
		this._locked = false; //锁定动作控制变量
		this.speed = 5;
		this.links = []; //关联角色
		this.polyAR = [[0, 0], [0, 0], [0, 0], [0, 0]]; //攻击矩形多边形行定点集合,角色采用obb碰撞检测模式,包围角色的永远是一个正矩形
        this.aabbAR = [[0, 0], [0, 0], [0, 0], [0, 0]]; //攻击矩形包围盒集合
        this.polyBR = [[0, 0], [0, 0], [0, 0], [0, 0]]; //身体矩形多边形行定点集合,角色采用obb碰撞检测模式,包围角色的永远是一个正矩形
	    this.aabbBR = [[0, 0], [0, 0], [0, 0], [0, 0]]; //身体矩形包围盒集合
	};
	/**
	 * 设置当前角色的动作
	 * @returns {link.active.Role}
	 * @param {number} cr
	 * @param {bool} notReset
	 * @param {bool} stopedRefresh
	 */
	$.action.Role.prototype.setSprite = function(cr, notReset, stopedRefresh) {
		if (this._locked) {
			return this;
		}
		var _cr = cr != undefined ? cr : 0,
		_trans = _cr >= 0 ? $.trans.TRANS_NONE : $.trans.TRANS_MIRROR, 
		_sprite, _frame;
		if (this._cr != _cr) { //不能连续执行两次同样的动作
			this._cr = _cr;
			if (_cr < 0)
				_cr = Math.abs(_cr);
			this.current = _cr >= this.sprites.length ? this.sprites.length - 1 : _cr;
			if (this.sprites.length > 1) { //单动作角色不需要强制设置翻转状态，因为有可能要对特效进行翻转处理
				this.setTrans(_trans); //如果动作帧的索引为负数表示需要镜像翻转渲染
			}
			_sprite = this.getSprite();
			_frame = _sprite.getFrame();
			if (!notReset) {
				_sprite.setFrame(0);//改变动作后将帧指针归零
			}
			if (stopedRefresh) {
				this._stopedAction = this._cr; //编辑移动停止后播放的动作
			}
            this.updateFrameParam();
		}
		//角色连接物转向
		for (var li = 0, lk; lk = this.links[li]; li++) {
			lk.setSprite(cr, notReset, stopedRefresh);
		}
		_cr = trans = _sprite = _frame = null;
		return this;
	};
	/**
	 * 添加一个关联角色
	 * @returns {link.active.Role}
	 * @param {array[link.active.Role]} links
	 */
	$.action.Role.prototype.addLinks = function(links) {
		this.links = links || [];
		//角色连接物方向和主体同步
		for (var li = 0, lk; lk = this.links[li]; li++) {
			lk.setSprite(this.getSprite().trans == $.trans.TRANS_NONE ? this.current : -this.current)
            .setStep(this.step);
		}
		return this;
	};
	/**
	 * 清空关联角色
	 */
	$.action.Role.prototype.clearLinks = function() {
		this.links = [];
		return this;
	};
	/**
	 * 锁定动作不可变
	 */
	$.action.Role.prototype.lockSprite = function() {
		this._locked = true;
		return this;
	};
	/**
	 * 解开锁定动作
	 */
	$.action.Role.prototype.unlockSprite = function() {
		this._locked = false;
		return this;
	};
	/**
	 * 设置翻转属性
	 * @returns {link.active.Role}
	 * @param {link.trans} trans
	 */
	$.action.Role.prototype.setTrans = function(trans) {
		this.getSprite().trans = trans;
		return this;
	};
	/**
	 * 获取当前角色的动作
		 * @returns {link.active.Role}
	 * @param {number} index
	 */
	$.action.Role.prototype.getSprite = function(index) {
		return this.sprites[index == null ? this.current : index];
	};
	/**
	 * 取得帧数据
	 * @returns {number}
	 * @param {number} index
	 */
	$.action.Role.prototype.getFrame = function(index) {
		return this.frames[index == null ? this.getSprite().getFrame().args[0] : index];
	};
    /**
     * 更新特定帧下的参数
     * @returns {link.active.Role}
     * @param {number} current
     */
    $.action.Role.prototype.updateFrameParam = function(current) {
        var _sprite = this.getSprite();
        if (!_sprite) {
            _sprite = null;            
            return this;
        }
        var _frame = _sprite.getFrame(), _frameAll;
        if (_frame && _frame.args) {
            if (_frameAll = this.frames[_frame.args[0]]) {
                this._fA = _frameAll.fA; //缓存动作动画帧
                this.aR = _frameAll.aR; //缓存攻击区域矩形
                this.bR = _frameAll.bR; //缓存身体区域矩形
                var _ar = this.getAttackRect(), _br = this.getBodyRect(), 
                _minX = 0, _maxX = 0, _minY = 0, _maxY = 0;
                //处理矩形的4个顶点
                this.polyAR[0][0] = _ar.x;
                this.polyAR[0][1] = _ar.y;
                this.polyAR[1][0] = _ar.x + _ar.width;
                this.polyAR[1][1] = _ar.y;
                this.polyAR[2][0] = _ar.x + _ar.width;
                this.polyAR[2][1] = _ar.y + _ar.height;
                this.polyAR[3][0] = _ar.x;
                this.polyAR[3][1] = _ar.y + _ar.height;
                
                this.polyBR[0][0] = _br.x;
                this.polyBR[0][1] = _br.y;
                this.polyBR[1][0] = _br.x + _br.width;
                this.polyBR[1][1] = _br.y;
                this.polyBR[2][0] = _br.x + _br.width;
                this.polyBR[2][1] = _br.y + _br.height;
                this.polyBR[3][0] = _br.x;
                this.polyBR[3][1] = _br.y + _br.height;
                //角度不为0则处理矩阵旋转
                if (this.angle != 0) {
                    //旋转矩阵
                    $.comm.setMatrixRotate(this.polyAR, this.angle)
                    .setMatrixRotate(this.polyBR, this.angle);
                }
                //处理AABB包围盒
                var side = 0, poly = this.polyAR, aabb = this.aabbAR;
                while(side++ < 2) {
                    for (var i = 0, node; node = poly[i]; i++) {
                        if (node[0] > _maxX) {
                            _maxX = node[0];
                        }
                        if (node[0] < _minX) {
                            _minX = node[0];
                        }
                        if (node[1] > _maxY) {
                            _maxY = node[1];
                        }
                        if (node[1] < _minY) {
                            _minY = node[1];
                        }
                    }
                    aabb[0][0] = _minX;
                    aabb[0][1] = _minY;
                    aabb[1][0] = _maxX;
                    aabb[1][1] = _minY;
                    aabb[2][0] = _maxX;
                    aabb[2][1] = _maxY;
                    aabb[3][0] = _minX;
                    aabb[3][1] = _maxY;
                    
                    poly = this.polyBR;
                    aabb = this.aabbBR;
                }
                _ar = _br = _minX = _maxX = _minY = _maxY = null;
            }
        }
        _sprite = _frame = _frameAll = null;
        return this;
    };
	/**
	 * 动作监听
	 * @returns {link.active.Role}
	 */
	$.action.Role.prototype.action = function() {
		var _sprite = this.getSprite();
		if (!_sprite)
			return this;
		var _frame = _sprite.getFrame(), _vx = 0, _vy = 0;
		if (_frame) {
		    this.updateFrameParam();
			if (this._path.length > 0) {
				var _pathStep = this._path.shift();
				_vx = _pathStep[0] || 0;
				_vy = _pathStep[1] || 0;
				_pathStep = null;
				//移动时根据速度确定人物正面的朝向动作
				if (!this._skipMoveDs) {
					this.setSprite(this._moveDs[this.dsIndex = _returnDIndex(_vx, _vy)], true);
				}
				this.svx = _vx;
				this.svy = _vy;
				//累加场景绝对坐标
				this.mapOffx += this.svx;
				this.mapOffy += this.svy;
			}
			else if (this.svx != null && this.svy != null) {
				//停止时根据前一帧的速度确定人物正面的朝向动作
				if (!this._skipMoveDs) {
					this.setSprite(this._stopedAction || this._stopDs[this.dsIndex = _returnDIndex(this.svx, this.svy)]);
					this._stopedAction = null;
				}
				if (this.onend) { //停止后回调
					this.onend(this);
				}
				this._skipMoveDs = false;
				this.svx = null;
				this.svy = null;
			}
			//处理缩放比例变换
			if (this._zooms.length > 0) {
				var _zoom = this._zooms.shift();
				if (typeof ~~(_zoom) == 'number') {
					this.setZoom(_zoom);
				}
				_zoom = null;
			}
			//处理旋转比例变换
			if (this._angles.length > 0) {
				var _angle = this._angles.shift();
				if (typeof ~~(_angle) == 'number') {
					this.setRotate(_angle);
				}
				_zoom = null;
			}
			this.x += (_frame.args[1] + _vx);
			this.y += (_frame.args[2] + _vy);
			var _lkFrameAll;
            //角色连接物动作同步
            for (var li = 0, lk; lk = this.links[li]; li++) {
                lk.x = this.x + (lk.dx || 0);
                lk.y = this.y + (lk.dy || 0);
                lk.getSprite().setFrame(_sprite.current);
                lk.updateFrameParam();
            }
            _lkFrameAll = null;
		}
		_sprite.nextFrame();
		_sprite = _vx = _vy = _frame = null;
		return this;
	};
	/**
	 * 渲染
	 * @returns {link.active.Role}
	 * @param {bool} act
	 */
	$.action.Role.prototype.render = function(act) {
		var _sprite = this.getSprite();
		if (_sprite && this._fA) {
			var _fa = this._fA, _len = _fa.length, _actRenderContext = $.canvas, _trans = _sprite.trans, _rect, _imgId, _img;
			if (this.angle > 0) {
				var _bodyRect = _fa[0], 
				_transX = this.x, 
				_transY = this.y;
				$.canvas.save()
				.translate(_transX, _transY)
				.rotate(this.angle * Math.PI / 180)
				.translate(-_transX, -_transY);
				_bodyRect = _transX = _transY = null;
			}
			for (var i = 0; i < _len; i++) {
				_rect = this.rects[_fa[i][0]][_fa[i][1]];
				_imgId = this.imageNames[_fa[i][0]];
				_img = $.getImage(_imgId);
				if (_trans == $.trans.TRANS_NONE) {
					_actRenderContext.drawImage(
						_imgId,
						_rect[0],
						_rect[1],
						_rect[2],
						_rect[3],
						this.zoom == 1 ? ~~(this.x + this.dx + _fa[i][2] * this.zoom) : this.x + this.dx + _fa[i][2] * this.zoom,
						this.zoom == 1 ? ~~(this.y + this.dy + _fa[i][3] * this.zoom) : this.y + this.dy + _fa[i][3] * this.zoom,
						_rect[2] * this.zoom,
						_rect[3] * this.zoom
					);
				}
				else {
					if (this.zoom == 1) {
						_actRenderContext.drawRegion(
							_imgId,
							_rect[0],
							_rect[1],
							_rect[2],
							_rect[3],
							_trans,
							~~(this.x + this.dx - (_fa[i][2] + _rect[2])),
							~~(this.y + this.dy + _fa[i][3])
						);
					}
					else {
						_actRenderContext.drawRegionAndZoom(
							_imgId,
							_rect[0],
							_rect[1],
							_rect[2],
							_rect[3],
							_trans,
							this.x + this.dx - (_fa[i][2] + _rect[2]) * this.zoom,
							this.y + this.dy + _fa[i][3] * this.zoom,
							null,
							_rect[2] * this.zoom,
							_rect[3] * this.zoom
						);
					}
				}
				if (!_img.loaded && _img.bench) { //图形资源正在加载时
					_actRenderContext.drawImage(
						_img.bench.id || _img.benchId,
						_img.bench.sx || 0,
						_img.bench.sy || 0,
						_img.bench.sw || _img.bench.w,
						_img.bench.sh || _img.bench.h,
						~~(this.x + this.dx - ((_img.bench.w * this.zoom) >> 1)),
						~~(this.y + this.dy - (_img.bench.h * this.zoom)),
						_img.bench.w * this.zoom,
						_img.bench.h * this.zoom
					);
				}
			}
			if (this.angle > 0) {
				$.canvas.restore();
			}
			//角色连接物动作渲染
			for (var li = 0, lk; lk = this.links[li]; li++) {
				lk.render();
			}
			_actRenderContext = _len = _fa = _trans = _rect = _imgId = _img = null;
		}
		_sprite = null;
		return this;
	};
	/**
	 * 设置缩放比例
	 * @returns {link.active.Role}
	 * @param {number} zoom
	 */
	$.action.Role.prototype.setZoom = function(zoom) {
		this.zoom = zoom;
		return this;
	};
	/**
	 * 设置缩放比例变换序列
	 * @returns {link.active.Role}
	 * @param {array} zooms
	 */
	$.action.Role.prototype.setZoomTransition = function(zooms) {
		if (zooms && zooms.length > 0) {
			this._zooms = zooms;
		}
		return this;
	};
	/**
	 * 判断缩放比例变换是否停止
	 * @returns {bool}
	 */
	$.action.Role.prototype.endZoomTransition = function() {
		return this._zooms.length == 0;
	};
	/**
	 * 取得角色身体矩形数据
	 * @returns {object}
	 * @param {number} spriteIndex
	 * @param {number} frameIndex
	 */
	$.action.Role.prototype.getBodyRect = function(spriteIndex, frameIndex) {
		var _sprite = this.getSprite(spriteIndex != null ? Math.abs(spriteIndex) : null);
		if (!_sprite) {
			return null;
		}
		var _frame = _sprite.getFrame(frameIndex);
		if (!_frame) {
			return null;
		}
		var br = this.frames[_frame.args[0]].bR;
		if ((spriteIndex == null && _sprite.trans != $.trans.TRANS_NONE) || spriteIndex < 0) {
			return { x: -(br[0] + br[2] * this.zoom), y: br[1] * this.zoom, width: br[2] * this.zoom, height: br[3] * this.zoom }; 
		}
		else {
			return { x: br[0] * this.zoom, y: br[1] * this.zoom, width: br[2] * this.zoom, height: br[3] * this.zoom };
		}
	};
	/**
	 * 取得角色攻击矩形数据
	 * @returns {object}
	 * @param {number} spriteIndex
	 * @param {number} frameIndex
	 */
	$.action.Role.prototype.getAttackRect = function(spriteIndex, frameIndex) {
		var _sprite = this.getSprite(spriteIndex != null ? Math.abs(spriteIndex) : null);
		if (!_sprite) {
			return null;
		}
		var _frame = _sprite.getFrame(frameIndex);
		if (!_frame) {
			return null;
		}
		var ar = this.frames[_frame.args[0]].aR;
		if ((spriteIndex == null && _sprite.trans != $.trans.TRANS_NONE) || spriteIndex < 0) {
			return { id: this.id, x: -(ar[0] + ar[2] * this.zoom), y: ar[1] * this.zoom, width: ar[2] * this.zoom, height: ar[3] * this.zoom }; 
		}
		else {
			return { id: this.id, x: ar[0] * this.zoom, y: ar[1] * this.zoom, width: ar[2] * this.zoom, height: ar[3] * this.zoom };
		}
	};
    /**
     * 获取身体矩形AABB包围盒 
     */
    $.action.Role.prototype.getAABBBodyRect = function() {
        return { id: this.id, x: this.aabbBR[0][0], y: this.aabbBR[0][1], width: Math.abs(this.aabbBR[1][0] - this.aabbBR[0][0]), height: Math.abs(this.aabbBR[2][1] - this.aabbBR[1][1]) };
    };
	/**
	 * 获取攻击矩形AABB包围盒 
	 */
	$.action.Role.prototype.getAABBAttackRect = function() {
	    return { id: this.id, x: this.aabbAR[0][0], y: this.aabbAR[0][1], width: Math.abs(this.aabbAR[1][0] - this.aabbAR[0][0]), height: Math.abs(this.aabbAR[2][1] - this.aabbAR[1][1]) };
	};
	/**
	 * 更改所有精灵动画的播放频率
	 * @returns {link.active.Role}
	 * @param {number} step
	 */
	$.action.Role.prototype.setStep = function(step) {
		this.step = step || 0;
		for (var _i = 0, _len = this.sprites.length; _i < _len; _i++) {
			this.sprites[_i].setStep(step);
		}
        for (var li = 0, lk; lk = this.links[li]; li++) {
            lk.setStep(this.step);
        }
		return this;
	};
	/**
	 * 检测和其他角色的碰撞<br />
	 * type1和type2的值为bR或aR，表示身体或攻击区域的检测
     * @returns {bool}
	 * @param {link.action.Role} role
	 * @param {string} type1
	 * @param {string} type2
	 */
	$.action.Role.prototype.collision = function(role, type1, type2) {
		if (!role) {
			return false;
		}
		var _type1 = type1 || 'aR', _type2 = type2 || 'aR', _R1, _R2;
		if (_type1 == 'aR') {
			_R1 = this.getAttackRect();
		}
		else if (_type1 == 'bR') {
			_R1 = this.getBodyRect();
		}
		if (_type2 == 'aR') {
			_R2 = role.getAttackRect();
		}
		else if (_type2 == 'bR') {
			_R2 = role.getBodyRect();
		}
		if (_R1 && _R2) {
//			$.canvas.fillStyle('#F00').fillRect(
//			this.getSprite().trans == $.trans.TRANS_NONE ? ~~((this.x + this.dx + _R1[0] * this.zoom)) : ~~((this.x + this.dx - (_R1[0] + _R1[2]) * this.zoom)), 
//				~~((this.y + this. dy + _R1[1] * this.zoom)), 
//				~~(_R1[2] * this.zoom), 
//				~~(_R1[3] * this.zoom)
//			)
//			.fillStyle('#FF0').fillRect(
//			role.getSprite().trans == $.trans.TRANS_NONE ? ~~((role.x + role.dx + _R2[0] * role.zoom)) : ~~((role.x + role.dx - (_R2[0] + _R2[2]) * role.zoom)), 
//				~~((role.y + role.dy + _R2[1] * role.zoom)), 
//				~~(_R2[2] * role.zoom), 
//				~~(_R2[3] * role.zoom)
//			);
			return $.comm.collision(
				~~(this.x + this.dx + _R1.x), 
				~~(this.y + this. dy + _R1.y), 
				~~(_R1.width), 
				~~(_R1.height),
				~~(role.x + role.dx + _R2.x), 
				~~(role.y + role.dy + _R2.y), 
				~~(_R2.width), 
				~~(_R2.height)
			);
		}
		return false;
	};
	/**
	 * 角色的输入碰撞<br />
	 * 用于用户的设备输入响应与角色碰撞检测,如鼠标碰撞，触碰碰撞等
     * @returns {bool}
	 * @param {number} x
	 * @param {number} y
	 * @param {number} width
	 * @param {number} height
	 * @param {string} type1
	 */
	$.action.Role.prototype.collisionInput = function(x, y, width, height, type1) {
		var _type1 = type1 || 'aR', _R1;
		if (_type1 == 'aR') {
			_R1 = this.getAttackRect();
		}
		else if (_type1 == 'bR') {
			_R1 = this.getBodyRect();
		}
		if (_R1) {
			return $.comm.collision(
				~~(this.x + this.dx + _R1.x), 
				~~(this.y + this. dy + _R1.y), 
				~~(_R1.width), 
				~~(_R1.height),
				x, y, width, height
			);
		}
		return false;
	};
	/**
     * 角色的圆形输入碰撞<br />
     * 用于用户的设备输入响应与角色碰撞检测,如鼠标碰撞，触碰碰撞等
     * @returns {bool}
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {string} type1
     */
    $.action.Role.prototype.circleCollisionInput = function(x, y, radius, type1) {
        var _type1 = type1 || 'aR', _R1;
        if (_type1 == 'aR') {
            _R1 = this.getAttackRect();
        }
        else if (_type1 == 'bR') {
            _R1 = this.getBodyRect();
        }
        if (_R1) {
            return $.comm.rect2CircleCollision(
                ~~(this.x + this.dx + _R1.x), 
                ~~(this.y + this. dy + _R1.y), 
                ~~(_R1.width), 
                ~~(_R1.height),
                x, y, radius
            );
        }
        return false;
    };
    /**
     *  角色的有多边形碰撞[带旋转的碰撞]<br />
     * type1和type2的值为bR或aR，表示身体或攻击区域的检测
     * @returns {bool}
     * @param {link.action.Role} role
     * @param {string} type1
     * @param {string} type2
     */
    $.action.Role.prototype.polygonSATCollision = function(role, type1, type2) {
        if (!role) {
            return false;
        }
        var _type1 = type1 || 'aR', _type2 = type2 || 'aR', _poly1, _poly2;
        if (_type1 == 'aR') {
            _poly1 = this.polyAR;
        }
        else if (_type1 == 'bR') {
            _poly1 = this.polyBR;
        }
        if (_type2 == 'aR') {
            _poly2 = role.polyAR;
        }
        else if (_type2 == 'bR') {
            _poly2 = role.polyBR;
        }
        if (_poly1 && _poly2) {
            return $.comm.polygonCollision(_poly1, _poly2, this.x + this.dx, this.y + this.dy, role.x + role.dx, role.y + role.dy);
        }
        return false;
    };
	/**
	 * 设置所有精灵动画是否循环播放
	 * @returns {link.active.Role}
	 * @param {number} step
	 */
	$.action.Role.prototype.setLoop = function(loop) {
		for (var _i = 0, _len = this.sprites.length; _i < _len; _i++) {
			this.sprites[_i].setLoop(loop);
		}
		return this;
	};
	/**
	 * 设置角色移动路径[移动过程中角色会自己调整动作方向]
	 * @returns {link.active.Role}
	 * @param {array} path
	 * @param {bool} skipMoveDs
	 */
	$.action.Role.prototype.setPath = function(path, skipMoveDs) {
		this._path = path || [];
		if (this._path.length > 0 && this.onstart) { //开始回调
			this.onstart(this);
		}
		//判断新增路径时是否限制角色的8方向动作自动切换
		if (skipMoveDs) {
			this._skipMoveDs = true;
		}
		return this;
	};
	/**
	 * 添加一组新的移动路径到原有路径里
	 * @param {array} path
	 */
	$.action.Role.prototype.concatPath = function(path){
		this._path = this._path.concat(path || []);
		return this;
	};
	/**
	 * 判断移动是否停止
	 * @returns {bool}
	 */
	$.action.Role.prototype.endPath = function() {
		return this._path.length == 0;
	};
	/**
	 * 清除路径使角色停止移动
	 * @returns {link.active.Role}
	 */
	$.action.Role.prototype.clearPath = function() {
		this._path = [];
		return this;
	};
	/**
	 * 返回当前角色路径的数量
     * @returns {number}
	 */
	$.action.Role.prototype.getPathCount = function() {
		return this._path.length;
	};
	/**
	 * 获取当前第一个移动路径[即下一帧的偏移量] 
     * @returns {array}
	 */
	$.action.Role.prototype.getFirstPath = function() {
        return this._path.length > 0 ? this._path[0] : [0, 0];
    };
	/**
	 * 角色匀速平移到指定坐标
	 * @param {number} x
	 * @param {number} y
	 * @param {number} speed
	 */
	$.action.Role.prototype.moveTo = function(x, y, speed) {
		if (speed) {
			this.speed = Math.abs(speed);
		}
		this.setPath($.comm.createPath(this.mapOffx, this.mapOffy, x, y, this.speed));
		return this;
	};
	/**
	 * 重置移动时8方向分别对应的动作索引编号集合
	 * @returns {link.active.Role}
	 * @param {array} moveDs
	 */
	$.action.Role.prototype.setMoveDs = function(moveDs) {
		this._moveDs = moveDs || [4, 7, 5, 5, 6, -5, -5, -7];
		return this;
	};
	/**
	 * 停止时8方向分别对应的动作索引编号集合
	 * @returns {link.active.Role}
	 * @param {array} stopDs
	 */
	$.action.Role.prototype.setStopDs = function(stopDs) {
		this._stopDs = stopDs || [0, -3, 1, 1, 2, -1, -1, -3];
		return this;
	};
	/**
	 * 执行移动动作
	 * @param {number} index
	 */
	$.action.Role.prototype.doMoveDs = function(index) {
		if (index != null && index >= 0 && index < 8) {
			this.dsIndex = index;
		}
		this.setSprite(this._moveDs[this.dsIndex]);
		return this;
	};
	/**
	 * 执行停止动作
	 * @param {number} index
	 */
	$.action.Role.prototype.doStopDs = function(index) {
		if (index != null && index >= 0 && index < 8) {
			this.dsIndex = index;
		}
		this.setSprite(this._stopDs[this.dsIndex]);
		return this;
	};
	/**
	 * 设置绝对坐标
	 * @returns {link.active.Role}
	 * @param {number} x
	 * @param {number} y
	 * @param {number} mapOffx
	 * @param {number} mapOffy
	 */
	$.action.Role.prototype.mark = function(x, y, mapOffx, mapOffy) {
		if (x != null) {
			this.x = x;
		}
		if (y != null) {
			this.y = y;
		}
		if (mapOffx != null) {
			this.mapOffx = mapOffx; //场景中绝对坐标
		}
		if (mapOffy != null) {
			this.mapOffy = mapOffy;
		}
		return this;
	};
	/**
	 * 更新角色的节点速度[用于计算路径节点的步长]
	 * @returns {link.active.Role}
	 * @param {number} nodeXStep
	 * @param {number} nodeYStep
	 */
	$.action.Role.prototype.setSpeed = function(nodeXStep, nodeYStep) {
		if (nodeXStep) {
			this.speed = Math.abs(nodeXStep);
		}
		this.nodeXStep = nodeXStep;
		this.nodeYStep = nodeYStep;
		return this;
	};
	/**
	 * 设置角色的旋转<br />
	 * [只能设置正数]<br />
	 * @returns {link.active.Role}
	 * @param {number} angle
	 */
	$.action.Role.prototype.setRotate = function(angle) {
	    if (angle != this.angle) {
	        if (Math.abs(angle) > 360) {
	            angle = angle % 360;
	        }
    		this.angle = angle < 0 ? 360 + angle : angle;
	    }
		return this;
	};
	/**
	 * 设置旋转比例变换序列
	 * @returns {link.active.Role}
	 * @param {array} angles
	 */
	$.action.Role.prototype.setRotateTransition = function(angles) {
		if (angles && angles.length > 0) {
			this._angles = angles;
		}
		return this;
	};
	/**
	 * 判断旋转比例变换是否停止
	 * @returns {bool}
	 */
	$.action.Role.prototype.endRotateTransition = function() {
		return this._angles.length == 0;
	};
	/**
	 * 使角色持续平移
	 * @returns {link.active.Role}
	 * @param {number} vx
	 * @param {number} vy
	 */
	$.action.Role.prototype.move = function(vx, vy) {
		if (vx != null) {
			this.x += vx;
		}
		if (vy != null) {
			this.y += vy;
		}
		return this;
	};
	/**
	 * 使角色持续旋转<br />
	 * [正数为顺时针旋转，负数为逆时针旋转]<br />
	 * @returns {link.active.Role}
	 * @param {number} angle
	 */
	$.action.Role.prototype.rotate = function(angle) {
		if (angle != null) {
			this.setRotate(this.angle + angle);
		}
		return this;
	};
	/**
	 * 查询角色是否停止
	 */
	$.action.Role.prototype.stoped = function() {
		return this.svx == null;
	};
	/**
	 * 获取换算过后的帧索引
	 * 注意: 此方法可以自动换算成翻转后的负数索引
	 */
	$.action.Role.prototype.getCurrent = function() {
		return this.current * (this.getSprite().trans == $.trans.TRANS_NONE ? 1 : -1);
	};
	
	//-------------------link.action.Role 实体类定义结束--------------------------------------------
	
	//-------------------link.action.Sprite 实体类定义开始--------------------------------------------
	
	/**
	 * 精灵实体类
	 * @class
	 * @param {array} frames
	 * @param {bool} loop
	 * @param {number} current
	 * @param {number} step
	 */
	$.action.Sprite = function(frames, loop, current, step) {
		this.frames = frames || [];
		this.loop = loop;
		this.current = current || 0;
		this.step = step || 0;
		this.trans = $.trans.TRANS_NONE; //TRANS_NONE正常、TRANS_MIRROR镜像翻转, 如果动作帧的索引为负数表示需要镜像翻转渲染
		this.setFrame(current);
		this.runStep = this.getFrame().step || this.step;
	};
	/**
	 * 设置帧指针
	 * @returns {link.active.Sprite}
	 * @param {number} cf
	 */
	$.action.Sprite.prototype.setFrame = function(cf) {
		this.current = cf >= this.frames.length ? this.frames.length - 1 : cf > 0 ? cf : 0;
		if (this.getFrame().step)
			this.runStep = this.getFrame().step;
		return this;
	};
	/**
	 * 获取帧指针
	 * @returns {object}
	 * @param {number} index
	 */
	$.action.Sprite.prototype.getFrame = function(index) {
		return this.frames[index == null ? this.current : index];
	};
	/**
	 * 下一帧
	 * @returns {link.active.Sprite}
	 */
	$.action.Sprite.prototype.nextFrame = function() {
		if (!this.loop && this.endFrame())
            return this;
		if (this.frames.length > 0) {
			if (this.runStep <= 0) {
				if (this.loop) {
					this.current++;
					this.current %= this.frames.length;
				}
				else {
					if (this.current < this.frames.length - 1) 
						this.current++;
				}
				//如果单帧播放延迟值不为空那以帧的播放延迟为基准，否则以精灵的播放延迟为基准
				if (this.getFrame().step) 
					this.runStep = this.getFrame().step;
				else 
					this.runStep = this.step;
			}
			else {
				this.runStep--;
			}
		}
		return this;
	};
	/**
	 * 上一帧
	 * @returns {link.active.Sprite}
	 */
	$.action.Sprite.prototype.preFrame = function() {
		if (this.frames.length > 0) {
			if (this.runStep <= 0) {
				//this.runStep = this.step;
				if (this.loop) {
					this.current--;
					if (this.current < 0)
						this.current = this.frames.length - 1;
				}
				else {
					if (this.current > 0)
						this.current--;
				}
				
				//如果单帧播放延迟值不为空那以帧的播放延迟为基准，否则以精灵的播放延迟为基准
				if (this.getFrame().step) 
					this.runStep = this.getFrame().step;
				else 
					this.runStep = this.step;
			}
			else {
				this.runStep--;
			}
		}
		return this;
	};
	/**
	 * 判断是否到达动画帧集合尾部
	 * @returns {bool}
	 * @param {number} cr
	 */
	$.action.Sprite.prototype.endFrame = function(cr) {
		var _cr = this.frames.length - 1;
		if (cr != null && cr >= 0 && cr <= this.frames.length - 1)
			_cr = cr;
		return this.current >= _cr && this.runStep == 0;
	};
	/**
	 * 判断是否到达动画帧集合头部
	 * @returns {bool}
	 */
	$.action.Sprite.prototype.firstFrame = function() {
		return this.current == 0 && this.runStep == 0;
	};
	/**
	 * 更改精灵动画播放频率
     * @returns {link.active.Sprite}
	 * @param {number} step
	 */
	$.action.Sprite.prototype.setStep = function(step) {
		this.step = step || 0;
		this.runStep = this.getFrame().step || this.step;
		return this;
	};
	/**
	 * 设置是否循环播放
	 * @returns {link.active.Sprite}
	 * @param {bool} loop
	 */
	$.action.Sprite.prototype.setLoop = function(loop) {
		this.loop = loop;
		return this;
	};
	
	//-------------------link.action.Sprite 实体类定义结束--------------------------------------------
	
	//-------------------link.action.Fragment 实体类定义开始--------------------------------------------
	
	var _getff, 
	_fragmentNext = function(f) {
		if (f.sprites.length > 0) {
			if (f.sprites[0].frames.length > 0) {
				if (f.sprites[0].runStep <= 0) {
					f.sprites[0].runStep = f.sprites[0].step;
					_getff = f.sprites[0].frames.shift();
					if (f.sprites[0].frames.length == 0)
						f.sprites.shift();
				}
				else {
					_getff = f.sprites[0].getFrame();
					f.sprites[0].runStep--;
				}
			}
		}
		else
			_getff = null;
		return _getff;
	};
	
	/**
	 * 动作片段实体类
	 * @class
	 * @param {array} sprites
	 */
	$.action.Fragment = function(sprites) {
		this.sprites = sprites || [];
	};
	/**
	 * 动作片段帧出队列，直到值为null
	 * @returns {object}
	 */
	$.action.Fragment.prototype.queue = function() {
		return _fragmentNext(this);
	};
	
	//-------------------link.action.Fragment 实体类定义结束--------------------------------------------
	
	//兼容大小写
	$.action.role = $.action.Role;
	$.action.sprite = $.action.Sprite;
	$.action.fragment = $.action.Fragment;
	
	return link.action;
});
