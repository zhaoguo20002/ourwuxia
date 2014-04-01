/**
 * @author Suker
 * 世界场景数据结构
 */
define([
	'lib/link',
	'data/sceneData',
	'global'
], function($, sceneData, gl) {
	//角色动画序列配置[集中配置方便日后修改]
	var ACTION = {
		STAND_N: 3, //站立 面朝北
		STAND_NE: 2, //站立 面朝东北
		STAND_E: 2, //站立 面朝东
		STAND_SE: 2, //站立 面朝东南
		STAND_S: 0, //站立 面朝南
		STAND_SW: 1, //站立 面朝西南
		STAND_W: 1, //站立 面朝西
		STAND_NW: 1, //站立 面朝西北
		
		WALK_N: 7, //走动 面朝北
		WALK_NE: 6, //走动 面朝东北
		WALK_E: 6, //走动 面朝东
		WALK_SE: 6, //走动 面朝东南
		WALK_S: 4, //走动 面朝南
		WALK_SW: 5, //走动 面朝西南
		WALK_W: 5, //走动 面朝西
		WALK_NW: 5, //走动 面朝西北
		
		RUN_N: 7, //跑动 面朝北
		RUN_NE: 6, //跑动 面朝东北
		RUN_E: 6, //跑动 面朝东
		RUN_SE: 6, //跑动 面朝东南
		RUN_S: 4, //跑动 面朝南
		RUN_SW: 5, //跑动 面朝西南
		RUN_W: 5, //跑动 面朝西
		RUN_NW: 5, //跑动 面朝西北
		
		JUMP_STEP1_N: 7, //轻功1段跳 面朝北
		JUMP_STEP1_NE: 6, //轻功1段跳 面朝东北
		JUMP_STEP1_E: 6, //轻功1段跳 面朝东
		JUMP_STEP1_SE: 6, //轻功1段跳 面朝东南
		JUMP_STEP1_S: 4, //轻功1段跳 面朝南
		JUMP_STEP1_SW: 5, //轻功1段跳 面朝西南
		JUMP_STEP1_W: 5, //轻功1段跳 面朝西
		JUMP_STEP1_NW: 5, //轻功1段跳 面朝西北
		
		JUMP_STEP2_N: 12, //轻功2段跳 面朝北
		JUMP_STEP2_NE: 12, //轻功2段跳 面朝东北
		JUMP_STEP2_E: 12, //轻功2段跳 面朝东
		JUMP_STEP2_SE: 12, //轻功2段跳 面朝东南
		JUMP_STEP2_S: 12, //轻功2段跳 面朝南
		JUMP_STEP2_SW: 12, //轻功2段跳 面朝西南
		JUMP_STEP2_W: 12, //轻功2段跳 面朝西
		JUMP_STEP2_NW: 12, //轻功2段跳 面朝西北
		
		JUMP_STEP3_N: 12, //轻功3段跳 面朝北
		JUMP_STEP3_NE: 12, //轻功3段跳 面朝东北
		JUMP_STEP3_E: 12, //轻功3段跳 面朝东
		JUMP_STEP3_SE: 12, //轻功3段跳 面朝东南
		JUMP_STEP3_S: 12, //轻功3段跳 面朝南
		JUMP_STEP3_SW: 12, //轻功3段跳 面朝西南
		JUMP_STEP3_W: 12, //轻功3段跳 面朝西
		JUMP_STEP3_NW: 12, //轻功3段跳 面朝西北
		
		SPRINT_N: 11, //冲刺 面朝北
		SPRINT_NE: 10, //冲刺 面朝东北
		SPRINT_E: 10, //冲刺 面朝东
		SPRINT_SE: 10, //冲刺 面朝东南
		SPRINT_S: 8, //冲刺 面朝南
		SPRINT_SW: 9, //冲刺 面朝西南
		SPRINT_W: 9, //冲刺 面朝西
		SPRINT_NW: 9, //冲刺 面朝西北
		
		//回撤逃离的方向是脸的朝向和移动方向相反
		FLEE_N: 4, //回撤逃离 面朝北
		FLEE_NE: 5, //回撤逃离 面朝东北
		FLEE_E: 5, //回撤逃离 面朝东
		FLEE_SE: 5, //回撤逃离 面朝东南
		FLEE_S: 7, //回撤逃离 面朝南
		FLEE_SW: 6, //回撤逃离 面朝西南
		FLEE_W: 6, //回撤逃离 面朝西
		FLEE_NW: 6, //回撤逃离 面朝西北
		
		FLEEEND_N: 0, //回撤逃离站定 面朝北
		FLEEEND_NE: 1, //回撤逃离站定 面朝东北
		FLEEEND_E: 1, //回撤逃离站定 面朝东
		FLEEEND_SE: 1, //回撤逃离站定 面朝东南
		FLEEEND_S: 3, //回撤逃离站定 面朝南
		FLEEEND_SW: 2, //回撤逃离站定 面朝西南
		FLEEEND_W: 2, //回撤逃离站定 面朝西
		FLEEEND_NW: 2, //回撤逃离站定 面朝西北
		
		ATTACKS1_N: 11, //攻击招式1 面朝北
		ATTACKS1_NE: 10, //攻击招式1 面朝东北
		ATTACKS1_E: 10, //攻击招式1 面朝东
		ATTACKS1_SE: 10, //攻击招式1 面朝东南
		ATTACKS1_S: 8, //攻击招式1 面朝南
		ATTACKS1_SW: 9, //攻击招式1 面朝西南
		ATTACKS1_W: 9, //攻击招式1 面朝西
		ATTACKS1_NW: 9 //攻击招式1 面朝西北
	};
	return {
		args: {
			world: null,
			font: '14px 微软雅黑',
			width: gl.sys.w,
			height: gl.sys.h,
			tw: 32,
			th: 32,
			ow: 32,
			oh: 32,
			sw: 3,
			sh: 3,
			wordsNum: 30,
			wordsW: 120,
			wordsH: 50,
			bubbleNum: 10, //角色说话气泡数量
			bubbleW: 300, //单元气泡的尺寸
			bubbleH: 100,
			asyncUrl: 'js/lib/asyncAstar.js',
			nodeXStep: 4,
			nodeYStep: 4,
			offsetTileNumber: 2,
			tiles: sceneData.sceneDataMapping ? sceneData.sceneDataMapping.tiles : [],
			callEventTimeout: 100, //事件触发间隔时间
			moveDs: [ACTION.WALK_N, ACTION.WALK_NE, ACTION.WALK_E, ACTION.WALK_SE, ACTION.WALK_S, ACTION.WALK_SW, ACTION.WALK_W, ACTION.WALK_NW], //移动时8方向分别对应的动作索引编号集合 0:面朝北, 1:面朝东北 2:面朝东 3:面朝东南 4:面朝南 5:面朝西南 6:面朝西 7:面朝西北 
			stopDs: [ACTION.STAND_N, ACTION.STAND_NE, ACTION.STAND_E, ACTION.STAND_SE, ACTION.STAND_S, ACTION.STAND_SW, ACTION.STAND_W, ACTION.STAND_NW], //停止时8方向分别对应的动作索引编号集合 索引意义如上
			jumpStep1Ds: [ACTION.JUMP_STEP1_N, ACTION.JUMP_STEP1_NE, ACTION.JUMP_STEP1_E, ACTION.JUMP_STEP1_SE, ACTION.JUMP_STEP1_S, ACTION.JUMP_STEP1_SW, ACTION.JUMP_STEP1_W, ACTION.JUMP_STEP1_NW], //轻功1段跳动作集合
			jumpStep2Ds: [ACTION.JUMP_STEP2_N, ACTION.JUMP_STEP2_NE, ACTION.JUMP_STEP2_E, ACTION.JUMP_STEP2_SE, ACTION.JUMP_STEP2_S, ACTION.JUMP_STEP2_SW, ACTION.JUMP_STEP2_W, ACTION.JUMP_STEP2_NW], //轻功2段跳动作集合
			jumpStep3Ds: [ACTION.JUMP_STEP3_N, ACTION.JUMP_STEP3_NE, ACTION.JUMP_STEP3_E, ACTION.JUMP_STEP3_SE, ACTION.JUMP_STEP3_S, ACTION.JUMP_STEP3_SW, ACTION.JUMP_STEP3_W, ACTION.JUMP_STEP3_NW], //轻功3段跳动作集合
			attacks1Ds: [ACTION.ATTACKS1_N, ACTION.ATTACKS1_NE, ACTION.ATTACKS1_E, ACTION.ATTACKS1_SE, ACTION.ATTACKS1_S, ACTION.ATTACKS1_SW, ACTION.ATTACKS1_W, ACTION.ATTACKS1_NW], //攻击招式1动作集合
			sprintDs: [ACTION.SPRINT_N, ACTION.SPRINT_NE, ACTION.SPRINT_E, ACTION.SPRINT_SE, ACTION.SPRINT_S, ACTION.SPRINT_SW, ACTION.SPRINT_W, ACTION.SPRINT_NW], //冲刺动作集合
			fleeDs: [ACTION.FLEE_N, ACTION.FLEE_NE, ACTION.FLEE_E, ACTION.FLEE_SE, ACTION.FLEE_S, ACTION.FLEE_SW, ACTION.FLEE_W, ACTION.FLEE_NW], //回撤逃离动作集合
			fleeEndDs: [ACTION.FLEEEND_N, ACTION.FLEEEND_NE, ACTION.FLEEEND_E, ACTION.FLEEEND_SE, ACTION.FLEEEND_S, ACTION.FLEEEND_SW, ACTION.FLEEEND_W, ACTION.FLEEEND_NW], //回撤逃离动作集合
			roleStep: 2,
			sceneId: 0, //场景id
			roles: [],
			lockEnemyRadius: 100, //索敌半径
			lockedRole: null //当前锁住的角色
		},
		entity: null
	};
});