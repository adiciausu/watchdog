var AnalyzerFilter =
{
    acceptedAnalyzers:[],

    filterCallback:function (script) {
        // only filter analyzers
        if (-1 == script.indexOf('analyzers')) {
            return true
        }
        var response = false;
        jQuery.each(AnalyzerFilter.acceptedAnalyzers, function (key, analyzer) {
            if (-1 !== script.indexOf(analyzer.name)) {
                response = true;
                $(analyzer.excludeUrls).each(function(key, url){
                    if (-1 !== document.URL.indexOf(url)) {
                        response = false;
                    }
                })
            }
        })
        
        return response;
    },

    registerEmbedFilterCallbacks:function (callback) {
        EmbedAutoloader.addFilterCallback(this.filterCallback);
        chrome.storage.sync.get(['state', 'sites'], function(storage){
           if ('undefined' !== typeof(storage.state) && !storage.state) {
               return;
           }
           jQuery.each(storage['sites'], function (name, site) {
                if (-1 == document.domain.indexOf(site.name)) {
                    return;
                }
                this.acceptedAnalyzers = site.analyzers;
           }.bind(this));
           callback();
        }.bind(this));    
    }
}


