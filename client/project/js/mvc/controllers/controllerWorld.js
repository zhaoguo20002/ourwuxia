/**
 * @author Suker
 */
define([
	'lib/link',
	'statics',
	'global'
], function($, statics, gl) {
	return $.extend(function(view) {
		this.view = view;
		var _ctrl = this, _model = _ctrl.view.model;
		
        this.createAcctackingUI();
        //PC快捷键
        $.setKeyCode('a', 65)
        .setKeyCode('s', 83)
        .setKeyCode('d', 68)
        .setKeyCode('jump', 32);
	}, null, {
		//更新场景数据
		updateScene: function(data) {
			var _model = this.view.model, _data = data || [1];
			_model.sceneId = _data[0];
			var _sceneData = sceneDataNameSpace.getScene(_model.sceneId);
			_model.world.update(_sceneData[0], _sceneData[1]);
			_model = _data = _sceneData = null;
			return this;
		},
		//刷新场景
		refreshScene: function() {
			var _model = this.view.model;
			
			_model = null;
			return this;
		},
		//更新场景中角色数据
		updateRoles: function(data) {
			var _model = this.view.model, _data = data || [];
			_model.roles = [
				{ id: 1, name: '主角', desc: '大侠1', spriteId: 10001, x0: 12, y0: 7, speedX: _model.nodeXStep, speedY: _model.nodeYStep, action: 0, host: true, jumpDistance: 200 }
				//{ id: 12, name: '路人甲', desc: '大侠2', spriteId: 10002, x0: 12, y0: 7, speedX: _model.nodeXStep, speedY: _model.nodeYStep, action: 0 }
			];
			// for (var i = 0; i < 200; i++) {
			    // _model.roles.push({ id: 'test' + i, name: '测试' + i, desc: '大侠' + i, spriteId: 10002, x0: $.comm.getRandom(0, 60), y0: $.comm.getRandom(0, 60), speedX: _model.nodeXStep, speedY: _model.nodeYStep, action: 0 });
			// }
			_model = _data = null;
			return this;
		},
		//刷新角色
		refreshRoles: function() {
			var _model = this.view.model;
			for (var i = 0, role; role = _model.roles[i]; i++) {
				_model.world.addRole(role.id, statics.getMapping('role', role.spriteId).getData(), [role.name, role.desc, role.host ? '#0FF' : '#FFF', '#000'], role.x0, role.y0, role.action, _model.roleStep, 'role')
				.setRoleSpeed(role.id, role.speedX, role.speedY)
				.setRoleState(role.id, 'jumpDistance', role.jumpDistance);
				if (role.host) {
					_model.world.setCameraSpeed(_model.tw, _model.th)
					.unFocusRole().focusRole(role.id)
					.setCameraSpeed(_model.sw, _model.sh);
				}
			}
			_model.world.addBullet({
			    id: 'e1',
			    role: man_001NameSpace.get(12),
			    x: 50, y: 50, aimX: 300, aimY: 470, speed: 10
			})
			.addBullet({
                id: 'e2',
                role: man_001NameSpace.get(12),
                x: 700, y: 200, aimX: 220, aimY: 400, speed: 10
            });
            for (var i = 0; i < 100; i++) {
                _model.world.addBullet({
                    id: 'bullet' + i,
                    role: man_001NameSpace.get(12),
                    x: $.comm.getRandom(0, 800), y: $.comm.getRandom(0, 800), aimX: 520, aimY: 400, speed: 10
                });
            }
			_model = null;
			return this;
		},
		//按下事件监听接口
		touchStart: function(offX, offY) {
			var _model = this.view.model;
			_model = null;
			return this;
		},
		//抬起事件监听接口
		touchEnd: function(offX, offY) {
			var _model = this.view.model, _getSuperStar = _model.world.getSuperStar();
			if (_getSuperStar && _getSuperStar.jumpTimes == 0) {
				_getSuperStar.setStep(_model.roleStep).setMoveDs(_model.moveDs).setStopDs(_model.stopDs);
				//寻路
				_model.world.setCameraSpeed(_model.sw, _model.sh).aim(_getSuperStar.id, offX, offY);
				
			}
			_model = _getSuperStar = null;
			return this;
		},
		//主角角色轻功飞
		jump: function(offX, offY) {
			var _model = this.view.model, _getSuperStar = _model.world.getSuperStar();
			if (_getSuperStar) {
				if (_getSuperStar.jumpTimes < 3) {
				    var _arcHeight = null, _num = null;
					switch (_getSuperStar.jumpTimes) {
						case 0: //1段跳动作
						default:
							_getSuperStar.setMoveDs(_model.jumpStep1Ds);
							_arcHeight = 30,
							_num = 40;
							break;
						case 1: //2段跳动作
							_getSuperStar.setMoveDs(_model.jumpStep2Ds);
                            _arcHeight = 35,
                            _num = 45;
							break;
						case 2: //3段跳动作
							_getSuperStar.setMoveDs(_model.jumpStep3Ds);
							_arcHeight = 40,
                            _num = 50;
							break;
					}
					_getSuperStar.setStep(1).setStopDs(_model.stopDs);
					_model.world.setCameraSpeed(_model.tw, _model.th).jump(_getSuperStar.id, offX, offY, 0, _arcHeight, _num);
					_arcHeight = _num = null;
				}
			}
			_model = _getSuperStar = null;
			return this;
		},
		//主角攻击动作
		attack: function() {
			var _model = this.view.model, _getSuperStar = _model.world.getSuperStar();
			if (_getSuperStar && _model.lockedRole) {
				_getSuperStar.setSprite(1).setStep(_model.roleStep).setSprite(_model.attacks1Ds[_model.world.getDsIndex(_getSuperStar.x, _getSuperStar.y, _model.lockedRole.x, _model.lockedRole.y)]);
			}
			_model = _getSuperStar = null;
			return this;
		},
		//主角冲刺
		sprint: function() {
			var _model = this.view.model, _getSuperStar = _model.world.getSuperStar();
			if (_getSuperStar && _model.lockedRole) {
				_getSuperStar.setStep(1).setMoveDs(_model.sprintDs).setStopDs(_model.stopDs);
				_model.world.setCameraSpeed(_model.tw, _model.th).jump(_getSuperStar.id, _model.lockedRole.x, _model.lockedRole.y, 0, 1, 5);
			}
			_model = _getSuperStar = null;
			return this;
		},
		//主角回撤逃离
		flee: function() {
			var _model = this.view.model, _getSuperStar = _model.world.getSuperStar();
			if (_getSuperStar && _model.lockedRole) {
				_getSuperStar.setStep(1).setMoveDs(_model.fleeDs).setStopDs(_model.fleeEndDs);
				var _dX = _getSuperStar.x - (_model.lockedRole.x - _getSuperStar.x >= 0 ? 200 : -200), _dY = _getSuperStar.y - (_model.lockedRole.y - _getSuperStar.y >= 0 ? 200 : -200);
				_model.world.setCameraSpeed(_model.tw, _model.th).jump(_getSuperStar.id, _dX, _dY, 0, null, 15);
				_dX = _dY = null;
			}
			_model = _getSuperStar = null;
			return this;
		},
		//主角轻功飞
		fly: function(startX, startY, offX, offY) {
		    //计算划过屏幕的距离，算出角色应该移动的距离
		    var _model = this.view.model, _getSuperStar = _model.world.getSuperStar();
		    if (_getSuperStar) {
		        var _a = offX - startX,
                _b = offY - startY,
                _c = Math.sqrt(Math.pow(_a, 2) + Math.pow(_b, 2)), //圆半径
                _rotate = (Math.atan2(_b, _a) / Math.PI * 180), _r, _px, _py, _jumpDistancs; 
                _rotate = _rotate >= 0 ? _rotate : _rotate + 360; //角度[90度开始为0度]
				//获取分段条的距离
				switch (_getSuperStar.jumpTimes) {
					case 0: //1段跳距离
					default:
						_jumpDistancs = _getSuperStar.jumpDistance || 100;
						_r = _c > _jumpDistancs ? _jumpDistancs : _c; //限制跳跃距离
						_r = _r < _model.tw * 2 ? _model.tw * 2 : _r; //最少跳2格
						break;
					case 1: //2段跳距离
						_jumpDistancs = _getSuperStar.jumpDistance * 1.5 || 200;
						_r = _jumpDistancs; //固定跳跃距离
						break;
					case 2: //3段跳距离
						_jumpDistancs = _getSuperStar.jumpDistance * 2 || 400;
						_r = _jumpDistancs; //固定跳跃距离
						break;
				}
                _px = _r * Math.cos(_rotate / 180 * Math.PI);
                _py = _r * Math.sin(_rotate / 180 * Math.PI);
                this.jump(_getSuperStar.x + _px, _getSuperStar.y + _py);
				_a = _b = _c = _rotate = _px = _py = _jumpDistancs = null;
		    }
		    _model = _getSuperStar = null;
		    return this;
		},
		//索敌监听
		lockEnemyAction: function() {
			var _model = this.view.model, _getSuperStar = _model.world.getSuperStar();
			if (_getSuperStar && !_getSuperStar.endPath()) {
				var _getShelters = _model.world.getShelters(), _shelter;
				for (var i = _getShelters.length - 1; i >= 0; i--) {
					if (_shelter = _getShelters[i]) {
						if (_shelter.id != _getSuperStar.id && $.comm.circleCollision(_getSuperStar.x, _getSuperStar.y, _model.lockEnemyRadius, _shelter.x, _shelter.y, 1)) {
							_model.lockedRole = _shelter;
						}
					}
				}
				_getShelters = _shelter = null;
			}
			this.view.lockEnemyRender();
			_model = _getSuperStar= null;
			return this;
		},
		//创建战斗UI
		createAcctackingUI: function() {
		    var _model = this.view.model;
		    //初始化战斗UI
            $.buttonLayout.create({ id: 'attackBtn', x: gl.sys.w - 310, y : gl.sys.h, path: $.comm.createPath(gl.sys.w - 310, gl.sys.h, gl.sys.w - 310, gl.sys.h - 50, _model.UIPathStep), width: 80, height: 40, value: '攻击(A)' })
            .create({ id: 'rushBtn', x: gl.sys.w - 220, y : gl.sys.h, path: $.comm.createPath(gl.sys.w - 220, gl.sys.h, gl.sys.w - 220, gl.sys.h - 50, _model.UIPathStep), width: 80, height: 40, value: '突(S)' })
            .create({ id: 'retreatBtn', x: gl.sys.w - 130, y : gl.sys.h, path: $.comm.createPath(gl.sys.w - 130, gl.sys.h, gl.sys.w - 130, gl.sys.h - 50, _model.UIPathStep), width: 80, height: 40, value: '撤(D)' })
            .create({ id: 'changeUIBtn', x: gl.sys.w - 45, y : gl.sys.h, path: $.comm.createPath(gl.sys.w - 45, gl.sys.h, gl.sys.w - 45, gl.sys.h - 50, _model.UIPathStep), width: 40, height: 40, value: '换(C)' });
		    _model = null;
		    return this;
		},
        //清除战斗UI
        clearAcctackingUI: function() {
            var _model = this.view.model;
            $.buttonLayout.gone('attackBtn', $.comm.createPath(gl.sys.w - 310, gl.sys.h - 50, gl.sys.w - 310, gl.sys.h, _model.UIPathStep))
            .gone('rushBtn', $.comm.createPath(gl.sys.w - 220, gl.sys.h - 50, gl.sys.w - 220, gl.sys.h, _model.UIPathStep))
            .gone('retreatBtn', $.comm.createPath(gl.sys.w - 130, gl.sys.h - 50, gl.sys.w - 130, gl.sys.h, _model.UIPathStep));
            _model = null;
            return this;
        },
		//创建非战斗UI
		createPeaceUI: function() {
            var _model = this.view.model;
		    $.buttonLayout.create({ id: 'stateBtn', x: gl.sys.w - 310, y : gl.sys.h, path: $.comm.createPath(gl.sys.w - 310, gl.sys.h, gl.sys.w - 310, gl.sys.h - 50, _model.UIPathStep), width: 80, height: 40, value: '属性' })
            .create({ id: 'bagBtn', x: gl.sys.w - 220, y : gl.sys.h, path: $.comm.createPath(gl.sys.w - 220, gl.sys.h, gl.sys.w - 220, gl.sys.h - 50, _model.UIPathStep), width: 80, height: 40, value: '背包' })
            .create({ id: 'skillBtn', x: gl.sys.w - 130, y : gl.sys.h, path: $.comm.createPath(gl.sys.w - 130, gl.sys.h, gl.sys.w - 130, gl.sys.h - 50, _model.UIPathStep), width: 80, height: 40, value: '武功' });
            _model = null;
		    return this;
		},
        //清除非战斗UI
        clearPeaceUI: function() {
            var _model = this.view.model;
            $.buttonLayout.gone('stateBtn', $.comm.createPath(gl.sys.w - 310, gl.sys.h - 50, gl.sys.w - 310, gl.sys.h, _model.UIPathStep))
            .gone('bagBtn', $.comm.createPath(gl.sys.w - 220, gl.sys.h - 50, gl.sys.w - 220, gl.sys.h, _model.UIPathStep))
            .gone('skillBtn', $.comm.createPath(gl.sys.w - 130, gl.sys.h - 50, gl.sys.w - 130, gl.sys.h, _model.UIPathStep));
            _model = null;
            return this;
        },
		//UI事件监听器
		UIAction: function() {
		    if ($.buttonLayout.pressed('attackBtn') || $.keyPressed('a')) {
                this.attack();
            }
            if ($.buttonLayout.pressed('rushBtn') || $.keyPressed('s')) {
                this.sprint();
            }
            if ($.buttonLayout.pressed('retreatBtn') || $.keyPressed('d')) {
                this.flee();
            }
            if ($.buttonLayout.pressed('changeUIBtn')) {
                if ($.buttonLayout.get('attackBtn')) {
                    this.clearAcctackingUI().createPeaceUI();
                }
                else {
                    this.clearPeaceUI().createAcctackingUI();
                }
            }
		    return this;
		},
		//动画监听器
		action: function() {
			var _model = this.view.model;
			if (_model.world) {
				_model.world.action().render();
				//_model.world.debugRender();
				
				this.lockEnemyAction() //索敌监听
				.UIAction(); //UI事件监听
				// _model.world.getRole(1).rotate(5);
			}
			_model = null;
			return this;
		}
	});
});
