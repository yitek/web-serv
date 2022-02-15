export interface InjectionOptions {
    $name?: string;
    $ctor?: string | Function;
    $value?: any;
    $factory?: (injection: Injection) => any;
    $isSingleon?: boolean;
    [name: string]: any;
}
declare class Injection {
    name?: any;
    isSingleon?: boolean;
    factory?: (injection: Injection, scope: Injection) => any;
    ctor?: {
        new (...args: any[]): any;
    };
    injectParent?: Injection;
    private _injectRoot?;
    private _dependences?;
    private _value?;
    private _execs?;
    constructor(_name?: InjectionOptions | Injection | string, opts?: any, parent?: Injection);
    setOptions(opts: InjectionOptions): void;
    get value(): any;
    get injectRoot(): Injection;
    /**
     * 根据名称获取依赖/配置项
     * get表示向下(子级方向)深度优先查找
     * @param {string} name 依赖/配置项名称
     * @returns {Injection} null 为未找到
     * @memberof Injection
     */
    getInjection(name: string): Injection;
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
    getInjectionPath(pathnames: string | string[]): Injection;
    /**
     * 广度优先查找某个特定名称项
     * find表示向下(子级方向)广度优先查找
     * @param {string} name
     * @returns {Injection}
     * @memberof Injection
     */
    findInjection(name: string): Injection;
    /**
     * 用依赖逻辑查找特定名称项
     * 即首先查找当前项的直接依赖项(dependences)
     * 如果未找到(表示未定义依赖项)，则查找上级项中是否包含该名称的项(该依赖可能是由上级定义的，如果本项有，表示覆盖上级配置)，直到根项
     *
     * @param {string} name 依赖项名称
     * @returns {Injection} 找到的依赖项,null为未找到
     * @memberof Injection
     */
    resolveInjection(name: string): Injection;
    /**
     * 在某个指定依赖项查找范围上(默认本项为依赖项查找范围)，构建本项的值
     *
     * @param {Injection} [scope] 依赖项查找范围
     * @returns {*} 本项定义的值
     * @memberof Injection
     */
    resolveInjectionValue(scope?: Injection): any;
    resolveExec(name: string): Function;
    replaceVariables(text: string): string;
    registerExec(name: string, value: Function): Injection;
    registerConstant(name: string, value: any): Injection;
    registerVariable(name: string, value: string): Injection;
    registerFactory(name: string, factory: (injection: Injection) => any, isSingleon?: boolean): Injection;
    registerType(name: string, ctor: {
        new (...args: any[]): any;
    } | Function, isSingleon?: boolean): Injection;
    registerDependence(name: string, value: any): Injection;
    createScope(name: string, opts?: any): Injection;
    static argnames(fn: Function | {
        new (...args: any[]): any;
    }): string[];
    static createInstance(ctor: {
        new (...args: any[]): any;
    } | Function, args?: any[]): any;
    static global: Injection;
}
export {};
