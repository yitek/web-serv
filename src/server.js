const http = require('http');
const net  = require('net');
const url  = require('url');
const querystring = require('querystring');
const path = require('path');
const fs= require('fs');

const hostConfigs = {
	public_dir : __dirname
	,root_dir: __dirname
}
class HttpContext{
	constructor(req,res){
		this.req = req
		this.res = res
	}
	get method(){return this.req.method}
	get url(){return this.req.url}
	get uri(){
		if(this.__uri) return this.__uri
		return this.__uri = url.parse(this.req.url)
	}
}
class Command{
	constructor(ctrlrCls,actionName){
		this.controllerCls = ctrlrCls
		this.actionName = actionName
	}
	execute(ctx){
		const ctrlr = new this.controllerCls(ctx)
		let actionResult = ctrlr[this.actionName].call(ctrlr,ctx.post)
		if(typeof actionResult==='object'){
			actionResult = JSON.stringify(actionResult)
		}
		ctx.res.end(actionResult)
	}
}
//响应错误
function echoError(code,message,context){
	context.res.writeHead(code,{'Content-Type':'text/html'});
    context.res.write("<h1 style='color:red'>Error</h1>");
    context.res.end(message);
}
let commandCaches = {}

function handleCommand(ctx){
	const cmdname = ctx.uri.pathname
	let cmd = commandCaches[cmdname]
	if(!cmd){
		const paths = ctx.uri.pathname.split('/')
		const ctrlrname = paths[1]
		const controller_file = path.join(hostConfigs.root_dir,ctrlrname + ".js")
		fs.access(controller_file,(err)=>{
			if(err) {
				echoError(404,'controller is not found:' + ctx.uri.pathname,ctx)
				return
			}else {
				loadController(ctrlrname,controller_file)
				cmd = commandCaches[cmdname]
				if(!cmd)  echoError(500,'action is not found:' + ctx.uri.pathname,ctx)
				else cmd.execute(ctx)
			}
		})
	}else {
		cmd.execute(ctx)
	}
}
function loadController(ctrlrname,controller_file){
	const exps = require(controller_file)
	const ctrlrCls = exps.default
	for(let n of Object.getOwnPropertyNames(ctrlrCls.prototype)){
		if(n!=='constructor' && /^[a-zA-Z]/.test(n) && typeof ctrlrCls.prototype[n]==='function'){
			let cmd = new Command(ctrlrCls,n)
			commandCaches['/'+ctrlrname+'/' + n] = cmd
		}
	}
}
function handleGet(ctx){
	ctx.get = querystring.parse(ctx.uri.querystring)
	handleCommand(ctx)
}
function handlePost(ctx){
	let post = '';
    ctx.req.on('data',(chunk)=>{
        post+=chunk;
    });
    ctx.req.on('end',()=>{
        //将字符串变为json的格式
        //post  =  querystring.parse(post);
        //向前端返回字符串
        ctx.post = JSON.parse(post)
		handleCommand(ctx)
    });
}


const server = new http.Server();
console.log("Created");
server.on('request',(req,res)=>{
	const ctx = new HttpContext(req,res)
	if(req.method==='GET'){
		const filename = path.join(hostConfigs.public_dir, ctx.uri.pathname);
		fs.readFile(filename,function(err,data){
			if(err){
				handleGet(ctx)
			}
			else{
				let at = ctx.url.lastIndexOf('.')
				if(at>=0) {
					let ext = ctx.url.substring(at)
					if(ext==='.js') res.writeHead(200,{"Content-Type":'application/javascript'})
					else if(ext==='.json') res.writeHead(200,{"Content-Type":'text/json'})
				}
				ctx.res.end(data)
			}
		});
	}else if(req.method==='POST'){
		handlePost(ctx)
	}
	return
	console.log(uri);
    
    //设置应答头信息
    res.writeHead(200,{'Content-Type':'text/html'});
    res.write('hello we are family<br>');
    res.end('server already end\n');
});
server.on('close',()=>{
    console.log('Closing.');
});
server.listen(8080);
console.log("Listen on 8080...");
