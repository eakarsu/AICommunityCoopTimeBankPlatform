'use strict';
const {createWave30cRouter}=require('./wave30c');
const auth=require('../middleware/auth');
const pool=require('../db');
async function loadRecords(){ const r=await pool.query('SELECT id,kind,title,skills,community_id FROM tb_listings ORDER BY id DESC LIMIT 200'); return r.rows; }
module.exports=createWave30cRouter({auth,loadRecords,features:["listing-match-outlook", "reciprocity-balance-brief", "demand-gap-summary"],searchFields:['title','name','client_name']});
