enyo.kind({
  name:'wp.AccountListItem',
  kind:'Control',
  published: {
    account:null,
    draftCount:0
  },
  events: {
    onSelect:""
  },
  components: [
    { name:'header', kind:'enyo.DividerDrawer', className:'account-drawer', icon:'../images/icons/default-blavatar.png', components:[
      { action:'comments', name:'comments', label:$L('Comments'), icon:'../images/icons/comments-icon.png', kind: 'wp.ReadCountListItem', onclick:'itemClick' },
      { action:'posts', name:'posts', label:$L('Posts'), icon:'../images/icons/posts-icon.png', kind: 'wp.ReadCountListItem', onclick:'itemClick' },
      { action:'pages', name:'pages', label:$L('Pages'), icon:'../images/icons/pages-icon.png', kind: 'wp.ReadCountListItem', onclick:'itemClick' },
      { action:'stats', name:'stats', label:$L('Stats'), icon:'../images/icons/stats-icon.png', kind: 'wp.ReadCountListItem', onclick:'itemClick' },
      { action:'drafts', name:'drafts', label:$L('Drafts'), icon:'../images/icons/drafts-icon.png', kind: 'wp.ReadCountListItem', onclick:'itemClick', unreadCount:0 },
   /*   { action:'dashboard', name:'dashboard', label:$L('Dashboard'), icon:'../images/icons/dashboard-icon.png', kind: 'wp.ReadCountListItem', onclick:'openDashBoard'}*/
    ]}
  ],
  create:function(){
    this.inherited(arguments);
    this.accountChanged();
    this.$.drafts.hide();
    this.selected = null;
    this.draftCountChanged();
    // blavatar!
  },
  clearSelection:function(){
    if (this.selected) {
      this.selected.removeClass('active-selection');
      this.selected = null;
    };
  },
  setSelection:function(selection){
    var item;
    if (item = this.$[selection]){
      if (this.selected == item) return;
      if (this.selected) this.selected.removeClass('active-selection');
      this.selected = item;
      this.selected.addClass('active-selection');
    }
    
  },
  accountChanged:function(){
    if(!this.account) return;
    var account = this.account.account;
    var label = this.decodeHtml(account.displayName());
    this.$.header.setCaption(label);
    
    // attempt to setup the blavatar if there is a valid one
    var blavatar = new Image();
    blavatar.onload = enyo.bind(this, function(){
      if(this.$ && this.$.header){
        this.$.header.setIcon(blavatar.src);
      }
    });
    blavatar.src = enyo.application.makeBlavatar(account.xmlrpc, {
      size:30
    });
  },
  updateCommentCount:function(){
    this.$.comments.setUnreadCount(this.account.pendingCommentCount);
  },
  itemClick:function(item, inEvent){
    if(this.selected == item) return;
    if(this.selected) this.selected.removeClass("active-selection");
    this.selected = item;
    this.selected.addClass('active-selection');
    this.doSelect(item.action, this.account);
    return true;
  },
  draftCountChanged:function(){
    this.$.drafts.setUnreadCount(this.draftCount);
  },
  decodeHtml:function(input){
    var e = document.createElement('div');
    e.innerHTML = input;
    if (e.childNodes.length > 0) {
      return e.childNodes[0].nodeValue;      
    } else {
      return "";
    }
  }
  /*openDashBoard:function(item, inEvent){
	  if(!this.account) return;
	  console.log("Launching Dashboard");
	  params = {'account': this.account};
	  enyo.windows.activate("./dashboardView.html", "Dashboard", params);
	  return;
  }*/
});
enyo.kind({
  name:'wp.SingleAccountListItem',
  kind:'wp.AccountListItem',
  create:function(){
    this.inherited(arguments);
    this.$.drafts.show();
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
    unreadCount:0,
    action:''
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
