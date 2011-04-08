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
    { label:'Comments', icon:'./images/icons/comments-icon.png' },
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
      this.$.item.addRemoveClass("active-selection", this.$.selection.isSelected(item.label));
      
      return true;
    };
  },
  clearSelection:function(){
    this.$.selection.clear();
    this.$.list.render();
  },
  accountChanged:function(){
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
    
    if(this.$.selection.isSelected(item.label)) return;

    this.$.selection.select(item.label);
    this.doSelect(item.label);
    return true;
  }
});

