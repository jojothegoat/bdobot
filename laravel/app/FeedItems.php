<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class FeedItems extends Model
{   
    protected $fillable = ['guid'];

    public function feed()
    {
        return $this->belongsTo('App\Feeds');
    }
}
