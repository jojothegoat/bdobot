<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class BdoEvents extends Model
{
    protected $table = "events";
    protected $fillable = ['id', 'title', 'start', 'end', 'color'];
}
