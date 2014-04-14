/**
 * @author Suker
 * 四叉树分屏算法
 */
define([
    'lib/link'
], function($) {
    //静态变量
    var _maxDepth, _maxChildren, _screenW, _screenH,
    //常量
    NODE_LEFT_TOP = 0,
    NODE_RIGHT_TOP = 1,
    NODE_LEFT_BOTTOM = 2,
    NODE_RIGHT_BOTTOM = 3,
    //节点类
    _Node = $.extend(function(param) {
        //节点的坐标和宽高
        this.x = param.x;
        this.y = param.y;
        this.width = param.width;
        this.height = param.height;
        this.nodes = []; //子节点集合
        this.children = []; //子对象集合
        this.overlapChildren = []; //压住分界线的对象集合
        this._depth = param.depth; //当前节点的深度
    }, null, {
        //添加一个对象
        insert: function(item) {
            if (!item) {
                return this;
            }
            //存在子节点就将对象继续递归添加到子节点中
            if (this.nodes.length > 0) {
                var _node = this.nodes[this.getIndex(item)];
                //处理没有压线的对象，直接放到对应的象限
                if (item.x >= _node.x && item.x + item.width <= _node.x + _node.width &&
                item.y >= _node.y && item.y + item.height <= _node.y + _node.height) {
                    _node.insert(item);
                }
                else {
                    //压线的对象放到压线对象集合中
                    this.overlapChildren.push(item);
                }
                return this;
            }
            //没有子节点就将对象添加到对象集合中
            this.children.push(item);
            var _len = this.children.length;
            //如果深度小于最大深度并且子对象数超过了该节点最大可容纳的对象数则当前节点分裂
            if (this._depth < _maxDepth && _len > _maxChildren) {
                this.split();
                //分裂完后将原来的子节点全部添加到子节点中，并且将该节点的对象集合清空
                for (var i = 0; i < _len; i++) {
                    this.insert(this.children[i]);
                }
                this.children.length = 0;
            }
            return this;
        },
        //获取对象对应所处的象限索引
        getIndex: function(item) {
            //根据xy坐标计算对象处于哪一个象限
            var _isLeft = item.x <= this.x + (this.width >> 1) ? true : false, 
            _isTop = item.y <= this.y + (this.height >> 1) ? true : false;
            if (_isLeft) {
                if (_isTop) {
                    return NODE_LEFT_TOP;
                }
                else {
                    return NODE_LEFT_BOTTOM;
                }
            }
            else {
                if (_isTop) {
                    return NODE_RIGHT_TOP;
                }
                else {
                    return NODE_RIGHT_BOTTOM;
                }
            }
        },
        //节点分裂
        split: function() {
            var _depth = this._depth++, _halfWidth = this.width >> 1, _halfHeight = this.height >> 1;
            this.nodes[NODE_LEFT_TOP] = new _Node({ x: this.x, y: this.y, width: _halfWidth, height: _halfHeight, depth: _depth });
            this.nodes[NODE_RIGHT_TOP] = new _Node({ x: this.x + _halfWidth, y: this.y, width: _halfWidth, height: _halfHeight, depth: _depth });
            this.nodes[NODE_LEFT_BOTTOM] = new _Node({ x: this.x, y: this.y + _halfHeight, width: _halfWidth, height: _halfHeight, depth: _depth });
            this.nodes[NODE_RIGHT_BOTTOM] = new _Node({ x: this.x + _halfWidth, y: this.y + _halfHeight, width: _halfWidth, height: _halfHeight, depth: _depth });
            return this;
        },
        //清除一切节点和对象集合
        clear: function() {
            this.children.length = 0;
            this.overlapChildren.length = 0;
            var _len = this.nodes.length;
            if (_len > 0) {
                for (var i = 0; i < _len; i++) {
                    this.nodes[i].clear();
                }
                this.nodes.length = 0;
            }
            return this;
        },
        //获取当前对象附近的其他对象
        retrieve: function(item) {
            var _out = [];
            //先获取子节点中的对象集合
            if (this.nodes.length > 0) {
                _out.push.apply(_out, this.nodes[this.getIndex(item)].retrieve(item));
            }
            //再获取父节点中的对象集合
            if (this.overlapChildren.length > 0) {
                _out.push.apply(_out, this.overlapChildren);
            }
            if (this.children.length > 0) {
                _out.push.apply(_out, this.children);
            }
            return _out;
        }
    });
    return $.extend(function(param) {
        var _props = $.objExtend({
            x: 0,
            y: 0,
            width: 300,
            height: 300,
            maxDepth: 4,
            maxChildren: 4
        }, param || {});
        //更新静态变量
        _maxDepth = _props.maxDepth; //节点最大深度
        _maxChildren = _props.maxChildren; //节点内最大可容纳的对象数
        _screenW = _props.width; //屏幕宽高
        _screenH = _props.height;
        //创建根节点
        this.root = new _Node({ x: _props.x, y: _props.y, width: _props.width, height: _props.height, depth: 0 });
    }, null, {
        //添加对象
        insert: function(item) {
            //批量添加对象
            if (item instanceof Array) {
                for (var i = 0, len = item.length; i < len; i++) {
                    this.root.insert(items[i]);
                }
            }
            else { //添加一个对象
                this.root.insert(item);
            }
            return this;
        },
        //清空整个四叉树集合
        clear: function() {
            this.root.clear();
            return this;
        },
        //获取当前对象附近的其他对象
        retrieve: function(item) {
            //克隆一个数组返回
            return this.root.retrieve(item).slice(0);
        }
    });
    
});
