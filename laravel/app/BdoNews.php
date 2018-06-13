<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class BdoNews extends Model
{
    protected $fillable = ['news_id','link','filter','img','title','news','created_at'];
}
