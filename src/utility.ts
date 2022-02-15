"use strict";
namespace utils{

	function modifier(descriptor,target?,name?,value?){
		if(name!==undefined){
			const nt = typeof name
			if(nt==='string'){
				descriptor.value = value
				Object.defineProperty(target,name,descriptor)
			}else if(nt==='object'){
				if(Array.isArray(name)){
					const keys = name
					for(let key of keys) {
						descriptor.value = target[key]
						Object.defineProperty(target,key,descriptor)
					}
				}else {
					const keys = Object.keys(name)
					for(let key of keys) {
						descriptor.value = name[key]
						Object.defineProperty(target,key,descriptor)
					}
				}
				
			}else throw new Error('name必须是字串或者对象')
		}else {
			let keys = Object.keys(target)
			for(let key of keys) {
				descriptor.value = target[key]
				Object.defineProperty(target,key,descriptor)
			}
		}
	}
	
	/**
	 * 成员装饰器 - 固定值装饰器
	 *
	 * @export
	 * @param {(Object|Function)} [target]
	 * @param {(string|Object|string[])} [name]
	 * @param {*} [value]
	 * @returns
	 */
	export function constant(target?:Object|Function,name?:string|Object|string[],value?:any){
		let descriptor ={enumerable:true,writable:false,configurable:false,value:undefined}
		if(target===undefined){
			return function(target,name?){
				return modifier(descriptor,target.prototype||target,name)
			}
		}else return modifier(descriptor,target,name,value)
	}
	export function readonly(target?:Object|Function,name?:string|Object|string[],value?:any){
		let descriptor ={enumerable:true,writable:false,configurable:true,value:undefined}
		if(target===undefined){
			return function(target,name?){
				return modifier(descriptor,target.prototype||target,name)
			}
		}else return modifier(descriptor,target,name,value)
	}
	export function internal(target?:Object|Function,name?:string|Object|string[],value?:any){
		let descriptor ={enumerable:false,writable:false,configurable:true,value:undefined}
		if(target===undefined){
			return function(target,name?){
				return modifier(descriptor,target.prototype||target,name)
			}
		}else return modifier(descriptor,target,name,value)
	}
	
	export function secret(target?:Object|Function,name?:string|Object|string[],value?:any){
		let descriptor ={enumerable:false,writable:false,configurable:false,value:undefined}
		if(target===undefined){
			return function(target,name?){
				return modifier(descriptor,target.prototype||target,name)
			}
		}else return modifier(descriptor,target,name,value)
	}
	
	
	export function implicit(target?:Object|Function,name?:string|Object|string[],value?:any){
		let descriptor ={enumerable:false,writable:true,configurable:true,value:undefined}
		if(target===undefined){
			return function(target,name?){
				return modifier(descriptor,target.prototype||target,name)
			}
		}else return modifier(descriptor,target,name,value)
	}
	
	export function argnames(fn:Function | { new(...args): any }): string[]{
		if((fn as any)['--argnames']) return (fn as any)['--argnames']
		const code = fn.toString()
		const begin = code.indexOf('(')
		const end = code.indexOf(')', begin)
		const argslist= code.substr(begin+1, end-begin-1)
		let args = argslist.split(',')
		for(let i =0, j= args.length; i<j; i++){
			let arg = args.shift().replace(trimRegx,'')
			args.push(arg)
		}
		secret(fn, '--argnames', Object.freeze(args))
		return args
	}
	export function createInstance(ctor: {new(...args):any} | Function, args?: any[]){
		// 创建一个空对象，继承构造函数的原型对象
		let res = Object.create(ctor.prototype);
		  // 执行构造函数，传递上下文和参数
		let ret;
		if(!args || args.length===0) ret = ctor.call(res)
		else if(args.length===1) ret = ctor.call(res, args.shift())
		else ret = ctor.apply(res, args || []);
		if (typeof ret === 'object' && ret !== null) {
		  return ret
		} else {
		  return res
		}
	}
	
	/**
	 * 是否是数组
	 *
	 * @export
	 * @param {*} o 要判定的值
	 * @returns 数组返回true,否则返回false
	 */
	 export function is_array(o) { return Object.prototype.toString.call(o)==='[object Array]' }
	
	 /**
	  * 数组是否包含某元素
	  *
	  * @export
	  * @param {*} arr array like object/数组
	  * @param {*} item 要判定的项值
	  * @returns item在数组种返回true, 否则返回false
	  */
	 export function array_contains(arr,item) {
		 if(arr)for(let i = 0,j=arr.length;i<j;i++) { if(arr[i]===item) return true }
		 return false
	 }
	 
	 /**
	  * 从数组中移除某个元素,可以将数组中所有的item移除
	  *
	  * @export
	  * @param {*} arr 要移除元素的数组
	  * @param {*} item 要移除的元素
	  * @returns 被移除的元素个数，0表示没有元素被移除
	  */
	 export function array_remove(arr,item) {
		 let c = 0;
		 if(arr)for(let i = 0,j=arr.length;i<j;i++) { 
			 let existed = arr.shift();if(item!==existed) {arr.push(existed)} else c++; }
		 return c;
	 }
	 
	 const intRegx = /^\s*[0-9]+\s*$/g
	 export function is_int(o) {
		 if(o===undefined || o ===null) return false
		 if(o instanceof Number) return true
		 return intRegx.test(o.toString())
	 }
	 const trimRegx = /^s+|s+$/gi
	 export function trim(o) {
		 if(o===null || o===undefined) return ''
		 return o.toString().replace(trimRegx,'')
	 }
	
	 const ltrimRegx = /^s+|s+$/gi
	 export function ltrim(o) {
		 if(o===null || o===undefined) return ''
		 return o.toString().replace(ltrimRegx,'')
	 }
	
	 const rtrimRegx = /^s+|s+$/gi
	 export function rtrim(o) {
		 if(o===null || o===undefined) return ''
		 return o.toString().replace(rtrimRegx,'')
	 }
}