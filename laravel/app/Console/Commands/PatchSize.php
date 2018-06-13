<?php

namespace App\Console\Commands;

use Redis;
use App\PatchVersions;
use App\PatchSizes;
use App\BotChannels;
use ByteUnits;
use Illuminate\Console\Command;

class Patchsize extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bdo:patchsize';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Checks for patchsizes';

    private $base_url = 'http://akamai-gamecdn.blackdesertonline.com/live001/game/patch/';
  
    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $last_version = PatchSizes::orderBy('created_at', 'desc')->value('version');
        //$last_version = PatchVersions::orderBy('created_at', 'desc')->value('version');
        $this->info("Last Version: v$last_version");
        do {
            $last_version++;
        } while ($this->get_patch($last_version));
    }
    
    private function get_patch($version)
    {
        $this->info("Get Patch v$version ($this->base_url$version.PAP)...");
        $ch = curl_init("$this->base_url$version.PAP");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_NOBODY => true,
            CURLOPT_FILETIME => true
        ]);
        curl_exec($ch);
        if(curl_errno($ch))
        {
            $this->error_msg(curl_error($ch));
        }
        
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if($code != 200) {
            $this->error("HTTP: $code");
            return 0;
        }
        
        $filetime = curl_getinfo($ch, CURLINFO_FILETIME);
        $filesize = curl_getinfo($ch, CURLINFO_CONTENT_LENGTH_DOWNLOAD);
        curl_close($ch);

        $date = date("Y-m-d H:i:s", $filetime);
        $entry = PatchSizes::firstOrNew([
            'version' => $version,
            'size' => $filesize,
            'modified' => $date
        ]);
        if($entry->exists) {
            $this->info("Patch v$version exists!");
            return 1;
        }
        
        $entry->save();
        $size = ByteUnits\Metric::bytes($filesize)->format();
        $alert = "Upcoming Patch: **v$version** $size ($date)";
        $this->info($alert);
        $counter = Redis::publish('alert', $alert);
        
        return 1;
    }
    
    private function error_msg($msg)
    {
        $this->error($msg);
        Log::error($msg);
        exit(1);
    }
}
