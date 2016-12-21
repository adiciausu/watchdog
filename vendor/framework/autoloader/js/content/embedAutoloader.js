var EmbedAutoloader = {

    filterCallbacks:[],

    injectScript:function (script) {
        var injectedScript = document.createElement('script');
        injectedScript.src = chrome.extension.getURL(script);
        injectedScript.onload = function () {
            this.parentNode.removeChild(this);
        };
        (document.head || document.documentElement).appendChild(injectedScript);
    },

    injectScripts:function (scripts) {
        scripts = scripts || [];
        jQuery.each(scripts, function(key, script) {
            var accepted = true;
            jQuery.each(this.filterCallbacks, function(key, callback){
                if (!callback(script)){
                    accepted = false;
                }
            })
            if (!accepted){
                return;
            }
            this.injectScript(script)
        }.bind(this))
    },

    addFilterCallback:function (callback) {
        this.filterCallbacks.push(callback);
    },

    run:function () {
        chrome.extension.sendRequest({
            method:'getContainer'
        }, function (value) {
            var container = jQuery.parseJSON(value);
            this.injectScripts(container.parameters.manifest.web_accessible_resources)
        }.bind(this));
    }
}


