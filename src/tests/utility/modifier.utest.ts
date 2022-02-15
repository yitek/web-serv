import {Unittest,Assert} from '../../unittest'
import {constant,readonly,secret,implicit} from '../../utility'

Unittest.namespace("utility").test('constant',`固定值修饰器
给设置固定值成员,该成员访问属性为公开、只读，不能修改、配置`,(ast:Assert)=>{
	ast.message('在对象上设置固定值')
	const obj:any = {}
	constant(obj,'c',3)
	let name:string
	for(let n in obj) name = n
	ast.true(name=='c',`可以用for in 访问设置的成员:names[0]=='c'`)
	let err
	try{obj.c = 4}catch(ex){err=ex}
	ast.true(err,`修改该成员值会报错`)
	err=null
	try{delete obj.c}catch(ex){err=ex}
	ast.true(err,`配置该成员报错`)
})