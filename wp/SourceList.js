enyo.kind({
  name: 'wp.SourceList',
  kind: 'VFlexBox',
  events: {
    onSelectAccountAction:"",
    onSelectAction:""
  },
  components: [
    { kind:'enyo.Scroller', flex:1, components:[
      { name:'list', kind:'enyo.Repeater', onGetItem:'getAccountItem' }
    ]},
    { kind:'enyo.nouveau.CommandMenu', className:'source-list-command' }
  ],
  create:function(){
    this.inherited(arguments);

    this.accountsChanged = enyo.bind(this, this.accountsChanged);
    this.accountsChanged();
  },
  getAccountItem: function(inSender, inIndex){
    var item = this.accounts[inIndex];
    if (item && item.global) {
      return [{kind:'wp.GlobalListItem', onSelect:'selectAccountAction', name:'global'}];
    }else if(item){
      return [{kind:'wp.AccountListItem', account:item, onSelect:"selectAccountAction"}];
    }
  },
  accountsChanged: function(){
    // this is the hook for loading in the account data. right now we're going to mock it
    this.accounts = [
      {
        "isAdmin": true,
        "url": "http://beaucollins.wordpress.com/",
        "blogid": "2825",
        "blogName": "beaucollins's Blog",
        "xmlrpc": "http://beaucollins.wordpress.com/xmlrpc.php"
      },
      {
        "isAdmin": true,
        "url": "http://dev.webos.wordpress.org/",
        "blogid": "21491930",
        "blogName": "WordPress rocking webOS",
        "xmlrpc": "http://wpwebosdev.wordpress.com/xmlrpc.php"
      }
    ];
    
    this.accounts.unshift({
      'global':'yeah'
    });
    
    
    // render the repeater
    this.$.list.build();
    if(this.$.list.hasNode()){
      this.$.list.render();
    }
  },
  selectAccountAction: function(inSender, inEvent){
    var account = inSender.account;
    var action = inEvent;
    if (this.selected) {
      this.selected.addRemoveClass("active-selection", false);
      this.selected = false;
    };
    // turn of the account list items that aren't this account
    this.forEachAccountControl(function(accountControl){
      if(accountControl.account != account){
        accountControl.clearSelection();
      }
    }, this);
    
    this.doSelectAccountAction(action, account);
    
  },
  // As done by com.palm.app.enyo-email
  forEachAccountControl: function(callBack, context){
    var wrappers = this.$.list.getControls();
    wrappers.forEach(function (wrapper, index, objBeingTraversed) {
      //having to do .getControls()[0] here is a hack to work around the fact that the Repeater creates an extra level of div for us
      //if it didn't do that, the foldersObjWrapper would be the foldersObj
      var accountControl = wrapper.getControls()[0];
      
      callBack.call(context, accountControl, index, objBeingTraversed);
    }, context);
    
  }
});


