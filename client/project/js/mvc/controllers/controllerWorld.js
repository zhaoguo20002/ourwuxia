/**
 * @author Suker
 */
define([
	'lib/link',
	'statics'
], function($, statics) {
	return $.extend(function(view) {
		this.view = view;
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
				{ id: 1, name: '主角', desc: '丐帮', spriteId: 10001, x0: 10, y0: 10, action: 0, host: true },
				{ id: 12, name: '路人甲', desc: '酱油男', spriteId: 10001, x0: 20, y0: 20, action: 0 }
			];
			_model = _data = null;
			return this;
		},
		//刷新角色
		refreshRoles: function() {
			var _model = this.view.model;
			for (var i = 0, role; role = _model.roles[i]; i++) {
				_model.world.addRole(role.id, statics.getMapping('role', role.spriteId).getData(), [role.name, role.desc, role.host ? '#FFF' : '#0FF', '#000'], role.x0, role.y0, role.action, _model.roleStep, 'role');
				if (role.host) {
					_model.world.unFocusRole().focusRole(role.id);
				}
			}
			_model = null;
			return this;
		},
		//按下事件监听接口
		touchStart: function(offX, offY) {
			var _model = this.view.model;
			var getSuperStar = _model.world.getSuperStar();
			if (getSuperStar) {
				_model.world.aim(getSuperStar.id, offX, offY);
				
			}
			_model = null;
			return this;
		},
		//动画监听器
		action: function() {
			var _model = this.view.model;
			if (_model.world) {
				_model.world.action().render();
			}
			_model = null;
			return this;
		}
	});
});
