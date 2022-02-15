
(function(){
	
	var define;
	if(typeof require){
		define = function(depnames,factory){
			const args=[];
			for(var i =0,j=depnames.length;i<j;i++){
				args.push(require(depnames[i]));
			}
			if(factory) factory.call(this,args);
		};
	}else{
		window.PromiseA = function PromiseA(asyncFn){
			var resolves = [];
			var rejects = [];
			var self= this,status,value;
			this.then=function(onResolve,onReject){
				return new PromiseA(function(resolve,reject){
					if(status==='resolved'){
						if(onResolve){
							var rs = onResolve(value);
							if(rs && typeof rs.then ==='function'){
								rs.then(resolve);
							}else resolve(rs);
						}
					}else if(status=='rejected'){
						if(onReject){
							onReject(value);
							reject(value);
						}
					}else{
						if(onResolve){
							resolves.push({callback:onResolve,resolve:resolve,reject:reject});
						}
						if(onReject){
							rejects.push(onReject);
						}
					}
				});
			}
			var resolve = function(resolveValue){
				value = resolveValue;
				status='resolved';
				for(var i =0,j=resolves.length;i<j;i++){
					var resolveInfo = resolves.shift();
					var rs = resolveInfo.callback.call(self,value);
					if(rs && typeof rs.then){
						rs.then(resolveInfo.resolve,resolveInfo.reject);
					}else resolveInfo.resolve(rs);
				} 
				resolves = undefined;
			}
			var reject = function(rejectValue){
				value = rejectValue;
				status='rejected';
				for(var i =0,j=rejects.length;i<j;i++){
					var rejectHandler = rejects.shift();
					rejectHandler.call(self,value);
				} 
				resolves = undefined;
			}
			setTimeout(function(){asyncFn(resolve,reject)},0)
		}
		if(typeof Promise==='undefined'){
			window.Promise = PromiseA;
		}
		function ajax(opts){
			return ajax.$default(opts);
		}
		ajax.$create=function(config){
			var ajaxInvoker = function(options){
				var opts = {};
				for(var n in ajaxInvoker) {
					if(n==='request'|| n==='response')continue;
					opts[n] = ajaxInvoker[n];
				}
				for(var n in options){
					var val = options[n];
					if(n==='headers'){
						var headers = opts.headers || (opts.headers={});
						for(var h in val) headers[n] = val[n];
					}else{
						opts[n] = options[n];
					}
				}
				var doResolve,doReject;
				var ajaxReturn =  new Promise(function(resolve,reject){
					doResolve = resolve;
					doReject = reject;
				})

				var xhr = ajaxReturn.xhr = new XMLHttpRequest();
				if(ajaxInvoker.request) {
					if(ajaxInvoker.request.call(xhr,opts)===false){
						var e = {reason:'canceled by intereptor'};
						ajaxReturn.error = e;
						if(opts.error)opts.call(xhr,e);
						doReject(e);
						return ajaxReturn;
					}
				}
				ajaxReturn.opts = opts;
				var method = ajaxReturn.method = opts.method || "GET";
				var url = ajaxReturn.url =(opts.url || "").replace(/\s+$/g,'');
				var data = opts.data;
				var contentType = opts.contentType;
				if(!contentType && opts.headers) contentType = opts.headers['Content-Type'];
				if(!contentType) contentType='';
				ajaxReturn.contentType = contentType;
				if(method=='GET'){
					var qs = ajaxInvoker.urlEncode(opts.data)
					if(qs){
						if(url.indexOf('?')<0) url += '?';
						else {
							if(url.lastIndexOf('&')!==url[url.length-1]) url += '&';
							url += qs;
						}
						ajaxReturn.url = url;
					}
					ajaxReturn.data = data = null;
				}else if(method==='POST' || method==='PUT') {
					if(!contentType || contentType ==='application/x-www-form-urlencode'){
						data = ajaxReturn.data = ajaxInvoker.urlEncode(data);
					}else if(contentType==='multipart/form-data'){
						var formData= new FormData();
						for(var n in data) formData.append(n,data[n]);
						data = ajaxReturn.data = formData;
					}else if(contentType=='json' || contentType.indexOf('/json')==contentType.length-5){
						if(typeof data==='object') data =ajaxReturn.data= JSON.stringify(data);
					}
				}
				var async = ajaxReturn.async = opts.async===false?false:true;
				
				xhr.onerror = function(e){
					ajaxReturn.error = e;
					if(opts.error)opts.error(e);
					doReject(e);
				}
				
				xhr.open(method,url,async);
				if(!async){
					xhr.send(data);
					processResponse(xhr,ajaxReturn,doResolve,doReject);
					return ajaxReturn;
				}
				
				xhr.onload = function(){
					processResponse(xhr,ajaxReturn,doResolve,doReject);
				}
				
				return result;
				
				
			};
			var processResponse = function(xhr,ajaxReturn,resolve,reject){
				var response
				if(ajaxInvoker.response) {
					response = ajaxInvoker.response.call(xhr,xhr,opts);
					if(response===false){
						var e = {reason:'canceled by intereptor'}
						if(opts.error)opts.call(xhr,e);
						reject(e);
						return;
					}
				}
				response = xhr.responseText;
				if(opts.dataType==='json'){
					try{
						response = JSON.parse(response);
					}catch(ex){
						ajaxReturn.error = ex;
						if(opts.error) opts.error.call(xhr,ex);
						reject(ex);
					}
				}
				ajaxReturn.response =response;
				if(opts.success)opts.success.call(xhr,response);
				resolve(response);
			}
			ajaxInvoker.urlEncode = function(data){
				if(data===undefined || data===null) return '';
				var t = typeof data,qs = ""
				if(t==='object'){
					if(!qs) qs += '&';
					for(var n in data) {
						qs += encodeURIComponent(n);
						qs += '=';
						qs += encodeURIComponent(data[n]);
					}
				}else qs = data.toString();
				return qs;
			}
			for(var n in config) ajaxInvoker[n] = config[n];
			if(config.name) ajax[config.name] = ajaxInvoker;
			return ajaxInvoker;
		}
		ajax.$default = ajax.$create({name:'$default'});
		window.ajax = ajax;
		
		function Uri(raw,basPathnames,resolveUrl){
			this.raw = raw;
			this.resolved = resolveUrl?resolveUrl(raw):raw;
			var pathnames=this.pathnames=[];
			//将基础的paths拷贝到当前的路径中
			if(basPathnames){
				for(let i =0,j=basPathnames.length;i<j;i++) pathnames.push(basPathnames[i]);
			}
			//将追加的path合并到bas中去，处理. 与..
			var names = this.resolved.split('/');  
			this.filename = names.pop();     
			for(let i = 0,j=names.length;i<j;i++){
				let n = names[i].replace(/(^\s+)|(\s+)$/g,"");
				if(n==="." && pathnames.length) continue;
				else if(n==="..") {
					if(pathnames.length){
						let n1 = pathnames.pop();
						if(n1[0]=='.') pathnames.push(n1);
						else continue;
					}
				}
				else if(!n) continue;
				pathnames.push(n);
			}
			//处理后缀
			let lastIndex = this.filename.lastIndexOf(".");
			if(lastIndex>0) this.ext = this.filename.substr(lastIndex);
			this.pathnames = pathnames
			//合并成最后的url
			if(pathnames.length) this.url = pathnames.join("/") + "/" + filename;
			else this.url = filename;
		}
		const headElement= document.getElementsByTagName('head')[0]
		function Resource(uri){
			this.uri = uri
			var elem
			if(this.uri.ext==='.css'){
				elem = this.element = document.createElement('link')
				elem.type='text/css'
				elem.rel = 'stylesheet'
				elem.href = uri.url
			}else if(this.uri.ext==='.js'){
				elem = this.element = document.createElement('script')
				elem.type='text/javascript'
				elem.src = uri.url
			}
			var self = this
			PromiseA.call(self,function(resolve,reject){
				if(elem.onload!==undefined ){
					elem.onload = function(){
						resolve(elem)
					}
				}else if(elem.onstatereadychange!==undefined){
					elem.onstatereadychange = function(){
						if(this.state===4 || this.state==='complete' && self.load) resolve(elem)
					}
				}
				self.onerror = function(err){
					reject(err)
				}
				headElement.appendChild(elem)
			})
			
		}

		function Module(uri,value){
			var self = this;
			self.exports = {};
			self.dependences = {};
			self.require = function(name){
				if(name===undefined || name===null) return;
				var dep = self.dependences[name];
				if(dep) return dep.value;
				
				var uri = new Uri(name,self.resouce.uri.pathnames);
				var existed = Module.resolve(name,module.resource.uri.pathnames);
				if(existed){
					if(existed.ready) return existed.value;
					if(existed.error) throw new Error('依赖项有错误');
					//阻止后面的factory执行
					existed.ready = true;
				}
				var code = ajax({url:uri.url,method:'get',async:false}).response;
				var fn = new Function(code);

			}
			
			PromiseA.call(this,function(resolve,reject){
				if(uri===undefined){
					resolve(value)
					return;
				}
				self.resource = new Resource(uri);
				self.resource.ready(function(element){
					// 加载第2步骤: resource.ready
					// 获取第一步define函数传递过来的defining
					var defining = Module.defining;
					defining.module = self;
					//定义完成了，模块才完成
					defining.ready(function(value){
						self.ready = true;
						self.value = value;
						resolve(value);
					});
					Module.defining = null;
				}).fail(function(err){self.error = err;reject(err)})
			})
		}
		Module.defining=null;
		Module.caches = {};
		Module.definings =[];

		Module.resolve = function(url,basPathnames){
			var existed = Module.caches[url];
			if(existed) return existed;
			var uri = new Uri(url,basPathnames);
			existed = Module.caches[uri.url];
			if(existed) return existed;
			return Module.caches[uri.url] = new Module(uri);
		};
		define = function(depnames,factory){
			let t = typeof depnames;
			if(t==='string'){
				Module.caches[depnames] = new Module(undefined,factory);
				return;
			}
			// 加载第1步骤: 执行define函数
			// resource.ready会给该defining追加module字段
			// 这里利用了script的load事件是微任务，会先于程序中的宏任务触发的特性。极端情况，define函数执行中，又有新的resource完成。由于前一个resource的onload先进队列，故当前的resource.ready的执行顺序比较靠前，会先执行。
			// 其执行顺序为: 1 define函数 2 resource.ready 3 defining.asyncFn 4 defining.resolve 6 module.resolve
			var defining = Module.defining = new PromiseA(function(resolve,reject){
				var module = defining.module;
				var taskCount = depnames.length+1;
				var args = [];
				var deps ={};
				var tryComplete = function(){
					if(module.ready || module.error) return;
					if(--taskCount==0) {
						if(!factory) return resolve();
						var value ;
						try{
							value = factory.apply(module,args);
						}catch(ex){
							var missingModulename = ex['--missingModuleName'];
							if(missingModulename===undefined) throw ex;
							taskCount++;
							Module.resolve(missingModulename,module.uri.pathnames).ready(function(value){
								deps[missingModulename]
							});
						}
						
						if(value instanceof PromiseA){
							value.ready(resolve);
						}else{
							if (value===undefined) value = module.exports;
							resolve(value);
						}
					}
				}
				for(var i = 0,j=depnames.length;i<j;i++)(function(depname,index){
					if(depname==='exports'){
						var val = args[index] = module.exports;
						deps[depname] = {value:val};
						tryComplete();
						continue;
					}
					if(depname==='require'){
						args[index] = function(name){
							if(name===undefined) return undefined;
							var value = deps[name];
							if(value) return value.value;
							deps[name] = require()
						}
						tryComplete();
						continue;
					}
					Module.resolve(depname,defining.module.uri.pathnames).ready(function(value){
						args[index] =value;
						deps[depname] = {value:value}
						tryComplete();
					})
				})(i,depnames[i])
			});
			tryComplete();
		} // end define
		// 启动第一个模块
		function startup(){}
	} // end if typeof require
	window.define = define;
})()
