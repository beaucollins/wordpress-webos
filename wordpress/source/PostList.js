enyo.kind({
  name:'wp.PostList',
  kind:'VFlexBox',
  events:{
    onSelectPost:'',
    onAcquirePage:'',
    onRefresh:''
  },
  published: {
    account:null
  },
  kPostStatus: {
    'publish' : 'Published',
    'draft' : 'Draft',
    'private' : 'Private'
  },
  components: [
    { kind:'wp.DataPage' },
    // setting lookAhead to 1 for XMLRPC api performance reasons, because we can't get paged results
    { name:'list', kind:'VirtualList', flex:1, onSetupRow:'setupPost', onAcquirePage:'doAcquirePage', onDiscardPage:'discardPage', components:[
      { name:'item', kind:'Item', onclick:'selectPost', className:'post-item', components:[
        { name:'title', className:'post-list-title wp-truncate' },
        { kind:'HFlexBox', components:[
          { name:'postDate', flex:1, content:'Date', className:'post-list-timestamp' },
          { name:'postStatus', content:'Status', className:'status-badge' }
        ]}
      ] }
    ] },
    { kind:'enyo.Toolbar', components:[
      { name: "slidingDrag", slidingHandler: true, kind:'GrabButton'},
      { name: 'refresh', content:'Refresh', onclick:'doRefresh'}
    ] }
  ],
  create:function(){
    this.inherited(arguments);
  },
  selectPost:function(sender, item){
    var post = this.$.dataPage.itemAtIndex(item.rowIndex);
    this.$.list.select(item.rowIndex);
    this.$.item.addClass('active-selection');
    this.doSelectPost(post, this.account);
    
  },
  refresh:function(){
    this.$.list.refresh();
  },
  setPage:function(pageNumber, items){
    this.$.dataPage.storePage(pageNumber, items);
    this.$.list.refresh();
  },
  discardPage:function(sender, page){
    this.$.dataPage.clearPage(page);
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
    this.$.list.reset();
    
  },
  resize:function(){
    this.$.list.resizeHandler();
  }
});



