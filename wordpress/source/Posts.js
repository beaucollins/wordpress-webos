enyo.kind({
  name: 'wp.Posts',
  kind: 'SlidingPane',
  className: 'posts-pane',
  published: {
    account:null,
    methodName:'metaWeblog.getRecentPosts'
  },
  components: [
    { name:'list', width:'350px', components:[
      { kind:'wp.PostList', flex:1, onSelectPost:'selectPost', onAcquirePage:'acquirePosts', onRefresh:'refreshPosts', onNewItem:'openNewItemEditor'}
    ]},
    { name:'right', flex:1, components:[
      { kind:'Pane', flex:1, components:[
        { name:'blank', kind:'BlankSlate', flex:1 },
        { name:'detail', kind:'wp.PostView', onEdit:'openPostEditor', flex:1 }
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
  refresh:function(){
    this.$.postList.accountChanged();
    this.$.detail.postChanged();
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
  acquirePosts:function(sender, page, pageSize){
    if(!this.account) return;
    if (page < 0) return;
    var that = this;
    console.log("Page size", pageSize);
    this.account.account
      .posts
      .order('date_created_gmt', false)
      .filter('postid', '!=', '0')
      .limit(pageSize)
      .skip(page*pageSize)
      .list(function(posts){
        if (posts.length > 0) {
          // console.log("Data for the page:", page, posts);
          that.$.postList.setPage(page, posts);          
        };
      });
    // if (this.account && this.$.dataPage.missingPage(page)) {
    //   this.$.xmlrpc_client.callMethod({methodParams:[this.account.blogid, this.account.username, this.account.password, ((page+1) * this.$.list.pageSize)]}, { page:page });
    // };
  },
  refreshPosts:function(){
    this.account.downloadPosts();    
  },
  openPostEditor:function(sender, post){ 
    enyo.application.launcher.openComposer(this.account.account, post);    
  },
  openNewItemEditor:function(sender, post){
	this.log('new Post clicked');
	enyo.application.launcher.openComposerWithNewItem(this.account.account,"Post");      
  }
});