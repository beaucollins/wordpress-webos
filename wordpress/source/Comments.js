enyo.kind({
  name: 'wp.Comments',
  kind: 'SlidingPane',
  published: {
    account:null,
    comment:null
  },
  events: {
    onReply:''
  },
  components: [
    { name: 'list', width:'350px', components:[
      { name:'comment_list', kind:'wp.CommentList', flex:1, onSelectComment:'showComment' }
    ]},
    { name: 'right', flex:1, components:[
      { kind:'Pane', flex:1, components:[
        { name:'blank', kind:'Control' },
        { name:'detail', kind:'wp.CommentView', onReply:'doReply' }
      ]}
    ]}
  ],
  create:function(){
    this.inherited(arguments);
    this.accountChanged();
  },
  accountChanged:function(){
    this.$.comment_list.setAccount(this.account);
    this.$.detail.setAccount(this.account);
    this.$.pane.selectView(this.$.blank);
  },
  commentChanged:function(){
    this.$.pane.selectViewByName('detail');
    this.$.detail.setComment(this.comment);
  },
  highlightComment:function(comment){
    this.$.comment_list.highlightComment(comment);
  },
  resize:function(){
    this.inherited(arguments);
    this.$.comment_list.resize();
  },
  showComment:function(sender, comment){
    this.setComment(comment);
  },
  refresh:function(){
    this.$.comment_list.refresh();
    this.$.detail.commentChanged();
  }
  // findComments:function(sender, query){
  //   var that = this;
  //   console.log("Find comments!", query);
  //   Comment.all().order('date_created_gmt', false).limit(query.limit).list(function(result){
  //     that.$.comment_list.queryResponse(result);
  //   });
  //   
  // }
})