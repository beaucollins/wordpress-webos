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
    { kind:'enyo.nouveau.CommandMenu', className:'source-list-command' },
    { kind:'Selection', onChange:'selectionChanged' }
  ],
  create:function(){
    this.inherited(arguments);

    this.accountsChanged = enyo.bind(this, this.accountsChanged);
    this.accountsChanged();
  },
  getAccountItem: function(inSender, inIndex){
    var item = this.accounts[inIndex];
    if (item && item.alias) {
      return [{kind:item.alias, name:item.name, onclick:'selectItem'}];
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
    
    // Prepend the Comments and Drafts items
    this.accounts.unshift({ alias:'wp.DraftsListItem', name:'drafts' } );
    this.accounts.unshift({ alias:'wp.CommentsListItem', name:'comments' });
    
    // render the repeater
    this.$.list.build();
    if(this.$.list.hasNode()){
      this.$.list.render();
    }
  },
  selectItem: function(inSender, inEvent){
    this.$.selection.select(inSender.id);
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
      if(accountControl.account && accountControl.account != account){
        accountControl.clearSelection();
      }
    }, this);
    
    this.doAccountAction(action, account);
    
  },
  selectionChanged: function(){
    this.forEachAccountControl(function(accountControl){
      if(accountControl.account) accountControl.clearSelection();
    }, this);
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

enyo.kind({
  name:'wp.ReadCountListItem',
  kind:'enyo.Item',
  layoutKind: 'HFlexLayout',
  className:'source-item',
  published: {
    label:'Label',
    icon:'./images/icons/default.png',
    unreadCount:0
  },
  components:[
    { name:'icon', kind:'Image' },
    { name:'content', flex:1, style:'margin-left:5px;' },
    { name:'unreadCount', className:'unread-count' }
  ],
  create:function(){
    this.inherited(arguments);
    this.labelChanged();
    this.iconChanged();
    this.unreadCountChanged();
  },
  ready:function(){
    if(this.unreadCount > 0) this.interval = setInterval(enyo.bind(this, function(){
      this.setUnreadCount(this.unreadCount - 1);
      if(this.unreadCount == 0) clearInterval(this.interval);
    }), 1000);
  },
  labelChanged:function(){
    this.$.content.setContent(this.label);
  },
  iconChanged:function(){
    this.$.icon.setSrc(this.icon);
  },
  unreadCountChanged:function(){
    this.$.unreadCount.setContent(this.unreadCount);
    if (this.unreadCount > 0) {
      this.$.unreadCount.show();
    }else{
      this.$.unreadCount.hide();
    }
  }
});

enyo.kind({
  name:'wp.CommentsListItem',
  kind:'wp.ReadCountListItem',
  label: 'Comments',
  unreadCount:100
});
enyo.kind({
  name:'wp.DraftsListItem',
  kind:'wp.ReadCountListItem',
  label: 'Drafts',
  icon: './images/icons/drafts-icon.png',
  unreadCount:2
});

