<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\BdoEvents;
use App\BotChannels;
use Exception;
use Redis;

class Events extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bdo:events';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Checks Event Calendar for Changes';
    
    protected $url = "https://www.blackdesertonline.com/ingame/Calendar.html?lang=EN";

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
        $this->info("Checking Calendar ...");
        $html = $this->get_html($this->url);
        $this->get_events($html);
    }
    
    private function notify_event($event) {
        $msg = "**New Event**\n" . $event['title'];
        $this->info($msg);
        $channels = BotChannels::where('notify_event', 1)->pluck('channel_id');
        $counter = Redis::publish('discord', 
          json_encode(['message' => $msg, 'channels' => $channels])
        );
    }
    
    private function get_events($html) {
        if(preg_match("/events: (\[.*\])/s", $html, $m)) {
            $js = preg_replace('/\s+/', ' ', $m[1]);
            $json = preg_replace('/\s(\w+):\s/', ' "${1}": ', $js);
            $json = preg_replace('/\'/', '"', $json);
            $json = preg_replace('/,\s+(}|])/', ' ${1}', $json);
            $events = json_decode($json, true);
            if($events) {
                $this->check_events($events);
            } else {
                $this->error("Error parsing " . $json);
            }
        } else {
            $this->error("Events not found!");
        }
    }
    
    private function check_events($events) {
        foreach($events as $event) {
            $e = BdoEvents::firstOrNew($event);
            if($e->exists) {
                $this->info($event['title'] . " touched!");
                $e->touch();
            } else {
                $this->notify_event($event);
                $e->save();
            }
        }
    }
    
    private function get_html($url) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYHOST => false
        ]);
        $content = curl_exec($ch);
        if(curl_errno($ch))
        {
            throw new Exception(curl_error($ch));
        }
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if($code != 200)
        {
            throw new Exception("HTTP CODE $code");
        }
        
        return $content;
    }
}
