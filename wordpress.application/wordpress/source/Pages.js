enyo.kind({
  name:"wp.Pages",
  kind:'wp.Posts',
  className: 'posts-pane',
  // Not optimal, this api is seriously going to kill the app,
  // are we going to set a max number of posts to donwload somehow?
  acquirePosts:function(sender, page, pageSize){
    if(!this.account) return;
    if (page < 0) return;
    var that = this;
    console.log("Page size", pageSize);
    this.account.account
      .pages
      .order('date_created_gmt', false)
      .filter('page_id', '!=', '0')
      .filter('local_modifications', '=', null) //we must filter the local drafts here
      .limit(pageSize)
      .skip(page*pageSize)
      .list(function(posts){
    	  if (posts.length > 0) {
    		  that.$.postList.setPage(page, posts);
    	  }
        // that.$.postList.refresh();
      });
    // if (this.account && this.$.dataPage.missingPage(page)) {
    //   this.$.xmlrpc_client.callMethod({methodParams:[this.account.blogid, this.account.username, this.account.password, ((page+1) * this.$.list.pageSize)]}, { page:page });
    // };
  },
  refreshPosts:function(){
    this.account.downloadPages();  
   },
  openNewItemEditor:function(sender, post){
	this.log('new Page clicked');
	enyo.application.launcher.openComposerWithNewItem(this.account.account,"Page");    
  },
  deleteItem:function(sender, post){ 
	  this.log('delete Page clicked');
	  this.account.deletePage(post);    
  },
})