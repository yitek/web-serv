interface IAssertResult {
    expected?: any;
    actual?: any;
    value?: any;
    message?: string;
    assertValue?: boolean;
    type: Function;
}
export declare class Assert {
    results: IAssertResult[];
    constructor();
    message(content: string, data?: any): Assert;
    compare(expected: any, actual: any, message?: string): Assert;
    equal(expected: any, actual: any, message?: string): Assert;
    true(value: boolean, message?: string): Assert;
    false(value: boolean, message?: string): Assert;
}
declare class Namespace {
    tag: string;
    children: Namespace[];
    tests: any[];
    attrs: any;
    constructor(name: string);
    find(subname: string): Namespace;
    sub(subname: string): Namespace;
    test(name: string, des: string | {
        (assert: Assert): any;
    }, fn?: (assert: Assert) => any): Namespace;
}
export declare class Unittest {
    static rootNS: Namespace;
    static _autoTick: any;
    static _auto: number;
    static dom: any;
    static auto(auto?: boolean): void;
    static namespace(name: string): Namespace;
    static render: (node?: Namespace) => any;
}
export declare function DomRender(node: Namespace): HTMLFieldSetElement;
export {};
