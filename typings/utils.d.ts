declare namespace utils {
    /**
     * 成员装饰器 - 固定值装饰器
     *
     * @export
     * @param {(Object|Function)} [target]
     * @param {(string|Object|string[])} [name]
     * @param {*} [value]
     * @returns
     */
    function constant(target?: Object | Function, name?: string | Object | string[], value?: any): void | ((target: any, name?: any) => void);
    function readonly(target?: Object | Function, name?: string | Object | string[], value?: any): void | ((target: any, name?: any) => void);
    function internal(target?: Object | Function, name?: string | Object | string[], value?: any): void | ((target: any, name?: any) => void);
    function secret(target?: Object | Function, name?: string | Object | string[], value?: any): void | ((target: any, name?: any) => void);
    function implicit(target?: Object | Function, name?: string | Object | string[], value?: any): void | ((target: any, name?: any) => void);
    function argnames(fn: Function | {
        new (...args: any[]): any;
    }): string[];
    function createInstance(ctor: {
        new (...args: any[]): any;
    } | Function, args?: any[]): any;
    /**
     * 是否是数组
     *
     * @export
     * @param {*} o 要判定的值
     * @returns 数组返回true,否则返回false
     */
    function is_array(o: any): boolean;
    /**
     * 数组是否包含某元素
     *
     * @export
     * @param {*} arr array like object/数组
     * @param {*} item 要判定的项值
     * @returns item在数组种返回true, 否则返回false
     */
    function array_contains(arr: any, item: any): boolean;
    /**
     * 从数组中移除某个元素,可以将数组中所有的item移除
     *
     * @export
     * @param {*} arr 要移除元素的数组
     * @param {*} item 要移除的元素
     * @returns 被移除的元素个数，0表示没有元素被移除
     */
    function array_remove(arr: any, item: any): number;
    function is_int(o: any): boolean;
    function trim(o: any): any;
    function ltrim(o: any): any;
    function rtrim(o: any): any;
}
