enyo.kind({
  name:'CommentDashboard',
  kind: enyo.Component,
  constructor:function(){
    this.inherited(arguments);
    this.dashboards = [];
  },
  notifyComment: function(comment, account){
    console.log("Notify comment for account", comment, account);
    var dashboard = this.getAccountDashboard(account);
    dashboard.push({
      icon:'images/notification-comment-large.png',
      title:comment.author,
      text:comment.content.replace(/<\/?[^>]+>/,'')}
    );
  },
  getAccountDashboard:function(account){
    var dashboards;
    if (dashboard = this.dashboards[account.id]) {
      return dashboard;
    };
    dashboard = this.dashboards[account.id] = this.createComponent({kind:'enyo.Dashboard', name:'comment_dashboard_' + account.id});
    return dashboard;
  },
  showTest: function(){
    console.log("Test dsahboard")
    if (!this.testDashboard) { this.testDashboard = this.createComponent({kind:'enyo.Dashboard', name:'testDashboard'}); };
    
    var message = {
      icon: "images/notification-comment-large.png",
      title: "Test Notification",
      text: "Seriously this better fucking work"
    };

    
    this.testDashboard.push(message);
  }
});