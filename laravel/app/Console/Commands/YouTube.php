<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\YouTubeVideos;
use App\BotChannels;
use Google_Client;
use Google_Service_YouTube;
use DateTime;
use Redis;

class YouTube extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bdo:youtube';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';
    protected $apiKey = "";

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
        $client = new Google_Client();
        $client->setApplicationName("BDDB");
        $client->setDeveloperKey($this->apiKey);
        $youtube = new Google_Service_YouTube($client);
        $dt = new DateTime(YouTubeVideos::max('created_at'));
        $searchResponse = $youtube->search->listSearch('snippet', array(
            'channelId' => 'UCcO-TjLkDNzvYrlPkOHgnfA',
            'order' => 'date',
            'publishedAfter' => $dt->format(DATE_RFC3339),
            'type' => 'video',
            'maxResults' => 50
        ));
        foreach($searchResponse['items'] as $video) {
            $id = $video['id']['videoId'];
            $dt = new DateTime($video['snippet']['publishedAt']);
            $ytvid = YouTubeVideos::firstOrNew([
                "videoId" => $id,
                "created_at" => $dt->format("Y-m-d H:i:s")
            ]);
            if(!$ytvid->exists) {
                $this->notify_video($video['snippet']['channelTitle'], 
                    $video['id']['videoId']);
                $ytvid->save();
            } else {
                $this->line("Video $id already exists.");
            }
        }
    }
    
    private function notify_video($channelTitle, $videoId) {
        $msg = "**$channelTitle just uploaded a video**\nhttps://youtu.be/$videoId";
        $this->info($msg);
        for($i=1;$i<4;$i++) {
            $channels = BotChannels::where('notify_youtube', $i)->pluck('channel_id');
            $counter = Redis::publish('discord', 
              json_encode(['message' => $msg, 'channels' => $channels, 'type' => $i]
            ));
        }
    }
}
 