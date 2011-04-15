enyo.kind({
  name: 'wp.CommentView',
  kind: 'VFlexBox',
  published: {
    account:null,
    comment:null,
    replies:[]
  },
  components:[
    { kind:'PalmService', service:'palm://com.palm.applicationManager/', method:'open' },
    { name:'xmlrpc_client', kind: 'XMLRPCService', onSuccess:'appendConversation' },
    { kind:'enyo.gemstone.Popup', showHideMode:'transition', className:'transitioner fastAnimate', onOpen:'focusReply', openClassName:'scaleFadeIn', scrim:true, components:[
      { name:'reply', kind: 'enyo.RichText', width:'300px', height:'300px' },
      { kind: 'HFlexBox', components:[
        { kind:'enyo.gemstone.Button', flex:1, caption:'Cancel', onclick:'cancelReply' },
        { kind:'enyo.gemstone.Button', flex:1, caption:'Submit', onclick:'publishReply' }
      ] }
    ]},
    { kind:'Pane', flex:1, components:[
      { name:'empty'},
      { name:'comment', kind:'VFlexBox', components:[
        { kind: 'Scroller', flex:1, components:[
          { name:'header', components:[
            { kind:'Control', kind:'HFlexBox', className:'enyo-item first', components:[
              { name:'avatar', kind:'Image', className:'avatar-large', src:'./images/icons/avatar-large.png' },
              { kind:'VFlexBox', flex:1, components:[
                { name:'authorName' },
                { name:'authorEmail' },
                { name:'authorURL' }
              ]}
            ] }
          ]},
          { name:'body', className:'enyo-item' },
          { kind:'HFlexBox', className:'enyo-item', components:[
            { content:'On:', className:'row-label' },
            { name:'subject', flex:1}
          ]},
          { name:'conversationHeader', className:'enyo-item', content:'Conversation:' },
          { name:'conversation', kind:'VirtualRepeater', onGetItem:'getReply', components:[
            { name:'item', className: 'enyo-item', components:[
              { name:'reployHeader', kind:'HFlexBox', components: [
                { kind:'Control', className:'comment-left-col', components:[{ name:'replyAvatar', width:'30px', height:'30px', kind:'Image', onerror:'imageLoadError', className:'comment-list-avatar', src:'images/icons/default-avatar.png' }] },
                { name:'replyAuthor', flex:1, className:'comment-author' },
                { name:'replyTimestamp', className:'comment-timestamp' }
              ] },
              { name:'replyContent', className: 'comment-content' }
            ]}
          ]}
        ] },
        { kind: 'enyo.nouveau.CommandMenu', components:[
          { name: "slidingDrag", slidingHandler: true, kind: "Control", className: "enyo-command-menu-draghandle" },
          { caption: 'Reply', onclick:'showReplyWindow' },
          { caption: 'View', onclick:'launchBrowser'}
        ] } 
      ] }
    ]}
  ],
  created:function(){
    this.inherited(arguments);
    this.commentChanged();
  },
  accountChanged:function(){
    if(this.account) this.$.xmlrpc_client.setUrl(this.account.xmlrpc);
  },
  commentChanged:function(){
    this.replies = [];
    this.$.conversationHeader.hide();
    this.$.conversation.render();
    if (this.comment == null) {
      this.$.pane.selectView(this.$.empty);
      return;
    };
    
    this.$.pane.selectView(this.$.comment);
    
    this.$.authorName.setContent(this.comment.author);
    this.$.authorEmail.setContent(this.comment.author_email);
    this.$.authorURL.setContent(this.comment.author_url);
    this.$.subject.setContent(this.comment.post_title);
    
    var avatar = new Image();
    avatar.onload = enyo.bind(this, function(){
      this.$.avatar.setSrc(avatar.src);
    });
    avatar.src = enyo.application.makeGravatar(this.comment.author_email, {
      size:50
    });

    this.$.body.setContent(this.comment.content);
    if(this.hasConversation()){
      this.$.conversationHeader.show();
      this.$.xmlrpc_client.callMethod({ methodName:'wp.getComment', methodParams:[this.account.blogid, this.account.username, this.account.password, this.comment.parent] })
    }
    
  },
  appendConversation:function(sender, response, request){
    this.replies.push(response);
    // render the repeater
    this.$.conversation.render();
    if (response.parent != "0") {
      this.$.xmlrpc_client.callMethod({ methodName:'wp.getComment', methodParams:[this.account.blogid, this.account.username, this.account.password, response.parent] })
    };
  },
  getReply:function(sender, index){
    var comment = this.replies[index];
    if(comment){
      this.$.replyAvatar.setSrc(enyo.application.makeGravatar(comment.author_email, {size:30}));
      this.$.replyAuthor.setContent(comment.author);
      this.$.replyTimestamp.setContent(TimeAgo(comment.date_created_gmt));
      this.$.replyContent.setContent(comment.content);
      return true;
    }
  },
  showReplyWindow:function(){
    this.$.popup.openAtCenter();
  },
  hasConversation:function(){
    return this.comment.parent != "0";
  },
  // open up a browser window with the comment's URL
  launchBrowser:function(){
    this.$.palmService.call({target:this.comment.link}); 
  },
  focusReply:function(){
    this.$.reply.forceFocus();
  },
  publishReply:function(){
    var reply = this.$.reply.value;
    this.$.popup.close();
    
    //     [commentParams setObject:feedback.text forKey:@"content"];
    // [commentParams setObject:@"153" forKey:@"post_id"];
    // [commentParams setObject:@"approve" forKey:@"status"];
    // [commentParams setObject:email.text forKey:@"author_email"];
    // [commentParams setObject:name.text forKey:@"author"];
		
    this.$.xmlrpc_client.callMethod({ methodName:'wp.newComment', methodParams:[this.account.blogid, this.account.username, this.account.password, this.comment.post_id, {
      post_id: this.comment.post_id,
      content: reply,
      comment_parent: this.comment.comment_id, //
      status: 'approve'
    }]});
    
  },
  cancelReply:function(){
    this.$.popup.close();
  }
  
})