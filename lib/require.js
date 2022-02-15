(() => {
    let define;
    if (typeof require) {
        define = function (depnames, factory) {
            const args = [];
            for (let depname of depnames) {
                args.push(require(depname));
            }
            if (factory)
                factory.call(globalThis, args);
        };
    }
    else {
        define = function (depnames, factory) {
        };
        /**
         * 表示url的各个部分
         * 可以通过basePaths参数来获取url的绝对值
         *
         * @class Uri
         */
        class RequireUri {
            constructor(raw, basPaths, resolveUrl) {
                this.raw = raw;
                raw = this.resolved = resolveUrl ? resolveUrl(raw) : raw;
                let paths = this.paths = [];
                if (basPaths)
                    for (let i = 0, j = basPaths.length; i < j; i++)
                        paths.push(basPaths[i]);
                let names = raw.split('/');
                for (let i = 0, j = names.length - 1; i < j; i++) {
                    let n = names[i].replace(/(^\s+)|(\s+)$/g, "");
                    if (n === "." && paths.length)
                        continue;
                    else if (n === "..") {
                        if (paths.length) {
                            let n1 = paths.pop();
                            if (n1[0] == '.')
                                paths.push(n1);
                            else
                                continue;
                        }
                    }
                    else if (!n)
                        continue;
                    paths.push(n);
                }
                let name = names[names.length - 1];
                if (name.lastIndexOf(".js") !== name.length - 3)
                    name += ".js";
                this.filename = name;
                if (paths.length)
                    this.url = paths.join("/") + "/" + name;
                else
                    this.url = name;
                let lastIndex = this.filename.lastIndexOf(".");
                if (lastIndex > 0)
                    this.ext = this.filename.substr(lastIndex + 1);
            }
        }
        const headElement = document.getElementsByTagName('head')[0];
        class RequireResource {
            constructor(uri) {
                let url = uri.resolved;
                if (url.indexOf("?") > 0)
                    url += "&";
                else
                    url += "?";
                url += Math.random();
                const elem = this.element = this.createElement();
                if (elem.src !== undefined)
                    elem.src = url;
                else if (elem.href !== undefined)
                    elem.href = url;
                else
                    elem.url = url;
                setTimeout(() => headElement.appendChild(elem), 0);
            }
            createElement() {
                throw new Error('not override');
            }
        }
    } // end if typeof require
})();
//# sourceMappingURL=require.js.map