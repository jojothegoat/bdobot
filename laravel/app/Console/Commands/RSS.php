<?php

namespace App\Console\Commands;

use Redis;
use Illuminate\Console\Command;
use SimplePie;
use App\Feeds;
use App\FeedItems;
use App\BotChannels;

class RSS extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bdo:rss';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Checks the RSS Feeds';
    
    private $langs = ['EN', 'DE', 'FR'];

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
        foreach($this->langs as $lang)
        {
            $this->info("=== $lang ===");
            $feeds = Feeds::where('lang', strtolower($lang))->get();
            foreach($feeds as $urls)
            {
                $this->info("Checking $urls->title ($urls->url) ...");
                $guids = $urls->items->pluck('guid')->toArray();
                $feed = new SimplePie();
            	$feed->set_feed_url($urls->url);
            	$feed->enable_cache(FALSE);
            	$feed->init();
            	$items = $feed->get_items();
            	foreach($items as $item)
            	{
            	    if(is_numeric($item->get_id())) {
            	        $guid = $item->get_id();
            	    } else if (preg_match("/\.(\d+)\/$/", $item->get_id(), $m)) {
            	        $guid = $m[1];
            	    } else {
                        $this->info("Error: " . $item->get_id());
            	    }
            	    if(!in_array($guid, $guids))
            	    {
            	        $title = $item->get_title();
            	        $this->info("[$lang] New $urls->title: $title");
                	    $urls->items()->firstOrCreate(['guid' => $guid]);
                	    $this->notify_feed($lang, $urls->title, $item->get_link());
            	    }
            	}
            }
        }
    }
    
    private function notify_feed($lang, $title, $link)
    {
        $msg = "**[$lang] New $title**\n$link";
        for($i=1;$i<4;$i++) {
            $channels = BotChannels::where('notify_rss_' . $lang, $i)->pluck('channel_id');
            $counter = Redis::publish('discord', 
              json_encode(['message' => $msg, 'channels' => $channels, 'type' => $i]
            ));
        }
    }
}
