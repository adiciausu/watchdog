var Config = {
    
    loaded: null,
    
    load:function (script, containerKey) {
        Container.addParameter(containerKey, this.fetch(script));
        return Container.getParameter(containerKey);
    },
    
    fetch:function (script) {
        jQuery.ajax({
            type:'GET',
            url:script,
            dataType:'json',
            async:false,
            success:function (config) {
                this.loaded = config;
            }.bind(this),
            error: function(jqXHR, textStatus, errorThrown){
                console.log(jqXHR, textStatus, errorThrown);
            }
        })
        
        return this.loaded;
    }
}