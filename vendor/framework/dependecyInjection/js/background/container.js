var Container = {
    parameters:{},

    addParameter:function (key, value) {
        this.parameters[key] = value
    },

    getParameter:function (key) {
        return this.parameters[key]
    },

    initialize:function () {
        var manifest = Config.load('manifest.json', 'manifest');
        chrome.extension.onRequest.addListener(function (request, sender, callback) {
            if (request.method == 'getContainer') {
                callback(JSON.stringify(Container));
            }
        })
    }
}


