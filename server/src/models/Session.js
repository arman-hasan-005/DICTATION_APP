const mongoose = require('mongoose');
const { LEVELS } = require('../utils/constants');

const sessionSchema = new mongoose.Schema({
  user:         { type:mongoose.Schema.Types.ObjectId, ref:'User', required:true, index:true },
  passageId:    { type:mongoose.Schema.Types.ObjectId, ref:'Passage', default:null },
  passageTitle: { type:String, required:true },
  level:        { type:String, enum:Object.values(LEVELS), default:LEVELS.BEGINNER },
  totalWords:   { type:Number, default:0 },
  correctWords: { type:Number, default:0 },
  score:        { type:Number, min:0, max:100, default:0 },
  isHandwrite:  { type:Boolean, default:false },
  sentences:    [{ original:String, answer:String, score:Number }],
  xpEarned:     { type:Number, default:0 },
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
