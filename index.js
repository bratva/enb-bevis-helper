module.exports = function (config) {
    config.registerModule('enb-bevis-helper', new EnbBevisHelperModule(config));
};

var inherit = require('inherit');
var ModuleConfig = require('enb/lib/config/module-config');

/** @name EnbBevisHelperBase */
var EnbBevisHelperBase = inherit(ModuleConfig, /** @lends EnbBevisHelperBase.prototype */ {
    __constructor: function (config) {
        this._sourcesConfig = {};
        this._depsConfig = {};
        this._useAutopolyfiller = true;
        this._autopolyfillerExcludes = [];
        this._browserSupport = [];
        this._buildHtml = false;
        this._addTargets = true;
        this._buildTests = false;
        this._ie8Suffix = null;
        this._ie9Suffix = null;
        this._testDirs = null;
        this._config = config;
        this._useSourceMaps = null;
        this._useCoverage = null;
        this._clientBtDependencies = null;
    },

    /**
     * Собирает статичную HTML-страницу из BtJson со всеми необходимыми ресурсами: JS, CSS.
     *
     * @returns {EnbBevisHelperBase}
     */
    forStaticHtmlPage: function () {
        return this.copyAnd(function () {
            this._depsConfig = {};
            this._buildHtml = true;
        });
    },

    /**
     * Собирает статичную HTML-страницу из BtJson со всеми необходимыми ресурсами: JS, CSS.
     * При этом не добавляет таргеты.
     * Подходит для сборки примеров.
     *
     * @returns {EnbBevisHelperBase}
     */
    forStaticExamplesHtmlPage: function () {
        return this.copyAnd(function () {
            this._depsConfig = {};
            this._buildHtml = true;
            this._addTargets = false;
        });
    },

    /**
     * Собирает необходимые ресурсы для рендеринга страницы на сервере: BT, JS, CSS.
     *
     * @returns {EnbBevisHelperBase}
     */
    forServerPage: function () {
        return this.copyAnd(function () {
            this._buildHtml = false;
        });
    },

    /**
     * Конфигурирует проект для сборки тестов.
     *
     * @param {String} path Путь к ноде, в которой происходит сборка тестов.
     * @param {Object} [options] Опции
     * @param {String[]} options.additionalTargets Дополнительные цели для тестов
     * @returns {EnbBevisHelperBase}
     */
    configureUnitTests: function (path, options) {
        options = options || {};
        options.additionalTargets = options.additionalTargets || [];
        return this.copyAnd(function () {
            this._buildHtml = false;
            this._buildTests = true;
            this._depsConfig = {jsSuffixes: ['js', 'test.js']};
            var testDirs = this._testDirs;
            var targets = ['sources.js', 'tests.js'].concat(options.additionalTargets);
            this._config.task('test', function (task) {
                var blocksToTest = [].slice.call(arguments, 1);
                if (blocksToTest.length) {
                    testDirs = blocksToTest;
                }
                return task.buildTargets(targets.map(function (target) {
                    return path + '/' + target;
                }));
            });
            var fileMask = function (file) {
                var fullname = file.fullname;
                if (fullname.indexOf('node_modules') !== -1) {
                    return false;
                }
                if (testDirs) {
                    for (var i = 0; i < testDirs.length; i++) {
                        if (fullname.indexOf(testDirs[i]) !== -1) {
                            return true;
                        }
                    }
                } else {
                    return true;
                }
                return false;
            };
            var _this = this;
            this._config.node(path, function (nodeConfig) {
                _this.configureNode(nodeConfig, {fileMask: fileMask});
            });

        });
    },

    /**
     * Устанавливает директории, которыми необходимо ограничить сборку тестов.
     *
     * @param {String[]} testDirs
     * @returns {EnbBevisHelperBase}
     */
    testDirs: function (testDirs) {
        return this.copyAnd(function () {
            this._testDirs = testDirs;
        });
    },

    /**
     * Включает сборку CSS-файла для IE8.
     *
     * @param {String} ie8Suffix Суффикс. Например, если передано значение `ie8`, будет собран `_?.ie8.css`.
     * @returns {EnbBevisHelperBase}
     */
    supportIE8: function (ie8Suffix) {
        return this.copyAnd(function () {
            this._ie8Suffix = ie8Suffix;
        });
    },

    /**
     * Включает сборку CSS-файла для IE9.
     *
     * @param {String} ie9Suffix Суффикс. Например, если передано значение `ie9`, будет собран `_?.ie9.css`.
     * @returns {EnbBevisHelperBase}
     */
    supportIE9: function (ie9Suffix) {
        return this.copyAnd(function () {
            this._ie9Suffix = ie9Suffix;
        });
    },

    /**
     * Устанавливает список поддерживаемых браузеров для автопрефиксера и автополифиллера.
     *
     * @param {String[]} browserSupport
     * @returns {EnbBevisHelperBase}
     */
    browserSupport: function (browserSupport) {
        return this.copyAnd(function () {
            this._browserSupport = browserSupport;
        });
    },

    /**
     * Включает или выключает использование автополифиллера.
     *
     * @param {Boolean} [useAutopolyfiller=true]
     * @returns {EnbBevisHelperBase}
     */
    useAutopolyfiller: function (useAutopolyfiller) {
        if (arguments.length === 0) {
            useAutopolyfiller = true;
        }
        return this.copyAnd(function () {
            this._useAutopolyfiller = useAutopolyfiller;
        });
    },

    /**
     * Задает список исключений для автополифиллера.
     *
     * @param {String[]} autopolyfillerExcludes
     * @returns {EnbBevisHelperBase}
     */
    autopolyfillerExcludes: function (autopolyfillerExcludes) {
        return this.copyAnd(function () {
            this._autopolyfillerExcludes = autopolyfillerExcludes;
        });
    },

    /**
     * Задает настройки для технологии `sources`.
     *
     * @param {Object} sourcesConfig
     * @returns {EnbBevisHelperBase}
     */
    sources: function (sourcesConfig) {
        return this.copyAnd(function () {
            this._sourcesConfig = sourcesConfig;
        });
    },

    /**
     * Устанавливает использование `source-maps`.
     *
     * @param {Boolean} use
     * @returns {EnbBevisHelperBase}
     */
    useSourceMaps: function (useSourceMaps) {
        return this.copyAnd(function () {
            this._useSourceMaps = useSourceMaps;
        });
    },

    /**
     * Устанавливает использование `source-maps`.
     *
     * @param {Boolean} useCoverage
     * @returns {EnbBevisHelperBase}
     */
    useCoverage: function (useCoverage) {
        return this.copyAnd(function () {
            this._useCoverage = useCoverage;
        });
    },

    /**
     * Задает список исходных зависимостей для сборки.
     *
     * @param {String[]} sourceDeps
     * @returns {EnbBevisHelperBase}
     */
    sourceDeps: function (sourceDeps) {
        return this.copyAnd(function () {
            if (sourceDeps) {
                this._depsConfig = {
                    sourceDeps: sourceDeps
                };
            } else {
                this._depsConfig = {};
            }
        });
    },

    /**
     * Задает зависимости для клиентского BT-модуля.
     *
     * @param {Object} dependencies
     * @returns {EnbBevisHelperBase}
     */
    clientBtDependencies: function (dependencies) {
        return this.copyAnd(function () {
            this._clientBtDependencies = dependencies;
        });
    },

    /**
     * Применяет конфигурацию для ноды.
     *
     * @param {NodeConfig} nodeConfig
     * @param {Object} options
     */
    configureNode: function (nodeConfig, options) {
        var browserSupport = this._browserSupport;
        var addTargets = this._addTargets;
        var useSourceMaps = this._useSourceMaps;

        if (useSourceMaps === null) {
            useSourceMaps = !process.env.ENB_NO_SOURCE_MAPS;
        }

        var useCoverage = this._useCoverage;

        if (useCoverage === null) {
            useCoverage = Boolean(process.env.ENB_COVERAGE);
        }

        function configureCssBuild(suffix, browserSupport, variables) {
            var file = '?' + (suffix ? '.' + suffix : '') + '.css';
            nodeConfig.addTech([require('enb-stylus/techs/css-stylus-with-autoprefixer'), {
                browsers: browserSupport,
                target: file,
                variables: variables
            }]);
            nodeConfig.mode('development', function () {
                nodeConfig.addTech([require('enb/techs/file-copy'), {source: file, target: '_' + file}]);
            });
            nodeConfig.mode('production', function () {
                nodeConfig.addTech([
                    require('enb-borschik/techs/borschik'), {source: file, target: '_' + file, freeze: true}
                ]);
            });
            if (addTargets) {
                nodeConfig.addTarget('_' + file);
            }
        }

        nodeConfig.addTechs([
            [require('enb-bevis/techs/sources'), this._sourcesConfig],
            [require('enb-bevis/techs/deps'), this._depsConfig],
            require('enb-bevis/techs/files'),

            [require('enb-y-i18n/techs/y-i18n-lang-js'), {lang: '{lang}'}],
            [
                require('enb-bt/techs/bt-client-module'),
                this._clientBtDependencies ? {
                    dependencies: this._clientBtDependencies,
                    useSourceMap: useSourceMaps
                } : {useSourceMap: useSourceMaps}
            ]
        ]);

        nodeConfig.addTechs([
            [require('enb-bevis/techs/js'), {
                lang: '{lang}',
                target: '?.source.{lang}.js',
                useSourceMap: useSourceMaps
            }],
            [require('enb-modernizr/techs/modernizr'), {
                useSourceMap: useSourceMaps,
                source: '?.source.{lang}.js',
                target: '?.modernizr.{lang}.js'
            }]
        ]);

        if (this._useAutopolyfiller) {
            nodeConfig.addTechs([
                [require('enb-autopolyfiller/techs/autopolyfiller'), {
                    source: '?.modernizr.{lang}.js',
                    target: '?.{lang}.js',
                    browsers: browserSupport,
                    excludes: this._autopolyfillerExcludes,
                    useSourceMap: useSourceMaps
                }]
            ]);
        } else {
            nodeConfig.addTech([require('enb/techs/file-copy'), {
                source: '?.modernizr.{lang}.js',
                target: '?.{lang}.js',
                lang: '{lang}'
            }]);
        }

        if (this._buildHtml) {
            nodeConfig.addTechs([
                [require('enb/techs/file-provider'), {target: '?.btjson.js'}],
                require('enb-bevis/techs/source-deps-from-btjson'),
                [require('enb-bt/techs/html-from-btjson'), {lang: '{lang}'}]
            ]);
            if (addTargets) {
                nodeConfig.addTarget('?.{lang}.html');
            }
        }

        if (this._buildTests) {
            var fileMask = options.fileMask;

            nodeConfig.setLanguages(['ru']);
            var testsTarget = 'tests.js';
            var sourcesTarget = 'sources.js';
            if (useCoverage) {
                testsTarget = '?.test-cov.js';
                sourcesTarget = '?.cov.js';
                nodeConfig.addTechs([
                    [require('enb-bevis/techs/js-cov-test'), {
                        source: testsTarget,
                        target: 'tests.js'
                    }],
                    [require('enb-bevis/techs/js-cov'), {
                        source: sourcesTarget,
                        target: 'sources.js',
                        excludes: [
                            nodeConfig.getPath() + '/**',
                            'node_modules/**'
                        ]
                    }]
                ]);
            }
            nodeConfig.addTechs([
                [require('enb-bevis/techs/source-deps-test'), {fileMask: fileMask}],
                [require('enb-bevis/techs/js-test'), {
                    target: testsTarget,
                    fileMask: fileMask,
                    useSourceMap: useSourceMaps
                }],
                [require('enb/techs/file-copy'), {source: '?.ru.js', target: sourcesTarget}]
            ]);
        } else {
            nodeConfig.addTech(require('enb-bt/techs/bt-server'));

            nodeConfig.mode('development', function (nodeConfig) {
                nodeConfig.addTechs([
                    [require('enb/techs/file-copy'), {source: '?.{lang}.js', target: '_?.{lang}.js'}],
                    [require('enb/techs/file-copy'), {source: '?.lang.{lang}.js', target: '_?.lang.{lang}.js'}]
                ]);
            });

            nodeConfig.mode('production', function (nodeConfig) {
                nodeConfig.addTechs([
                    [require('enb-borschik/techs/borschik'), {source: '?.{lang}.js', target: '_?.{lang}.js'}],
                    [require('enb-borschik/techs/borschik'), {source: '?.lang.{lang}.js', target: '_?.lang.{lang}.js'}]
                ]);
            });

            configureCssBuild(null, browserSupport, {});

            if (this._ie8Suffix) {
                configureCssBuild(this._ie8Suffix, ['ie 8'], {ie: 8});
            }

            if (this._ie9Suffix) {
                configureCssBuild(this._ie9Suffix, ['ie 9'], {ie: 9});
            }

            if (addTargets) {
                nodeConfig.addTargets(['?.bt.js', '_?.{lang}.js', '_?.lang.{lang}.js']);
            }
        }
    },

    copyAnd: function (fn) {
        var newInstance = this.copy();
        fn.call(newInstance);
        return newInstance;
    },

    copy: function () {
        var Class = this.__self;
        var result = new Class(this._config);
        for (var i in this) {
            if (this.hasOwnProperty(i)) {
                result[i] = this[i];
            }
        }
        return result;
    }
});

var EnbBevisHelperModule = inherit(EnbBevisHelperBase, {
    getName: function () {
        return 'enb-bevis-helper';
    }
});
