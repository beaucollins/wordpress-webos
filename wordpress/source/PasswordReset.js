enyo.kind({
  name:'PasswordReset',
  kind:'enyo.Popup',
  scrim:true,
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
    { name:'login', kind:'enyo.RowGroup', caption:$L('Password'), components:[
      { kind:'enyo.Input', name:'passwordField', inputType:'password', value: 'M0bileT3am' },
    ]},
    { kind:'enyo.Button', content:$L('Save'), onclick:'savePassword' },
    { kind:'enyo.Button', content:$L('Cancel'), onclick:'doCancel' }
  ],
  accountChanged:function(){
    // this.$.username.setContent(this.account.account.username);
  },
  savePassword:function(sender){
    this.doSavePassword(this.$.passwordField.getValue());
  }
});