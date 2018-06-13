<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\IngameImages;
use App\BotChannels;
use Exception;
use Redis;

class InGame extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bdo:ingame';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Checks Ingame Stuff for Changes';
    
    protected $htmls = [ 
        [ "title" => "Shop", "name" => "ShopMain" ], 
        [ "title" => "Banner", "name" => "ShopCategory" ], 
        [ "title" => "Event", "name" => "Event" ]
    ];
    protected $url = "https://www.blackdesertonline.com/ingame/%s.html?lang=EN";
    protected $regex = "/https:\/\/akamai-webcdn\.blackdesertonline\.com\/web\/static\/images\/ingame\/(.+).(png|jpg)/i";

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
        foreach($this->htmls as $id => $data) {
            $url = sprintf($this->url, $data["name"]);
            $this->info("Checking " . $data["title"] . " ($url)...");
            $images = $this->get_images($url);
            $this->check_images($id, $images);
        }
    }
    
    private function notify_image($id, $image) {
        $msg = "**New " . $this->htmls[$id]["title"] . " Image**\n$image";
        $this->info($msg);
        $channels = BotChannels::where('notify_ingame', 1)->pluck('channel_id');
        $counter = Redis::publish('discord', 
          json_encode(['message' => $msg, 'channels' => $channels]
        ));
    }
    
    private function check_images($id, $images) {
        foreach($images as $image) {
            $igimg = IngameImages::firstOrNew([
                "page_id" => $id,
                "image" => $image
            ]);
            if($igimg->exists) {
                $igimg->touch();
                $this->info("$image touched.");
            } else {
                $this->notify_image($id, $image);
                $igimg->save();
            }
        }
    }
    
    private function get_images($url) {
        $html = $this->get_html($url);
        if(preg_match_all($this->regex, $html, $matches)) {
            return $matches[0];
        }
        
        return [];
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
