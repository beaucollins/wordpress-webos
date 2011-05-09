// var href = "mock/comments.json";
// if (document.location.protocol != 'http:') href = document.location.href.replace(/\/[^\/]+?$/, '/'+ href );

enyo.kind({
  name:'wp.DataPage',
  kind:'Component',
  published: {
    pageSize:10
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
    filterItem:null
  },
  events: {
    onSelectComment:""
  },
  kStatusNames: {
    'hold':'Pending',
    'approve':'Approved',
    'spam':'Spam',
    'trash':'Trash'
  },
  components:[
    { kind:'wp.DataPage' },
    { name:'service', kind:'XMLRPCService', onSuccess:'gotComments' },
    { name:'filterMenu', scrim:false, kind:'Menu', defaultKind:'MenuCheckItem', components:[
      { name:'allFilter', caption:'All', checked:true },
      { caption:'Pending', checked:false },
      { caption:'Approved', checked:false },
      { caption:'Trash', checked:false },
      { caption:'Spam', checked:false }
    ] },
    { name:'listHeader', kind:'enyo.Header', layoutKind:'HFlexLayout', components:[
      { name:'filterButton', kind:'enyo.Button', caption:'All Comments', onclick:'showFilterOptions' }
    ] },
    { name:'list', kind: 'VirtualList', flex:1, onSetupRow:'setupComment', onAcquirePage:'acquireCommentPage', onDiscardPage:'discardCommentPage', components: [
      { name:'item', kind:'Item', tapHighlight:true, onclick:'selectComment', className:'comment-item', layoutKind:'VFlexLayout', components:[
        { name:'header', kind:'HFlexBox', components: [
          { kind:'Control', className:'comment-left-col', components:[{ name:'avatar', width:'30px', height:'30px', kind:'Image', onerror:'imageLoadError', className:'comment-list-avatar', src:'images/icons/default-avatar.png' }] },
          { kind:'VFlexBox', flex:1, components:[
            { kind:'HFlexBox', components:[
              { name:'author', flex:1, className:'comment-author' },
              { name:'timestamp', className:'comment-timestamp' }
            ]},
            { kind:'HFlexBox', components:[
              { flex:1, kind:"Control" },
              { name:'status', className:'comment-status-badge', content:"Status" }
            ]}
          ]}
        ]},
        { name:'commentContent', className: 'comment-content' },
        { name:'commentSubject', className: 'comment-subject' }
      ]}
    ] },
    { kind: 'enyo.Toolbar', components:[
      { name: "slidingDrag", slidingHandler: true, kind:'GrabButton'}
    ] }
  ],
  create:function(){
    this.inherited(arguments);
    this.filterItem = this.$.allFilter;
    // this.filterItemChanged();
  },
  setupComment:function(inSender, inIndex){
    if(comment = this.$.dataPage.itemAtIndex(inIndex)){      
      this.$.avatar.setSrc(enyo.application.makeGravatar(comment.author_email, {size:30}));
      this.$.author.setContent(comment.author);
      this.$.timestamp.setContent(TimeAgo(comment.date_created_gmt));
      this.$.commentContent.setContent(TruncateText(StripHTML(comment.content)));
      this.$.commentSubject.setContent(comment.post_title);
      this.$.item.addRemoveClass('active-selection', this.$.list.isSelected(inIndex))
      this.$.item.addClass("status-"+comment.status);
      this.$.status.addClass("status-"+comment.status);
      this.$.status.setContent($L(this.kStatusNames[comment.status]));
      return true;
    }
  },
  discardCommentPage:function(sender, page){
    this.$.dataPage.clearPage(page);
  },
  acquireCommentPage:function(sender, page){
    var index = (page + 1) * sender.pageSize;
    if (this.$.dataPage.missingPage(page) && this.account) {
      // look for additional comments
      
      // status
      // post_id
      // offset
      // number
      var filter;
      var options = {
        number: sender.pageSize,
        offset: page * sender.pageSize,
      }
      if (filter = this.getStatusFilter()) {
        options['status'] = filter;
      };
      this.$.service.callMethod({
        methodName:'wp.getComments',
        methodParams: [this.account.blogid, this.account.username, this.account.password, options]
      }, { url:this.account.xmlrpc, page:page })
    };
  },
  gotComments:function(sender, response, request){
    this.$.dataPage.storePage(request.page, response);
    this.$.list.refresh();
  },
  accountChanged:function(){
    this.$.list.punt();
    this.$.dataPage.clear();
    if (this.account == null) {
      return;
    };
    this.$.list.reset();
    this.$.list.refresh();
  },
  imageLoadError:function(sender){
    sender.setSrc('images/icons/default-avatar.png');
  },
  selectComment:function(sender, item){
    var comment = this.$.dataPage.itemAtIndex(item.rowIndex);
    this.$.list.select(item.rowIndex);
    this.$.item.addClass('active-selection');
    this.doSelectComment(comment, this.account);
  },
  selectionChanged:function(){
    this.$.list.refresh();
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
    
    return {
      'Pending' : 'hold',
      'Approved' : 'approve',
      'Trash' : 'trash',
      'Spam' : 'spam'
    }[this.filterItem.caption];
  },
  resize:function(){
    this.$.list.resizeHandler();
  }
});

function TimeAgo(date){
  var units = {
    'second':60,
    'minute':60,
    'hour':24,
    'day':7,
    'week':1
  }
  var d = Date.parse(date);
  var now = (new Date).getTime();
  var time = (now-d)/1000;
  if (time < 1) {
    return 'moments ago';
  };
  
  for (unit in units){
    if(time < units[unit]-1){
      time = Math.round(time);
      return time  + " " + unit + (time == 1 ? '' : 's');
    }
    time = time / units[unit];
  };
  
  var formatter = new enyo.g11n.DateFmt({ format:'short' });
  return formatter.format(date);
}

function TruncateText(t){
  if (t.length > 120) {
    return t.slice(0,120) + "&hellip;";
  };
  return t;
}

function StripHTML(string){
  return string.replace(/<\/?[^>]+>/gi,'');
}