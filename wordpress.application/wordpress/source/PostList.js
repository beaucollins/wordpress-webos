enyo.kind({
  name:'wp.PostList',
  kind:'VFlexBox',
  events:{
    onSelectPost:'',
    onAcquirePage:'',
    onRefresh:'',
    onNewItem:'',
    onLoadMore:''
  },
  published: {
    account:null,
    selected:null,
    showBlogTitle:false,
    emptyMessage:$L('No Posts')
  },
  kPostStatus: {
    'publish' : 'Published',
    'draft' : 'Draft',
    'private' : 'Private',
    'pending' : 'Pending'
  },
  components: [
    { kind:'wp.DataPage' },
    { name:'empty', kind:'EmptyMessage' },
    { name:'list', kind:'VirtualList', flex:1, onSetupRow:'setupPost', onAcquirePage:'acquirePosts', onDiscardPage:'discardPage', components:[
      { name:'item', kind:'Item', onclick:'selectPost', className:'post-item', components:[
	      { name:'header', kind:'HFlexBox', components: [
	          { kind:'VFlexBox', flex:1, components:[
	            { kind:'HFlexBox', components:[
	              { name:'title', flex:1, className:'post-list-title wp-truncate', allowHtml: 'true' },
	              { name:'postDate', content:'Date', className:'post-list-timestamp' }
	            ]},
	            { kind:'HFlexBox', components:[
	              { flex:1, name:'blogTitle', className:'post-list-blog-name wp-truncate', kind:"Control" },
	              { name:'postStatus', content:'Status', className:'status-badge' }
	            ]}
	          ]}
	        ]},
	       { name:'postExcerpt', content:'Excerpt', className:'list-excerpt', allowHtml: 'true' }
      ] }
    ] },
    { kind:'enyo.Toolbar', className:'enyo-toolbar-light', components:[
	    { name: "slidingDrag", slidingHandler: true, kind:'GrabButton'},
	    { flex:1 },
      { kind: 'Spinner', className: 'wp-list-spinner' },
      { kind:'Button', name: 'refresh', content:$L("Refresh"), onclick:'refreshList'},
      { kind:'Button', name: 'newItem', content:$L("Add New"), onclick:'openNewItemEditor'},
      { flex:1}
    ] }
  ],
  create:function(){
    this.inherited(arguments);
    this.emptyMessageChanged();
  },
  refreshList:function(sender){
	 this.$.spinner.show();
	 this.$.list.punt();
	 this.$.dataPage.clear();
	 this.doRefresh();
  },
  stopSpinner:function() {
	 this.$.spinner.hide();
  },
  selectPost:function(sender, event){
    var post = this.$.dataPage.itemAtIndex(event.rowIndex);
    this.setSelected(post);
    this.$.list.select(event.rowIndex);
    this.doSelectPost(post, this.account);
  },
  requestPageWithSize:function(sender, page){
    var cached;
    if (cached = this.$.dataPage.getPage(page)) {
      this.$.list.refresh();
    }else{
      this.acquirePosts(page, this.$.list.pageSize);
    }
  },
  acquirePosts:function(sender, page){
    if(!this.account) return;
    if (page < 0) return;
    var load_requests = this.load_requests;
    var that = this;
    var pageSize = this.$.list.pageSize;
    this.account.account
      .posts
      .order('date_created_gmt', false)
       .filter('local_modifications', '=', null) //we must filter the local drafts here
      .filter('postid', '!=', '0')
      .limit(pageSize)
      .skip(page*pageSize)
      .list(function(posts){
        that.setPage(page, posts);          
        that.$.list.refresh();
        
        if (that.account && that.missingPage(page) && !load_requests[page]) {
          load_requests[page] = true;
          that.doLoadMore(page*pageSize + pageSize);
        };
        
      });
  },
  reset: function(){
  	this.$.spinner.hide();
  	this.selectedRow = null;
    // this.$.list.punt();
    this.$.dataPage.clear();
    this.$.list.reset();
    this.$.list.refresh();    
  },
  refresh:function(){
  	this.selectedRow = null;
    // this.$.list.punt();
    // this.$.dataPage.clear();
    this.$.list.reset();
    this.$.list.refresh();    
    this.$.spinner.hide();
  },
  setPage:function(pageNumber, items){
    this.$.empty.hide();
    this.$.dataPage.storePage(pageNumber, items);
  },
  missingPage:function(pageNumber){
    return this.$.dataPage.missingPage(pageNumber);
  },
  discardPage:function(sender, page){
    this.$.dataPage.clearPage(page);
  },
  setupPost:function(sender, index){
    var post;
    if (post = this.$.dataPage.itemAtIndex(index)) {
      if (post.title.trim() == '') {
        this.$.title.addClass('untitled');
        this.$.title.setContent( $L("(No title)") );
      }else{
        this.$.title.removeClass('untitled');
        this.$.title.setContent(post.title);
      };
      if (this.showBlogTitle) {
        console.log(post.account);
        this.$.blogTitle.setContent(post.account.blogName);
      }else{
        this.$.blogTitle.setContent('');
      }
      
      var postExcerpt;
      if (post.description.trim() != '') {
      	this.$.postExcerpt.setContent((TruncateText(StripHTML(post.description))));
      }
      else {
      	this.$.postExcerpt.setContent( $L("(No content)") );
      	this.$.postExcerpt.addClass('empty');
      }
      
      var status;
	
      if (post.postid == 0 || post.page_id == 0) {
        status = 'draft';
      }else{
        status = post.post_status || post.page_status || 'draft';
      }
      this.$.postStatus.setContent($L(this.kPostStatus[status]));
      this.$.postStatus.addClass("status-"+status);
      this.$.item.addRemoveClass('active-selection', this.$.list.isSelected(index));
      if (post.date_created_gmt) {
        this.$.postDate.setContent(FormatDateTimeForListView(post.date_created_gmt));        
      }else{
        this.$.postDate.setContent("<em>" + $L("not published") + "</em>");
      }
      return true;
    };
  },
  accountChanged:function(){
    this.$.empty.show();
    this.load_requests = {};
    this.setSelected(null);
    this.$.list.select(null);
    
    this.$.list.punt();
    this.$.dataPage.clear();
    this.$.list.reset();
    this.$.list.refresh();
  },
  resize:function(){
    this.$.list.resizeHandler();
  },
  hideNewButton:function(){
	  this.$.newItem.setShowing(false);
  },
  fireSelected:function(){
    this.doSelectPost(this.selected);
  },
  clearSelection:function(){
    this.selected = null;
    this.$.list.select(null);
  },
  openNewItemEditor:function(sender, post){
  	enyo.application.launcher.openComposerWithNewItem(this.account.account,"Post");    
  },
  emptyMessageChanged:function(){
    this.$.empty.setMessage(this.emptyMessage);
  }
  
});

enyo.kind({
  name:'EmptyMessage',
  kind: 'Control',
  style:'padding:10px',
  published:{
    message:'Message Here'
  },
  components:[
    { name:'message', className:'emptyMessage', style:'text-align:center; background:rgba(0,0,0,0.8); color:#FFF; border-radius:5px; padding:10px;' }
  ],
  create:function(){
    this.inherited(arguments);
    this.messageChanged();
  },
  messageChanged:function(){
    this.$.message.setContent(this.message);
  }
})



