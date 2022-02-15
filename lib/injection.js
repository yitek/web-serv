"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const trimRegx = /(^\s+)|(\s+$)/g;
const variableRegx = /\$\{([^\}]+)\}/g;
const loadExecRegx = /^%([^%]+)%(\+?)$/g;
class Injection {
    constructor(_name, opts, parent) {
        var _a;
        let name, value = Injection, factory, ctor, isSingleon;
        if (opts === undefined) {
            if (_name instanceof Injection) {
                parent = _name;
            }
            else if (typeof _name === 'object') {
                opts = _name;
            }
            else
                name = (_a = _name) === null || _a === void 0 ? void 0 : _a.toString();
        }
        else if (parent === undefined) {
            if (typeof _name === 'object') {
                parent = opts;
                opts = _name;
            }
            else {
                name = _name;
                if (opts instanceof Injection) {
                    parent = opts;
                    opts = undefined;
                }
            }
        }
        else {
            name = _name;
        }
        if (opts) {
            if (typeof opts === 'object') {
                if (!name)
                    name = opts.$name;
                if (opts.$value !== undefined)
                    value = opts.$value;
                else if (Object.getOwnPropertyDescriptor(opts, '$value'))
                    value = undefined;
                factory = opts.$factory;
                ctor = opts.$type;
                isSingleon = opts.$isSingleon;
            }
            else {
                value = opts;
                opts = undefined;
            }
        }
        utils_1.constant(this, 'name', name);
        utils_1.constant(this, 'injectParent', parent);
        let match;
        if (typeof value === 'string') {
            if (variableRegx.test(value)) {
                let tmpl = value;
                value = Injection;
                factory = (injection) => tmpl.replace(variableRegx, (text, varname) => { var _a; return (_a = this.resolveInjection(tmpl)) === null || _a === void 0 ? void 0 : _a.resolveInjectionValue(); });
            }
        }
        utils_1.implicit(this, "_value", value);
        if (ctor) {
            let t = typeof ctor;
            if (t === 'string') {
                loadExecRegx.lastIndex = 0;
                if (match = loadExecRegx.exec(ctor)) {
                    let libFile = match[1];
                    isSingleon = match[2];
                    factory = (injection) => {
                        libFile = injection.replaceVariables(libFile);
                        const inst = require(libFile);
                        if (typeof inst === 'function') {
                            utils_1.constant(this, 'ctor', inst);
                        }
                        else
                            utils_1.constant(this, '_value', inst);
                        return this.resolveInjectionValue();
                    };
                    ctor = undefined;
                }
                else {
                    factory = (injection) => {
                        var _a;
                        let depname = ctor;
                        const inst = (_a = this.resolveInjection(depname)) === null || _a === void 0 ? void 0 : _a.resolveInjectionValue();
                        if (!inst)
                            throw new Error('无法找到');
                        utils_1.constant(this, 'ctor', inst);
                        return this.resolveInjectionValue();
                    };
                    ctor = undefined;
                }
            }
            else {
                if (t !== 'function')
                    throw new Error('$ctor必须是string/Function');
                utils_1.constant(this, 'ctor', ctor);
            }
        }
        if (isSingleon)
            utils_1.constant(this, 'isSingleon', isSingleon);
        if (factory)
            utils_1.constant(this, 'factory', factory);
        if (opts)
            this.setOptions(opts);
    }
    setOptions(opts) {
        const names = Object.getOwnPropertyNames(opts);
        for (let prop of names) {
            if (prop[0] === '$')
                continue;
            if (!this._dependences)
                utils_1.secret(this, '_dependences', {});
            let propValue = opts[prop];
            this._dependences[prop] = new Injection(prop, propValue, this);
        }
        if (!this.ctor)
            utils_1.constant(this, 'factory', (item) => {
                let ret = {};
                for (let name of names)
                    ret[name] = this.resolveInjection(name);
                return ret;
            });
    }
    get value() {
        return this._value === Injection ? undefined : this._value;
    }
    get injectRoot() {
        if (this._injectRoot)
            return this._injectRoot;
        let injection = this;
        while (injection) {
            this._injectRoot = injection;
            injection = injection.injectParent;
        }
        utils_1.constant(this, '_injectRoot', this._injectRoot);
        return this._injectRoot;
    }
    /**
     * 根据名称获取依赖/配置项
     * get表示向下(子级方向)深度优先查找
     * @param {string} name 依赖/配置项名称
     * @returns {Injection} null 为未找到
     * @memberof Injection
     */
    getInjection(name) {
        if (this._dependences)
            return this._dependences[name];
        return null;
    }
    /**
     * 根据数据路径获取依赖/配置项
     * get表示向下(子级方向)深度优先查找
     * 可支持:
     *  user.name 在本项开始，查找user,如果有继续查找user上的name项
     *  $.profile 在从根(root)项开始，查找profile项
     *  ../hosts 从本项的上级项开始，查找hosts项
     * @param {(string|string[])} pathnames
     * @returns {Injection}
     * @memberof Injection
     */
    getInjectionPath(pathnames) {
        if (typeof pathnames === 'string')
            pathnames = pathnames.split('.');
        let injection = this;
        let pathname;
        while (pathname = pathnames.shift()) {
            if (pathname === '$')
                injection = this.injectRoot;
            else if (pathname === '..')
                injection = injection.injectParent;
            else
                injection = injection._dependences ? injection._dependences[pathname] : null;
            if (!injection)
                return null;
        }
        return injection;
    }
    /**
     * 广度优先查找某个特定名称项
     * find表示向下(子级方向)广度优先查找
     * @param {string} name
     * @returns {Injection}
     * @memberof Injection
     */
    findInjection(name) {
        const containers = [this];
        let container;
        while (container = containers.shift()) {
            if (container._dependences) {
                let injection = container._dependences[name];
                if (injection)
                    return injection;
                for (let n in container._dependences) {
                    containers.push(container._dependences[n]);
                }
            }
        }
        return null;
    }
    /**
     * 用依赖逻辑查找特定名称项
     * 即首先查找当前项的直接依赖项(dependences)
     * 如果未找到(表示未定义依赖项)，则查找上级项中是否包含该名称的项(该依赖可能是由上级定义的，如果本项有，表示覆盖上级配置)，直到根项
     *
     * @param {string} name 依赖项名称
     * @returns {Injection} 找到的依赖项,null为未找到
     * @memberof Injection
     */
    resolveInjection(name) {
        let item = this;
        while (item) {
            if (item._dependences) {
                let injection = item._dependences[name];
                if (injection)
                    return injection;
            }
            item = item.injectParent;
        }
        return null;
    }
    /**
     * 在某个指定依赖项查找范围上(默认本项为依赖项查找范围)，构建本项的值
     *
     * @param {Injection} [scope] 依赖项查找范围
     * @returns {*} 本项定义的值
     * @memberof Injection
     */
    resolveInjectionValue(scope) {
        var _a;
        if (this._value !== Injection)
            return this._value;
        if (!scope)
            scope = this;
        if (this.ctor) {
            const argnames = Injection.argnames(this.ctor);
            const args = [];
            for (let argname of argnames) {
                let dep = scope.resolveInjection(argname);
                let argv = (_a = dep) === null || _a === void 0 ? void 0 : _a.resolveInjectionValue(scope);
                args.push(argv);
            }
            let instance = Injection.createInstance(this.ctor, args);
            if (this.isSingleon)
                utils_1.constant(this, '_value', instance);
            return instance;
        }
        if (this.factory) {
            const value = this.factory(this, scope);
            if (this.isSingleon)
                utils_1.constant(this, '_value', value);
            return value;
        }
        return this._value;
    }
    resolveExec(name) {
        let injection = this;
        while (injection) {
            const exec = this._execs ? this._execs[name] : null;
            if (exec)
                return exec;
            injection = injection.injectParent;
        }
        return null;
    }
    replaceVariables(text) {
        return text.replace(variableRegx, (text, varname) => { var _a; return (_a = this.getInjectionPath(varname)) === null || _a === void 0 ? void 0 : _a.resolveInjectionValue(); });
    }
    registerExec(name, value) {
        if (!this._execs)
            utils_1.secret(this, '_execs', {});
        this._execs[name] = value;
        return this;
    }
    registerConstant(name, value) {
        if (!this._dependences)
            utils_1.secret(this, '_dependences', {});
        const dep = this._dependences[name] = new Injection(name, this);
        utils_1.constant(dep, '_value', value);
        return dep;
    }
    registerVariable(name, value) {
        if (!this._dependences)
            utils_1.secret(this, '_dependences', {});
        const dep = this._dependences[name] = new Injection(name, this);
        if (variableRegx.test(value)) {
            utils_1.readonly(dep, 'factory', (container) => {
                variableRegx.lastIndex = 0;
                return value.replace(variableRegx, (text, varname) => {
                    let varia = this.resolveInjection(varname);
                    if (varia)
                        return varia.resolveInjectionValue();
                    return text;
                });
            });
            utils_1.constant(dep, 'value', Injection);
        }
        else {
            utils_1.constant(dep, 'value', value);
        }
        return dep;
    }
    registerFactory(name, factory, isSingleon) {
        if (!this._dependences)
            utils_1.secret(this, '_dependences', {});
        const dep = this._dependences[name] = new Injection(name, this);
        utils_1.constant(dep, 'isSingleon', isSingleon);
        utils_1.constant(dep, 'factory', factory);
        return dep;
    }
    registerType(name, ctor, isSingleon) {
        if (!this._dependences)
            utils_1.secret(this, '_dependences', {});
        const dep = this._dependences[name] = new Injection(name, this);
        utils_1.constant(dep, 'ctor', ctor);
        utils_1.constant(dep, 'isSingleon', isSingleon);
        return dep;
    }
    registerDependence(name, value) {
        if (!this._dependences)
            utils_1.secret(this, '_dependences', {});
        return this._dependences[name] = new Injection(name, value, this);
    }
    createScope(name, opts) {
        const scope = new Injection(opts, this);
        utils_1.constant(scope, 'scopeName', name);
        return scope;
    }
    static argnames(fn) {
        if (fn['--argnames'])
            return fn['--argnames'];
        const code = fn.toString();
        const begin = code.indexOf('(');
        const end = code.indexOf(')', begin);
        const argslist = code.substr(begin + 1, end - begin - 1);
        let args = argslist.split(',');
        for (let i = 0, j = args.length; i < j; i++) {
            let arg = args.shift().replace(trimRegx, '');
            args.push(arg);
        }
        utils_1.secret(fn, '--argnames', Object.freeze(args));
        return args;
    }
    static createInstance(ctor, args) {
        // 创建一个空对象，继承构造函数的原型对象
        let res = Object.create(ctor.prototype);
        // 执行构造函数，传递上下文和参数
        let ret;
        if (!args || args.length === 0)
            ret = ctor.call(res);
        else if (args.length === 1)
            ret = ctor.call(res, args.shift());
        else
            ret = ctor.apply(res, args || []);
        if (typeof ret === 'object' && ret !== null) {
            return ret;
        }
        else {
            return res;
        }
    }
}
Injection.global = new Injection('<GLOBAL>');
function testBasic() {
    function C(a, b) {
        this.a = a;
        this.b = b;
        this.x = a + b;
    }
    Injection.global.registerConstant('a', 12);
    Injection.global.registerFactory('b', () => 13);
    Injection.global.registerType('c', C);
    const c = Injection.global.resolveInjection('c').resolveInjectionValue();
    console.assert(c instanceof C, "c Instanceof C");
    console.assert(c.a === 12 && c.b === 13, '');
}
function testCacedite() {
    function Cls(a, b, c, d) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }
    const scope = Injection.global.createScope('sub');
    scope.registerConstant('c', 14);
    scope.registerConstant('d', 15);
    scope.registerType('cls', Cls);
    const obj = scope.resolveInjection('cls').resolveInjectionValue();
    console.assert(obj instanceof Cls);
    console.assert(obj.a === 12 && obj.b == 13 && obj.c == 14 && obj.d === 15);
    console.log('complet testCacedite');
}
testBasic();
testCacedite();
//# sourceMappingURL=injection.js.map