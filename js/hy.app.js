(function(global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		(global.app = factory());
})(this, function() {
	var app = (function(document) {
		var $ = function(selector, context) {
			context = context || document;
			if(!selector)
				return armedobject();
			if(typeof selector === 'object')
				if($.isArrayLike(selector)) {
					return armedobject([].slice.call(selector), null);
				} else {
					return armedobject([selector], null);
				}
			if(typeof selector === 'function')
				return $.ready(selector);//$(function(){...});
			if(typeof selector === 'string') {
				selector = selector.trim();
				if(/^#([\w-]+)$/.test(selector)) {
					var found = document.getElementById(RegExp.$1); //$("#id");
					return armedobject(found ? [found] : []);
				}
				return armedobject($.querySelectorAll(selector, context), selector); //$(".class");
			}
			return armedobject();
		};
		//为选取的DOM元素扩展方法
		function armedobject(domList, selector) {
			domList = domList || [];
			Object.setPrototypeOf(domList, $.fn);//将选取的DOM元素设为$.fn对象的上下文
			domList.selector = selector || '';
			return domList;
		};
		return $;
	})(document);
	
	/**
	 * 静态方法封装
	 * @param {Object} $
	 */
	(function($) {
		/**
		 * each  遍历对象
		 * @param {type} elements
		 * @param {type} callback
		 */
		$.each = function(elements, callback, hasOwnProperty) {
			if(!elements) {
				return this;
			}
			if(typeof elements.length === 'number') {
				[].every.call(elements, function(el, idx) {
					return callback.call(el, idx, el) !== false;
				});
			} else {
				for(var key in elements) {
					if(hasOwnProperty) {
						if(elements.hasOwnProperty(key)) {
							if(callback.call(elements[key], key, elements[key]) === false) return elements;
						}
					} else {
						if(callback.call(elements[key], key, elements[key]) === false) return elements;
					}
				}
			}
			return this;
		};
		/**
		 * 是否是空对象
		 * @param {Object} o
		 */
		$.isEmptyObject = function(o) {
			for(var p in o) {
				if(p !== undefined) {
					return false;
				}
			}
			return true;
		};
	})(app);

	(function($) {
		/**
		 * querySelectorAll
		 * @param {type} selector
		 * @param {type} context
		 * @returns {Array}
		 */
		$.querySelectorAll = function(selector, context) {
			context = context || document;
			return [].slice.call(/^\.([\w-]+)$/.test(selector) ? context.getElementsByClassName(RegExp.$1) : /^[\w-]+$/.test(selector) ? context.getElementsByTagName(selector) : context.querySelectorAll(selector));
		};
		var class2type = {};
		$.each(['Boolean', 'Number', 'String', 'Function', 'Array', 'Date', 'RegExp', 'Object', 'Error'], function(i, name) {
			class2type["[object " + name + "]"] = name.toLowerCase();
		});
		/**
		 * 对象的类型
		 * @param {Object} obj
		 */
		$.type = function(obj) {
			return obj == null ? String(obj) : class2type[{}.toString.call(obj)] || "object";
		};
		/**
		 * isArrayLike 
		 * @param {Object} obj
		 */
		$.isArrayLike = function(obj) {
			var length = !!obj && "length" in obj && obj.length;
			var type = $.type(obj);
			if(type === "function" || $.isWindow(obj)) {
				return false;
			}
			return type === "array" || length === 0 ||
				typeof length === "number" && length > 0 && (length - 1) in obj;
		};
		/**
		 * 是否为window
		 * @param {Object} obj
		 */
		$.isWindow = function(obj) {
			return obj != null && obj === obj.window;
		};
		/**
		 * 当文档加载完毕时
		 * @param {type} callback
		 * @returns $
		 */
		$.ready = function(callback) {
			if (/complete|loaded|interactive/.test(document.readyState)) {
				callback($);
			} else {
				document.addEventListener('DOMContentLoaded', function() {
					callback($);
				}, false);
			}
			return this;
		};
	})(app);
	
	(function($) {
		/**
		 * $.fn 依赖上下文的原型扩展对象
		 */
		$.fn = {
			each: function(callback) {
				[].every.call(this, function(el, idx) {
					return callback.call(el, idx, el) !== false;
				});
				return this;
			}
		};
	})(app);
	
	(function($) {
		if('ontouchstart' in window) {
			$.isTouchable = true;
			$.EVENT_START = 'touchstart';
			$.EVENT_MOVE = 'touchmove';
			$.EVENT_END = 'touchend';
		} else {
			$.isTouchable = false;
			$.EVENT_START = 'mousedown';
			$.EVENT_MOVE = 'mousemove';
			$.EVENT_END = 'mouseup';
		}
		$.EVENT_CANCEL = 'touchcancel';
		$.EVENT_CLICK = 'click';

		var _mid = 1;
		var delegates = {};
		//需要wrap的函数
		var eventMethods = {
			preventDefault: 'isDefaultPrevented',
			stopImmediatePropagation: 'isImmediatePropagationStopped',
			stopPropagation: 'isPropagationStopped'
		};
		//默认true返回函数
		var returnTrue = function() {
			return true
		};
		//默认false返回函数
		var returnFalse = function() {
			return false
		};
		//wrap浏览器事件
		var compatible = function(event, target) {
			if(!event.detail) {
				event.detail = {
					currentTarget: target
				};
			} else {
				event.detail.currentTarget = target;
			}
			$.each(eventMethods, function(name, predicate) {
				var sourceMethod = event[name];
				event[name] = function() {
					this[predicate] = returnTrue;
					return sourceMethod && sourceMethod.apply(event, arguments)
				}
				event[predicate] = returnFalse;
			}, true);
			return event;
		};
		//简单的wrap对象_mid
		var mid = function(obj) {
			return obj && (obj._mid || (obj._mid = _mid++));
		};
		//事件委托对象绑定的事件回调列表
		var delegateFns = {};
		
		//返回事件委托的wrap事件回调
		var delegateFn = function(element, event, selector, callback) {
			return function(e) {
				//same event
				var callbackObjs = delegates[element._mid][event];
				var handlerQueue = [];
				var target = e.target;
				var selectorAlls = {};
				for(; target && target !== document; target = target.parentNode) {
					if(target === element) {
						break;
					}
					if(~['click', 'tap', 'doubletap', 'longtap', 'hold'].indexOf(event) && (target.disabled || target.classList.contains('mui-disabled'))) {
						break;
					}
					var matches = {};
					$.each(callbackObjs, function(selector, callbacks) { //same selector
						selectorAlls[selector] || (selectorAlls[selector] = $.qsa(selector, element));
						if(selectorAlls[selector] && ~(selectorAlls[selector]).indexOf(target)) {
							if(!matches[selector]) {
								matches[selector] = callbacks;
							}
						}
					}, true);
					if(!$.isEmptyObject(matches)) {
						handlerQueue.push({
							element: target,
							handlers: matches
						});
					}
				}
				selectorAlls = null;
				e = compatible(e); //compatible event
				$.each(handlerQueue, function(index, handler) {
					target = handler.element;
					var tagName = target.tagName;
					if(event === 'tap' && (tagName !== 'INPUT' && tagName !== 'TEXTAREA' && tagName !== 'SELECT')) {
						e.preventDefault();
						e.detail && e.detail.gesture && e.detail.gesture.preventDefault();
					}
					$.each(handler.handlers, function(index, handler) {
						$.each(handler, function(index, callback) {
							if(callback.call(target, e) === false) {
								e.preventDefault();
								e.stopPropagation();
							}
						}, true);
					}, true)
					if(e.isPropagationStopped()) {
						return false;
					}
				}, true);
			};
		};
		var findDelegateFn = function(element, event) {
			var delegateCallbacks = delegateFns[mid(element)];
			var result = [];
			if(delegateCallbacks) {
				result = [];
				if(event) {
					var filterFn = function(fn) {
						return fn.type === event;
					}
					return delegateCallbacks.filter(filterFn);
				} else {
					result = delegateCallbacks;
				}
			}
			return result;
		};
		var preventDefaultException = /^(INPUT|TEXTAREA|BUTTON|SELECT)$/;
		/**
		 * @param {type} event
		 * @param {type} selector
		 * @param {type} callback
		 * @returns {undefined}
		 */
		$.fn.on = function(event, selector, callback) { //简单的事件委托,主要是tap事件使用，类似mouse,focus之类暂不封装支持
			return this.each(function() {
				var element = this;
				mid(element);
				mid(callback);
				var isAddEventListener = false;
				var delegateEvents = delegates[element._mid] || (delegates[element._mid] = {}); //委托事件
				var delegateCallbackObjs = delegateEvents[event] || ((delegateEvents[event] = {}));
				if($.isEmptyObject(delegateCallbackObjs)) {
					isAddEventListener = true;
				}
				var delegateCallbacks = delegateCallbackObjs[selector] || (delegateCallbackObjs[selector] = []);
				delegateCallbacks.push(callback);//回调队列
				if(isAddEventListener) {
					var delegateFnArray = delegateFns[mid(element)];
					if(!delegateFnArray) {
						delegateFnArray = [];
					}
					var delegateCallback = delegateFn(element, event, selector, callback);
					delegateFnArray.push(delegateCallback);
					delegateCallback.i = delegateFnArray.length - 1;
					delegateCallback.type = event;
					delegateFns[mid(element)] = delegateFnArray;
					element.addEventListener(event, delegateCallback);
					if(event === 'tap') { //TODO 需要找个更好的解决方案
						element.addEventListener('click', function(e) {
							if(e.target) {
								var tagName = e.target.tagName;
								if(!preventDefaultException.test(tagName)) {
									if(tagName === 'A') {
										var href = e.target.href;
										if(!(href && ~href.indexOf('tel:'))) {
											e.preventDefault();
										}
									} else {
										e.preventDefault();
									}
								}
							}
						});
					}
				}
			});
		};
		$.fn.off = function(event, selector, callback) {
			return this.each(function() {
				var _mid = mid(this);
				if(!event) { //mui(selector).off();
					delegates[_mid] && delete delegates[_mid];
				} else if(!selector) { //mui(selector).off(event);
					delegates[_mid] && delete delegates[_mid][event];
				} else if(!callback) { //mui(selector).off(event,selector);
					delegates[_mid] && delegates[_mid][event] && delete delegates[_mid][event][selector];
				} else { //mui(selector).off(event,selector,callback);
					var delegateCallbacks = delegates[_mid] && delegates[_mid][event] && delegates[_mid][event][selector];
					$.each(delegateCallbacks, function(index, delegateCallback) {
						if(mid(delegateCallback) === mid(callback)) {
							delegateCallbacks.splice(index, 1);
							return false;
						}
					}, true);
				}
				if(delegates[_mid]) {
					//如果off掉了所有当前element的指定的event事件，则remove掉当前element的delegate回调
					if((!delegates[_mid][event] || $.isEmptyObject(delegates[_mid][event]))) {
						findDelegateFn(this, event).forEach(function(fn) {
							this.removeEventListener(fn.type, fn);
							delete delegateFns[_mid][fn.i];
						}.bind(this));
					}
				} else {
					//如果delegates[_mid]已不存在，删除所有
					findDelegateFn(this).forEach(function(fn) {
						this.removeEventListener(fn.type, fn);
						delete delegateFns[_mid][fn.i];
					}.bind(this));
				}
			});
		}
	})(app);
	
	return app;
});