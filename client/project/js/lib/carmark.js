/**
 * @author John Carmack
 * trans by Suker
 * 卡马克算法
 */

define([
	'lib/link'
], function($) {
	$.carmark = $.Carmark = $.extend(function(scrW, scrH, titleW, titleH, offsetTileNumber, map, tiles, cache) {
		this.args = {
			carWidth: 0,
			carHeight: 0,
			carTitleWidth: 0,
			carTitleHeight: 0,
			scrWidth: 0,
			scrHeight: 0,
			carx: 0, //卡马克线坐标
			cary: 0,
			mapOffx: 0,  // 缓冲区在地图中的X坐标
			mapOffy: 0, // 缓冲区在地图中的Y坐标
			carBuffer: null,
			carGp: null,
			buffSize: 0,
			titleSize: 0,
			titleW: 0,
			titleH: 0,
			mapLastx: 0,
	        mapLasty: 0,
			map: [[]],
			tilesType: 'array', //array为数组型地砖列表、json为键值型地砖列表
			tiles: null,
			xState: 0,
			yState: 0
		};
		this.args.carx = 0; //卡马克线坐标
		this.args.cary = 0;
		this.args.mapOffx = 0;    // 地图在缓冲区的X偏移量
		this.args.mapOffy = 0;   // 地图在缓冲区的Y偏移量
		this.args.scrWidth = scrW; //屏幕宽高
        this.args.scrHeight = scrH;
        this.args.titleW = titleW; //地砖宽高
        this.tw = this.args.titleW;
        this.args.titleH = titleH;
		this.th = this.args.titleH;
        this.args.buffW = titleW * offsetTileNumber; //外圈缓冲地砖宽高
        this.args.buffH = titleH * offsetTileNumber;
		this.args.map = map; //地图数组
		this.args.tiles = tiles; //地砖数组
		//判断地砖列表类型
		if (this.args.tiles.length != null)
			this.args.tilesType = 'array';
		else
			this.args.tilesType = 'json';
		
        var temp = 0;
        while (temp < this.args.scrWidth) {
            temp += titleW;
        }
        this.args.carWidth = this.args.buffW + temp;
        temp = 0;
        while (temp < this.args.scrHeight) {
            temp += titleH;
        }
        this.args.carHeight = this.args.buffH + temp;
		temp = null;
		
		this.args.titleSH = this.args.map.length;
        this.args.titleSW = this.args.map[0].length;
		//地砖个数
        this.args.carTitleWidth = this.args.carWidth / titleW;
        this.args.carTitleHeight = this.args.carHeight / titleH;
		//创建缓冲区
		if (!this.args.carBuffer) {
			if (cache)
				this.args.carBuffer = cache;
			else {
				this.args.carBuffer = document.createElement('canvas');
			}
			//缓冲区上下文赋值
	        this.args.carGp = this.args.carBuffer.getContext('2d');
		}
		if (this.args.carBuffer.width != this.args.carWidth || 
		this.args.carBuffer.height != this.args.carHeight) {
			this.args.carBuffer.width = this.args.carWidth;
			this.args.carBuffer.height = this.args.carHeight;
			this.args.carBuffer.style.width = this.args.carBuffer.width + 'px';
			this.args.carBuffer.style.height = this.args.carBuffer.height + 'px';
		}
		
        this.args.mapLastx = this.args.titleSW * titleW - this.args.scrWidth;
        this.args.mapLasty = this.args.titleSH * titleH - this.args.scrHeight;
		this.carWidth = this.args.carWidth;
		this.carHeight = this.args.carHeight;
		this.tileW = this.args.titleSW;
		this.tileH = this.args.titleSH;
//		this.mapW = this.tileW * this.args.map[0].length;
//		this.mapH = this.tileH * this.args.map.length;
		this.mapW = this.args.titleW * this.args.map[0].length;
		this.mapH = this.args.titleH * this.args.map.length;
		this.scrWidth = this.args.scrWidth;
		this.scrHeight = this.args.scrHeight;
	}, null, {
		/**
		 * 全绘制缓冲区
		 */
		mapRender: function() {
			this.initBuffer();
		},
		/**
		 * 刷新缓冲区
		 * 这个方法只是把固定缓冲区内的地砖重铺而已
		 * 重画范围受offsetTileNumber值的限制
		 */
		refreshCache: function() {
			var _startI = this.getIndexCarY(), _startJ = this.getIndexCarX(),
			_endI = this.getIndexBuffLastY(), _endJ = this.getIndexBuffLastX();
			for (var _ci = _startI; _ci <= _endI; _ci++) {
				if (!this.args.map[_ci])
					continue;
	            for (var _cj = _startJ; _cj <= _endJ; _cj++) {
	                var tileid = this.args.map[_ci][_cj];
	                if (tileid != 0) {//为0时候代表改块为空
	                    tileid = tileid < 0 ? -tileid : tileid;
						var tile = this.getTile(tileid);;
						if (tile)
							this.args.carGp.drawImage($.getImage(tile.imageid), tile.sx, tile.sy, this.args.titleW, this.args.titleH, _cj * this.args.titleW, _ci * this.args.titleH, this.args.titleW, this.args.titleH);
						tile = null;
	                } 
					else {//以背景色彩填充之
						this.args.carGp.fillStyle = '#000';
						this.args.carGp.fillRect(_cj * this.args.titleW, _ci * this.args.titleH, this.args.titleW, this.args.titleH);
	                    
	                }
	            }
	        }
		},
		/**
		 * 卷动
		 * @param {number} dx
		 * @param {number} dy
		 */
		scroll: function(dx, dy){
			//x方向
			var temp = 0;
			if (dx != 0) {
				temp = dx;
				temp = temp < 0 ? -temp : temp;
				if (temp <= this.args.titleW) {
					this.scrollDelt(dx, 0);
				}
				else {
					var times = temp / this.args.titleW;
					temp = temp % this.args.titleW;
					for (var _si = 0; _si < times; _si++) {
						this.scrollDelt(dx < 0 ? -this.args.titleW : this.args.titleW, 0);
					}
					this.scrollDelt(dx < 0 ? -temp : temp, 0);
				}
			}
			//y方向:
			if (dy != 0) {
				temp = dy;
				temp = temp < 0 ? -temp : temp;
				if (temp <= this.args.titleH) {
					this.scrollDelt(0, dy);
				}
				else {
					var times = temp / this.args.titleH;
					temp = temp % this.args.titleH;
					for (var _si = 0; _si < times; _si++) {
						this.scrollDelt(0, dy < 0 ? -this.args.titleH : this.args.titleH);
					}
					this.scrollDelt(0, dy < 0 ? -temp : temp);
				}
			}
			temp = null;
		},
		/**
		 * 渲染缓冲区
		 * @param {canvas} g  画布上下文
		 * @param {number} x  视口在画布上的xy坐标
		 * @param {number} y
		 */
		paint: function(g, x, y) {
			var tempx = this.args.mapOffx % this.args.carWidth, 
			tempy = this.args.mapOffy % this.args.carHeight, 
	        rightWidth = this.args.carWidth - tempx, 
	        rightHeight = this.args.carHeight - tempy;
	        this.drawRange(g, this.args.carBuffer, tempx, tempy, rightWidth, rightHeight, x, y);//左上区域
	        this.drawRange(g, this.args.carBuffer, 0, tempy, this.args.scrWidth - rightWidth, rightHeight, x + rightWidth, y);
	        this.drawRange(g, this.args.carBuffer, tempx, 0, rightWidth, this.args.scrHeight - rightHeight, x, y + rightHeight);
        	this.drawRange(g, this.args.carBuffer, 0, 0, this.args.scrWidth - rightWidth, this.args.scrHeight - rightHeight, x + rightWidth, y + rightHeight);
			rightHeight = rightWidth = tempy = tempx = null;
		},
		/**
		 * 返回缓冲区上下文
		 */
		getContext: function() {
			return this.args.carGp;
		},
		/**
		 * 返回缓冲区canvas
		 */
		getCanvas: function() {
			return this.args.carBuffer;
		},
		/**
		 * 取场景绝对X坐标
		 */
		getMapOffX: function() {
			return this.args.mapOffx;
		},
		/**
		 * 取场景绝对Y坐标
		 */
		getMapOffY: function() {
			return this.args.mapOffy;
		},
		/**
		 * 取地图数据
		 */
		getMap: function() {
			return this.args.map;
		},
		/**
		 * 设置地图数据
		 * @param {array} map
		 */
		setMap: function(map) {
			this.args.map = null;
			this.args.map = map;
		},
		/**
		 * 获取地砖数据
		 * @param {number} id
		 */
		getTile: function(id) {
			if (this.args.tilesType == 'json') {
				return this.args.tiles['i' + id];
			}
			else if (this.args.tilesType == 'array') {
				return this.args.tiles[id];
			}
			return null;
		},
		/**
		 * 第一次绘制缓冲区
		 */
		initBuffer: function() {
			for (var _ci = 0; _ci < this.args.carTitleHeight; _ci++) {
				if (!this.args.map[_ci])
					continue;
				var _getImg;
	            for (var _cj = 0; _cj < this.args.carTitleWidth; _cj++) {
	                var tileid = this.args.map[_ci][_cj];
	                if (tileid != 0) {//为0时候代表改块为空
	                    tileid = tileid < 0 ? -tileid : tileid;
						var tile = this.getTile(tileid);
						if (tile) {
							_getImg = $.getImage(tile.imageid);
							if (_getImg.loaded) {
								this.args.carGp.drawImage($.getImage(tile.imageid), tile.sx, tile.sy, this.args.titleW, this.args.titleH, _cj * this.args.titleW, _ci * this.args.titleH, this.args.titleW, this.args.titleH);
							}
						}
						tile = null;
	                } 
					else {//以背景色彩填充之
						this.args.carGp.fillStyle = '#000';
						this.args.carGp.fillRect(_cj * this.args.titleW, _ci * this.args.titleH, this.args.titleW, this.args.titleH);
	                    
	                }
	            }
				_getImg = null;
	        }
		},
        /**
         * 卷动一步
         * @param x x轴卷动
         * @param y y轴卷动
         * @returns {boolean}
         */
		scrollDelt: function(x, y) {
			x += this.args.mapOffx;
	        y += this.args.mapOffy;
            // ===============边界检测 Start===================//
	        //视口左边界超出世界地图左边界的时候
	          if (x < 0) {
				this.args.xState = x;
	            return false;
	        }
            //视口上边界超出世界地图上边界的时候
			if (y < 0) {
				this.args.yState = y;
	            return false;
	        }
            //视口右边界超出世界地图右边界的时候
	        if (x > this.args.mapLastx) {
				this.args.xState = x - this.args.mapLastx;
	            this.args.mapOffx = this.args.mapLastx;
	            return false;
	        }
            //视口下边界超出世界地图下边界的时候
	        if (y > this.args.mapLasty) {
				this.args.yState = y - this.args.mapLasty;
	            this.args.mapOffy = this.args.mapLasty;
	            return false;
	        }
            // ================边界检测 End===================//
	        this.updateBuffer(x, y);
		},
		/**
		 * 更新
		 * @param {number} x  缓冲区新的地图X坐标
         * @param {number} y  缓冲区新的地图Y坐标
         */
		updateBuffer: function(x, y) {
			//处理卡马克线
			this.args.mapOffx = x;
	        this.args.mapOffy = y;
            // 右移
	        if (x > this.args.carx + this.args.buffW) {
	            var indexMapLastX = this.getIndexBuffLastX();
//	            if (indexMapLastX < this.args.titleW) {
	                this.copyBufferX(indexMapLastX, this.getIndexCarY(), this.getTitleHeight(),
	                        this.getBufferCarX(), this.getBufferCarY());
	                this.args.carx += this.args.titleW;
//	            }
	        }
            // 左移
	        if (x < this.args.carx) {
	            this.args.carx -= this.args.titleW;
	            this.copyBufferX(this.getIndexCarX(), this.getIndexCarY(), this.getTitleHeight(),
	                    this.getBufferCarX(), this.getBufferCarY());
	        }
            // 下移
	        if (y > this.args.cary + this.args.buffH) {
	            var indexMapLastY = this.getIndexBuffLastY();
//	            if (indexMapLastY < this.args.titleH)
//	            {
	                this.copyBufferY(this.getIndexCarX(), indexMapLastY, this.getTitelWidth(),
	                        this.getBufferCarX(), this.getBufferCarY());
	                this.args.cary += this.args.titleH;
//	            }
	        }
            // 上移
	        if (y < this.args.cary) {
	            this.args.cary -= this.args.titleH;
	            this.copyBufferY(this.getIndexCarX(), this.getIndexCarY(), this.getTitelWidth(),
	                    this.getBufferCarX(), this.getBufferCarY());
	        }
		},
        /**
         * 获得切割线所在的图块索引X
         * @returns {number}
         */
		getIndexCarX: function() {
			return this.args.carx / this.args.titleW;
		},
        /**
         * 获得切割线所在的图块索引Y
         * @returns {number}
         */
		getIndexCarY: function() {
	        return this.args.cary / this.args.titleH;
	    },
        /**
         * 获得切割线在Buffer中的X位置
         * @returns {number}
         */
		getBufferCarX: function() {
	        return this.args.carx % this.args.carWidth;
	    },
        /**
         * 获得切割线在Buffer中的Y位置
         * @returns {number}
         */
		getBufferCarY: function() {
	        return this.args.cary % this.args.carHeight;
	    },
        /**
         * 获得缓冲区后面的X索引
         * @returns {number}
         */
		getIndexBuffLastX: function() {
	        return (this.args.carx + this.args.carWidth) / this.args.titleW;
	    },
        /**
         * 获得缓冲区后面的Y索引
         * @returns {number}
         */
		getIndexBuffLastY: function() {
	        return (this.args.cary + this.args.carHeight) / this.args.titleH;
	    },
        /**
         * 获得当前要绘制的图块高度的数量
         * @returns {number}
         */
		getTitleHeight: function() {
	        return (this.args.carHeight - this.args.cary % this.args.carHeight) / this.args.titleH;
	    },
        /**
         * 获得当前要绘制的图块宽度的数量
         * @returns {number}
         */
		getTitelWidth: function() {
	        return (this.args.carWidth - this.args.carx % this.args.carWidth) / this.args.titleW;
	    },
        /**
         * 由于x方向卷动造成的重绘
         * @param indexMapx
         * @param indexMapy
         * @param titleHeight
         * @param destx
         * @param desty
         */
		copyBufferX: function(indexMapx, indexMapy, titleHeight, destx, desty) {
			var vy;
	        for (var _bj = 0; _bj < titleHeight; _bj++) {
	            vy = _bj * this.args.titleH + desty;
				if (!this.args.map[indexMapy + _bj])
					continue;
	            var tileid = this.args.map[indexMapy + _bj][indexMapx];
	            if (tileid != 0) {
	                tileid = tileid < 0 ? -tileid : tileid;
					var tile = this.getTile(tileid);;
					if (tile)
						this.args.carGp.drawImage($.getImage(tile.imageid), tile.sx, tile.sy, this.args.titleW, this.args.titleH, destx, vy, this.args.titleW, this.args.titleH);
	            	tile = null;
				} 
				else {
	                this.args.carGp.fillStyle = '#000';
					this.args.carGp.fillRect(destx, vy, this.args.titleW, this.args.titleH);
	            }
	        }
	        for (var _bk = titleHeight; _bk < this.args.carTitleHeight; _bk++) {
	            vy = (_bk - titleHeight) * this.args.titleH;
				if (!this.args.map[indexMapy + _bk])
					continue;
	            var tileid = this.args.map[indexMapy + _bk][indexMapx];
	            if (tileid != 0){
	                tileid = tileid < 0 ? -tileid : tileid;
					var tile = this.getTile(tileid);;
					if (tile)
						this.args.carGp.drawImage($.getImage(tile.imageid), tile.sx, tile.sy, this.args.titleW, this.args.titleH, destx, vy, this.args.titleW, this.args.titleH);
	            	tile = null;
				} 
				else {
	                this.args.carGp.fillStyle = '#000';
					this.args.carGp.fillRect(destx, vy, this.args.titleW, this.args.titleH);
	            }
	        }
			vy = null;
		},
        /**
         * 由于y方向卷动造成的重绘
         * @param indexMapx
         * @param indexMapy
         * @param titleWidth
         * @param destx
         * @param desty
         */
		copyBufferY: function(indexMapx, indexMapy, titleWidth, destx, desty) {
			var vx;
	        for (var _ci = 0; _ci < titleWidth; _ci++) {
	            vx = _ci * this.args.titleW + destx;
				if (!this.args.map[indexMapy])
					continue;
	            var tileid = this.args.map[indexMapy][indexMapx + _ci];
	            if (tileid != 0) {
	                tileid = tileid < 0 ? -tileid : tileid;
					var tile = this.getTile(tileid);;
					if (tile)
						this.args.carGp.drawImage($.getImage(tile.imageid), tile.sx, tile.sy, this.args.titleW, this.args.titleH, vx, desty, this.args.titleW, this.args.titleH);
	            	tile = null;
				} 
				else {
					this.args.carGp.fillStyle = '#000';
					this.args.carGp.fillRect(vx, desty, this.args.titleW, this.args.titleH);
	            }
	        }
	        for (var _ck = titleWidth; _ck < this.args.carTitleWidth; _ck++) {
	            vx = (_ck - titleWidth) * this.args.titleW;
				if (!this.args.map[indexMapy])
					continue;
	            var tileid =this.args.map[indexMapy][indexMapx + _ck];
	            if (tileid != 0) {
	                tileid = tileid < 0 ? -tileid : tileid;
					var tile = this.getTile(tileid);;
					if (tile)
						this.args.carGp.drawImage($.getImage(tile.imageid), tile.sx, tile.sy, this.args.titleW, this.args.titleH, vx, desty, this.args.titleW, this.args.titleH);
	            	tile = null;
			    } 
				else {
					this.args.carGp.fillStyle = '#000';
					this.args.carGp.fillRect(vx, desty, this.args.titleW, this.args.titleH);
	            }
	            
	        }
			vx = null
		},
		/**
		 * 绘制一个区
		 * @param {canvas} g
		 * @param {image} img
		 * @param {number} x_src
		 * @param {number} y_src
		 * @param {number} width
		 * @param {number} height
		 * @param {number} x_dest
		 * @param {number} y_dest
		 */
		drawRange: function(g, img, x_src, y_src, width, height, x_dest, y_dest) {
			if (width <= 0 || height <= 0) {
	            return false;
	        }
	        if (width > this.args.scrWidth) {
	            width = this.args.scrWidth;
	        }
	        if (height > this.args.scrHeight) {
	            height = this.args.scrHeight;
	        }
        	g.drawImage(img, x_src, y_src, width, height, x_dest, y_dest, width, height);
		}
	});
	return $.Carmark
	
});
