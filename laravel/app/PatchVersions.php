<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class PatchVersions extends Model
{
    protected $fillable = ['version', 'modified'];
}
