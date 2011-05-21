enyo.kind({
  name:'wp.GlobalListItem',
  kind:'wp.AccountListItem',
  items: [
    { label:'All Comments', icon:'./images/icons/comments-icon.png' },
    { label:'Drafts', icon:'./images/icons/drafts-icon.png' }
  ],
  create:function(){
    this.inherited(arguments);
    this.$.comments.setLabel($L('All Comments'))
    this.$.drafts.show();
    this.$.posts.hide();
    this.$.pages.hide();
    this.$.stats.hide();
  }
});