
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
  isOnErrorPopupShown : false,
  components: [
    { name: 'xmlrpc_client', kind:'XMLRPCService' },
    { name: 'stats_api', kind: 'WebService', method: 'POST', url: 'https://api.wordpress.org/webosapp/update-check/1.0/' },
    {kind: "ApplicationEvents", onOpenAppMenu: "openAppMenuHandler", onCloseAppMenu: "closeAppMenuHandler"},
    { kind:'Pane', flex:1, components:[
      { name:'blankSlate', flex:1, kind:'enyo.Control' },
      {
        name: 'panes',
        kind: 'enyo.SlidingPane',
        className:'wordpress-main-pane',
        flex: 1,
        multiViewMinWidth:500,
        components: [
          { name:'left', className:'source-list', width:'225px', components:[
            { name:'sourceList', kind:'wp.SourceList', flex:1, onSelectAccountAction:'performAccountAction', /*onCreateDraft:'composeDraft',*/ onAddBlog:'addNewBlog' }
          ]},
          // column for showing what is selected from the source list
          { name:'middle', width:'350px', fixedWidth:true, peekWidth:42, components:[
            { name:'middlePane', flex:1, kind:'Pane', onSelectView:'setupMiddleView', components:[
              { name:'middle_blank', kind:'Control', flex:1 },
              { name:'comment_list', kind:'wp.CommentList', flex:1, onLoadMoreComments:'loadMoreComments', onSelectComment:'onSelectComment', onRefreshComment:'' },
              { name:'post_list', kind:'wp.PostList', flex:1, onSelectPost:'onSelectPost',  onRefresh:'downloadPosts'},
              { name:'page_list', kind:'wp.PageList', flex:1, onSelectPost:'onSelectPage', onRefresh:'downloadPages'},
              { name:'draft_list', kind:'wp.DraftList', flex:1, onSelectPost:'onSelectPage' },
              { name:'stats', kind: 'wp.Stats', flex:1, lazy:true }
            ]}
          ]},
          { name:'main', className:'main-pane', flex:1, showing:false, onResize:'resizeSubviews', peekWidth:42, components:[
              { name:'content', flex:1, kind:'Pane', onSelectView:'setupSubView', components:[
                { name:'blank', kind:'BlankSlate', clasName:'blank-view', flex:1 },
                { name:'comment_view', kind:'wp.CommentView', onReply:'replyToComment', flex:1, lazy:false },
                { name:'post_view', kind:'wp.PostView', onEdit:'openPostEditor', onDelete:'onDeletePost', flex:1 },
                // { name:'comments', kind: 'wp.Comments', flex:1, lazy:false, onReply:'replyToComment', onLoadMoreComments:'loadMoreComments' },
                // { name:'posts', kind: 'wp.Posts', onLoadMore:'loadMorePosts', flex:1, lazy:true },
                // { name:'pages', kind: 'wp.Pages', onLoadMore:'loadMorePages', flex:1, lazy:true },
                { name:'drafts', kind: 'wp.Drafts', flex:1, lazy:true },
              ]}
          ]}
      ]}
    ]},
    // main sliding pane interface
    { name:'replyForm', scrim:true, onPublish:'publishCommentReply', className:'wp-comment-reply-dialog', kind:'wp.ReplyForm'},
    { kind:'AppMenu', automatic: false, components:[
      {name: 'setupMenuItem', caption: $L('Setup Blog'), onclick:'addNewBlog' }
    ]},
    { name:'passwordForm', kind:'PasswordReset', onSavePassword:'saveAccountPassword', onCancel:'closePasswordForm' },
    { name:'setupForm', scrim:true, lazy:false, kind:'enyo.Toaster', className:'wp-blog-setup-dialog',  onBeforeOpen:'beforeNewBlogDialogOpen', components:[
      { name:'setup', flex:1, height:'100%', kind: 'wp.AccountSetup', onSelectBlogs:'setupBlogs', onCancel:'showPanes' }
    ]},
    
	//Global errors handling interface components
    {name: "globalErrorPopup", kind: "Popup",  lazy:false, showHideMode: "transition",  openClassName: "scaleFadeIn", scrim: true, 
    	dismissWithClick:false, modal: true, className: "fastAnimate transitioner wp-blog-setup-dialog", width: "400px", components: [
		{name: 'globalNeedHelpPane', kind: "wp.NeedHelpPrompt", onNeedHelp: "needHelp", onSubmit: "closeGlobalErrorPopup"}
	]},
    { name: 'globalHelpView', scrim:true, className:'wp-comment-reply-dialog', kind:'enyo.Toaster', components:[
      {content: $L("Please visit the FAQ to get answers to common questions. If you're still having trouble, post in the forums.")},
      { kind: 'enyo.Button', onclick:"readTheFAQ", caption: $L('Read the FAQ') },
      { kind: 'enyo.Button', onclick:"sendEmail", caption: $L('Send Support E-mail')},
    ]},
  ],
  create:function(){
    this.inherited(arguments);
    // create a signing key
    // should this only be done when needed or can it be called whenever?
    enyo.windowParamsChangeHandler = enyo.bind(this, 'windowParamsChangeHandler');
    // this.runStats();
  },
  ready:function(){
    console.log("Ready");
    this.loadAccounts();
  },
  loadAccounts: function(){
    this.log("Load accounts", enyo.application.accountManager.accounts);
    var client, clients = [];
    enyo.forEach(enyo.application.accountManager.accounts, function(account){
      client = this.createComponent({
        kind:'wp.WordPressClient',
        account:account,
        onInvalidPassword:'displayPasswordForm',
        onPasswordReady:'refreshClient',
        
        onFailure:'connectionError',
        onBadURL:'connectionError',
                
        onPendingComments:'updateCommentCount',
        onNewComment:'refreshComments',
        onUpdateComment:'refreshComments',
        onDeleteComment:'refreshCommentsAfterDelete',
        onRefreshComments:'refreshComments',
        
        onNewPost:'refreshPosts',
        onUpdatePost:'refreshPosts',
        onDeletePost:'refreshPosts',
        onSaveDraft:'refreshDrafts',
        onRefreshPosts:'refreshPosts',
        
        onNewPage:'refreshPages',
        onUpdatePage:'refreshPages',
        onSaveDraftPage:'refreshDrafts',
        onDeletePage:'refreshPages',
        onRefreshPages:'refreshPages',
      });
      clients.push(client);
    }, this);
    this.setAccounts(clients);
    this.accountChanged();
    this.commentChanged();
    this.refreshDraftCount();
  },
  connectionError:function(sender, response, request){
	this.log("connectionError", response, request);
    if(this.isOnErrorPopupShown == true) return;
    
    this.isOnErrorPopupShown == true;
    
    var errorTitle = 'Error';
    var errorMessage = $L('Sorry, something went wrong. Please, try again.');	 
    if(response && response.faultString && response.faultString.length > 0) {
    	errorMessage = response.faultString;
    }
    //check the error code
    if(response && response.faultCode && response.faultCode == 403) {
    	this.displayPasswordForm(sender);
    	return;
    }
    
    this.log("error: ", errorTitle, errorMessage);
    this.$.globalNeedHelpPane.setErrorMessage(errorTitle, errorMessage);
    this.$.globalErrorPopup.openAtCenter();
        
    //stop the loading spinners
    if(this.$.post_list) this.$.post_list.stopSpinner();
    if(this.$.page_list) this.$.page_list.stopSpinner();
    if(this.$.draft_list) this.$.draft_list.stopSpinner();
  },
  closeGlobalErrorPopup: function(inSender) {
	  this.isOnErrorPopupShown = false;
	  this.$.globalErrorPopup.close();
  },
  needHelp: function(inSender) {
	  this.$.globalErrorPopup.close();
	  this.isOnErrorPopupShown = false;
	  this.$.globalHelpView.openAtCenter();
  },
  readTheFAQ:function(){
	  this.isOnErrorPopupShown = false;
	  enyo.application.launcher.readTheFAQ();
  },
  sendEmail:function(){
	  this.isOnErrorPopupShown = false;
	  enyo.application.launcher.sendEmailToSupport();
  },
  refreshClient:function(sender){
    console.log("Refresh client");
    sender.downloadComments();
    sender.downloadPages();
    sender.downloadPosts();
  },
  refreshDrafts:function(){
	this.log(">>>Refreshing drafts");  
    this.refreshDraftCount();
    this.$.draft_list.refresh();
  },
  refreshDraftCount:function(){
	this.log("Refreshing the drafts count");  
    var sourceList = this.$.sourceList;
    enyo.application.models.Post.all().filter('local_modifications', '=', 'true').count(function(draft_count){
    	enyo.application.models.Page.all().filter('local_modifications', '=', 'true').count(function(page_draft_count){
    	      sourceList.setDraftCount(draft_count+page_draft_count);
    	    });
    });
  },
  refreshComments:function(sender, comment, account){
    console.log("refresh the comments!");
    if (this.account == sender) {
      this.$.comment_list.refresh();
    };
    // if (this.$.content.getView() == this.$.comments) {
    //   if (this.$.comments.account == sender) {
    //     this.$.comments.refresh();
    //   }
    // };
  },
  refreshCommentsAfterDelete:function(sender, comment, account){
    console.log(this.account, sender);
    if (this.account == sender) {
      if (this.$.comment_view.comment == comment) {
        this.$.content.selectView(this.$.blank);
        this.$.comment_list.clearSelection();
      };
      this.$.comment_list.refresh();
    };
    // if (this.$.content.getView() == this.$.comments) {
    //   if (this.$.comments.account == sender) {
    //     this.$.comments.refresh();
    //   }
    // };
  },
  downloadPosts:function(sender){
    sender.account.downloadPosts();
  },
  refreshPosts:function(sender, post, account){
	  this.log(">>>refreshPosts");
    this.refreshDraftCount();
	  if (this.account == sender) {
	    this.$.post_list.stopSpinner();
	    if (this.$.post_list.selected = post) {
	      this.$.post_list.clearSelection();
	      this.$.content.selectView(this.$.blank);
	    };
	    this.$.post_list.refresh();
	  };
  },
  downloadPages:function(sender){
    sender.account.downloadPages();
  },
  refreshPages:function(sender, page, account){
	  this.log(">>>refreshPages");
    this.refreshDraftCount();
	  if (this.account == sender) {
	    if (this.$.page_list.selected = page) {
	      this.$.page_list.clearSelection();
	      this.$.content.selectView(this.$.blank);
	    };
	    this.$.page_list.refresh();
	  };
  },
  updateCommentCount:function(sender, count){
    // console.log("Pending comments:", count);
    this.$.sourceList.updateCommentCounts();
  },
  performAccountAction: function(sender, action, account){
    this.setAccount(account);
    this.activeAccount = account;
    if (action == 'comments') {
      this.$.middle.setFixedWidth(true);
      this.$.middlePane.selectViewByName('comment_list');
      this.$.main.setShowing(true);
    };
    if (action == 'posts') {
      this.$.middle.setFixedWidth(true);
      this.$.middlePane.selectViewByName('post_list');
      this.$.main.setShowing(true);
    };
    if (action == 'pages') {
      this.$.middle.setFixedWidth(true);
      this.$.middlePane.selectViewByName('page_list');
      this.$.main.setShowing(true);
    };
    if (action == 'drafts') {
      this.$.middle.setFixedWidth(true);
      this.$.middlePane.selectViewByName('draft_list');
      this.$.main.setShowing(true);
    };
    if (action == 'stats') {
      this.$.middle.setFixedWidth(false);
      this.$.middlePane.selectViewByName('stats');
      this.$.main.setShowing(false);
    };
    if (!this.$.panes.multiView) {
      this.$.panes.selectView(this.$.main);
    };
  },
  setupMiddleView:function(sender, view){
    
    switch(view){
      case this.$.comment_list:
      case this.$.account_list:
      case this.$.page_list:
      case this.$.post_list:
        if(view.account != this.account){
          console.log("Account is changed, selection should be cleared");
          view.setAccount(this.account);
        }
        if (view.getSelected()) {
          view.fireSelected()
        }else{
          this.$.content.selectView(this.$.blank);
        }
        break;
     case this.$.draft_list:
       if (view.getSelected()) {
         view.fireSelected()
       }else{
         this.$.content.selectView(this.$.blank);
       }
       break;
     case this.$.stats:
       if(view.account != this.account){
         console.log("Account is changed, selection should be cleared");
         view.setAccount(this.account);
       }
       break;
      
    }
  },
  setupSubView:function(sender, view){
    var account;
    if ( view.name == 'posts' || view.name == 'pages' || view.name == 'stats') {
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
    if (this.$.comment_list) this.$.comment_list.resize();
    if (this.$.post_list) this.$.post_list.resize();
	if (this.$.stats) this.$.stats.resizeChart();
  },
  backHandler: function(sender, e){
    this.$.panes.back(e);
  },
  beforeNewBlogDialogOpen: function() {
	  if (this.accounts.length == 0) {
		  this.$.setupForm.setScrim(false);
		  this.$.setupForm.setModal(true);
		  this.$.setupForm.setDismissWithClick(false);
		  this.$.setup.setCancelable(false);
	  }else{
		  this.$.setupForm.setScrim(true);
		  this.$.setupForm.setModal(false);
		  this.$.setupForm.setDismissWithClick(true);
	  }
	  this.$.setup.reset();
  },
  accountsChanged:function(){
    if (this.accounts.length == 0) {
      this.$.pane.setTransitionKind('enyo.transitions.Simple');
      // we don't have any accounts, force the welcome screen
       enyo.nextTick(this, function(){
         this.$.setupForm.setScrim(false);
         this.$.setupForm.setModal(true);
         this.$.setupForm.open();
         this.$.setup.setCancelable(false);
       });
    }else{
      this.$.sourceList.setAccounts(this.accounts);
      this.$.setupForm.setScrim(true);
      this.$.setupForm.setModal(false);
      this.$.pane.selectView(this.$.panes);
    }
  },
  accountChanged:function(){
    //an account should be selected, show in source list as activeaccount
  },
  commentChanged:function(){
    // select the comment item from the account source list
    // show the comment view
  },
  onSelectComment:function(sender, comment){
    this.$.comment_view.setAccount(this.account);
    this.$.comment_view.setComment(comment);
    this.$.content.selectView(this.$.comment_view);
    this.$.main.setShowing(true);
  },
  onSelectPost:function(sender, post){
    this.$.post_view.setAccount(this.account);
    this.$.post_view.setPost(post);
    this.$.content.selectView(this.$.post_view);
  },
  onSelectPage:function(sender, post){
    this.$.post_view.setAccount(this.account);
    this.$.post_view.setPost(post);
    this.$.content.selectView(this.$.post_view);
  },
  onDeletPost:function(sender, post){
    
  },
  onDeletePage:function(sender, page){
    
  },
  onDeleteComment:function(sender, comment){
    
  },
  addNewBlog:function(sender){
	this.$.setup.reset();
    this.$.setupForm.open();
  },
  setupBlogs:function(sender, blogs, username, password){
    var that = this;
    this.$.setupForm.close();
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
  },
  showPanes:function(){
    // this.$.pane.selectView(this.$.panes);
    this.$.setupForm.close();
  },
/*  composeDraft:function(sender, inEvent){
    var account;
    if(this.activeAccount){
      account = this.activeAccount.account;
    }else{
      account = this.accounts[0].account;
    }
    enyo.application.launcher.openComposerWithNewItem(account,"Post");
  },*/
  openAppMenuHandler: function() {
    // this.log("Open app menu please");
    // this.$.appMenu.render();
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
  },
  cancelCommentReply:function(sender){
    this.$.replyForm.close();
  },
  publishCommentReply:function(sender){
    var client = this.activeAccount;
    var reply = sender.getValue();
    var comment = new enyo.application.models.Comment();
    comment.content = reply;
    comment.status = 'approve';
    comment.comment_parent = sender.comment.comment_id;
    comment.post_id = sender.comment.post_id;
        
    client.newComment(comment);
    this.$.replyForm.close();
    
  },
  windowParamsChangeHandler:function(params){
	var p = params;
	this.log(window.name, p);
	
	if (params.action == 'refreshPages') {
		this.refreshDraftCount();
		if(this.$.page_list)
			this.$.page_list.refresh();
	};
	if (params.action == 'refreshPosts') {
		this.refreshDraftCount();
		if(this.$.post_list)
			this.$.post_list.refresh();
	};  
    if (params.action == 'refreshComments') {
      this.updateCommentCount();
      if(this.$.comment_list)
    	  this.$.comment_list.refresh();
    };
    if (params.action == 'refreshDrafts') {
      this.refreshDraftCount();
      if(this.$.draft_list)
    	  this.$.draft_list.refresh();
    };
    if (params.action == 'showComment') {
      // we should have a comment id
      var app = this;
      enyo.application.models.Comment.load(params.comment_id, function(comment){
        if (comment) {
          comment.fetch('account', function(account){
            var client;
            
            for (var i=0; i < app.accounts.length; i++) {
              if (app.accounts[i].account.id == account.id) client = app.activeAccount = app.accounts[i]
            };
            
            app.$.sourceList.selectAccountItem(account, 'comments');
            app.$.comments.setAccount(client);
            app.$.content.selectView(app.$.comments);
            app.$.comments.setComment(comment);
            app.$.comments.highlightComment(comment);
          });
        };
      });
    };
  },
  // sender will be a Comments
  loadMoreComments:function(sender, options){
      var wpclient = sender.account;
      wpclient.loadComments(options, true);
  },
  loadMorePosts:function(sender, numberOfPosts){
    var wpclient = sender.account;
    wpclient.downloadPosts(numberOfPosts);
  },
  openPostEditor:function(sender, post){
    post.fetch('account', function(account){
      enyo.application.launcher.openComposer(account, post);    
    })
  },
  onDeletePost:function(sender, post){
    var wp = this;
    if (post.local_modifications) {
      enyo.application.persistence.remove(post);
      enyo.application.persistence.flush(function(){
        //refresh the drafts
        wp.$.draft_list.refresh();
        if (wp.$.draft_list.selected == post) {
          wp.$.content.selectView(this.$.blank);
        };
      });
      //then just delete the post itself
    }else if (post._type == 'Post') {
  	  this.account.deletePost(post);         
    }else if(post._type == 'Page'){
      this.account.deletePage(post);
    }
  }
  
});
