enyo.kind({
  name: 'wp.Comments',
  kind: 'SlidingPane',
  published: {
    account:null
  },
  components: [
    { name: 'list', width:'350px', components:[
      { name:'comment_list', kind:'wp.CommentList', flex:1, onSelectComment:'showComment' }
    ]},
    { name: 'right', flex:1, components:[
      { kind:'Pane', flex:1, components:[
        { name:'blank', kind:'Control' },
        { name:'detail', kind:'wp.CommentView' }
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
  },
  resize:function(){
    this.inherited(arguments);
    this.$.comment_list.resize();
  },
  showComment:function(sender, comment){
    this.$.pane.selectViewByName('detail');
    this.$.detail.setComment(comment);
  }
})