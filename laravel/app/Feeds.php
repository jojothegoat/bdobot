<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Feeds extends Model
{
    public function items()
    {
        return $this->hasMany('App\FeedItems', 'feed_id');
    }
}
