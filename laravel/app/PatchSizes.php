<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class PatchSizes extends Model
{
    protected $fillable = ['version', 'size', 'modified'];
}
