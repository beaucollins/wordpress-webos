// var href = "mock/comments.json";
// if (document.location.protocol != 'http:') href = document.location.href.replace(/\/[^\/]+?$/, '/'+ href );



enyo.kind({
  name:'wp.CommentList',
  kind:'VFlexBox',
  flex:1,
  published: {
    account: null,
    comments: []
  },
  events: {
    onSelectComment:""
  },
  components:[
    { kind:'Selection', onChange:'selectionChanged' },
    { name:'service', kind:'XMLRPCService', onSuccess:'gotComments' },
    { name:'list', kind: 'VirtualList', flex:1, onSetupRow:'setupComment', components: [
      { name:'item', tapHighlight:true, onclick:'selectComment', kind:'Item', className:'comment-item', layoutKind:'VFlexLayout', components:[
        { name:'header', kind:'HFlexBox', components: [
          { kind:'Control', className:'comment-left-col', components:[{ name:'avatar', width:'30px', height:'30px', kind:'Image', onerror:'imageLoadError', className:'comment-list-avatar', src:'images/icons/default-avatar.png' }] },
          { name:'author', flex:1, className:'comment-author' },
          { name:'timestamp', className:'comment-timestamp' }
        ] },
        { name:'commentContent', className: 'comment-content' },
        { name:'commentSubject', className: 'comment-subject' }
      ]}
    ] },
    { kind: 'enyo.nouveau.CommandMenu', components:[
      {name: "slidingDrag", slidingHandler: true, kind: "Control", className: "enyo-command-menu-draghandle"}
    ] }
  ],
  setupComment:function(inSender, inIndex){
    var comment = this.comments[inIndex];
    if(comment){
      this.$.avatar.setSrc(enyo.application.makeGravatar(comment.author_email, {size:30}));
      this.$.author.setContent(comment.author);
      this.$.timestamp.setContent(TimeAgo(comment.date_created_gmt));
      this.$.commentContent.setContent(TruncateText(comment.content));
      this.$.commentSubject.setContent(comment.post_title);
      this.$.item.addRemoveClass('active-selection', this.$.selection.isSelected(comment.comment_id))
      return true;
    }
  },
  gotComments:function(sender, response, request){
    this.setComments(response);
  },
  noWorky:function(sender, response, request){
    this.setComments(response['comments'] || []);
  },
  commentsChanged:function(){
    this.$.list.refresh();
  },
  accountChanged:function(){
    this.comments = [];
    this.$.list.punt();
    this.$.service.callMethod({
      methodName:'wp.getComments',
      methodParams: [this.account.blogid, this.account.username, this.account.password]
    }, { url:this.account.xmlrpc })
    
  },
  imageLoadError:function(sender){
    sender.setSrc('images/icons/default-avatar.png');
  },
  selectComment:function(sender, item){
    var comment = this.comments[item.rowIndex];
    this.$.selection.select(comment.comment_id);
    this.$.item.addClass('active-selection');
    this.doSelectComment(comment, this.account);
  },
  selectionChanged:function(){
    this.$.list.refresh();
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
  
  return 'long ago';
}

function TruncateText(t){
  if (t.length > 120) {
    return t.slice(0,120) + "&hellip;";
  };
  return t;
}
