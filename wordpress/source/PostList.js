enyo.kind({
  name:'wp.PostList',
  kind:'VFlexBox',
  events:{
    onSelectPost:'',
    onAcquirePage:'',
    onRefresh:'',
    onNewItem:''	
  },
  published: {
    account:null,
	selectedRow:null
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
	      { name:'header', kind:'HFlexBox', components: [
	          { kind:'VFlexBox', flex:1, components:[
	            { kind:'HFlexBox', components:[
	              { name:'title', flex:1, className:'post-list-title wp-truncate' },
	              { name:'postDate', content:'Date', className:'post-list-timestamp' }
	            ]},
	            { kind:'HFlexBox', components:[
	              { flex:1, kind:"Control" },
	              { name:'postStatus', content:'Status', className:'status-badge' }
	            ]}
	          ]}
	        ]},
	       { name:'postExcerpt', content:'Excerpt', className:'list-excerpt' }
      ] }
    ] },
    { kind:'enyo.Toolbar', components:[
      { name: "slidingDrag", slidingHandler: true, kind:'GrabButton'},      
      { kind:'Button', name: 'refresh', content:'Refresh', onclick:'doRefresh'},
      { kind:'Button', name: 'newItem', content:'Add New', onclick:'doNewItem'}
    ] }
  ],
  create:function(){
    this.inherited(arguments);
  },
  selectPost:function(sender, item){
	this.selectedRow = item;
    var post = this.$.dataPage.itemAtIndex(item.rowIndex);
    this.$.list.select(item.rowIndex);
    this.$.item.removeClass('active-selection');
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
     // console.log("Setting up index: ", index, post);
      if (post.title.trim() == '') {
        this.$.title.addClass('untitled');
        this.$.title.setContent("(No title)");
      }else{
        this.$.title.removeClass('untitled');
        this.$.title.setContent(post.title);
      };
      
      var postExcerpt;
      if (post.description.trim() != '') {
      	this.$.postExcerpt.setContent((TruncateText(StripHTML(post.description))));
      }
      else {
      	this.$.postExcerpt.setContent('(No content)');
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
      this.$.item.addRemoveClass('active-selection', this.$.list.isSelected(index))
      if (post.date_created_gmt) {
        this.$.postDate.setContent(FormatDateTimeForListView(post.date_created_gmt));        
      }else{
        this.$.postDate.setContent("<em>" + $L("not published") + "</em>");
      }
      return true;
    };
  },
  accountChanged:function(){
	if (this.selectedRow){
		this.$.list.select(this.selectedRow.rowIndex);
	}
    this.$.list.punt();
    this.$.dataPage.clear();
    this.$.list.reset();
    
  },
  resize:function(){
    this.$.list.resizeHandler();
  },
  hideNewButton:function(){
	  this.$.newItem.setShowing(false);
  }
});



