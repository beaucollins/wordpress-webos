enyo.kind({
  name:'wp.Drafts',
  kind:'wp.Posts',
  acquirePosts:function(sender, page, pageSize){
    console.log("Acquire page:", page, pageSize);
    if (page < 0) return;
    var that = this;
    enyo.application.models.Post.all().filter('local_modifications', '=', 'true')
      .prefetch('account')
      .order('date_created_gmt', false)
      .limit(pageSize)
      .skip(page*pageSize)
      .list(function(posts){
        console.log("Received posts: ", posts);
        if (posts.length > 0) {
          that.$.postList.setPage(page, posts);          
        };
      });
  },
  create: function(){
	  this.inherited(arguments);
	  this.$.postList.hideNewButton();
  },
  refresh:function(){
    console.log("Refresh!");
    this.$.postList.accountChanged();
  },
  refreshPosts:function(){
    this.refresh();
  },
  openPostEditor:function(sender, post){
    console.log("Opening with account: " + post.account);
    enyo.application.launcher.openComposer(post.account, post);
  }
});