enyo.kind({
  name:'wp.Drafts',
  kind:'wp.Posts',
  acquirePosts:function(sender, page, pageSize){
    console.log("Reading drafts:", page, pageSize);
    if (page < 0) return;
    var that = this;
    enyo.application.models.Post.all().filter('local_modifications', '=', 'true')
      .prefetch('account')
      .order('date_created_gmt', false)
     // .limit(pageSize)
     // .skip(page*pageSize)
      .list(function(posts){       
	    enyo.application.models.Page.all().filter('local_modifications', '=', 'true')
	      .prefetch('account')
	      .order('date_created_gmt', false)
	     // .limit(pageSize)
	     // .skip(page*pageSize)
	      .list(function(pages){
	        console.log("Received posts: ", pages);
	        that.$.postList.setPage(page, posts.concat(pages)); 
	      });
      });
  },
  create: function(){
	  this.inherited(arguments);
	  this.$.postList.hideNewButton();
  },
  refresh:function(){
    console.log("Draft Items UI Refresh!");
    this.$.postList.accountChanged();
    this.$.pane.selectView(this.$.blank);
  },
  refreshPosts:function(){
    this.refresh();
  },
  openPostEditor:function(sender, post){
    console.log("Opening with account: " + post.account);
    enyo.application.launcher.openComposer(post.account, post);
  },
  deleteItem:function(sender, post){ 
	  this.log('delete draft clicked');
	  var client = this;
	  if (post._type === "Page")
		  enyo.application.models.Page.all().remove(post);
	  else
		  enyo.application.models.Post.all().remove(post);
	  
	  enyo.application.persistence.flush(function(){
		  client.refreshPosts();
	  });
  },
});