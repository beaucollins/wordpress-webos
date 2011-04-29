enyo.kind({
  name: 'wp.Posts',
  kind: 'SlidingPane',
  published: {
    account:null,
    methodName:'metaWeblog.getRecentPosts'
  },
  components: [
    { name:'list', width:'350px', components:[
      { kind:'wp.PostList', flex:1, onSelectPost:'selectPost' }
    ]},
    { name:'right', flex:1, components:[
      { kind:'Pane', flex:1, components:[
        { name:'blank', kind:'Control', flex:1 },
        { name:'detail', kind:'wp.PostView', flex:1 }
      ]}
    ]}
  ],
  create: function(){
    this.inherited(arguments);
    this.methodNameChanged();
  },
  accountChanged:function(){
    this.$.postList.setAccount(this.account);
    this.$.detail.setAccount(this.account);
  },
  resize:function(){
    this.inherited(arguments);
    this.$.postList.resize();
  },
  methodNameChanged:function(){
    this.$.postList.setMethodName(this.methodName);
  },
  selectPost:function(sender, post){
    this.$.pane.selectViewByName('detail');
    this.$.detail.setPost(post);
  }
  
});