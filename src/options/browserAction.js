var BrowserAction = {
  
    initialize: function(){
        this.getState();
        $('#check').live('change', function(event){
            this.changeState();
        }.bind(this))
    },
  
    getState: function(){
        chrome.storage.sync.get('state', function(storage){
            var isChecked = false;
            if (undefined == storage.state){
                this.changeState(true);
                isChecked = true;
            }
            
            if (storage.state) {
                 isChecked = true;
            }
            $('#check').attr('checked', isChecked);

        }.bind(this)); 
    },
  
    changeState:function(state){
        if (undefined == state) {
            chrome.storage.sync.get('state', function(storage){
               chrome.storage.sync.set({'state': !storage.state}); 
            })
            
            return;
        }
        chrome.storage.sync.set({'state': state});
    }
}

$(document).ready(function(){
    BrowserAction.initialize();
})


       