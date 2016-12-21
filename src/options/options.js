var Options = {

    analyzers:null,
    excludeMold:null,
    addSiteForm:null,
    defaultExclude:'ex: admin',


    initialize:function () {
        // jQuery nodes
        this.addExcludeMold = $('#addExcludeUrlMold').html();
        this.addSiteForm = $('#addSiteForm');

        this.refreshSites();
        this.initModal();
        this.addListeners();
        this.addValidation();
    },

    addListeners:function () {
        $('#saveNewSite').live('click', this.saveSite.bind(this));
        $('.deleteSite').live('click', this.deleteSite.bind(this));
        $('.editSite').live('click', this.showEditSite.bind(this));
        $('.removeExcludeUrl').live('click', this.removeExcludeUrl.bind(this));

        $('#addWebsite').on('hidden', this.resetModal.bind(this));
        $('#addWebsite').on('shown', function () {
            $('#newSiteName').focus()
        });

        $('.addExclude').live('click', function (event) {
            var target = $(event.target);
            var analyzer = {
                name:target.attr('rel'),
                excludeUrls:['']
            };
            this.addExcludeUrl(analyzer);
        }.bind(this));
    },

    removeExcludeUrl:function (event) {
        $(event.target).prev().remove();
        $(event.target).remove();
    },

    addValidation:function () {
        this.addSiteForm.validate(
            {
                rules:{
                    name:{
                        minlength:4,
                        required:true
                    }
                },
                messages:{
                    name:{
                        required:'Website name is required!',
                        minlength:'Website name is invalid'
                    }
                },
                highlight:function (label) {
                    $(label).closest('.control-group').addClass('error');
                }
            });
    },

    saveSite:function () {
        if (!this.addSiteForm.valid()) {
            return;
        }
        var newSite = {};
        newSite.name = $('#newSiteName').attr('value');
        newSite.analyzers = [];
        $('#addAnalyzerContainer input:checked.analyzerName').each(function (key, analyzer) {
            analyzerObj = {};
            analyzerObj.excludeUrls = [];
            $('#excludeUrls-' + $(analyzer).val()).children('input').each(function (key, exclude) {
                if ('' == $.trim($(exclude).val())) {
                    return;
                }
                analyzerObj.excludeUrls.push($(exclude).val());
            });
            analyzerObj.name = $(analyzer).val();
            newSite.analyzers.push(analyzerObj)
        });
        chrome.storage.sync.get('sites', function (storage) {
            currentSites = storage['sites'] || [];
            if ($('#isEdit').val()) {
                currentSites = $.grep(currentSites, function (value) {
                    return value.name !== $('#isEdit').val();
                })
            }
            currentSites.push(newSite);
            chrome.storage.sync.set({'sites':currentSites});
            this.refreshSites();
            $('#addWebsite').modal('hide')
        }.bind(this));
    },

    deleteSite:function (event) {
        var deletedSite = $(event.target).attr('rel');
        chrome.storage.sync.get('sites', function (storage) {
            var newSites = $.grep(storage.sites, function (value) {
                return value.name != deletedSite;
            });
            chrome.storage.sync.set({'sites':newSites});
            this.refreshSites();
        }.bind(this));
    },

    showEditSite:function (event) {
        var site = $(event.target).attr('rel');
        $('#isEdit').val(site);
        chrome.storage.sync.get('sites', function (storage) {
            var siteData = $.grep(storage.sites, function (value) {
                return value.name == site;
            });
            siteData = siteData[0];

            // populate site name
            $('#newSiteName').attr('value', siteData.name);

            // populate analyzers
            $('#addAnalyzerContainer input.analyzerName').each(function (key, analyzer) {
                $('#excludeUrls-' + $(analyzer).attr('value')).html('');
                var matches = $.grep(siteData.analyzers, function (value) {
                    return value.name == $(analyzer).attr('value');
                });

                if (0 !== matches.length) {
                    $(matches).each(function (key, match) {
                        this.addExcludeUrl(match);
                    }.bind(this));
                    $(analyzer).attr('checked', true);
                    return;
                }
                $(analyzer).attr('checked', false);
            }.bind(this));

        }.bind(this));
    },

    addExcludeUrl:function (analyzer) {
        $(analyzer.excludeUrls).each(function (key, url) {
            var excludeHtml = this.addExcludeMold.replace(/%excludeValue%/g, url);
            $('#excludeUrls-' + analyzer.name).append(excludeHtml);
        }.bind(this));
    },

    refreshSites:function () {
        $('#siteContainer').html('');
        chrome.storage.sync.get('sites', function (storage) {
            if (!storage.sites) {
                $('#siteContainer').html($('#noSitesMold').html());
                this.runTutorial();
            }
            storage.sites.sort(this.sortCallback);
            var siteMold = $('#showSiteMold').html();
            var analyzerMold = $('#analyzerMold').html();
            $(storage.sites).each(function (key, site) {
                var siteHtml = siteMold.replace(/%siteName%/g, site.name);
                var allAnalyzersHtml = '';
                $(site.analyzers).each(function (key, analyzer) {
                    var analyzerObj = this.getAnalyzer(analyzer.name);
                    var analyzerHtml = analyzerMold.replace(/%analyzerName%/g, analyzerObj.name)
                    analyzerHtml = analyzerHtml.replace(/%analyzerId%/g, analyzerObj.id);
                    var excludeMold = $('#excludeUrlsMold').html();
                    var allExcludesHtml = '';
                    $(analyzer.excludeUrls).each(function (key, url) {
                        var excludeHtml = excludeMold.replace(/%excludeUrl%/g, url);
                        allExcludesHtml += excludeHtml;
                    });
                    analyzerHtml = analyzerHtml.replace(/%excludeUrls%/g, allExcludesHtml);
                    allAnalyzersHtml += analyzerHtml;
                }.bind(this));
                siteHtml = siteHtml.replace(/%analyzers%/g, allAnalyzersHtml);
                $('#siteContainer').append(siteHtml);
            }.bind(this));
        }.bind(this));
    },

    sortCallback:function (a, b) {
        var aName = a.name.toLowerCase();
        var bName = b.name.toLowerCase();
        return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
    },

    getAnalyzers:function () {
        if (this.analyzers) {
            return this.analyzers;
        }
        var analyzersConfig = Config.fetch('../../analyzers/config/config.json', 'analyzers');
        return analyzersConfig.analyzers;
    },

    getAnalyzer:function (id) {
        var analyzers = this.getAnalyzers();
        var analyzer =  $.grep(analyzers, function (value) {
            return value.id == id;
        });

        return analyzer[0];
    },

    initModal:function () {
        var addAnalyzerMold = $('#addAnalyzerMold').html();
        $(this.getAnalyzers()).each(function (key, analyzer) {
            var analyzerHtml = addAnalyzerMold.replace(/%analyzerName%/g, analyzer.name);
            analyzerHtml = analyzerHtml.replace(/%analyzerId%/g, analyzer.id);
            $('#addAnalyzerContainer').append(analyzerHtml);
            var analyzerObjMock = {
                name:analyzer.id,
                excludeUrls:['']
            }
            this.addExcludeUrl(analyzerObjMock);
        }.bind(this))
    },

    runTutorial:function () {
        chrome.storage.sync.get('tutorial', function (storage) {
            if (storage.tutorial === 1) {
                return;
            }
            var popoverOptions = {
                'content':'It appears that Watchdog is not monitoring any of your websites. ' +
                    'Add a website by clicking the add new website button',
                'placement':'bottom'
            }
            $('#addWebsiteButton').popover(popoverOptions);

            chrome.tts.speak('Welcome to the watchdog configuration pannel!' + popoverOptions.content);
            setTimeout(function () {
                $('#addWebsiteButton').popover('show');
                setTimeout(function () {
                    $('#addWebsiteButton').popover('hide');
                }, 5000)
            }, 7000)

            $('#addWebsiteButton').live('click', function () {
                chrome.tts.speak("Excelent! Now let's add the address of your website");
                $('#addWebsiteButton').popover('hide');
            });

            $('#newSiteName').live('focusout', function () {
                $('#addWebsiteButton').popover('hide');
                if (-1 === $(newSiteName).val().indexOf('.')) {
                    return;
                }
                chrome.tts.speak("Well done! Now Check only the codes you want to monitor on your website.");
            })

            var seenExcludes = false;
            $('.analyzerName').live('click', function (event) {
                if (seenExcludes) {
                    return;
                }
                var analyzer = $(event.target).val();
                var target = $("a[rel='" + analyzer + "']");
                var popoverOptions = {
                    'content':'You can add more excludes by clicking the add link',
                    'placement':'right',
                    'title':'Add excluded urls',
                    'trigger':'manual'
                }
                $(target).popover(popoverOptions);
                $(target).popover('show');
                setTimeout(function () {
                    chrome.tts.speak("Don't forget to exclude pages that do not have the code. Probably admin pages are a safe bet.");
                }, 100);
                setTimeout(function () {
                    $(target).popover('hide');
                }, 5000);
                seenExcludes = true;
            });
            chrome.storage.sync.set({'tutorial':1});
        })
    },

    resetModal:function () {
        $('#isEdit').val('');
        $('#newSiteName').attr('value', '');
        $('#addAnalyzerContainer input.analyzerName').each(function (key, analyzer) {
            var analyzerObjMock = {
                name:$(analyzer).attr('value'),
                excludeUrls:['/admin']
            }
            $(analyzer).attr('checked', false);
            $('#excludeUrls-' + analyzerObjMock.name).html('');
            this.addExcludeUrl(analyzerObjMock);
        }.bind(this));
    }
}

$(document).ready(function () {
    Options.initialize();
})


       