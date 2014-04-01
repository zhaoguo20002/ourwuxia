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
		 $.buttonLayout.create({ id: 'attackBtn', x: gl.sys.w - 300, y : gl.sys.h - 50, width: 80, height: 40, value: '攻击(A)' })
         .create({ id: 'rushBtn', x: gl.sys.w - 200, y : gl.sys.h - 50, width: 80, height: 40, value: '突(S)' })
         .create({ id: 'retreatBtn', x: gl.sys.w - 100, y : gl.sys.h - 50, width: 80, height: 40, value: '撤(D)' });
         
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
				{ id: 1, name: '主角', desc: '大侠1', spriteId: 10001, x0: 10, y0: 10, speedX: _model.nodeXStep, speedY: _model.nodeYStep, action: 0, host: true },
				{ id: 12, name: '路人甲', desc: '大侠2', spriteId: 10002, x0: 12, y0: 12, speedX: _model.nodeXStep, speedY: _model.nodeYStep, action: 0 }
			];
			for (var i = 0; i < 200; i++) {
			    _model.roles.push({ id: 'test' + i, name: '测试' + i, desc: '大侠' + i, spriteId: 10002, x0: $.comm.getRandom(0, 60), y0: $.comm.getRandom(0, 60), speedX: _model.nodeXStep, speedY: _model.nodeYStep, action: 0 });
			}
			_model = _data = null;
			return this;
		},
		//刷新角色
		refreshRoles: function() {
			var _model = this.view.model;
			for (var i = 0, role; role = _model.roles[i]; i++) {
				_model.world.addRole(role.id, statics.getMapping('role', role.spriteId).getData(), [role.name, role.desc, role.host ? '#0FF' : '#FFF', '#000'], role.x0, role.y0, role.action, _model.roleStep, 'role')
				.setRoleSpeed(role.id, role.speedX, role.speedY);
				if (role.host) {
					_model.world.setCameraSpeed(_model.tw, _model.th)
					.unFocusRole().focusRole(role.id)
					.setCameraSpeed(_model.sw, _model.sh);
				}
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
			var _model = this.view.model;
			var getSuperStar = _model.world.getSuperStar();
			if (getSuperStar) {
				getSuperStar.setStep(_model.roleStep).setMoveDs(_model.moveDs).setStopDs(_model.stopDs);
				//寻路
				_model.world.setCameraSpeed(_model.sw, _model.sh).aim(getSuperStar.id, offX, offY);
				
			}
			_model = null;
			return this;
		},
		//主角角色轻功飞
		jump: function(offX, offY) {
			var _model = this.view.model, _getSuperStar = _model.world.getSuperStar();
			if (_getSuperStar) {
				if (_getSuperStar.jumpTimes <= 3) {
					switch (_getSuperStar.jumpTimes) {
						case 0: //1段跳动作
						default:
							_getSuperStar.setMoveDs(_model.jumpStep1Ds);
							break;
						case 1: //2段跳动作
							_getSuperStar.setMoveDs(_model.jumpStep2Ds);
							break;
						case 2: //3段跳动作
							_getSuperStar.setMoveDs(_model.jumpStep3Ds);
							break;
					}
					_getSuperStar.setStep(1).setStopDs(_model.stopDs);
//					_model.world.setCameraSpeed(_model.tw, _model.th).jump(_getSuperStar.id, offX, offY, 0, null, 15);
					_model.world.setCameraSpeed(_model.tw, _model.th).jump(_getSuperStar.id, offX, offY);
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
		//动画监听器
		action: function() {
			var _model = this.view.model;
			if (_model.world) {
				_model.world.action().render();
				
				this.lockEnemyAction(); //索敌监听
				
				if ($.buttonLayout.pressed('attackBtn')) {
					this.attack();
				}
				if ($.buttonLayout.pressed('rushBtn')) {
					this.sprint();
				}
				if ($.buttonLayout.pressed('retreatBtn')) {
					this.flee();
				}
			}
			_model = null;
			return this;
		}
	});
});
