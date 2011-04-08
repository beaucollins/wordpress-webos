enyo.kind({
  name:'wp.AccountListItem',
  kind:'Control',
  published: {
    account:null
  },
  events: {
    onSelect:""
  },
  components: [
    { name:'header', kind:'enyo.DividerDrawer', className:'account-drawer', icon:'./images/icons/default-blavatar.png', components:[
      { name:'list', kind:'VirtualRepeater', onGetItem:'getItem', className:'account-list', components:[
        { name:'item', kind: 'wp.ReadCountListItem', onclick:'itemClick' }
      ] }
    ]},
    { kind:'Selection', onChange:'selectionChanged' }
  ],
  items: [
    { label:'Comments', icon:'./images/icons/comments-icon.png', unreadCount:5 },
    { label:'Posts', icon:'./images/icons/posts-icon.png' },
    { label:'Pages', icon:'./images/icons/pages-icon.png'}
  ],
  create:function(){
    this.inherited(arguments);
    this.accountChanged();
    // blavatar!
  },
  getItem:function(inSender, inIndex){
    var item = this.items[inIndex];
    if (item) {
      this.$.item.setLabel(item.label);
      this.$.item.setIcon(item.icon);
      this.$.item.setUnreadCount(item.unreadCount);
      this.$.item.addRemoveClass("active-selection", this.$.selection.isSelected(item.label));
      
      return true;
    };
  },
  clearSelection:function(){
    this.$.selection.clear();
    this.$.list.render();
  },
  accountChanged:function(){
    if(!this.account) return;
    this.$.header.setCaption(this.account.blogName);
    
    // attempt to setup the blavatar if there is a valid one
    var blavatar = new Image();
    blavatar.onload = enyo.bind(this, function(){
      this.$.header.setIcon(blavatar.src);
    });
    blavatar.src = enyo.application.makeBlavatar(this.account.xmlrpc, {
      size:30
    });
    
  },
  selectionChanged:function(){
    
    this.$.list.render();
  },
  itemClick:function(inSender, inEvent){
    var item = this.items[this.$.list.fetchRowIndex()];
    inSender.decrement();
    if(this.$.selection.isSelected(item.label)) return;

    this.$.selection.select(item.label);
    this.doSelect(item.label);
    return true;
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
    this.inherited(arguments);
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
  },
  decrement:function(){
    if(this.unreadCount > 0) this.setUnreadCount(this.unreadCount - 1);
  }
});
