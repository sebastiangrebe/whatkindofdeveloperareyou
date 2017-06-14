var expect = require('chai').expect;
var bot = require('./index');

 describe('bot', function(){
    it ('should work!',function(){
        expect(true).to.be.true;
    });
    it ('should merge the config Objects',function(){
        expect(bot.config).to.contain.all.keys({'grid':{'padding':['top','right','bottom','left']}});
    });
 });