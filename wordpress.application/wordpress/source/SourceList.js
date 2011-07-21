enyo.kind({
  name: 'wp.SourceList',
  kind: 'VFlexBox',
  published: {
    accounts:[]
  },
  events: {
    onSelectAccountAction:"",
    onSelectAction:"",
    onAddBlog:"",
    onOpenReader:"",
  },
  components: [
    { kind:'enyo.Scroller', flex:1, components:[
      { name:'list', kind:'enyo.Repeater', onSetupRow:'getAccountItem' }
    ]},
     { kind:'enyo.Toolbar', className:'source-list-command', components:[
        { kind:'Button', name:'readerButton', caption:$L('Reader'), onclick:'doOpenReader' },
    //   // { kind:'Button', caption:$L('Open Menu'), onclick:'doAddBlog' },
     ] }
  ],
  create:function(){
    this.inherited(arguments);
    this.accountsChanged = enyo.bind(this, this.accountsChanged);
    this.accountsChanged();
  },
  hasMultipleAccounts:function(){
    return this.accounts.length > 1;
  },
  getAccountItem: function(inSender, inIndex){
    var item;
    if (this.accounts.length == 1 && inIndex == 0) {
      return [{kind:'wp.SingleAccountListItem', account:this.accounts[0], onSelect:'selectAccountAction', name:'singleAccountListItem'}];
    }else if (this.accounts.length > 1) {
      if (inIndex == 0) {
        return [{kind:'wp.GlobalListItem', onSelect:'selectAccountAction', name:'global'}];
      }else{
        if(item = this.accounts[inIndex-1]){
          return [{kind:'wp.AccountListItem', account:item, onSelect:"selectAccountAction"}];
        }
      }
    };
  },
  getItems:function(){
    var items = [];
    this.forEachAccountControl(function(control){
      items.push(control);
    }, this);
    return items;
  },
  getAccountItems:function(){
    var items = [];
    this.forEachAccountControl(function(control){
      if (control != this.$.global) {
        items.push(control);        
      };
    }, this);
    return items;
  },
  selectAccountItem:function(account, action){
    this.forEachAccountControl(function(control){
      if (control.account) {
        console.log("Checking control", control);
        if (control.account && control.account.account.id == account.id) {
          //highlight the action
          control.setSelection(action);
        }else{
          control.clearSelection();
        }
      };
    }, this);
  },
  accountsChanged: function(){
    this.$.list.build();
    if(this.$.list.hasNode()){
      this.$.list.render();
    }
    this.$.toolbar.hide();
    
    /*if(enyo.application.accountManager.getFirstWPCOMaccount() !== false) {
    	this.$.toolbar.show();
    } else {
    	this.$.toolbar.hide();
    }*/
  },
  setDraftCount:function(count){
    if (this.$.global) {
      this.$.global.setDraftCount(count);
    }else if (this.$.singleAccountListItem){
      this.$.singleAccountListItem.setDraftCount(count);
    }
  },
  updateCommentCounts: function(){
    var items = this.$.list.getControls(), item;
    for (var i=0; i < items.length; i++) {
      item = items[i];
     // if(item.children[0].updateCommentCount) item.children[0].updateCommentCount();
      if(item.updateCommentCount) item.updateCommentCount(); //starting from enyo 0.10 the repeater no longer wraps its items in an extra control.
    };
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
      // var accountControl = wrapper.getControls()[0];
    	
    	var accountControl = wrapper; //starting from enyo 0.10 the repeater no longer wraps its items in an extra control.
      callBack.call(context, accountControl, index, objBeingTraversed);
    }, context);
    
  }
});