enyo.kind({
  name:'wp.GlobalListItem',
  kind:'wp.AccountListItem',
  items: [
    { label:'All Comments', icon:'./images/icons/comments-icon.png' },
    { label:'Drafts', icon:'./images/icons/drafts-icon.png' }
  ],
  create:function(){
    this.inherited(arguments);
    this.$.comments.setLabel($L('All Comments'));
    this.$.comments.hide();
    this.$.drafts.show();
    this.$.posts.hide();
    this.$.pages.hide();
    this.$.stats.hide();
  },
  updateCommentCount:function(){
    // this.$.comments.setUnreadCount(this.account.pendingCommentCount);
    // get all account pending comment counts
    var list_item = this;
    enyo.application.models.Comment.all().filter('status', '=', 'hold').count(function(count){
      list_item.$.comments.setUnreadCount(count);
    });
  }
});