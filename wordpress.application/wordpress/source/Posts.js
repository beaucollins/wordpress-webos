enyo.kind({
  name: 'wp.Posts',
  kind: 'SlidingPane',
  className: 'posts-pane',
  published: {
    account:null,
    methodName:'metaWeblog.getRecentPosts'
  },
  events: {
    onLoadMore:''
  },
  components: [
    { name:'list', width:'350px', components:[
      { kind:'wp.PostList', flex:1, onSelectPost:'selectPost', onAcquirePage:'acquirePosts', onRefresh:'refreshPosts', onNewItem:'openNewItemEditor'}
    ]},
    { name:'right', flex:1, components:[
      { kind:'Pane', flex:1, components:[
        { name:'blank', kind:'BlankSlate', flex:1 },
        { name:'detail', kind:'wp.PostView', onEdit:'openPostEditor', onDelete:'deleteItem', flex:1 }
      ]}
    ]}
  ],
  create: function(){
    this.inherited(arguments);
  },
  accountChanged:function(){
    this.load_requests = {};
    this.$.postList.setAccount(this.account);
    this.$.detail.setAccount(this.account);
  },
  stopSpinner:function() {
	this.$.postList.stopSpinner();
  },
  refresh:function(){
    this.$.postList.refresh();
    this.$.detail.postChanged();
    this.$.pane.selectViewByName('blank'); //on refresh we should put the blank item on the right side
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
    var load_requests = this.load_requests;
    var that = this;
    this.account.account
      .posts
      .order('date_created_gmt', false)
       .filter('local_modifications', '=', null) //we must filter the local drafts here
      .filter('postid', '!=', '0')
      .limit(pageSize)
      .skip(page*pageSize)
      .list(function(posts){
        if (posts.length > 0) {
          // console.log("Data for the page:", page, posts);
          that.$.postList.setPage(page, posts);          
        };
      });
      
      if (this.account && that.$.postList.missingPage(page) && !load_requests[page]) {
        load_requests[page] = true;
        this.doLoadMore(page*pageSize + pageSize);
      };
  },
  refreshPosts:function(){
    this.account.downloadPosts();    
  },
  openPostEditor:function(sender, post){ 
    enyo.application.launcher.openComposer(this.account.account, post);    
  },
  deleteItem:function(sender, post){ 
	  this.log('delete Post clicked');
	  this.account.deletePost(post);   
  },
  openNewItemEditor:function(sender, post){
	this.log('new Post clicked');
	enyo.application.launcher.openComposerWithNewItem(this.account.account,"Post");      
  }
});