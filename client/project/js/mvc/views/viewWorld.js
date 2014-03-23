/**
 * @author Suker
 */
define([
	'lib/link',
	'lib/world'
], function($, World) {
	return $.extend(function(model) {
		this.model = model;
		var _model = this.model;
		//重写初始化文本描述缓冲区
		World.prototype.initWordsCache = function(role, width, height) {
			if (role && role.words) {
				role._wordsDx = -(role.width >> 1) + ((role.width - width) >> 1);
				role._wordsDy = -(role.height + height + 5);
				$.canvas.pass(role._passId).clearScreen().font('12px Arial');
				var _desc = role.words[1], _descW = $.canvas.measureText(_desc), _descX = (width - _descW.width) >> 1, _descY = 25;
				$.canvas.fillStyle('#000').fillText(_desc, _descX - 1, _descY - 1)
				.fillText(_desc, _descX + 1, _descY - 1)
				.fillText(_desc, _descX - 1, _descY + 1)
				.fillText(_desc, _descX + 1, _descY + 1)
				.fillStyle('#FF0').fillText(_desc, _descX, _descY);
				_desc = _descW = _descX = _descY = null;
				$.canvas.font('14px Arial');
				var _name = role.words[0], _nameW = $.canvas.measureText(_name), _nameX = (width - _nameW.width) >> 1, _nameY = 43;
				$.canvas.fillStyle('#000').fillText(_name, _nameX - 1, _nameY - 1)
				.fillText(_name, _nameX + 1, _nameY - 1)
				.fillText(_name, _nameX - 1, _nameY + 1)
				.fillText(_name, _nameX + 1, _nameY + 1)
				.fillStyle(role.words[2] || '#FFF').fillText(_name, _nameX, _nameY);
				_name = _nameW = _nameX = _nameY = null;
				$.canvas.pass();
			}
			return this;
		};
		_model.world = new World({
			width: model.width,
			height: _model.height,
			tw: _model.tw,
			th: _model.th,
			ow: _model.ow,
			oh: _model.oh,
			sw: _model.sw,
			sh: _model.sh,
			wordsNum: _model.wordsNum,
			wordsW: _model.wordsW,
			wordsH: _model.wordsH,
			bubbleNum: _model.bubbleNum, //角色说话气泡数量
			bubbleW: _model.bubbleW, //单元气泡的尺寸
			bubbleH: _model.bubbleH,
			asyncUrl: _model.asyncUrl,
			nodeXStep: _model.nodeXStep,
			nodeYStep: _model.nodeYStep,
			offsetTileNumber: _model.offsetTileNumber,
			tiles: _model.tiles,
			patchs: {"12_5": 49, "12_6": 50, "13_5": 57, "13_6": 58},
			callEventTimeout: _model.callEventTimeout, //事件触发间隔时间
			moveDs: _model.moveDs, //移动时8方向分别对应的动作索引编号集合 0:面朝北, 1:面朝东北 2:面朝东 3:面朝东南 4:面朝南 5:面朝西南 6:面朝西 7:面朝西北 
			stopDs: _model.stopDs
		});
		_model = null;
	}, null, {
		//索敌渲染
		lockEnemyRender: function() {
			var _model = this.model, _getSuperStar = _model.world.getSuperStar();
			if (_getSuperStar && !_getSuperStar.endPath()) {
				$.canvas.strokeStyle('rgba(255, 0, 0, 0.5)')
				.beginPath()
				.arc(_getSuperStar.x, _getSuperStar.y, _model.lockEnemyRadius, 0, 2 * Math.PI)
				.closePath()
				.lineWidth(5)
				.stroke();
			}
			if (_model.lockedRole) {
				$.canvas.drawString('当前锁定角色:' + _model.lockedRole.words[0], 50, 50, '', true, '#ff0', '#000');
			}
			_model = _getSuperStar= null;
			return this;
		},
		//测试按钮渲染
		testBtnsRender: function() {
			var _model = this.model;
			for (var i = 0, btn; btn = _model.testBtns[i]; i++) {
				$.canvas
				.fillStyle('#000').fillRect(btn.x, btn.y, btn.width, btn.height)
				.fillStyle('#FFF').font(_model.font).fillText(btn.value, btn.x + ((btn.width - $.canvas.measureText(btn.value).width) >> 1), btn.y + 24);
			}
			_model = null;
			return this;
		}
	});
});