enyo.kind({
  name:'wp.GlobalListItem',
  kind:'wp.AccountListItem',
  items: [
    { label:'Comments', icon:'./images/icons/comments-icon.png', unreadCount:100 },
    { label:'Drafts', icon:'./images/icons/drafts-icon.png' }
  ],
  create:function(){
    this.inherited(arguments);
  }
});