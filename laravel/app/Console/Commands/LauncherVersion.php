<?php

namespace App\Console\Commands;

use Redis;
use App\LauncherVersions;
use App\BotChannels;
use Illuminate\Console\Command;

class LauncherVersion extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bdo:launcherversion';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Checks if a new launcher version is available';

    private $url = 'http://akamai-gamecdn.blackdesertonline.com/live001/launcher/launcher1.version';
  
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
        $last = LauncherVersions::select('modified')
          ->orderBy('modified', 'desc')->first();
        $lastmod = $last ? $last->modified : 0;
        $gmdate = gmdate('D, d M Y H:i:s T', strtotime($lastmod));
        
        $ch = curl_init($this->url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['If-Modified-Since: ' . $gmdate]); 
        curl_setopt($ch, CURLOPT_FILETIME, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $content = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $filetime = curl_getinfo($ch, CURLINFO_FILETIME);
        curl_close($ch);
        
        switch($code) {
            case 200:
                $date = date("Y-m-d H:i:s", $filetime);
                $this->line("New Version: $content ($date)");
                LauncherVersions::firstOrCreate(['version' => $content,
                  'modified' => $date]);
                $this->broadcast_version($content, gmdate('Y-m-d\TH:i:s\Z', $filetime));
                break;
            case 304:
                $this->line('Not Modified');
                break;
            default:
                $this->error('HTTP Code: ' . $code);
        }
    }
    
    private function broadcast_version($version, $date) {
        $msg = "**Update Notification**";
        $embed = [
            "color" => 0x3b88c3,
            "author" => [
                "name" => "BDOBot Version"
            ],
            "title" => "Launcher :new:",
            "description" => "v$version",
            "timestamp" => $date
        ];
        for($i=1;$i<4;$i++) {
            $channels = BotChannels::where('notify_launcher', $i)->pluck('channel_id');
            Redis::publish('discord', 
              json_encode(['message' => $msg, 'channels' => $channels, 'type' => $i, 'embed' => $embed])
            );
        }
    }
}
