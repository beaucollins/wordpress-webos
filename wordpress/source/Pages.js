enyo.kind({
  name:"wp.Pages",
  kind:'wp.Posts',
  // Not optimal, this api is seriously going to kill the app,
  // are we going to set a max number of posts to donwload somehow?
  acquirePosts:function(sender, page){
    if(!this.account) return;
    var that = this;
    this.account.account
      .pages
      .order('date_created_gmt', false)
      .limit(this.$.list.pageSize)
      .skip(page*this.$.list.pageSize)
      .list(function(posts){
        that.$.postList.setPage(page, posts);
        // that.$.postList.refresh();
      });
    // if (this.account && this.$.dataPage.missingPage(page)) {
    //   this.$.xmlrpc_client.callMethod({methodParams:[this.account.blogid, this.account.username, this.account.password, ((page+1) * this.$.list.pageSize)]}, { page:page });
    // };
  },
  downloadPosts:function(){
    this.account.downloadPages();    
  }
})