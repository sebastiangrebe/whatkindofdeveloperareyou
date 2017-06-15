var expect = require('chai').expect;
var should = require('chai').should();
var bot = require('./index');
const path = require('path');
const ImageCreator = require('./createResult');
var appRoot = path.resolve(__dirname);

 describe('bot', function(){
    it ('should work!',function(){
        expect(true).to.be.true;
    });
    it ('should have a database',function(){
        bot.db.filename.should.equal(appRoot+'/whatkindofdeveloperareyou.db');
        bot.db.inMemoryOnly.should.equal(false);
    });
 });