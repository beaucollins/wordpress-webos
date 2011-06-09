enyo.kind({
  name:'PasswordReset',
  kind:'enyo.Popup',
  scrim:true,
  lazy:false,
  events: {
    onSavePassword:'',
    onCancel:''
  },
  published: {
    account:null
  },
  components:[
    { content:$L("Bad username/password") },
    //{ name:'username' },
    { name:'message', style:'font-size:14px; padding:5px 0;' },
    { name:'login', kind:'enyo.RowGroup', caption:$L('Password'), components:[
      { kind:'enyo.Input', name:'passwordField', inputType:'password' },
    ]},
    { kind:'enyo.Button', content:$L('Save'), onclick:'savePassword' },
    { kind:'enyo.Button', content:$L('Cancel'), onclick:'doCancel' }
  ],
  accountChanged:function(){
    console.log("Account changed", this.account);
    // this.$.username.setContent(this.account.account.username);
    this.$.message.setContent(new enyo.g11n.Template($L('Password for #{username} on blog #{blogName}')).evaluate({
      username: this.account.account.username,
      blogName: this.account.account.blogName
    }));
  },
  savePassword:function(sender){
    this.doSavePassword(this.$.passwordField.getValue());
  }
});