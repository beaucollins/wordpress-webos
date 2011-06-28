enyo.kind({
  name:'Gravatar',
  kind:'enyo.Control',
  size:100,
  published: {
    email:null,
    missing:'identicon',
    defaultImage:'../images/icons/avatar-backup.png'
  },
  create:function(options){
    this.width = options.size + 'px';
    this.height = options.size + 'px';
    this.inherited(arguments);
    this.createComponent({ kind:'enyo.Image', onerror:'loadDefaultImage', width:this.size + 'px', height:this.size + 'px', src:this.defaultImage });
    this.$.image.hide();
    
  },
  emailChanged:function(){
    this.loadImage();
  },
  sizeChanged:function(){
    this.loadImage();
  },
  missingChanged:function(){
    this.loadImage();
  },
  loadImage:function(){
    var url = this.gravatarUrl();
    this.$.image.hide();
    if (!url){
      this.errored = true;
      this.loadDefaultImage();
      return;
    }else{
      this.errored = false;
      this.setSrc(this.defaultImage);
      this.setSrc(this.gravatarUrl());      
    }
  },
  loadDefaultImage:function(sender, event){
    if (this.errored) return;
    this.errored = true;
    this.setSrc(this.defaultImage);
    this.$.image.show();
  },
  gravatarUrl:function(){
    return enyo.application.makeGravatar(this.email, { size:this.size, missing:this.missing });
  },
  setSrc:function(src){
    if (!src) return;
    this.$.image.setSrc(src);
    this.$.image.show();
  }
})