<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class YouTubeVideos extends Model
{
    protected $table = 'youtube_videos';
    protected $fillable = ['videoId','created_at'];
}
