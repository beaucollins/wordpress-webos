enyo.kind({
  name: 'AccountManager',
  kind: enyo.Component,
  published: {
    accounts:[]
  },
  loadAccounts:function(onReady){
    var manager = this;
    enyo.application.models.Account.all().list(function(accounts){
      manager.setAccounts(accounts);
      onReady();
    });
  },
  addAccount:function(account, callback){
    var store = enyo.application.persistence;
    var manager = this;
    manager.accounts.push(account);
  }
})