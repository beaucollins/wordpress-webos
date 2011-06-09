// var href = "mock/comments.json";
// if (document.location.protocol != 'http:') href = document.location.href.replace(/\/[^\/]+?$/, '/'+ href );

enyo.kind({
  name:'wp.DataPage',
  kind:'Component',
  published: {
    pageSize:10,
	selectedRow:null
  },
  create:function(){
    this.inherited(arguments);
    this.pages = {};
  },
  destroy:function(){
    this.pages = null;
  },
  storePage:function(page, itemArray){
    this.pages[page] = enyo.clone(itemArray);
  },
  clearPage:function(page){
    this.pages[page] = null;
  },
  getPage:function(page){
    return this.pages[page];
  },
  itemAtIndex:function(index){
    var pagesize = this.pageSize;
    var page = Math.floor(index/pagesize);
    var offset = index % pagesize;
    var items, item;
    if(!(items = this.pages[page])){
      return;
    }
    if (item = items[offset]) {
      return item;
    };
  },
  clear:function(){
    this.pages = {};
  },
  missingPage:function(page){
    if(page < 0) return false;
    return !this.havePage(page);
  },
  havePage:function(page){
    return this.pages[page];
  }
  
});

enyo.kind({
  name:'wp.CommentList',
  kind:'VFlexBox',
  published: {
    account: null,
    filterItem:null,
  },
  events: {
    onAcquireComments:"",
    onDiscardComments:"",
    onSelectComment:""
  },
  kStatusNames: {
    'hold':'Pending',
    'approve':'Approved',
    'spam':'Spam',
    'trash':'Trash'
  },
  components:[
    { kind:'wp.DataPage'},
    { name:'list', kind: 'VirtualList', flex:1, onSetupRow:'setupComment', onAcquirePage:'acquireComments', onDiscardPage:'discardComments', components: [
      { name:'item', kind:'Item', tapHighlight:true, onclick:'selectComment', className:'comment-item', layoutKind:'VFlexLayout', components:[
        { name:'header', kind:'HFlexBox', components: [
          { kind:'Control', className:'comment-left-col', components:[
            { name:'avatar', size:'30', kind:'Gravatar', className:'comment-list-avatar' }
          ] },
          { kind:'VFlexBox', flex:1, components:[
            { kind:'HFlexBox', components:[
              { name:'author', flex:1, className:'comment-author', allowHtml: 'true' },
              { name:'timestamp', className:'comment-timestamp' }
            ]},
            { kind:'VFlexBox', components:[
              	{ name:'authorURL', className:'comment-author-url', allowHtml: 'true' },
              	{ flex:1, kind:"Control" },
              { name:'status', className:'comment-status-badge', content:"Status" }
            ]}
          ]}
        ]},
        { name:'commentContent', className: 'comment-content', allowHtml: 'true' },
        { name:'commentSubject', className: 'comment-subject', allowHtml: 'true' }
      ]}
    ] },
    { kind: 'enyo.Toolbar', components:[
      { name: "slidingDrag", slidingHandler: true, kind:'GrabButton'},
	  { kind: 'Spinner', className: 'wp-list-spinner' },
      { kind:'Button', name: 'refreshButton', content:$L('Refresh'), onclick:'refreshComments', className:"enyo-button-blue" }
    ] }
  ],
  create:function(){
    this.inherited(arguments);
  },
  setupComment:function(inSender, inIndex){
    if(comment = this.$.dataPage.itemAtIndex(inIndex)){      
      this.$.avatar.setEmail(comment.author_email, {size:30});
      this.$.author.setContent(comment.author);
      this.$.authorURL.setContent(comment.author_url);
      this.$.timestamp.setContent(FormatDateTimeForListView(comment.date_created_gmt));
      this.$.commentContent.setContent(TruncateText(StripHTML(comment.content)));
      this.$.commentSubject.setContent(comment.post_title);
      this.$.item.addRemoveClass('active-selection', this.$.list.isSelected(comment.id))
      this.$.item.addClass("status-"+comment.status);
      this.$.status.addClass("status-"+comment.status);
      this.$.status.setContent($L(this.kStatusNames[comment.status]));
      return true;
    }
  },
  acquireComments:function(sender, page){
    var that = this;
    if (this.account) {
      this.account.account
        .comments
        .order('date_created_gmt', false)
        .limit(this.$.list.pageSize)
        .skip(page*this.$.list.pageSize)
        .list(function(comments){
          that.$.dataPage.storePage(page, comments);
          that.$.list.refresh();
        });
    };
  },
  gotComments:function(sender, response, request){
    this.$.dataPage.storePage(request.page, response);
    this.$.list.refresh();
  },
  accountChanged:function(){
	if (this.selectedRow){
		this.$.list.select(this.selectedRow.rowIndex);
	}
    this.$.list.punt();
    this.$.dataPage.clear();
    if (this.account == null) {
      return;
    };
    this.$.list.reset();
    this.$.list.refresh();
  },
  imageLoadError:function(sender){
    sender.setSrc('../images/icons/default-avatar.png');
  },
  selectComment:function(sender, item){
	this.selectedRow = item;
    var comment = this.$.dataPage.itemAtIndex(item.rowIndex);
    this.$.list.select(comment.id);
    this.$.item.addClass('active-selection');
    this.doSelectComment(comment, this.account);
  },
  refresh:function(){
    console.log("Refresh the list");
    this.$.list.reset();
    this.$.list.refresh();
	this.$.spinner.hide();
  },
  highlightComment:function(comment){
    this.$.list.select(comment.id);
    console.log("Selected", this.$.list);
    this.refresh();
  },
  showFilterOptions:function(sender){
    this.$.filterMenu.openAtControl(sender);
  },
  menuItemClick:function(item, mouseEvent){
    // based on which kind is checked we change the call for which kind of comment we want
    // should it be a multi thing?, nope the API doesn't support that, we can think about
    // it once we have our own datastore
    if (this.filterItem != item) {
      this.filterItem.setChecked(false);
      item.setChecked(true);
      // this.filterItem.setChecked();
      this.setFilterItem(item);
    };
    
  },
  filterItemChanged:function(){
    this.$.list.punt();
    this.$.dataPage.clear();
    this.$.list.reset();
    this.$.filterButton.setCaption(this.filterItem.caption + ' Comments');
  },
  getStatusFilter:function(){
    //  hold, approve, spam, trash
    //can these be translated? <3 Dan
    return {
      'Pending' : 'hold',
      'Approved' : 'approve',
      'Trash' : 'trash',
      'Spam' : 'spam'
    }[this.filterItem.caption];
  },
  resize:function(){
    this.$.list.resizeHandler();
  },
  refreshComments:function(sender){
    console.log("Account", this.account);
	this.$.spinner.show();
    this.account.refreshComments();
  }
});

function TruncateText(t){
  if (t.length > 120) {
    return t.slice(0,120) + "&hellip;";
  };
  return t;
}

function StripHTML(string){
  return string.replace(/<\/?[^>]+>/gi,'');
}