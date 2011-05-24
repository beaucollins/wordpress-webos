/*
 WordPress application root
*/
enyo.kind({
  name: 'wp.WordPress',
  kind: 'enyo.VFlexBox',
  className: 'enyo-bg',
  published: {
    accounts:[],
    account:null,
    comment:null
  },
  components: [
    { name: 'xmlrpc_client', kind:'XMLRPCService' },
    { name: 'stats_api', kind: 'WebService', method: 'POST', url: 'https://api.wordpress.org/webosapp/update-check/1.0/' },
    { kind:'Pane', flex:1, components:[
      {
        name: 'panes',
        kind: 'enyo.SlidingPane',
        flex: 1,
        multiViewMinWidth:500,
        components: [
          { name:'left', width:'225px', components:[
            { name:'sourceList', kind:'wp.SourceList', flex:1, onSelectAccountAction:'performAccountAction', onCreateDraft:'composeDraft', onAddBlog:'addNewBlog' }
          ]},
          // column for showing what is selected from the source list
          { name:'main', flex:1, onResize:'resizeSubviews', peekWidth:42, components:[
              { name:'content', flex:1, kind:'Pane', onSelectView:'setupSubView', components:[
                { name:'blank', kind:'Control', flex:1 },
                { name:'comments', kind: 'wp.Comments', flex:1, lazy:false, onReply:'replyToComment' },
                { name:'posts', kind: 'wp.Posts', flex:1, lazy:true },
                { name:'pages', kind: 'wp.Pages', flex:1, lazy:true },
                { name:'stats', kind: 'wp.Stats', flex:1, lazy:true },
                { name:'drafts', kind: 'wp.Drafts', flex:1, lazy:true },
              ]}
          ]}
      ]},
      { name: 'setup', kind: 'wp.AccountSetup', onSelectBlogs:'setupBlogs', onCancel:'showPanes' },
    ]},
    // main sliding pane interface
    { name:'replyForm', scrim:true, onPublish:'publishCommentReply', className:'wp-comment-reply-dialog', kind:'wp.ReplyForm'},
    { kind:'AppMenu', components:[
      {name: 'setupMenuItem', caption: $L('Setup Blog'), onclick:'addNewBlog' }
    ]},
    { name:'passwordForm', kind:'PasswordReset', onSavePassword:'saveAccountPassword', onCancel:'closePasswordForm' }
    
  ],
  create:function(){
    this.inherited(arguments);
    // create a signing key
    // should this only be done when needed or can it be called whenever?
    this.loadAccounts();
    
    // this.runStats();
  },
  loadAccounts: function(){
    // console.log("Load accounts", enyo.application.accountManager.accounts);
    var client, clients = [];
    enyo.forEach(enyo.application.accountManager.accounts, function(account){
      client = this.createComponent({
        kind:'wp.WordPressClient',
        account:account,
        onInvalidPassword:'displayPasswordForm',
        onPendingComments:'updateCommentCount',
        onNewComment:'refreshComments',
        onUpdateComment:'refreshComments',
        onNewPost:'refreshPosts',
        onUpdatePost:'refreshPosts',
        onNewPage:'refreshPages',
        onUpdatePage:'refreshPages',
        onPasswordReady:'refreshClient',
        onSaveDraft:'refreshDrafts',
        onSavePost:'refreshPosts'
      });
      clients.push(client);
    }, this);
    this.setAccounts(clients);
    this.accountChanged();
    this.commentChanged();
    this.refreshDraftCount();
  },
  refreshClient:function(sender){
    console.log("Refresh client");
    sender.downloadComments();
    sender.downloadPages();
    sender.downloadPosts();
  },
  refreshDrafts:function(){
    this.refreshDraftCount();
    if (this.$.content.getView() == this.$.drafts) {
      this.$.drafts.refresh();
    };
  },
  refreshDraftCount:function(){
    var sourceList = this.$.sourceList;
    enyo.application.models.Post.all().filter('local_modifications', '=', 'true').count(function(draft_count){
      sourceList.setDraftCount(draft_count);
    });
  },
  refreshComments:function(sender, comment, account){
    if (this.$.content.getView() == this.$.comments) {
      if (this.$.comments.account == sender) {
        this.$.comments.refresh();
      }
    };
  },
  refreshPosts:function(sender, post, account){
    this.refreshDraftCount();
    if (this.$.content.getView() == this.$.posts) {
      if (this.$.posts.account == sender) {
        console.log("Refresh posts!")
        this.$.posts.refresh();
      }
    };
  },
  refreshPages:function(sender, page, account){
    if (this.$.content.getView() == this.$.page) {
      if (this.$.page.account == sender) {
        this.$.page.refresh();
      }
    };
  },
  updateCommentCount:function(sender, count){
    // console.log("Pending comments:", count);
    this.$.sourceList.updateCommentCounts();
  },
  performAccountAction: function(sender, action, account){
    this.setAccount(sender);
    this.activeAccount = account;
    if (action == 'comments') {
      this.$.content.selectViewByName('comments');      
    };
    if (action == 'posts') {
      this.$.content.selectViewByName('posts');
    };
    if (action == 'pages') {
      this.$.content.selectViewByName('pages');
    };
    if (action == 'drafts') {
      this.$.content.selectViewByName('drafts');
    };
    if (action == 'stats') {
      this.$.content.selectViewByName('stats');
    };
    if (!this.$.panes.multiView) {
      this.$.panes.selectView(this.$.main);
    };
  },
  setupSubView:function(sender, view){
    console.log("Setup Sub View", view);
    var account;
    if (view.name == 'comments' || view.name == 'posts' || view.name == 'pages' || view.name == 'stats') {
      account = this.account ? this.account : this.activeAccount;
      view.setAccount(this.activeAccount);
    };
    if (view.name == 'drafts') {
      view.refresh();
    };
  },
  resizeHandler: function(){
    this.$.panes.resize();
  },
  resizeSubviews: function(){
    if (this.$.comments) this.$.comments.resize();
    if (this.$.posts) this.$.posts.resize();
  },
  backHandler: function(sender, e){
    this.$.panes.back(e);
  },
  accountsChanged:function(){
    // save the accounts
    this.$.sourceList.setAccounts(this.accounts);
    if (this.accounts.length == 0) {
      // we don't have any accounts, force the welcome screen
      this.$.pane.setTransitionKind('enyo.transitions.Simple');
      this.$.setup.setCancelable(false);
      this.$.pane.selectView(this.$.setup);
      this.$.pane.setTransitionKind('enyo.transitions.Fade');
    }
  },
  accountChanged:function(){
    //an account should be selected, show in source list as activeaccount
  },
  commentChanged:function(){
    // select the comment item from the account source list
    // show the comment view
  },
  addNewBlog:function(sender){
    if (this.accounts.length > 0) this.$.setup.setCancelable(true);
    this.$.setup.reset();
    this.$.pane.selectView(this.$.setup);
  },
  setupBlogs:function(sender, blogs, username, password){
    var that = this;
    enyo.map(blogs, function(blog, index, blogs){
      var account = new enyo.application.models.Account(enyo.mixin(blog, { username:username, password:password }));
      enyo.application.persistence.add(account);
      var client = that.createComponent({'kind':'wp.WordPressClient', 'account':account});
      client.savePassword();
      enyo.application.accountManager.addAccount(account);
    }, this);
    // add some accounts
    var wp = this;
    enyo.application.persistence.flush(function(){
      wp.loadAccounts();      
    });
    this.$.pane.selectView(this.$.panes);
  },
  showPanes:function(){
    this.$.pane.selectView(this.$.panes);
  },
  // if given a post, then creating a draft based on that post
  // the sender should have an associated account that we will
  // link up by xmlrpc url for now
  composeDraft:function(sender, inEvent, post, options){
    //launches a new window with the compose view
    this.log("post",post);
    this.log("options", options);
    // this.log("params", params);
    
    var account;
    
    if(this.activeAccount){
      account = this.activeAccount.account;
    }else{
      account = this.accounts[0].account;
    }
    
	  params = {'account': account, 'post' : post};
    enyo.mixin(params, options);
    enyo.application.launcher.openDraft(params);
  },
  openAppMenuHandler: function() {
    // console.log("Open app menu please");
    this.$.appMenu.render();
    this.$.appMenu.open();
  },
  closeAppMenuHandler: function() {
      this.$.appMenu.close();
  },
  displayPasswordForm:function(sender){
    this.$.passwordForm.setAccount(sender);
    this.$.passwordForm.openAtCenter();
  },
  saveAccountPassword:function(sender, password){
    this.$.passwordForm.close();
    // console.log("Let's save the password: " + password);
    sender.account.setPassword(password);
    sender.account.savePassword();
  },
  closePasswordForm:function(){
    this.$.passwordForm.close();
  },
  runStats: function() {
      var lastRun = Date.parse(enyo.getCookie('statsLastRun'));
      var now = new Date();
      var daysSinceLastRun = 100;
      if (lastRun) {
          console.log('Last time we sent stats: ' + lastRun);
          daysSinceLastRun = (now.getTime() - lastRun) / (1000 * 86400);
      }
      if (daysSinceLastRun >= 7) {
          var statsParams = {
              appVersion: enyo.fetchAppInfo().version,
          };
          var deviceInfo = enyo.fetchDeviceInfo();
          if (deviceInfo) {
              statsParams.deviceInfo = deviceInfo;
          }
          console.log('Sending info to Stats API: ' + this.$.stats_api.url);
          // console.log('data => ' + enyo.json.stringify(statsParams));
          this.$.stats_api.call(statsParams);
          enyo.setCookie('statsLastRun', new Date());          
      }
  },
  replyToComment:function(sender){
    this.$.replyForm.setComment(sender.comment);
    this.$.replyForm.open();
    console.log("Reply to comment", sender);
  },
  cancelCommentReply:function(sender){
    this.$.replyForm.close();
  },
  publishCommentReply:function(sender){
    var client = this.activeAccount;
    var reply = sender.getValue();
    console.log("Reply", sender);
    var comment = new enyo.application.models.Comment();
    comment.content = reply;
    comment.status = 'approve';
    comment.comment_parent = sender.comment.comment_id;
    comment.post_id = sender.comment.post_id;
        
    client.newComment(comment);
    this.$.replyForm.close();
    
  }
  
});

