"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertTokenRegx = /\(([^\)]+)\)/gi;
const rtrimRegx = /\s+$/gi;
const trimRegx = /^\s+|\s+$/gi;
//const tokenRegx = /(?:\\\{)|(\{([a-zA-Z_][a-zA-Z0-9_]*(?:.[a-zA-Z_][a-zA-Z0-9_]*)*)\})/gi
const tokenRegx = /(?:\\\{)|(?:\{(([a-zA-Z_][a-zA-Z0-9_]*)((?:.(?:[a-zA-Z_][a-zA-Z0-9_]*))*))\})/gi;
function replace_token(content, data) {
    if (content === null || content === undefined)
        return "";
    if (data) {
        return content.toString().replace(tokenRegx, (t, t0, tname, subs) => {
            let d = data[tname];
            if (subs) {
                subs = subs.split('.');
                for (let i = 1, j = subs.length; i < j; i++)
                    d = d[subs[i]];
            }
            return d;
        });
    }
    return content.toString();
}
class Assert {
    constructor() {
        this.results = [];
    }
    message(content, data) {
        this.results.push({
            type: Assert.prototype.message,
            message: replace_token(content, data),
            assertValue: true
        });
        return this;
    }
    compare(expected, actual, message) {
        let d = {
            type: Assert.prototype.compare,
            message: message,
            expected: JSON.stringify(expected),
            actual: JSON.stringify(actual),
            assertValue: compare(expected, actual)
        };
        d.message = message ? replace_token(message, d) : "";
        this.results.push(d);
        return this;
    }
    equal(expected, actual, message) {
        let d = {
            type: Assert.prototype.equal,
            message: message,
            expected: expected,
            actual: actual,
            assertValue: expected === actual
        };
        d.message = message ? replace_token(message, d) : "";
        this.results.push(d);
        return this;
    }
    true(value, message) {
        let d = {
            type: Assert.prototype.equal,
            message: message,
            value: value,
            assertValue: value === true
        };
        d.message = message ? replace_token(message, d) : "true";
        this.results.push(d);
        return this;
    }
    false(value, message) {
        let d = {
            type: Assert.prototype.equal,
            message: message,
            value: value,
            assertValue: value === false
        };
        d.message = message ? replace_token(message, d) : "false";
        this.results.push(d);
        return this;
    }
}
exports.Assert = Assert;
for (let n in Assert.prototype) {
    let afn = Assert.prototype[n];
    if (typeof afn === 'function')
        afn.toString = () => n;
}
function array_contains(arr, item) {
    for (let i = 0, j = arr.length; i < j; i++) {
        if (arr[i] === item)
            return true;
    }
    return false;
}
function compare(expected, actual, exactly) {
    if (!expected || !actual)
        return expected === actual;
    let t = typeof expected;
    if (t !== 'object')
        return expected === actual;
    if (typeof expected.push === 'function' && expected.length !== undefined) {
        if (exactly && expected.length !== actual.length)
            return false;
        for (let i in expected) {
            if (!compare(expected[i], actual[i], exactly))
                return false;
        }
        return true;
    }
    for (let n in expected) {
        if (!compare(expected[n], actual[n], exactly))
            return false;
    }
    if (exactly)
        for (let n in actual) {
            if (!compare(expected[n], actual[n], exactly))
                return false;
        }
    return true;
}
function makeCodes(fn, as) {
    const fnText = fn.toString();
    const codes = fnText.split('\n');
    let line = codes.shift();
    let match = assertTokenRegx.exec(line);
    assertTokenRegx.lastIndex = 0;
    if (!match)
        return false;
    const assertCodeRegx = new RegExp('^\\s*' + match[1] + '.([a-z]+)\\s*\\(');
    let cds = [];
    for (let i = 0, j = codes.length - 1; i < j; i++) {
        line = codes.shift();
        match = assertCodeRegx.exec(line);
        if (match) {
            cds.push({ tag: "assert", attrs: as.shift() });
        }
        else {
            cds.push(line.replace(rtrimRegx, ''));
        }
    }
    return cds;
}
class Namespace {
    constructor(name) {
        this.tag = "namespace";
        this.attrs = { 'name': name };
    }
    find(subname) {
        var _a;
        let arr = this.children;
        if (arr)
            for (let i = 0, j = arr.length; i < j; i++)
                if (((_a = arr[i].attrs) === null || _a === void 0 ? void 0 : _a.name) === subname)
                    return arr[i];
    }
    sub(subname) {
        let sub = this.find(subname);
        if (!sub) {
            (this.children || (this.children = [])).push(sub = new Namespace(subname));
        }
        return sub;
    }
    test(name, des, fn) {
        if (!fn) {
            if (typeof des === 'function') {
                fn = des;
                des = undefined;
            }
        }
        let assert = new Assert();
        if (Unittest._auto !== undefined) {
            Unittest._auto = 1;
            Unittest.auto();
        }
        fn(assert);
        let codes = makeCodes(fn, assert.results);
        (this.tests || (this.tests = [])).push({
            tag: 'test',
            attrs: { name: name, description: des },
            children: codes
        });
        return this;
    }
}
class Unittest {
    static auto(auto) {
        if (auto !== false) {
            Unittest._auto = 1;
            if (!Unittest._autoTick) {
                let render = () => {
                    if (Unittest.rootNS) {
                        let dom = Unittest.render(Unittest.rootNS);
                        if (this.render === DomRender) {
                            let body = Unittest.dom || document.body;
                            body.appendChild(dom);
                        }
                        Unittest.rootNS = null;
                        this._auto = 1000;
                    }
                    else {
                        this._auto += 100;
                        if (this._auto > 1000 * 60 + 10) {
                            this._auto = 0;
                        }
                        else
                            Unittest._autoTick = setTimeout(render, this._auto);
                    }
                };
                Unittest._autoTick = setTimeout(render, this._auto);
            }
        }
        else {
            Unittest._auto = undefined;
            if (Unittest._autoTick) {
                clearTimeout(Unittest._autoTick);
                Unittest._autoTick = 0;
            }
        }
    }
    static namespace(name) {
        let ns = name.split('/');
        let nsNode = Unittest.rootNS || (Unittest.rootNS = new Namespace("#root"));
        for (let v of ns) {
            nsNode = nsNode.sub(v);
        }
        return nsNode;
    }
}
exports.Unittest = Unittest;
Unittest.render = (node) => {
    if (!node)
        node = Unittest.rootNS;
    console.group(node.attrs.name);
    if (node.tests) {
        for (let test of node.tests) {
            console.group(test.attrs.name);
            for (let line of test.children) {
                if (typeof line === 'string')
                    console.log(line.replace(trimRegx, ''));
                else {
                    let attrs = line.attrs;
                    if (attrs.assertValue) {
                        console.warn(attrs.message, attrs);
                    }
                    else {
                        console.error(attrs.message, attrs);
                    }
                }
            }
            console.groupEnd();
        }
    }
    if (node.children) {
        for (let child of node.children)
            Unittest.render(child);
    }
    console.groupEnd();
};
function DomRender(node) {
    if (!node)
        node = Unittest.rootNS;
    let nsDom = document.createElement('fieldset');
    nsDom.className = 'unittest';
    let caption = document.createElement("legend");
    nsDom.appendChild(caption);
    caption.innerHTML = node.attrs.name;
    if (node.tests) {
        let ul = document.createElement('ul');
        nsDom.appendChild(ul);
        ul.className = "tests";
        for (let test of node.tests) {
            let li = document.createElement("li");
            ul.appendChild(li);
            li.className = "test";
            let caption = document.createElement("h4");
            li.appendChild(caption);
            caption.innerHTML = test.attrs.name;
            if (test.attrs.description) {
                let des = document.createElement('pre');
                li.appendChild(des);
                des.className = 'description';
                des.innerHTML = test.attrs.description;
            }
            if (test.children && test.children.length) {
                let codeOL = document.createElement('ol');
                li.appendChild(codeOL);
                codeOL.className = "codes";
                let preLi;
                for (let line of test.children) {
                    let li = makeCodeLi(line);
                    if (li.tagName === 'PRE')
                        preLi.appendChild(li);
                    else if (li.tagName === "LI") {
                        codeOL.appendChild(preLi = li);
                    }
                    else if (li.length && li.push) {
                        for (let i = 0, j = li.length; i < j; i++)
                            codeOL.appendChild(li[i]);
                    }
                }
                let clr = document.createElement("li");
                codeOL.appendChild(clr);
                clr.className = 'clr';
                clr.style.cssText = "clear:both";
            }
        }
    }
    if (node.children) {
        for (let child of node.children) {
            let childDom = Unittest.render(child);
            nsDom.appendChild(childDom);
        }
    }
    return nsDom;
}
exports.DomRender = DomRender;
const commentRegx = /^\s*\/\//g;
const commentWithCommandRegx = /^(\s*)\/\/\[([a-zA-Z]+)\]/g;
function makeCodeLi(code) {
    if (typeof code === 'string') {
        let li = document.createElement('li');
        let lineDom = document.createElement("code");
        li.appendChild(lineDom);
        let codeDom = document.createElement("pre");
        lineDom.appendChild(codeDom);
        if (commentRegx.test(code)) {
            li.className = 'comment-line';
            commentWithCommandRegx.lastIndex = 0;
            let mch = commentWithCommandRegx.exec(code);
            if (!mch) {
                codeDom.innerHTML = code;
                return li;
            }
            let cmtCmd = mch[2];
            debugger;
            if (cmtCmd === 'ln') {
                let li1 = document.createElement("li");
                codeDom.innerHTML = code.replace(/\[[a-zA-Z]+\]/g, '');
                return [li1, li];
            }
        }
        else {
            li.className = 'code-line';
            codeDom.innerHTML = code;
        }
        return li;
    }
    else if (code.attrs.type === Assert.prototype.message) {
        let li = document.createElement('li');
        let preDom = document.createElement("div");
        li.appendChild(preDom);
        li.className = 'message';
        preDom.innerHTML = '\t/* ' + code.attrs.message + ' */';
        return li;
    }
    else {
        let attrs = code.attrs;
        let insDom = document.createElement("pre");
        insDom.innerHTML = "\t/* " + code.attrs.message + " */";
        if (attrs.assertValue) {
            insDom.className = 'success';
        }
        else {
            insDom.className = 'fail';
        }
        return insDom;
    }
}
Unittest.render = DomRender;
Unittest.auto();
//# sourceMappingURL=unittest.js.map