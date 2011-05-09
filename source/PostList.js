enyo.kind({
  name:'wp.PostList',
  kind:'VFlexBox',
  events:{
    onSelectPost:''
  },
  published: {
    account:null,
    methodName:'metaWeblog.getRecentPosts'
  },
  kPostStatus: {
    'publish' : 'Published',
    'draft' : 'Draft',
    'private' : 'Private'
  },
  components: [
    { name:'xmlrpc_client', kind:'XMLRPCService', methodName:'metaWeblog.getRecentPosts', onSuccess:'gotPosts'},
    { kind:'wp.DataPage' },
    // setting lookAhead to 1 for XMLRPC api performance reasons, because we can't get paged results
    { name:'list', kind:'VirtualList', lookAhead:1, flex:1, onSetupRow:'setupPost', onAcquirePage:'acquirePostPage', components:[
      { name:'item', kind:'Item', onclick:'selectPost', className:'post-item', components:[
        { name:'title', className:'post-list-title wp-truncate' },
        { kind:'HFlexBox', components:[
          { name:'postDate', flex:1, content:'Date', className:'post-list-timestamp' },
          { name:'postStatus', content:'Status', className:'status-badge' }
        ]}
      ] }
    ] },
    { kind:'enyo.Toolbar', components:[
      { name: "slidingDrag", slidingHandler: true, kind:'GrabButton'}
    ] }
  ],
  create:function(){
    this.inherited(arguments);
    this.methodNameChanged();
  },
  selectPost:function(sender, item){
    var post = this.$.dataPage.itemAtIndex(item.rowIndex);
    this.$.list.select(item.rowIndex);
    this.$.item.addClass('active-selection');
    this.doSelectPost(post, this.account);
    
  },
  // Not optimal, this api is seriously going to kill the app,
  // are we going to set a max number of posts to donwload somehow?
  acquirePostPage:function(sender, page){
    if (this.account && this.$.dataPage.missingPage(page)) {
      this.$.xmlrpc_client.callMethod({methodParams:[this.account.blogid, this.account.username, this.account.password, ((page+1) * this.$.list.pageSize)]}, { page:page });
    };
  },
  setupPost:function(sender, index){
    var post;
    if (post = this.$.dataPage.itemAtIndex(index)) {
      if (post.title.trim() == '') {
        this.$.title.addClass('untitled');
        this.$.title.setContent("Untitled");
      }else{
        this.$.title.removeClass('untitled');
        this.$.title.setContent(post.title);
      };
      console.log(post);
      var status = post.post_status || post.page_status;
      this.$.postStatus.setContent($L(this.kPostStatus[status]));
      this.$.item.addRemoveClass('active-selection', this.$.list.isSelected(index))
      this.$.postDate.setContent(TimeAgo(post.date_created_gmt));
      return true;
    };
  },
  gotPosts:function(sender, response, request){
    var trimmed = request.page*this.$.list.pageSize;
    var posts = response.slice(trimmed);
    this.$.dataPage.storePage(request.page, posts);
    this.$.list.refresh();
  },
  accountChanged:function(){
    this.$.list.punt();
    this.$.dataPage.clear();
    if (this.account == null) {
      return;
    };
    this.$.xmlrpc_client.setUrl(this.account.xmlrpc);
    this.$.list.reset();
    
  },
  methodNameChanged:function(){
    this.$.xmlrpc_client.setMethodName(this.methodName);
  },
  resize:function(){
    this.$.list.resizeHandler();
  }
});



