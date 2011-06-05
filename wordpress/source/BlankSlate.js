enyo.kind({
  name:'BlankSlate',
  kind:'enyo.Control',
  className:'blank-slate',
  published: {
    message: $L('Intentionally left blank')
  },
  components: [
    { name:'graphic', className:'blank-slate-graphic' },
    { name:'message', className:'blank-slate-message' }
  ],
  create:function(){
    this.inherited(arguments);
    this.messageChanged();
  },
  messageChanged:function(){
    this.$.message.setContent(this.message);
  }
})