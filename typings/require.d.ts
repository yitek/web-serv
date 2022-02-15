interface IRequireDefine {
    (deps: string[], factory?: (...args: any[]) => any): any;
}
interface IRequireResource {
    url: string;
    type: string;
    element: HTMLElement;
    loaded: (valOrCallback?: any) => any;
    error: (valOrCallback?: any) => any;
}
interface IRequireUri {
    paths: string[];
    raw: string;
    resolved: string;
    url: string;
    filename: string;
    ext: string;
}
