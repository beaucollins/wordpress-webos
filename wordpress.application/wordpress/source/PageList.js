enyo.kind({
  name:'wp.PageList',
  kind:'wp.PostList',
  acquirePosts:function(page, pageSize){
    if(!this.account) return;
    if (page < 0) return;
    var load_requests = this.load_requests;
    var that = this;
    console.log("Looking for page", page, pageSize)
    this.account.account
      .pages
      .order('date_created_gmt', false)
       .filter('local_modifications', '=', null) //we must filter the local drafts here
      .filter('page_id', '!=', '0')
      .limit(pageSize)
      .skip(page*pageSize)
      .list(function(posts){
        if (posts.length > 0) {
          // console.log("Data for the page:", page, posts);
          that.setPage(page, posts);          
        };
                

        if (that.account && that.missingPage(page) && !load_requests[page]) {
          load_requests[page] = true;
          that.doLoadMore(page*pageSize + pageSize);
        };

      });
      
  },
  openNewItemEditor:function(sender, post){
  	enyo.application.launcher.openComposerWithNewItem(this.account.account,"Page");    
  }

});