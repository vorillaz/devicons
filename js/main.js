function getMatch(e, t) {
    var n = [];
    for (var r = 0; r < e.length; r++) {
        for (var i = 0; i < t.length; i++) {
            if (e[r] === t[i]) n.push(e[r])
        }
    }
    return n
}

function shuffleArray(e) {
    for (var t = e.length - 1; t > 0; t--) {
        var n = Math.floor(Math.random() * (t + 1));
        var r = e[t];
        e[t] = e[n];
        e[n] = r
    }
    return e
}! function(e, t) {
    var n = function(e) {
        return e.trim ? e.trim() : e.replace(/^\s+|\s+$/g, "")
    }, r = function(e, t) {
            return -1 !== (" " + e.className + " ").indexOf(" " + t + " ")
        }, i = function(e, t) {
            r(e, t) || (e.className = "" === e.className ? t : e.className + " " + t)
        }, s = function(e, t) {
            e.className = n((" " + e.className + " ").replace(" " + t + " ", " "))
        }, o = function(e, t) {
            if (e)
                do {
                    if (e.id === t) return !0;
                    if (9 === e.nodeType) break
                } while (e = e.parentNode);
            return !1
        }, u = t.documentElement,
        a = (e.Modernizr.prefixed("transform"), e.Modernizr.prefixed("transition")),
        f = function() {
            var e = {
                WebkitTransition: "webkitTransitionEnd",
                MozTransition: "transitionend",
                OTransition: "oTransitionEnd otransitionend",
                msTransition: "MSTransitionEnd",
                transition: "transitionend"
            };
            return e.hasOwnProperty(a) ? e[a] : !1
        }();
    e.App = function() {
        var n = !1,
            c = {}, p = t.getElementById("inner-wrap"),
            d = !1,
            v = "js-nav";
        return c.init = function() {
            if (!n) {
                n = !0;
                var y = function(e) {
                    e && e.target === p && t.removeEventListener(f, y, !1), d = !1
                };
                c.closeNav = function() {
                    if (d) {
                        var n = f && a ? parseFloat(e.getComputedStyle(p, "")[a + "Duration"]) : 0;
                        n > 0 ? t.addEventListener(f, y, !1) : y(null)
                    }
                    s(u, v)
                }, c.openNav = function() {
                    d || (i(u, v), d = !0)
                }, c.toggleNav = function(e) {
                    d && r(u, v) ? c.closeNav() : c.openNav(), e && e.preventDefault()
                }, t.getElementById("nav-open-btn").addEventListener("click", c.toggleNav, !1), t.addEventListener("click", function(e) {
                    d && !o(e.target, "nav") && (e.preventDefault(), c.closeNav())
                }, !0), i(u, "js-ready")
            }
        }, c
    }(), e.addEventListener && e.addEventListener("DOMContentLoaded", e.App.init, !1)
}(window, window.document);
"use strict";
var myApp = angular.module("myApp", []);
myApp .directive('a', function() {
    return {
        restrict: 'E',
        link: function(scope, elem, attrs) {
            if(attrs.ngClick || attrs.href === '' || attrs.href === '#'){
                elem.on('click', function(e){
                    e.preventDefault();
                });
            }
        }
   };
});
myApp.controller("MainCtrl", ["$scope",
    function(e) {
        e.tags = [{
            key: "programming",
            name: "Programming Languages"
        }, {
            key: "js",
            name: "Javascript & stuff"
        }, {
            key: "misc",
            name: "Misc."
        }, {
            key: "browsers",
            name: "Browsers"
        }, {
            key: "useful",
            name: "Useful"
        }, {
            key: "tools",
            name: "Tools"
        }, {
            key: "html5",
            name: "HTML5 & stuff"
        }, {
            key: "css",
            name: "CSS & stuff"
        }, {
            key: "node",
            name: "Node.js & stuff"
        }, {
            key: "source",
            name: "Source control"
        }, {
            key: "social",
            name: "Social"
        }, {
            key: "os",
            name: "OS"
        }, {
            key: "frameworks",
            name: "Frameworks"
        }, {
            key: "resources",
            name: "Resources"
        }, {
            key: "companies",
            name: "Companies"
        }, {
            key: "ides",
            name: "IDEs"
        }, {
            key: "mob",
            name: "Mobile"
        }, {
            key: "websites",
            name: "Websites"
        }, {
            key: "cms",
            name: "CMS"
        }];
        e.icons = [{
            "iconname": "git",
            "key": "\\e602",
            "desc": "",
            "tags": ["source", "tools"]
        }, {
            "iconname": "git_compare",
            "key": "\\e628",
            "desc": "",
            "tags": ["source", "tools"]
        }, {
            "iconname": "git_branch",
            "key": "\\e625",
            "desc": "",
            "tags": ["source", "tools"]
        }, {
            "iconname": "git_commit",
            "key": "\\e629",
            "desc": "",
            "tags": ["source", "tools"]
        }, {
            "iconname": "git_pull_request",
            "key": "\\e626",
            "desc": "",
            "tags": ["source", "tools"]
        }, {
            "iconname": "git_merge",
            "key": "\\e627",
            "desc": "",
            "tags": ["source", "tools"]
        }, {
            "iconname": "bitbucket",
            "key": "\\e603",
            "desc": "",
            "tags": ["source", "tools", "websites", "social"]
        }, {
            "iconname": "github_alt",
            "key": "\\e608",
            "desc": "",
            "tags": ["source", "tools", "websites", "social"]
        }, {
            "iconname": "github_badge",
            "key": "\\e609",
            "desc": "",
            "tags": ["source", "tools", "websites", "social"]
        }, {
            "iconname": "github",
            "key": "\\e60a",
            "desc": "",
            "tags":["source", "tools", "websites", "social"]
        }, {
            "iconname": "github_full",
            "key": "\\e617",
            "desc": "",
            "tags": ["source", "tools", "websites", "social"]
        }, {
            "iconname": "java",
            "key": "\\e638",
            "desc": "",
            "tags": ["programming"]
        }, {
            "iconname": "ruby",
            "key": "\\e639",
            "desc": "",
            "tags": ["programming"]
        }, {
            "iconname": "scala",
            "key": "\\e637",
            "desc": "",
            "tags": ["programming"]
        }, {
            "iconname": "python",
            "key": "\\e63c",
            "desc": "",
            "tags": ["programming"]
        }, {
            "iconname": "go",
            "key": "\\e624",
            "desc": "",
            "tags": ["programming"]
        }, {
            "iconname": "ruby_on_rails",
            "key": "\\e63b",
            "desc": "",
            "tags":  ["frameworks","programming"]
        }, {
            "iconname": "django",
            "key": "\\e61d",
            "desc": "",
            "tags": ["frameworks","programming"]
        }, {
            "iconname": "markdown",
            "key": "\\e63e",
            "desc": "",
            "tags": ["programming", "frameworks"]
        }, {
            "iconname": "php",
            "key": "\\e63d",
            "desc": "",
            "tags": ["programming"]
        }, {
            "iconname": "mysql",
            "key": "\\e604",
            "desc": "",
            "tags": ["tools", "programming"]
        }, {
            "iconname": "streamline",
            "key": "\\e605",
            "desc": "",
            "tags": ["tools", "programming","misc"]
        }, {
            "iconname": "database",
            "key": "\\e606",
            "desc": "",
            "tags": ["tools", "programming","misc"]
        }, {
            "iconname": "laravel",
            "key": "\\e63f",
            "desc": "",
            "tags": ["programming", "frameworks"]
        }, {
            "iconname": "javascript",
            "key": "\\e64e",
            "desc": "",
            "tags": ["tools", "programming", "node", "frameworks","js"]
        }, {
            "iconname": "angular",
            "key": "\\e653",
            "desc": "",
            "tags": ["js", "frameworks"]
        }, {
            "iconname": "backbone",
            "key": "\\e652",
            "desc": "",
            "tags": ["js", "frameworks"]
        }, {
            "iconname": "coffeescript",
            "key": "\\e651",
            "desc": "",
            "tags": ["js", "frameworks"]
        }, {
            "iconname": "jquery",
            "key": "\\e650",
            "desc": "",
            "tags": ["js", "frameworks"]
        }, {
            "iconname": "modernizr",
            "key": "\\e620",
            "desc": "",
            "tags": {}
        }, {
            "iconname": "jquery_ui",
            "key": "\\e654",
            "desc": "",
            "tags": ["js", "frameworks"]
        }, {
            "iconname": "ember",
            "key": "\\e61b",
            "desc": "",
            "tags": ["js", "frameworks"]
        }, {
            "iconname": "dojo",
            "key": "\\e61c",
            "desc": "",
            "tags": ["js", "frameworks"]
        }, {
            "iconname": "nodejs",
            "key": "\\e619",
            "desc": "",
            "tags": ["js", "frameworks"]
        }, {
            "iconname": "nodejs_small",
            "key": "\\e618",
            "desc": "",
            "tags": ["tools", "programming", "node", "frameworks"]
        }, {
            "iconname": "javascript_shield",
            "key": "\\e64f",
            "desc": "",
            "tags": ["tools", "programming", "node", "frameworks","js"]
        }, {
            "iconname": "bootstrap",
            "key": "\\e647",
            "desc": "",
            "tags": ["css", "frameworks"]
        }, {
            "iconname": "sass",
            "key": "\\e64b",
            "desc": "",
            "tags": ["css", "frameworks","tools"]
        }, {
            "iconname": "css3_full",
            "key": "\\e64a",
            "desc": "",
            "tags": ["css", "html5"]
        }, {
            "iconname": "css3",
            "key": "\\e649",
            "desc": "",
            "tags": ["css", "html5"]
        }, {
            "iconname": "html5",
            "key": "\\e636",
            "desc": "",
            "tags": ["html5"]
        }, {
            "iconname": "html5_multimedia",
            "key": "\\e632",
            "desc": "",
            "tags": ["html5"]
        }, {
            "iconname": "html5_device_access",
            "key": "\\e633",
            "desc": "",
            "tags": ["html5"]
        }, {
            "iconname": "html5_3d_effects",
            "key": "\\e635",
            "desc": "",
            "tags": ["html5"]
        }, {
            "iconname": "html5_connectivity",
            "key": "\\e634",
            "desc": "",
            "tags": ["html5"]
        }, {
            "iconname": "ghost_small",
            "key": "\\e614",
            "desc": "",
            "tags": ["html5"]
        }, {
            "iconname": "ghost",
            "key": "\\e61f",
            "desc": "",
            "tags": ["tools", "cms"]
        }, {
            "iconname": "magento",
            "key": "\\e640",
            "desc": "",
            "tags": ["tools", "cms"]
        }, {
            "iconname": "joomla",
            "key": "\\e641",
            "desc": "",
            "tags": ["tools", "cms"]
        }, {
            "iconname": "jekyll_small",
            "key": "\\e60d",
            "desc": "",
            "tags": ["tools", "cms"]
        }, {
            "iconname": "drupal",
            "key": "\\e642",
            "desc": "",
            "tags": ["tools", "cms"]
        }, {
            "iconname": "wordpress",
            "key": "\\e60b",
            "desc": "",
            "tags": ["tools", "cms"]
        }, {
            "iconname": "grunt",
            "key": "\\e64c",
            "desc": "",
            "tags": ["tools", "node"]
        }, {
            "iconname": "bower",
            "key": "\\e64d",
            "desc": "",
            "tags": ["tools", "node"]
        }, {
            "iconname": "npm",
            "key": "\\e61e",
            "desc": "",
            "tags": ["tools", "node"]
        }, {
            "iconname": "yahoo_small",
            "key": "\\e62b",
            "desc": "",
            "tags": ["websites", "resources", "companies", "useful"]
        }, {
            "iconname": "yahoo",
            "key": "\\e615",
            "desc": "",
            "tags": ["websites", "resources", "companies", "useful"]
        }, {
            "iconname": "bing_small",
            "key": "\\e600",
            "desc": "",
            "tags": ["websites", "resources", "companies", "useful"]
        }, {
            "iconname": "windows",
            "key": "\\e60f",
            "desc": "",
            "tags":  ["os", "companies"]
        }, {
            "iconname": "linux",
            "key": "\\e612",
            "desc": "",
            "tags":  ["os", "companies"]
        }, {
            "iconname": "ubuntu",
            "key": "\\e63a",
            "desc": "",
            "tags":  ["os", "companies"]
        }, {
            "iconname": "android",
            "key": "\\e60e",
            "desc": "",
            "tags":  ["os", "companies"]
        }, {
            "iconname": "apple",
            "key": "\\e611",
            "desc": "",
            "tags": {}
        }, {
            "iconname": "appstore",
            "key": "\\e613",
            "desc": "",
            "tags":  ["os", "companies"]
        }, {
            "iconname": "phonegap",
            "key": "\\e630",
            "desc": "",
            "tags": ["mob", "misc"]
        }, {
            "iconname": "blackberry",
            "key": "\\e623",
            "desc": "",
            "tags": ["mob", "misc"]
        }, {
            "iconname": "stackoverflow",
            "key": "\\e610",
            "desc": "",
            "tags":  ["websites", "resources"]
        }, {
            "iconname": "techcrunch",
            "key": "\\e62c",
            "desc": "",
            "tags":  ["websites", "resources"]
        }, {
            "iconname": "codrops",
            "key": "\\e62f",
            "desc": "",
            "tags":  ["websites", "resources"]
        }, {
            "iconname": "css_tricks",
            "key": "\\e601",
            "desc": "",
            "tags":  ["websites", "resources"]
        }, {
            "iconname": "smashing_magazine",
            "key": "\\e62d",
            "desc": "",
            "tags":  ["websites", "resources"]
        }, {
            "iconname": "netmagazine",
            "key": "\\e62e",
            "desc": "",
            "tags":  ["websites", "resources"]
        }, {
            "iconname": "codepen",
            "key": "\\e616",
            "desc": "",
            "tags": ["websites", "resources", "useful", "social"]
        }, {
            "iconname": "cssdeck",
            "key": "\\e62a",
            "desc": "",
            "tags": ["websites", "resources", "useful", "social"]
        }, {
            "iconname": "hackernews",
            "key": "\\e61a",
            "desc": "",
            "tags": ["websites", "resources", "useful", "social"]
        }, {
            "iconname": "dropbox",
            "key": "\\e607",
            "desc": "",
            "tags": ["tools"]
        }, {
            "iconname": "google_drive",
            "key": "\\e631",
            "desc": "",
            "tags": ["tools"]
        }, {
            "iconname": "visualstudio",
            "key": "\\e60c",
            "desc": "",
            "tags": ["tools", "ides"]
        }, {
            "iconname": "unity_small",
            "key": "\\e621",
            "desc": "",
            "tags": ["tools", "frameworks", "misc"]
        }, {
            "iconname": "rasberry_pi",
            "key": "\\e622",
            "desc": "",
            "tags": ["misc"]
        }, {
            "iconname": "chrome",
            "key": "\\e643",
            "desc": "",
            "tags": ["browsers"]
        }, {
            "iconname": "ie",
            "key": "\\e644",
            "desc": "",
            "tags": ["browsers"]
        }, {
            "iconname": "firefox",
            "key": "\\e645",
            "desc": "",
            "tags": ["browsers"]
        }, {
            "iconname": "opera",
            "key": "\\e646",
            "desc": "",
            "tags": ["browsers"]
        }, {
            "iconname": "safari",
            "key": "\\e648",
            "desc": "",
            "tags": ["browsers"]
        }];
        e.filteredIcons = [];
        e.active = false;
        e.randomIcons = e.icons;
        e.includeInFilter = function(t) {
            var n = $.inArray(t, e.filteredIcons);
            if (n > -1) {
                e.filteredIcons.splice(n, 1)
            } else {
                e.filteredIcons.push(t)
            }
        };
        e.filterTheIcons = function(t) {
            var n;
            if (e.filteredIcons.length > 0) {
                n = getMatch(t.tags, e.filteredIcons);
                if (!n.length > 0) return
            }
            return t
        }
    }
]);
jQuery(document).ready(function(e) {
    function o() {
        
    }

    function u() {
        var n = e(this).scrollTop() + r;
        var o = s.map(function() {
            if (e(this).offset().top < n) return this
        });
        o = o[o.length - 1];
        var u = o && o.length ? o[0].id : "";
        if (t !== u) {
            t = u;
            i.parent().removeClass("active").end().filter("[href=#" + u + "]").parent().addClass("active")
        }
    }
    var t, n = e("nav"),
        r = n.outerHeight() + 15,
        i = n.find("a"),
        s = i.map(function() {
            var t = e(e(this).attr("href"));
            if (t.length) {
                return t
            }
        });
    i.click(function(t) {
        var n = e(this).attr("href"),
            i = n === "#" ? 0 : e(n).offset().top - r + 1;
        e("html, body").stop().animate({
            scrollTop: i
        }, 300);
        t.preventDefault()
    });
    o();
    e(window).on("scroll", function() {
        u()
    })
})
