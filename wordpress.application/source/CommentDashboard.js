enyo.kind({
  name:'CommentDashboard',
  kind: enyo.Component,
  events: {
    onTapComment:''
  },
  constructor:function(){
    this.inherited(arguments);
    this.dashboards = [];
  },
  destroy:function(){
    delete this.dashboards;
  },
  notifyComment: function(comment, account){
    console.log("Notifying comment", comment, account);
    var dashboard = this.getAccountDashboard(account);
    dashboard.push({
      icon:'images/notification-comment-large.png',
      title:comment.author,
      text:comment.content.replace(/<\/?[^>]+>/,''),
      comment:comment,
      account:account
    });
  },
  getAccountDashboard:function(account){
    var dashboards;
    if (dashboard = this.dashboards[account.id]) {
      return dashboard;
    };
    dashboard = this.dashboards[account.id] = this.createComponent({
      kind:'enyo.Dashboard',
      name:'comment_dashboard_' + account.id,
      onTap:'tappedComment'
    });
    return dashboard;
  },
  tappedComment:function(sender, layer, mouseEvent){
    console.log("Tapped Comment");
    this.doTapComment(layer.comment, layer.account);
    var dashboard = this.getAccountDashboard(layer.account);
    dashboard.pop();
  }
});