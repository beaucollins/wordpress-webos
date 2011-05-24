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
    'private' : 'Private',
    'pending' : 'Pending'
  },
  components: [
    { kind:'wp.DataPage' },
    // setting lookAhead to 1 for XMLRPC api performance reasons, because we can't get paged results
    { name:'list', kind:'VirtualList', flex:1, onSetupRow:'setupPost', onAcquirePage:'requestPageWithSize', onDiscardPage:'discardPage', components:[
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
  requestPageWithSize:function(sender, page){
    var cached;
    if (cached = this.$.dataPage.getPage(page)) {
      this.$.list.refresh();
    }else{
      this.doAcquirePage(page, this.$.list.pageSize);
    }
  },
  refresh:function(){
    this.$.list.reset();    
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
      console.log("Set up post");
      // console.log("Setting up index: ", index, post);
      if (post.title.trim() == '') {
        this.$.title.addClass('untitled');
        this.$.title.setContent("Untitled");
      }else{
        this.$.title.removeClass('untitled');
        this.$.title.setContent(post.title);
      };
      
      var status;
      if (post.postid == 0) {
        status = 'draft';
      }else{
        status = post.post_status || post.page_status || 'draft';
      }
      this.$.postStatus.setContent($L(this.kPostStatus[status]));
      this.$.item.addRemoveClass('active-selection', this.$.list.isSelected(index))
      if (post.date_created_gmt) {
        this.$.postDate.setContent(TimeAgo(post.date_created_gmt));        
      }else{
        this.$.postDate.setContent("<em>" + $L("not published") + "</em>");
      }
      return true;
    };
  },
  accountChanged:function(){
    this.$.list.punt();
    this.$.dataPage.clear();
    this.$.list.reset();
    
  },
  resize:function(){
    this.$.list.resizeHandler();
  }
});



