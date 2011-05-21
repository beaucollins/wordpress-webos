enyo.kind({
  name: 'wp.Posts',
  kind: 'SlidingPane',
  published: {
    account:null,
    methodName:'metaWeblog.getRecentPosts'
  },
  components: [
    { name:'list', width:'350px', components:[
      { kind:'wp.PostList', flex:1, onSelectPost:'selectPost', onAcquirePage:'acquirePosts', onRefresh:'downloadPosts' }
    ]},
    { name:'right', flex:1, components:[
      { kind:'Pane', flex:1, components:[
        { name:'blank', kind:'Control', flex:1 },
        { name:'detail', kind:'wp.PostView', flex:1 }
      ]}
    ]}
  ],
  create: function(){
    this.inherited(arguments);
  },
  accountChanged:function(){
    this.$.postList.setAccount(this.account);
    this.$.detail.setAccount(this.account);
  },
  resize:function(){
    this.inherited(arguments);
    this.$.postList.resize();
  },
  selectPost:function(sender, post){
    this.$.pane.selectViewByName('detail');
    this.$.detail.setPost(post);
  },
  // Not optimal, this api is seriously going to kill the app,
  // are we going to set a max number of posts to donwload somehow?
  acquirePosts:function(sender, page){
    if(!this.account) return;
    var that = this;
    this.account.account
      .posts
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
    this.account.downloadPosts();    
  }
  
});